'use client'

import { useState } from 'react'
import { Mail, MessageCircle, Phone, Plus, Trash2 } from 'lucide-react'
import { api, telHref, waHref } from './lib'
import { parsePhone } from '@/lib/phone'
import { ROLE_TYPES, type ProspectContact, type RoleType } from '@/lib/crm'

/* The numbers at a prospect. Call is offered for any valid number;
   WhatsApp only when the number can be a mobile (never for landlines and
   toll-free). A value that isn't a single valid number gets no buttons and a
   note, instead of a link that fails. */

export function PhoneButtons({ phone, message }: { phone: string; message?: string }) {
  const tel = telHref(phone)
  const wa = waHref(phone, message)
  if (!phone.trim()) return null
  if (!parsePhone(phone)) return <span className="crmSub is-late">Number needs fixing</span>
  return (
    <>
      {tel ? <a className="erpBtn ghost sm" href={tel}><Phone size={13} /> Call</a> : null}
      {wa ? <a className="erpBtn ghost sm" href={wa} target="_blank" rel="noopener noreferrer"><MessageCircle size={13} /> WhatsApp</a> : null}
    </>
  )
}

/** One person or line, with its own Call and WhatsApp. */
function Row({ c, message, onDelete }: { c: ProspectContact; message?: string; onDelete?: () => void }) {
  const ph = parsePhone(c.phone)
  return (
    <div className="crmMatch">
      <b>{c.name}</b>
      <div className="crmSub">{[c.role, c.role_type !== 'Generic' ? c.role_type : ''].filter(Boolean).join(' · ')}</div>
      {c.phone ? <div className="crmSub">{ph?.display ?? c.phone}</div> : null}
      <div className="crmActions">
        <PhoneButtons phone={c.phone} message={message} />
        {c.email ? <a className="erpBtn ghost sm" href={`mailto:${c.email}`}><Mail size={13} /> Email</a> : null}
        {onDelete ? <button className="erpBtn ghost sm" onClick={onDelete} aria-label={`Remove ${c.name}`}><Trash2 size={13} /></button> : null}
      </div>
    </div>
  )
}

/** The compact list on a prospect card. */
export function ContactList({ contacts, message }: { contacts: ProspectContact[]; message?: string }) {
  if (contacts.length === 0) return null
  return (
    <div className="crmContacts">
      <div className="crmSub">Also reach</div>
      {contacts.map((c) => <Row key={c.id} c={c} message={message} />)}
    </div>
  )
}

const blank = { name: '', role: '', role_type: 'Generic' as RoleType, phone: '', email: '' }

/** The editable list in the prospect drawer. */
export function ContactEditor({ prospectId, contacts, message, onChanged, onError }: { prospectId: string; contacts: ProspectContact[]; message?: string; onChanged: () => void; onError: (m: string) => void }) {
  const [adding, setAdding] = useState(false)
  const [f, setF] = useState(blank)
  const [busy, setBusy] = useState(false)

  async function add() {
    if (!f.name.trim()) return onError('Give the person or line a name, e.g. "Land acquisition" or "Head office".')
    setBusy(true)
    try {
      await api.post('/api/crm/prospect-contacts', { ...f, prospect_id: prospectId })
      setF(blank)
      setAdding(false)
      onChanged()
    } catch (e) {
      onError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  async function remove(c: ProspectContact) {
    if (!confirm(`Remove ${c.name}?`)) return
    try {
      await api.del(`/api/crm/prospect-contacts?id=${c.id}`)
      onChanged()
    } catch (e) {
      onError((e as Error).message)
    }
  }

  return (
    <div className="erpField full">
      <span>People and lines</span>
      {contacts.length === 0 ? <small>Nobody published yet. Add a person or a line when you find one; nothing is guessed.</small> : null}
      {contacts.map((c) => <Row key={c.id} c={c} message={message} onDelete={() => remove(c)} />)}
      {adding ? (
        <div className="erpForm two" style={{ marginTop: 8 }}>
          <input className="erpInput" placeholder="Name or label (e.g. Sales line)" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <input className="erpInput" placeholder="Role (optional)" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} />
          <select className="erpInput" value={f.role_type} onChange={(e) => setF({ ...f, role_type: e.target.value as RoleType })} aria-label="Kind of contact">
            {ROLE_TYPES.map((r) => <option key={r}>{r}</option>)}
          </select>
          <input className="erpInput" placeholder="One phone number" inputMode="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
          <input className="erpInput" placeholder="Email (only if published)" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
          <div className="crmActions">
            <button className="erpBtn primary sm" onClick={add} disabled={busy}>Add</button>
            <button className="erpBtn ghost sm" onClick={() => { setAdding(false); setF(blank) }}>Cancel</button>
          </div>
        </div>
      ) : (
        <button className="erpBtn ghost sm" style={{ marginTop: 6 }} onClick={() => setAdding(true)}><Plus size={13} /> Add a person or line</button>
      )}
    </div>
  )
}
