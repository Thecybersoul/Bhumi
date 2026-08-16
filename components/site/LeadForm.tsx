'use client'

import { useState } from 'react'
import Icon from './Icon'
import { whatsapp } from '@/lib/content/brand'
import type { LeadKind } from '@/lib/types'

/* WhatsApp-first, not form-first (Plan §3F).

   Click-to-chat is presented as the primary action on every one of
   these blocks; the short form stays available underneath as a
   backup. It is deliberately short — name, phone, and the one
   field that qualifies the lead for this specific context. */

export interface LeadFormProps {
  kind: LeadKind
  source: string
  heading?: string
  blurb?: string
  /** The single qualifying question for this context. */
  qualifier?: { name: string; label: string; placeholder?: string; type?: 'text' | 'number'; options?: string[] }
  whatsappMessage: string
  whatsappLabel?: string
  submitLabel?: string
  /** Extra data captured elsewhere on the page (e.g. tool results). */
  payload?: Record<string, string | number | boolean>
  propertyCode?: string
  corridor?: string
  compact?: boolean
}

export default function LeadForm({
  kind,
  source,
  heading = 'Talk to an advisor',
  blurb,
  qualifier,
  whatsappMessage,
  whatsappLabel = 'Start on WhatsApp',
  submitLabel = 'Send',
  payload,
  propertyCode,
  corridor,
  compact = false,
}: LeadFormProps) {
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    setState('sending')

    const qualifierValue = qualifier ? String(form.get(qualifier.name) ?? '') : ''

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind,
          source,
          channel: 'Form',
          name: form.get('name'),
          phone: form.get('phone'),
          email: form.get('email') ?? '',
          company: form.get('company') ?? '',
          notes: String(form.get('notes') ?? ''),
          property_code: propertyCode ?? '',
          corridor: corridor ?? '',
          payload: {
            ...(payload ?? {}),
            ...(qualifier && qualifierValue ? { [qualifier.name]: qualifierValue } : {}),
          },
        }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body?.error ?? 'Request failed')
      setMessage(body?.message ?? 'Received. An advisor will be in touch shortly.')
      setState('done')
    } catch (err) {
      setMessage((err as Error).message)
      setState('error')
    }
  }

  if (state === 'done') {
    return (
      <div className={`leadForm leadForm--done ${compact ? 'is-compact' : ''}`}>
        <span className="leadForm__tick">
          <Icon name="check" size={22} stroke={2.4} />
        </span>
        <h3 className="h3">Received.</h3>
        <p>{message}</p>
        <a href={whatsapp(whatsappMessage)} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
          <Icon name="whatsapp" size={16} /> Continue on WhatsApp now
        </a>
      </div>
    )
  }

  return (
    <div className={`leadForm ${compact ? 'is-compact' : ''}`}>
      <h3 className="h3">{heading}</h3>
      {blurb && <p className="leadForm__blurb">{blurb}</p>}

      <a
        href={whatsapp(whatsappMessage)}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-whatsapp btn-block btn-lg"
      >
        <Icon name="whatsapp" size={17} /> {whatsappLabel}
      </a>

      <div className="leadForm__divider">
        <span>or leave your details</span>
      </div>

      <form onSubmit={onSubmit} className="leadForm__form">
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor={`${source}-name`}>Name</label>
            <input id={`${source}-name`} name="name" required autoComplete="name" />
          </div>
          <div className="form-group">
            <label htmlFor={`${source}-phone`}>Phone</label>
            <input id={`${source}-phone`} name="phone" required inputMode="tel" autoComplete="tel" />
          </div>

          {!compact && (
            <div className="form-group">
              <label htmlFor={`${source}-email`}>Email <span className="hint">optional</span></label>
              <input id={`${source}-email`} name="email" type="email" autoComplete="email" />
            </div>
          )}

          {qualifier && (
            <div className="form-group">
              <label htmlFor={`${source}-${qualifier.name}`}>{qualifier.label}</label>
              {qualifier.options ? (
                <select id={`${source}-${qualifier.name}`} name={qualifier.name} defaultValue="">
                  <option value="" disabled>
                    Select…
                  </option>
                  {qualifier.options.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id={`${source}-${qualifier.name}`}
                  name={qualifier.name}
                  type={qualifier.type ?? 'text'}
                  placeholder={qualifier.placeholder}
                />
              )}
            </div>
          )}

          {!compact && (
            <div className="form-group span2">
              <label htmlFor={`${source}-notes`}>
                Anything we should know <span className="hint">optional</span>
              </label>
              <textarea id={`${source}-notes`} name="notes" rows={3} />
            </div>
          )}
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={state === 'sending'}>
          {state === 'sending' ? 'Sending…' : submitLabel}
        </button>

        {state === 'error' && <p className="leadForm__error">{message}</p>}

        <p className="leadForm__privacy">
          Your details go to our advisory desk and to nobody else. We do not sell data.
        </p>
      </form>
    </div>
  )
}
