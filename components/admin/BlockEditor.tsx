'use client'

import { useMemo, useState } from 'react'
import Icon from '@/components/site/Icon'
import MediaPicker from './MediaPicker'
import type { Block, Field } from '@/lib/content/schema'

/* One editor, generated from the schema.

   Adding an editable field is a line in lib/content/schema.ts, not
   a new screen — which is the only way "everything is editable"
   survives the site growing. The trade-off is that this file has
   to handle every field type properly rather than assuming text.

   Saving is per block. Reverting deletes the stored row so the
   block falls back to the copy compiled into the codebase, which
   means there is always a way back from a bad edit. */

type Value = Record<string, unknown>

function get(obj: Value, path: string[]): unknown {
  return path.reduce<unknown>((a, k) => (a as Value)?.[k], obj)
}

function setIn(obj: Value, path: string[], v: unknown): Value {
  if (path.length === 0) return v as Value
  const [head, ...rest] = path
  return {
    ...obj,
    [head]: rest.length ? setIn(((obj?.[head] as Value) ?? {}) as Value, rest, v) : v,
  }
}

export default function BlockEditor({
  block,
  initial,
  isEdited,
}: {
  block: Block
  initial: Value
  isEdited: boolean
}) {
  const [value, setValue] = useState<Value>(initial)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [edited, setEdited] = useState(isEdited)

  const dirty = useMemo(() => JSON.stringify(value) !== JSON.stringify(initial), [value, initial])

  async function save() {
    setSaving(true)
    setError(null)
    setStatus(null)
    try {
      const r = await fetch('/api/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: block.key, value }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Save failed')
      setValue(j.data)
      setEdited(true)
      setStatus('Saved. The live page updates within a few seconds.')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function revert() {
    setSaving(true)
    setError(null)
    setStatus(null)
    try {
      const r = await fetch(`/api/content?key=${encodeURIComponent(block.key)}`, { method: 'DELETE' })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Revert failed')
      setValue(j.data)
      setEdited(false)
      setStatus('Reverted to the original copy.')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const renderField = (f: Field, path: string[]): React.ReactNode => {
    const here = [...path, f.key]
    const raw = get(value, here)

    if (f.type === 'group') {
      return (
        <fieldset key={f.key} className="fieldGroup">
          <legend>{f.label}</legend>
          {f.help && <p className="fieldHelp">{f.help}</p>}
          <div className="fieldGroup__body">
            {(f.fields ?? []).map((sub) => renderField(sub, here))}
          </div>
        </fieldset>
      )
    }

    if (f.type === 'list') {
      const items = Array.isArray(raw) ? (raw as string[]) : []
      const write = (next: string[]) => setValue((v) => setIn(v, here, next))
      return (
        <div key={f.key} className="field">
          <span className="fieldLabel">{f.label}</span>
          {f.help && <p className="fieldHelp">{f.help}</p>}
          <div className="listField">
            {items.map((item, i) => (
              <div key={i} className="listField__row">
                <textarea
                  className="input"
                  rows={2}
                  value={item}
                  onChange={(e) => {
                    const next = [...items]
                    next[i] = e.target.value
                    write(next)
                  }}
                />
                <div className="listField__ops">
                  <button
                    type="button"
                    className="iconBtn"
                    aria-label="Move up"
                    disabled={i === 0}
                    onClick={() => {
                      const next = [...items]
                      ;[next[i - 1], next[i]] = [next[i], next[i - 1]]
                      write(next)
                    }}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="iconBtn"
                    aria-label="Move down"
                    disabled={i === items.length - 1}
                    onClick={() => {
                      const next = [...items]
                      ;[next[i + 1], next[i]] = [next[i], next[i + 1]]
                      write(next)
                    }}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="iconBtn is-danger"
                    aria-label="Remove"
                    onClick={() => write(items.filter((_, k) => k !== i))}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
            <button type="button" className="btn btn-sm btn-outline" onClick={() => write([...items, ''])}>
              Add item
            </button>
          </div>
        </div>
      )
    }

    if (f.type === 'image' || f.type === 'video') {
      return (
        <div key={f.key} className="field">
          <MediaPicker
            label={f.label}
            kind={f.type}
            value={typeof raw === 'string' ? raw : ''}
            onChange={(url) => setValue((v) => setIn(v, here, url))}
          />
          {f.help && <p className="fieldHelp">{f.help}</p>}
        </div>
      )
    }

    const text = typeof raw === 'string' ? raw : ''
    const over = f.limit ? text.length > f.limit : false
    return (
      <div key={f.key} className="field">
        <span className="fieldLabel">
          {f.label}
          {f.limit && (
            <em className={`fieldCount ${over ? 'is-over' : ''}`}>
              {text.length}/{f.limit}
            </em>
          )}
        </span>
        {f.type === 'textarea' ? (
          <textarea
            className="input"
            rows={3}
            value={text}
            onChange={(e) => setValue((v) => setIn(v, here, e.target.value))}
          />
        ) : (
          <input
            className="input"
            type={f.type === 'url' ? 'url' : 'text'}
            value={text}
            onChange={(e) => setValue((v) => setIn(v, here, e.target.value))}
          />
        )}
        {f.help && <p className="fieldHelp">{f.help}</p>}
        {over && (
          <p className="fieldHelp is-warn">
            Longer than the space this was designed for. It will still save, but check the page.
          </p>
        )}
      </div>
    )
  }

  return (
    <section className="blockCard">
      <header className="blockCard__head">
        <div>
          <h3>
            {block.title}
            {edited && <span className="pill is-edited">Edited</span>}
            {!edited && <span className="pill">Original</span>}
          </h3>
          {block.description && <p>{block.description}</p>}
        </div>
        {block.preview && (
          <a href={block.preview} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-ghost">
            View <Icon name="arrow" size={12} />
          </a>
        )}
      </header>

      <div className="blockCard__body">{block.fields.map((f) => renderField(f, []))}</div>

      <footer className="blockCard__foot">
        <button type="button" className="btn btn-primary btn-sm" onClick={save} disabled={saving || !dirty}>
          {saving ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}
        </button>
        {edited && (
          <button type="button" className="btn btn-sm btn-ghost" onClick={revert} disabled={saving}>
            Revert to original
          </button>
        )}
        {status && <span className="blockCard__status">{status}</span>}
        {error && <span className="blockCard__status is-error">{error}</span>}
      </footer>
    </section>
  )
}
