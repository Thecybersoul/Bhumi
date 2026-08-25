'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Icon from '@/components/site/Icon'
import type { MediaRow } from './MediaPicker'

/* The library as a page of its own: upload, review, copy a path,
   delete. Deleting removes the stored object as well as the row,
   because a bucket quietly filling with unreferenced files is how
   storage bills get surprising. */

const KINDS = [
  { id: 'all', label: 'Everything' },
  { id: 'image', label: 'Images' },
  { id: 'video', label: 'Video' },
  { id: 'document', label: 'Documents' },
] as const

const human = (n: number | null) =>
  !n ? '—' : n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`

export default function MediaLibrary({ canUpload }: { canUpload: boolean }) {
  const [kind, setKind] = useState<(typeof KINDS)[number]['id']>('all')
  const [rows, setRows] = useState<MediaRow[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`/api/media?kind=${kind}`)
      const j = await r.json()
      setRows(j.data ?? [])
      setError(j.error ?? null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [kind])

  useEffect(() => {
    load()
  }, [load])

  async function upload(files: FileList) {
    setBusy(true)
    setError(null)
    for (const file of Array.from(files)) {
      try {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('folder', file.type.startsWith('video') ? 'video' : 'general')
        const r = await fetch('/api/media', { method: 'POST', body: fd })
        const j = await r.json()
        if (!r.ok) throw new Error(`${file.name}: ${j.error}`)
      } catch (e) {
        setError((e as Error).message)
      }
    }
    setBusy(false)
    if (fileRef.current) fileRef.current.value = ''
    load()
  }

  async function remove(m: MediaRow) {
    if (!confirm(`Delete ${m.title ?? m.url}? This removes the file itself, not just the entry.`)) return
    setBusy(true)
    try {
      const r = await fetch(`/api/media?id=${m.id}`, { method: 'DELETE' })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error)
      setRows((prev) => prev.filter((x) => x.id !== m.id))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="mediaBar">
        <div className="mediaBar__kinds">
          {KINDS.map((k) => (
            <button
              key={k.id}
              type="button"
              className={kind === k.id ? 'is-active' : ''}
              onClick={() => setKind(k.id)}
            >
              {k.label}
            </button>
          ))}
        </div>

        {canUpload && (
          <label className="btn btn-primary btn-sm mediaBar__upload">
            {busy ? 'Uploading…' : 'Upload files'}
            <input
              ref={fileRef}
              type="file"
              multiple
              hidden
              accept="image/jpeg,image/png,image/webp,image/avif,image/svg+xml,video/mp4,video/webm,application/pdf"
              onChange={(e) => e.target.files?.length && upload(e.target.files)}
              disabled={busy}
            />
          </label>
        )}
      </div>

      {error && <p className="mediaModal__error">{error}</p>}

      {loading ? (
        <p className="mediaModal__note">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="emptyPanel">
          <Icon name="land" size={26} />
          <h3>Nothing uploaded yet</h3>
          <p>
            Images, video and PDFs uploaded here can be picked from any media field in the content
            editor. Files that ship with the codebase — the hero footage, the billboard photographs, the
            design renders — stay where they are and are referenced by path.
          </p>
        </div>
      ) : (
        <div className="mediaGrid is-page">
          {rows.map((m) => (
            <figure key={m.id} className="mediaTile is-static">
              <span className="mediaTile__thumb">
                {m.kind === 'video' ? (
                  <video src={m.url} muted playsInline preload="metadata" controls />
                ) : m.kind === 'image' ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.url} alt={m.alt ?? ''} loading="lazy" />
                ) : (
                  <Icon name="checklist" size={22} />
                )}
              </span>
              <figcaption>
                <strong title={m.title ?? ''}>{m.title ?? m.url.split('/').pop()}</strong>
                <small>
                  {m.kind} · {human(m.bytes)}
                </small>
                <div className="mediaTile__ops">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(m.url)
                      setCopied(m.id)
                      setTimeout(() => setCopied(null), 1600)
                    }}
                  >
                    {copied === m.id ? 'Copied' : 'Copy URL'}
                  </button>
                  <button type="button" className="is-danger" onClick={() => remove(m)} disabled={busy}>
                    Delete
                  </button>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </>
  )
}
