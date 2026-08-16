'use client'

import { useState } from 'react'
import Icon from './Icon'
import { wa } from '@/lib/content/brand'

/* The NDA-style gate (Plan §9).

   Headline details are public; this releases the memorandum.
   The undertaking is shown in full rather than hidden behind a
   link — a gate that nobody reads protects nobody. */

export default function DataRoomGate({ parcels }: { parcels: { code: string; label: string }[] }) {
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [ndaOpen, setNdaOpen] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    setState('sending')

    try {
      const res = await fetch('/api/data-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parcel_code: form.get('parcel_code'),
          parcel_label: parcels.find((p) => p.code === form.get('parcel_code'))?.label ?? '',
          name: form.get('name'),
          organisation: form.get('organisation'),
          role: form.get('role'),
          email: form.get('email'),
          phone: form.get('phone'),
          buyer_type: form.get('buyer_type'),
          ticket_size: form.get('ticket_size'),
          nda_accepted: form.get('nda') === 'on',
        }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body?.error ?? 'Request failed')
      setMessage(body?.message ?? 'Request received.')
      setState('done')
    } catch (err) {
      setMessage((err as Error).message)
      setState('error')
    }
  }

  if (state === 'done') {
    return (
      <div className="gate">
        <span className="gate__lock">
          <Icon name="check" size={22} stroke={2.4} />
        </span>
        <h3>Request received</h3>
        <p>{message}</p>
        <p style={{ marginTop: 14 }}>
          A named advisor reviews every request personally, usually within one working day. If we need
          anything else to verify you, we will ask for it directly rather than declining silently.
        </p>
        <a
          href={wa.largeParcel}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-gold btn-block"
          style={{ marginTop: 22 }}
        >
          <Icon name="whatsapp" size={16} /> Speak to the advisor now
        </a>
      </div>
    )
  }

  return (
    <div className="gate">
      <span className="gate__lock">
        <Icon name="lock" size={22} />
      </span>
      <h3>Request data room access</h3>
      <p>Released to verified buyers against an accepted undertaking. Reviewed by a named advisor.</p>

      <ul className="gate__list">
        {[
          'Full information memorandum with corridor and feasibility analysis',
          'Survey documents, tippani and the measured extent',
          'Our complete six-stage verification report for the assembly',
          'Pricing position and the seller\'s stated terms',
        ].map((x) => (
          <li key={x}>
            <Icon name="check" size={15} stroke={2.4} />
            <span>{x}</span>
          </li>
        ))}
      </ul>

      <form onSubmit={onSubmit}>
        <div className="form-grid">
          <div className="form-group span2">
            <label htmlFor="dr-parcel">Parcel</label>
            <select id="dr-parcel" name="parcel_code" required defaultValue={parcels[0]?.code ?? ''}>
              {parcels.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.code} — {p.label}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="dr-name">Name</label>
            <input id="dr-name" name="name" required autoComplete="name" />
          </div>
          <div className="form-group">
            <label htmlFor="dr-org">Organisation</label>
            <input id="dr-org" name="organisation" required autoComplete="organization" />
          </div>
          <div className="form-group">
            <label htmlFor="dr-role">Role</label>
            <input id="dr-role" name="role" placeholder="e.g. Head of Development" />
          </div>
          <div className="form-group">
            <label htmlFor="dr-type">Buyer type</label>
            <select id="dr-type" name="buyer_type" defaultValue="Developer">
              {['Developer', 'Investor', 'Family office', 'Institution', 'Other'].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="dr-email">Work email</label>
            <input id="dr-email" name="email" type="email" required autoComplete="email" />
          </div>
          <div className="form-group">
            <label htmlFor="dr-phone">Phone</label>
            <input id="dr-phone" name="phone" required inputMode="tel" autoComplete="tel" />
          </div>
          <div className="form-group span2">
            <label htmlFor="dr-ticket">Indicative ticket size</label>
            <select id="dr-ticket" name="ticket_size" defaultValue="₹25–50 Cr">
              {['Under ₹25 Cr', '₹25–50 Cr', '₹50–100 Cr', '₹100 Cr+', 'Not yet defined'].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="gate__nda">
          <label className="gate__ndaCheck">
            <input type="checkbox" name="nda" required />
            <span>
              I accept the confidentiality undertaking below on behalf of myself and my organisation.
            </span>
          </label>
          <button type="button" className="gate__ndaToggle" onClick={() => setNdaOpen((v) => !v)}>
            {ndaOpen ? 'Hide' : 'Read'} the undertaking
          </button>
          {ndaOpen && (
            <div className="gate__ndaText">
              <p>
                Material released through this data room is confidential and provided solely to evaluate a
                possible transaction in the identified parcel. You agree not to disclose it to any third party
                other than your professional advisers on the same terms, not to approach the landowner or any
                party in the assembly directly, and to return or destroy the material on request.
              </p>
              <p>
                Verification findings relate only to the parcel and the scope stated in the report and are not
                a title guarantee. Pricing indications are the seller&rsquo;s stated position and are not an
                offer. This undertaking is a condition of access, not a substitute for the definitive
                documentation the transaction itself will require.
              </p>
            </div>
          )}
        </div>

        <button type="submit" className="btn btn-gold btn-block btn-lg" disabled={state === 'sending'}>
          {state === 'sending' ? 'Sending…' : 'Request access'}
        </button>

        {state === 'error' && (
          <p style={{ fontSize: '.82rem', color: '#ffb4a8', marginTop: 12 }}>{message}</p>
        )}
      </form>
    </div>
  )
}
