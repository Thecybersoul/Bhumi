'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { PLAYBOOK, openingMessage } from '@/lib/crm'

/* What a salesperson opens on their phone during a call. Placeholders in
   {braces} are filled by hand; "Your name" is filled in from the
   signed-in account. */

export function CopyBtn({ text }: { text: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      className="erpBtn ghost sm"
      onClick={() => {
        navigator.clipboard?.writeText(text).then(() => {
          setDone(true)
          setTimeout(() => setDone(false), 1500)
        })
      }}
    >
      {done ? <Check size={13} /> : <Copy size={13} />} {done ? 'Copied' : 'Copy'}
    </button>
  )
}

function Fold({ n, title, open, children }: { n: number; title: string; open?: boolean; children: React.ReactNode }) {
  return (
    <details className="erpCard crmFold" open={open}>
      <summary>
        <span>{n}</span> {title}
      </summary>
      <div className="crmFold__body">{children}</div>
    </details>
  )
}

function Table({ head, rows }: { head: string[]; rows: readonly (readonly string[])[] }) {
  return (
    <div className="crmTableWrap">
      <table className="crmTable">
        <thead>
          <tr>{head.map((h) => <th key={h}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[0]}>{r.map((c, i) => (i === 0 ? <th key={i} scope="row">{c}</th> : <td key={i}>{c}</td>))}</tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Script({ text }: { text: string }) {
  return (
    <div>
      <pre className="crmScript">{text}</pre>
      <CopyBtn text={text} />
    </div>
  )
}

export default function CrmPlaybook({ me }: { me: string }) {
  const you = (t: string) => t.replace(/\{Your name\}/g, me || '{Your name}')
  const blankP = { name: '{Name}', area: '{Area}', requirement: '{Requirement}' }
  return (
    <div className="crmFolds">
      <Fold n={1} title="The six stages" open>
        <Table head={['Stage', 'Definition', 'Exit condition']} rows={PLAYBOOK.stages} />
        <p className="crmSub">Every prospect needs an owner and a next-action date. A prospect with no date is not in the funnel; it is a forgotten name.</p>
      </Fold>
      <Fold n={2} title="Who to contact and how">
        <Table head={['Type', 'Who decides', 'First touch', 'Rhythm']} rows={PLAYBOOK.contacts} />
      </Fold>
      <Fold n={3} title="Offer ladder">
        <Table head={['Stage', 'What to offer', 'Use when']} rows={PLAYBOOK.ladder} />
      </Fold>
      <Fold n={4} title="Call script">
        <Script text={you(PLAYBOOK.callScript)} />
      </Fold>
      <Fold n={5} title="WhatsApp after the call">
        <Script text={you(PLAYBOOK.whatsapp)} />
      </Fold>
      <Fold n={6} title="Email templates">
        {PLAYBOOK.emails.map(([name, subject], i) => {
          const body = openingMessage({ list: i === 0 ? 'P' : 'B', ...blankP }, me)
          const text = `Subject: ${subject}\n\n${body}`
          return (
            <div key={name} style={{ marginBottom: 14 }}>
              <b>{name}</b>
              <Script text={text} />
            </div>
          )
        })}
      </Fold>
      <Fold n={7} title="Objections">
        {PLAYBOOK.objections.map(([o, a]) => (
          <div key={o} className="crmObj">
            <b>“{o}”</b>
            <p>{a}</p>
            <CopyBtn text={a} />
          </div>
        ))}
      </Fold>
      <Fold n={8} title="Sector angles">
        <Table head={['Development type', 'Where to look']} rows={PLAYBOOK.sectors} />
      </Fold>
    </div>
  )
}
