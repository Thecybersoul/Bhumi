'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Icon from '@/components/site/Icon'

/* Pick or upload a file, from anywhere a field needs one.

   Two things this does that a bare file input does not: it keeps
   what has already been uploaded, so the same image can be reused
   without hunting for the original; and it accepts a plain path
   for the files that ship with the codebase, so a field pointing
   at /img/hero.jpg is editable without being re-uploaded first. */

export interface MediaRow {
  id: string
  url: string
  kind: 'image' | 'video' | 'document'
  mime: string | null
  bytes: number | null
  alt: string | null
  title: string | null
  folder: string
  created_at: string
}

const human = (n: number | null) =>
  !n ? '—' : n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`

export default function MediaPicker({
  value,
  onChange,
  kind = 'image',
  label,
}: {
  value: string
  onChange: (url: string) => void
  kind?: 'image' | 'video' | 'document'
  label?: string
}) {
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState<MediaRow[]>([])
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [manual, setManual] = useState(value ?? '')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => setManual(value ?? ''), [value])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const r = await fetch(`/api/media?kind=${kind}`)
      const j = await r.json()
      setRows(j.data ?? [])
      if (j.error) setError(j.error)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [kind])

  useEffect(() => {
    if (open) load()
  }, [open, load])

  async function upload(file: File) {
    setBusy(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', kind === 'video' ? 'video' : 'general')
      const r = await fetch('/api/media', { method: 'POST', body: fd })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Upload failed')
      setRows((prev) => [j.data, ...prev])
      onChange(j.data.url)
      setOpen(false)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="mediaField">
      {label && <span className="fieldLabel">{label}</span>}

      <div className="mediaField__row">
        <div className="mediaField__preview">
          {value ? (
            kind === 'video' ? (
              <video src={value} muted playsInline preload="metadata" />
            ) : kind === 'image' ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={value} alt="" />
            ) : (
              <span className="mediaField__doc">
                <Icon name="checklist" size={20} />
              </span>
            )
          ) : (
            <span className="mediaField__empty">None</span>
          )}
        </div>

        <div className="mediaField__controls">
          <input
            className="input"
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            onBlur={() => manual !== value && onChange(manual)}
            placeholder="/img/example.jpg or a full URL"
            spellCheck={false}
          />
          <div className="row-wrap" style={{ gap: 8 }}>
            <button type="button" className="btn btn-sm btn-outline" onClick={() => setOpen(true)}>
              Choose or upload
            </button>
            {value && (
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={() => {
                  onChange('')
                  setManual('')
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {open && (
        <div className="mediaModal" role="dialog" aria-modal="true" aria-label="Media library">
          <button className="mediaModal__scrim" onClick={() => setOpen(false)} aria-label="Close" />
          <div className="mediaModal__panel">
            <header>
              <div>
                <h3>Media library</h3>
                <p>{kind === 'video' ? 'Videos' : kind === 'document' ? 'Documents' : 'Images'}</p>
              </div>
              <button className="btn btn-sm btn-ghost" onClick={() => setOpen(false)}>
                Close
              </button>
            </header>

            <div className="mediaModal__upload">
              <input
                ref={fileRef}
                type="file"
                accept={
                  kind === 'video'
                    ? 'video/mp4,video/webm'
                    : kind === 'document'
                      ? 'application/pdf'
                      : 'image/jpeg,image/png,image/webp,image/avif,image/svg+xml'
                }
                onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
                disabled={busy}
              />
              <span>
                {busy
                  ? 'Uploading…'
                  : kind === 'video'
                    ? 'MP4 or WebM, up to 120 MB'
                    : kind === 'document'
                      ? 'PDF, up to 25 MB'
                      : 'JPEG, PNG, WebP, AVIF or SVG, up to 12 MB'}
              </span>
            </div>

            {error && <p className="mediaModal__error">{error}</p>}

            {loading ? (
              <p className="mediaModal__note">Loading…</p>
            ) : rows.length === 0 ? (
              <p className="mediaModal__note">
                Nothing uploaded yet. Files already in the codebase can be referenced by path in the
                field above — for example <code>/img/hero-poster.jpg</code>.
              </p>
            ) : (
              <div className="mediaGrid">
                {rows.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className={`mediaTile ${m.url === value ? 'is-current' : ''}`}
                    onClick={() => {
                      onChange(m.url)
                      setOpen(false)
                    }}
                  >
                    <span className="mediaTile__thumb">
                      {m.kind === 'video' ? (
                        <video src={m.url} muted playsInline preload="metadata" />
                      ) : m.kind === 'image' ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.url} alt={m.alt ?? ''} loading="lazy" />
                      ) : (
                        <Icon name="checklist" size={22} />
                      )}
                    </span>
                    <span className="mediaTile__meta">
                      <strong>{m.title ?? m.url.split('/').pop()}</strong>
                      <small>{human(m.bytes)}</small>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
