'use client'

import { useState } from 'react'

/* A block of SQL you are meant to run elsewhere. Collapsed by
   default because these are long, and copying is the actual
   action — reading it is optional. */

export default function CopyBlock({ title, text }: { title: string; text: string }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const lines = text.split('\n').length

  return (
    <div className="copyBlock">
      <header>
        <div>
          <code>{title}</code>
          <small>{lines} lines</small>
        </div>
        <div className="row-wrap" style={{ gap: 8 }}>
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => setOpen((v) => !v)}>
            {open ? 'Hide' : 'Show'}
          </button>
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(text)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              } catch {
                setOpen(true)
              }
            }}
          >
            {copied ? 'Copied' : 'Copy SQL'}
          </button>
        </div>
      </header>
      {open && <pre>{text}</pre>}
    </div>
  )
}
