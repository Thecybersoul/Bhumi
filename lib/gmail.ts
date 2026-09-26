import { google } from 'googleapis'
import { randomBytes } from 'node:crypto'
import { getClient, WORKSPACE_EMAIL } from './google'
import { createServiceClient } from './supabase'
import { DOCUMENTS_BUCKET, type DocumentRow } from './documents'

/* ═══════════════════════════════════════════════════════════
   Gmail — sending as the company account.

   Mail goes out from info@bhumiestates.in, with the sender's own
   name in the display name ("Sanjog · Bhumi Estates"), so a client
   sees one consistent company address but knows who they are
   dealing with. It lands in that account's Sent folder like any
   other email, and replies come back to the shared inbox.

   The scope is gmail.send only: the ERP can send, never read the
   mailbox.
   ═══════════════════════════════════════════════════════════ */

export const MAX_ATTACH_MB = 18

export interface Attachment {
  name: string
  mime: string
  bytes: Buffer
}

const EMAIL_RE = /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/

/** "a@x.com, B <b@y.com>" → ["a@x.com", "b@y.com"], or throws on anything unusable. */
export function parseAddresses(raw: string): string[] {
  const list = raw
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.match(/<([^>]+)>/)?.[1]?.trim() ?? s)
  for (const a of list) if (!EMAIL_RE.test(a)) throw new Error(`“${a}” is not an email address`)
  return [...new Set(list.map((a) => a.toLowerCase()))]
}

const b64 = (s: string | Buffer) => Buffer.from(s).toString('base64')
const wrap = (s: string) => s.replace(/.{1,76}/g, '$&\r\n')
/* RFC 2047 so names and subjects in any script survive the trip. */
const word = (s: string) => (/^[\x20-\x7e]*$/.test(s) ? s : `=?UTF-8?B?${b64(s)}?=`)

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function htmlBody(text: string, senderName: string) {
  const paragraphs = escapeHtml(text)
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 14px">${p.replace(/\n/g, '<br>').replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color:#9E7833">$1</a>')}</p>`)
    .join('')
  return `<!doctype html><html><body style="margin:0;background:#F7F5F0;padding:24px 12px;font-family:Arial,Helvetica,sans-serif;color:#10231B;font-size:15px;line-height:1.55">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #E3E1DA;border-radius:14px">
<tr><td style="background:#0E3B2E;border-radius:14px 14px 0 0;padding:18px 24px;color:#ffffff;font-weight:bold;letter-spacing:3px;font-size:15px">BHUMI <span style="color:#C2974A">ESTATES</span></td></tr>
<tr><td style="padding:24px">${paragraphs}
<p style="margin:22px 0 0;padding-top:14px;border-top:1px solid #EFEDE7;font-size:13px;color:#3D4A55"><strong style="color:#0E3B2E">${escapeHtml(senderName)}</strong><br>Bhumi Estates · Bengaluru<br><a href="mailto:${WORKSPACE_EMAIL}" style="color:#9E7833">${WORKSPACE_EMAIL}</a> · <a href="https://www.bhumiestates.in" style="color:#9E7833">bhumiestates.in</a></p>
</td></tr></table></body></html>`
}

function textBody(text: string, senderName: string) {
  return `${text}\n\n—\n${senderName}\nBhumi Estates · Bengaluru\n${WORKSPACE_EMAIL} · https://www.bhumiestates.in\n`
}

/** Build the RFC 5322 message: text + HTML alternatives, plus files. */
function buildMime(opts: { to: string[]; cc: string[]; subject: string; text: string; senderName: string; attachments: Attachment[] }) {
  const mixed = `mixed_${randomBytes(12).toString('hex')}`
  const alt = `alt_${randomBytes(12).toString('hex')}`
  const lines = [
    `From: ${word(`${opts.senderName} · Bhumi Estates`)} <${WORKSPACE_EMAIL}>`,
    `To: ${opts.to.join(', ')}`,
    ...(opts.cc.length ? [`Cc: ${opts.cc.join(', ')}`] : []),
    `Reply-To: ${WORKSPACE_EMAIL}`,
    `Subject: ${word(opts.subject)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${mixed}"`,
    '',
    `--${mixed}`,
    `Content-Type: multipart/alternative; boundary="${alt}"`,
    '',
    `--${alt}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    wrap(b64(textBody(opts.text, opts.senderName))),
    `--${alt}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    wrap(b64(htmlBody(opts.text, opts.senderName))),
    `--${alt}--`,
  ]
  for (const a of opts.attachments) {
    const name = a.name.replace(/["\r\n]/g, '')
    lines.push(
      `--${mixed}`,
      `Content-Type: ${a.mime || 'application/octet-stream'}; name="${word(name)}"`,
      `Content-Disposition: attachment; filename="${word(name)}"`,
      'Content-Transfer-Encoding: base64',
      '',
      wrap(a.bytes.toString('base64'))
    )
  }
  lines.push(`--${mixed}--`, '')
  return lines.join('\r\n')
}

/** Fetch ERP documents as attachments. Files in the bucket or uploaded
    to Drive are attached; a Drive file that was only linked (or a
    Google Doc, which has no bytes) goes in the body as a link. */
export async function loadAttachments(ids: string[]): Promise<{ files: Attachment[]; links: { name: string; url: string }[] }> {
  if (!ids.length) return { files: [], links: [] }
  const sb = createServiceClient()
  const { data } = await sb.from('documents').select('*').in('id', ids)
  const docs = (data ?? []) as DocumentRow[]
  const files: Attachment[] = []
  const links: { name: string; url: string }[] = []
  let total = 0
  const auth = await getClient()
  for (const d of docs) {
    let bytes: Buffer | null = null
    if (d.storage === 'supabase' && d.path) {
      const { data: blob } = await sb.storage.from(DOCUMENTS_BUCKET).download(d.path)
      if (blob) bytes = Buffer.from(await blob.arrayBuffer())
    } else if (d.storage === 'drive' && d.drive_file_id && d.path !== 'link' && auth && !String(d.mime).startsWith('application/vnd.google-apps')) {
      const res = await google
        .drive({ version: 'v3', auth })
        .files.get({ fileId: d.drive_file_id, alt: 'media' }, { responseType: 'arraybuffer' })
        .catch(() => null)
      if (res?.data) bytes = Buffer.from(res.data as ArrayBuffer)
    }
    if (!bytes) {
      if (d.url) links.push({ name: d.name, url: d.url })
      continue
    }
    total += bytes.length
    if (total > MAX_ATTACH_MB * 1024 * 1024) {
      throw new Error(`Attachments come to more than ${MAX_ATTACH_MB} MB. Send fewer files, or share them from Drive instead.`)
    }
    files.push({ name: d.name, mime: d.mime || 'application/octet-stream', bytes })
  }
  return { files, links }
}

export async function sendEmail(opts: {
  to: string[]
  cc: string[]
  subject: string
  text: string
  senderName: string
  attachments: Attachment[]
}): Promise<{ id: string; threadId: string }> {
  const auth = await getClient()
  if (!auth) throw new Error('Google is not connected')
  const raw = Buffer.from(buildMime(opts)).toString('base64url')
  const { data } = await google.gmail({ version: 'v1', auth }).users.messages.send({ userId: 'me', requestBody: { raw } })
  return { id: data.id ?? '', threadId: data.threadId ?? '' }
}
