import type { useApi } from './api'

/* Client half of /api/documents. An upload is three steps and the
   middle one never touches our server: ask where to put the file
   (Google Drive when connected, otherwise the private bucket), send
   the bytes straight there, then record the result against the
   listing, note or deal it belongs to. */

export type DocEntity = 'property' | 'note' | 'transaction' | 'lead' | 'verification' | 'meeting' | 'task' | 'contact' | 'general'

export interface Doc {
  id: string
  entity_type: DocEntity
  entity_id: string | null
  entity_label: string
  name: string
  category: string
  mime: string
  bytes: number | null
  storage: 'supabase' | 'drive'
  path: string | null
  url: string | null
  created_by?: string | null
  created_at: string
}

export interface PickedFile {
  uri: string
  name: string
  mime: string
  size?: number | null
}

type Api = ReturnType<typeof useApi>

interface Start {
  storage: 'supabase' | 'drive'
  path?: string
  upload: { url: string; method: string; headers: Record<string, string> }
}

export async function uploadDocument(
  api: Api,
  file: PickedFile,
  target: { entity_type: DocEntity; entity_id: string; entity_label: string; category: string }
): Promise<Doc> {
  const meta = { name: file.name, mime: file.mime, bytes: file.size ?? undefined, ...target }
  const start = await api.post<Start>('/api/documents', { action: 'start', ...meta })

  const blob = await (await fetch(file.uri)).blob()
  const res = await fetch(start.upload.url, { method: start.upload.method, headers: start.upload.headers, body: blob })
  if (!res.ok) throw new Error(`Upload failed (${res.status})`)

  const recorded =
    start.storage === 'drive'
      ? { storage: 'drive', drive_file_id: ((await res.json()) as { id: string }).id }
      : { storage: 'supabase', path: start.path }
  const out = await api.post<{ data: Doc }>('/api/documents', { action: 'record', ...meta, ...recorded })
  return out.data
}

export function formatBytes(n: number | null | undefined) {
  if (!n) return ''
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

export function docIcon(mime: string, name: string) {
  const m = (mime || '').toLowerCase()
  const ext = name.toLowerCase().split('.').pop() ?? ''
  if (m.includes('pdf') || ext === 'pdf') return { icon: 'document-text' as const, tint: '#C0392B' }
  if (m.startsWith('image/')) return { icon: 'image' as const, tint: '#1B6FA8' }
  if (m.startsWith('video/')) return { icon: 'videocam' as const, tint: '#6B4FA8' }
  if (m.includes('sheet') || m.includes('excel') || ['xls', 'xlsx', 'csv'].includes(ext)) return { icon: 'grid' as const, tint: '#1D7A4D' }
  if (m.includes('word') || m.includes('document') || ['doc', 'docx'].includes(ext)) return { icon: 'document' as const, tint: '#2B579A' }
  return { icon: 'document-attach' as const, tint: '#6C7A87' }
}

/* What a Karnataka land deal actually runs on, in the order a buyer's
   lawyer asks for it. */
export const CATEGORIES: Record<DocEntity, string[]> = {
  property: ['Title deed', 'EC', 'RTC / Pahani', 'Khata', 'Conversion order', 'Survey sketch', 'Mutation', 'Tax receipt', 'Layout plan', 'Photos', 'Other'],
  transaction: ['Agreement', 'Sale deed', 'Token receipt', 'KYC', 'Invoice', 'Other'],
  verification: ['Title deed', 'EC', 'RTC / Pahani', 'Survey sketch', 'Legal opinion', 'Report', 'Other'],
  lead: ['KYC', 'Requirement', 'Brochure', 'Other'],
  contact: ['KYC', 'PAN', 'Aadhaar', 'Agreement', 'Other'],
  note: ['Attachment'],
  meeting: ['Minutes', 'Photos', 'Other'],
  task: ['Attachment'],
  general: ['Other'],
}
