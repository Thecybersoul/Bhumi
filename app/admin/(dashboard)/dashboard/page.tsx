import Link from 'next/link'
import Icon from '@/components/site/Icon'
import { getLeads, getVerificationCases, getTransparency, getDataRoomRequests, getProperties, deriveFromCases } from '@/lib/db'
import { verificationStages } from '@/lib/content/verification'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Overview · Admin' }

export default async function AdminOverview() {
  const [leadsRes, casesRes, transparency, dataRoomRes, propsRes] = await Promise.all([
    getLeads(),
    getVerificationCases(),
    getTransparency(),
    getDataRoomRequests(),
    getProperties({ admin: true }),
  ])

  const cases = casesRes.data
  const derived = deriveFromCases(cases)
  const leads = leadsRes.data
  const newLeads = leads.filter((l) => l.stage === 'New')
  const pendingDataRoom = dataRoomRes.data.filter((d) => d.status === 'Pending')
  const inProgress = cases.filter((c) => c.outcome === 'In progress')
  const live = propsRes.data.filter((p) => p.status === 'Live')

  const usingFallback = [leadsRes, casesRes, propsRes, dataRoomRes].some((r) => r.source === 'fallback')

  /* Where is each in-progress case stalled? A stage that has sat
     "In progress" is the thing this dashboard exists to surface. */
  const stalled = inProgress
    .map((c) => {
      const stage = c.stages.find((s) => s.status === 'In progress')
      const days = Math.round((Date.now() - new Date(c.opened_at).getTime()) / 86400000)
      const def = verificationStages.find((v) => v.key === stage?.key)
      const overdue = def ? days > def.typicalDays[1] * 2 : false
      return { case: c, stage, def, days, overdue }
    })
    .sort((a, b) => b.days - a.days)

  const leadsByKind = leads.reduce<Record<string, number>>((acc, l) => {
    acc[l.kind] = (acc[l.kind] ?? 0) + 1
    return acc
  }, {})

  return (
    <>
      <div className="adminHead">
        <div>
          <h1>Overview</h1>
          <p>
            The operating picture: what is on the verification desk, what has come in across every conversion
            path, and what the public transparency dashboard is currently publishing.
          </p>
        </div>
        <div className="row-wrap">
          <span className={`sourcePill ${usingFallback ? 'is-fallback' : 'is-live'}`}>
            {usingFallback ? 'Seeded data' : 'Live database'}
          </span>
          <Link href="/verification#transparency" target="_blank" className="btn btn-sm btn-ghost">
            View public dashboard
          </Link>
        </div>
      </div>

      {usingFallback && (
        <div className="adminNote">
          <Icon name="flag" size={15} />
          <span>
            No Supabase credentials are attached, so every panel below is reading the seeded reference
            record and writes are accepted but not persisted. Set{' '}
            <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>SUPABASE_SERVICE_ROLE_KEY</code>, then run{' '}
            <code>supabase/migrations/004_business_plan_restructure.sql</code>, to switch to live data. The
            public site behaves identically either way — that is deliberate.
          </span>
        </div>
      )}

      <div className="statRow">
        <div className="statTile is-gold">
          <span className="statTile__value">{newLeads.length}</span>
          <span className="statTile__label">New leads to action</span>
          <span className="statTile__note">{leads.length} in the inbox in total</span>
        </div>
        <div className="statTile">
          <span className="statTile__value">{inProgress.length}</span>
          <span className="statTile__label">Cases on the verification desk</span>
          <span className="statTile__note">
            {stalled.filter((s) => s.overdue).length} past twice the typical stage duration
          </span>
        </div>
        <div className="statTile is-flagged">
          <span className="statTile__value">{pendingDataRoom.length}</span>
          <span className="statTile__label">Data room requests waiting</span>
          <span className="statTile__note">Each needs a named advisor to release or decline</span>
        </div>
        <div className="statTile is-verified">
          <span className="statTile__value">{live.length}</span>
          <span className="statTile__label">Live listings</span>
          <span className="statTile__note">
            {live.filter((p) => p.verified_stage === 'report').length} have cleared all six stages
          </span>
        </div>
      </div>

      <div className="adminGrid sidebarRight">
        <div className="stack" style={{ gap: 18 }}>
          {/* Verification desk */}
          <div className="adminCard">
            <div className="adminCard__head">
              <div>
                <span className="adminCard__title">On the verification desk</span>
                <span className="adminCard__sub" style={{ display: 'block' }}>
                  Sorted by age. A case past twice its stage&rsquo;s typical duration is flagged here before a
                  client has to ask.
                </span>
              </div>
              <Link href="/admin/verifications" className="btn btn-sm btn-ghost">
                Open the board
              </Link>
            </div>

            {stalled.length === 0 ? (
              <p style={{ fontSize: '.88rem', color: 'var(--muted)' }}>Nothing in progress.</p>
            ) : (
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Reference</th>
                      <th>Parcel</th>
                      <th>Current stage</th>
                      <th>Open</th>
                      <th>Advisor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stalled.map((s) => (
                      <tr key={s.case.id}>
                        <td style={{ fontFamily: 'var(--mono)', fontSize: '.78rem' }}>{s.case.reference}</td>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--navy)' }}>{s.case.parcel_label}</div>
                          <div style={{ fontSize: '.76rem', color: 'var(--muted)' }}>{s.case.location}</div>
                        </td>
                        <td>
                          <span className="badge badge-progress">{s.def?.short ?? '—'}</span>
                        </td>
                        <td>
                          <span style={{ color: s.overdue ? 'var(--flagged)' : 'var(--ink-2)', fontWeight: s.overdue ? 700 : 400 }}>
                            {s.days}d{s.overdue ? ' ⚠' : ''}
                          </span>
                        </td>
                        <td style={{ fontSize: '.82rem' }}>{s.case.advisor || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Lead inbox preview */}
          <div className="adminCard">
            <div className="adminCard__head">
              <div>
                <span className="adminCard__title">Latest leads</span>
                <span className="adminCard__sub" style={{ display: 'block' }}>
                  Every conversion path lands in one inbox — WhatsApp, forms, tool results, checklist
                  downloads and data room requests.
                </span>
              </div>
              <Link href="/admin/leads" className="btn btn-sm btn-ghost">
                Open the inbox
              </Link>
            </div>

            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Kind</th>
                    <th>Name</th>
                    <th>Source</th>
                    <th>Qualifying detail</th>
                    <th>Stage</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.slice(0, 6).map((l) => (
                    <tr key={l.id}>
                      <td>
                        <span className="badge badge-navy leadRow__kind">{l.kind}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{l.name}</div>
                        <div style={{ fontSize: '.76rem', color: 'var(--muted)' }}>{l.company || l.phone}</div>
                      </td>
                      <td style={{ fontFamily: 'var(--mono)', fontSize: '.74rem', color: 'var(--muted)' }}>
                        {l.source}
                      </td>
                      <td>
                        <div className="payloadChips">
                          {Object.entries(l.payload ?? {})
                            .slice(0, 3)
                            .map(([k, v]) => (
                              <span key={k} className="payloadChip">
                                {k}: {String(v)}
                              </span>
                            ))}
                          {Object.keys(l.payload ?? {}).length === 0 && (
                            <span style={{ fontSize: '.76rem', color: 'var(--muted)' }}>—</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-${l.stage === 'New' ? 'pending' : l.stage === 'Closed' ? 'sold' : 'progress'}`}>
                          {l.stage}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="stack" style={{ gap: 18 }}>
          <div className="adminCard">
            <div className="adminCard__head">
              <span className="adminCard__title">What the public sees</span>
            </div>
            <div className="stack" style={{ gap: 12 }}>
              {[
                ['Parcels reviewed', transparency.data.parcels_reviewed.toLocaleString('en-IN')],
                [
                  'Flag rate published',
                  `${Math.round((transparency.data.parcels_flagged / transparency.data.parcels_reviewed) * 100)}%`,
                ],
                ['Median turnaround', `${transparency.data.median_turnaround_days} days`],
                ['Period', transparency.data.period],
              ].map(([k, v]) => (
                <div key={k} className="row-wrap" style={{ justifyContent: 'space-between', fontSize: '.85rem' }}>
                  <span style={{ color: 'var(--muted)' }}>{k}</span>
                  <strong style={{ color: 'var(--navy)' }}>{v}</strong>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
              <p style={{ fontSize: '.78rem', color: 'var(--muted)', lineHeight: 1.6, marginBottom: 12 }}>
                Live case record currently shows {derived.reviewed} cases, {derived.flagged} flagged, median{' '}
                {derived.medianTurnaround || '—'} days. Reconcile before the next publication.
              </p>
              <Link href="/admin/transparency" className="btn btn-sm btn-primary btn-block">
                Review the published figures
              </Link>
            </div>
          </div>

          <div className="adminCard">
            <div className="adminCard__head">
              <span className="adminCard__title">Leads by path</span>
            </div>
            <div className="stack" style={{ gap: 10 }}>
              {Object.entries(leadsByKind)
                .sort((a, b) => b[1] - a[1])
                .map(([kind, count]) => {
                  const max = Math.max(...Object.values(leadsByKind))
                  return (
                    <div key={kind}>
                      <div className="row-wrap" style={{ justifyContent: 'space-between', fontSize: '.8rem', marginBottom: 4 }}>
                        <span style={{ color: 'var(--ink-2)' }}>{kind}</span>
                        <strong style={{ color: 'var(--navy)' }}>{count}</strong>
                      </div>
                      <div style={{ height: 6, background: 'var(--line-2)', borderRadius: 100, overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${(count / max) * 100}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, var(--gold-deep), var(--gold))',
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>

          <div className="adminCard">
            <div className="adminCard__head">
              <span className="adminCard__title">Data room queue</span>
            </div>
            {pendingDataRoom.length === 0 ? (
              <p style={{ fontSize: '.85rem', color: 'var(--muted)' }}>Nothing waiting.</p>
            ) : (
              <div className="stack" style={{ gap: 12 }}>
                {pendingDataRoom.map((d) => (
                  <div key={d.id} style={{ fontSize: '.84rem' }}>
                    <strong style={{ color: 'var(--navy)', display: 'block' }}>{d.name}</strong>
                    <span style={{ color: 'var(--muted)', fontSize: '.78rem' }}>
                      {d.organisation} · {d.buyer_type} · {d.ticket_size}
                    </span>
                    <div style={{ fontSize: '.76rem', color: 'var(--muted)', marginTop: 2 }}>{d.parcel_code}</div>
                  </div>
                ))}
              </div>
            )}
            <Link href="/admin/data-room" className="btn btn-sm btn-ghost btn-block" style={{ marginTop: 14 }}>
              Review requests
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
