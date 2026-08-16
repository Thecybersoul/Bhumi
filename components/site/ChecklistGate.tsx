'use client'

import { useState } from 'react'
import Icon from './Icon'
import { whatsapp } from '@/lib/content/brand'

/* The gated lead magnet — Plan §7.

   "Credible, useful, and self-qualifying for landowner leads."
   Note the deliberate design choice: the content is NOT actually
   withheld — it is printed in full further down the page. The
   form buys a formatted copy and a conversation, not access.
   A gate that hides genuinely useful information from someone
   who will not fill in a form is a tax on the wrong people. */

export default function ChecklistGate() {
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    setState('sending')
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'Checklist download',
          source: '/checklist',
          channel: 'Form',
          name: form.get('name'),
          phone: form.get('phone'),
          email: form.get('email'),
          payload: {
            holding: String(form.get('holding') ?? ''),
            stage: String(form.get('stage') ?? ''),
          },
          notes: 'Requested the verification checklist',
        }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body?.error ?? 'Request failed')
      setMessage(body?.message ?? 'Sent.')
      setState('done')
    } catch (err) {
      setMessage((err as Error).message)
      setState('error')
    }
  }

  if (state === 'done') {
    return (
      <div className="leadForm leadForm--done">
        <span className="leadForm__tick">
          <Icon name="check" size={22} stroke={2.4} />
        </span>
        <h3 className="h3">On its way.</h3>
        <p>{message} A formatted copy is being sent to you. The full checklist is also printed below — you never needed the form to read it.</p>
        <a href="#checklist" className="btn btn-primary">
          Read it on this page
        </a>
        <a
          href={whatsapp('Hi Bhumi Estates — I downloaded the verification checklist and have a question about my parcel.')}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-whatsapp"
        >
          <Icon name="whatsapp" size={16} /> Ask a question about your parcel
        </a>
      </div>
    )
  }

  return (
    <div className="leadForm">
      <span className="typeCard__icon" style={{ width: 46, height: 46, marginBottom: 14 }}>
        <Icon name="download" size={21} />
      </span>
      <h3 className="h3">Get the formatted copy</h3>
      <p className="leadForm__blurb">
        We will send a laid-out version you can print and take to a site visit. Two of these fields tell us
        whether you might need more than a checklist.
      </p>

      <form onSubmit={onSubmit} className="leadForm__form">
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="cl-name">Name</label>
            <input id="cl-name" name="name" required autoComplete="name" />
          </div>
          <div className="form-group">
            <label htmlFor="cl-phone">Phone</label>
            <input id="cl-phone" name="phone" required inputMode="tel" autoComplete="tel" />
          </div>
          <div className="form-group span2">
            <label htmlFor="cl-email">Email</label>
            <input id="cl-email" name="email" type="email" required autoComplete="email" />
          </div>
          <div className="form-group">
            <label htmlFor="cl-holding">Extent you hold or are buying</label>
            <select id="cl-holding" name="holding" defaultValue="Under 2 acres">
              {['Under 2 acres', '2–10 acres', '10–50 acres', '50+ acres', 'A built property', 'Not specific'].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="cl-stage">Where are you</label>
            <select id="cl-stage" name="stage" defaultValue="Considering">
              {['Just researching', 'Considering', 'Advance paid', 'Agreement signed', 'I already own it'].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
        </div>

        <button type="submit" className="btn btn-gold btn-block btn-lg" disabled={state === 'sending'}>
          <Icon name="download" size={16} />
          {state === 'sending' ? 'Sending…' : 'Send me the checklist'}
        </button>

        {state === 'error' && <p className="leadForm__error">{message}</p>}

        <p className="leadForm__privacy">
          One email with the checklist. No drip campaign, and no data sold — ever.
        </p>
      </form>
    </div>
  )
}
