'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { FileImage, FileSpreadsheet, FileText, FolderOpen, Link as LinkIcon, Paperclip, Trash2, Upload, Video } from 'lucide-react'
import { api, DOC_CATEGORIES, formatBytes, type Doc, type DocEntity } from './lib'
import { Banner, Empty, Loading } from './ui'

/* Same three-step upload as the app: ask the server where the file
   goes (Google Drive when connected, otherwise the private bucket),
   send the bytes straight there from the browser, then record it
   against the listing, deal, note or meeting. */
export async function uploadDocument(
  file: File,
  target: { entity_type: DocEntity; entity_id: string; entity_label: string; category: string }
): Promise<Doc> {
  const meta = { name: file.name, mime: file.type || 'application/octet-stream', bytes: file.size, ...target }
  const start = await api.post<{ storage: 'supabase' | 'drive'; path?: string; upload: { url: string; method: string; headers: Record<string, string> } }>(
    '/api/documents',
    { action: 'start', ...meta }
  )
  const res = await fetch(start.upload.url, { method: start.upload.method, headers: start.upload.headers, body: file })
  if (!res.ok) throw new Error(`Upload failed (${res.status})`)
  const recorded =
    start.storage === 'drive'
      ? { storage: 'drive', drive_file_id: ((await res.json()) as { id: string }).id }
      : { storage: 'supabase', path: start.path }
  return (await api.post<{ data: Doc }>('/api/documents', { action: 'record', ...meta, ...recorded })).data
}

export function docIcon(mime: string, name: string) {
  const m = (mime || '').toLowerCase()
  const ext = name.toLowerCase().split('.').pop() ?? ''
  if (m.includes('pdf') || ext === 'pdf') return { Icon: FileText, tint: '#C0392B' }
  if (m.startsWith('image/')) return { Icon: FileImage, tint: '#1B6FA8' }
  if (m.startsWith('video/')) return { Icon: Video, tint: '#6B4FA8' }
  if (m.includes('sheet') || m.includes('excel') || ['xls', 'xlsx', 'csv'].includes(ext)) return { Icon: FileSpreadsheet, tint: '#1D7A4D' }
  return { Icon: Paperclip, tint: '#6C7A87' }
}

export async function openDocument(d: Doc) {
  const w = window.open('about:blank', '_blank')
  try {
    const { url } = await api.get<{ url: string }>(`/api/documents/${d.id}`)
    if (w) w.location.href = url
    else window.location.href = url
  } catch (e) {
    w?.close()
    alert((e as Error).message)
  }
}

export function DocRow({ d, onRemove }: { d: Doc; onRemove?: () => void }) {
  const { Icon, tint } = docIcon(d.mime, d.name)
  return (
    <div className="erpDoc">
      <span className="erpDoc__icon" style={{ background: `${tint}14`, color: tint }}>
        <Icon size={19} />
      </span>
      <button type="button" onClick={() => openDocument(d)} style={{ flex: 1, minWidth: 0, textAlign: 'left', background: 'none', border: 0, cursor: 'pointer', padding: 0 }}>
        <div className="erpRow__title">{d.name}</div>
        <div className="erpRow__sub">
          <b style={{ color: 'var(--gold-deep)', textTransform: 'uppercase', fontSize: 10.5, letterSpacing: '.04em' }}>{d.category}</b>
          {' · '}
          {[d.created_by, formatBytes(d.bytes), new Date(d.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })].filter(Boolean).join(' · ')}
          {d.storage === 'drive' ? ' · Google Drive' : ''}
        </div>
      </button>
      {onRemove ? (
        <button type="button" className="erpBtn ghost sm" onClick={onRemove} title="Remove">
          <Trash2 size={14} />
        </button>
      ) : null}
    </div>
  )
}

export function DocumentsPanel({
  entityType,
  entityId,
  entityLabel,
  compact,
  onChange,
}: {
  entityType: DocEntity
  entityId: string
  entityLabel: string
  compact?: boolean
  onChange?: () => void
}) {
  const cats = DOC_CATEGORIES[entityType]
  const [docs, setDocs] = useState<Doc[] | null>(null)
  const [category, setCategory] = useState(cats[0])
  const [progress, setProgress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [drive, setDrive] = useState(false)
  const [over, setOver] = useState(false)
  const [linking, setLinking] = useState(false)
  const [link, setLink] = useState('')
  const [linkName, setLinkName] = useState('')
  const input = useRef<HTMLInputElement>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const load = useCallback(async () => {
    try {
      const r = await api.get<{ data: Doc[]; error?: string }>(`/api/documents?entity_type=${entityType}&entity_id=${encodeURIComponent(entityId)}`)
      setDocs(r.data)
    } catch (e) {
      setError((e as Error).message)
      setDocs([])
    }
  }, [entityType, entityId])

  useEffect(() => {
    load()
    api
      .get<{ drive?: boolean }>('/api/admin/google/status')
      .then((g) => setDrive(Boolean(g.drive)))
      .catch(() => {})
  }, [load])

  async function add(files: FileList | File[]) {
    const list = Array.from(files)
    if (!list.length) return
    setError(null)
    try {
      for (let i = 0; i < list.length; i++) {
        setProgress(list.length > 1 ? `Uploading ${i + 1} of ${list.length}…` : `Uploading ${list[i].name}…`)
        await uploadDocument(list[i], { entity_type: entityType, entity_id: entityId, entity_label: entityLabel, category })
      }
      await load()
      onChangeRef.current?.()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setProgress(null)
    }
  }

  async function saveLink() {
    if (!link.trim()) return
    setProgress('Saving link…')
    try {
      await api.post('/api/documents', {
        action: 'record',
        link: link.trim(),
        name: linkName.trim() || 'Google Drive file',
        entity_type: entityType,
        entity_id: entityId,
        entity_label: entityLabel,
        category,
      })
      setLink('')
      setLinkName('')
      setLinking(false)
      await load()
      onChangeRef.current?.()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setProgress(null)
    }
  }

  async function remove(d: Doc) {
    if (!confirm(`Remove “${d.name}”?${d.storage === 'drive' && d.path !== 'link' ? ' It moves to Google Drive’s trash.' : ''}`)) return
    setDocs((p) => p?.filter((x) => x.id !== d.id) ?? null)
    await api.del(`/api/documents/${d.id}`).catch((e) => setError(e.message))
    load()
    onChangeRef.current?.()
  }

  async function openFolder() {
    const w = window.open('about:blank', '_blank')
    try {
      const q = new URLSearchParams({ entity_type: entityType, entity_id: entityId, entity_label: entityLabel })
      const { url } = await api.get<{ url: string }>(`/api/documents/folder?${q}`)
      if (w) w.location.href = url
    } catch (e) {
      w?.close()
      setError((e as Error).message)
    }
  }

  return (
    <div>
      {!compact && cats.length > 1 ? (
        <div className="erpChips" style={{ marginBottom: 10 }}>
          {cats.map((c) => (
            <button type="button" key={c} className={`erpChip ${category === c ? 'is-gold' : ''}`} onClick={() => setCategory(c)}>
              {c}
            </button>
          ))}
        </div>
      ) : null}

      <div
        className={`erpDrop ${over ? 'is-over' : ''}`}
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setOver(true)
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setOver(false)
          add(e.dataTransfer.files)
        }}
      >
        <Upload size={18} style={{ verticalAlign: -4, marginRight: 6 }} />
        Drop files here or <b>browse</b>
        {!compact && cats.length > 1 ? <> · saved as “{category}”</> : null}
        <input ref={input} type="file" multiple hidden onChange={(e) => e.target.files && add(e.target.files)} />
      </div>

      <div className="erpDocs__actions" style={{ marginTop: 8 }}>
        <button type="button" className="erpBtn ghost sm" onClick={() => setLinking((v) => !v)}>
          <LinkIcon size={14} /> Attach a Drive link
        </button>
        {drive && ['property', 'transaction', 'verification'].includes(entityType) ? (
          <button type="button" className="erpBtn soft sm" onClick={openFolder}>
            <FolderOpen size={14} /> Open this record’s Drive folder
          </button>
        ) : null}
      </div>
      <p style={{ fontSize: 'var(--text-2xs)', color: 'var(--muted)', marginTop: 8 }}>
        {drive ? 'Saved to Google Drive (info@bhumiestates.in) › Bhumi Estates ERP' : 'Saved to Bhumi secure storage until Google Drive is connected'}
      </p>

      {linking ? (
        <div className="erpForm" style={{ marginTop: 10 }}>
          <input className="erpInput" placeholder="Paste a Google Drive link" value={link} onChange={(e) => setLink(e.target.value)} />
          <input className="erpInput" placeholder="Name (e.g. Sale deed 2019)" value={linkName} onChange={(e) => setLinkName(e.target.value)} />
          <button type="button" className="erpBtn primary" onClick={saveLink}>
            Attach link
          </button>
        </div>
      ) : null}

      {progress ? <Banner tone="ok">{progress}</Banner> : null}
      {error ? <Banner tone="error">{error}</Banner> : null}

      <div style={{ marginTop: 10 }}>
        {docs === null ? <Loading /> : docs.length === 0 ? <Empty>No documents yet.</Empty> : docs.map((d) => <DocRow key={d.id} d={d} onRemove={() => remove(d)} />)}
      </div>
    </div>
  )
}
