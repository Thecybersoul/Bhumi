import Link from 'next/link'
import Icon from '@/components/site/Icon'
import { checkHealth, editedKeys } from '@/lib/cms'
import { blocks, PAGES, blocksByPage } from '@/lib/content/schema'
import { getProperties, getLeads } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Overview · Admin' }

const STATE_TONE: Record<string, string> = {
  live: 'is-live',
  empty: 'is-ok',
  'no-tables': 'is-warn',
  unreachable: 'is-bad',
  unconfigured: 'is-warn',
}

export default async function AdminOverview() {
  const [health, edited, props, leads] = await Promise.all([
    checkHealth(),
    editedKeys().catch(() => new Set<string>()),
    getProperties({ admin: true }),
    getLeads(),
  ])

  const canEdit = health.state === 'empty' || health.state === 'live'
  const newLeads = leads.data.filter((l) => l.stage === 'New')

  return (
    <>
      <div className="adminHead">
        <div>
          <h1>Overview</h1>
          <p>
            What the public site is currently serving, and what is available to change. The site
            renders correctly whether or not anything here has been edited — that is deliberate.
          </p>
        </div>
        <div className="row-wrap">
          <a href="/" target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-ghost">
            View site <Icon name="arrow" size={12} />
          </a>
        </div>
      </div>

      {/* ── Connection state ──
          Named precisely, because the previous banner reported every
          fallback as "no credentials" and sent you looking for a key
          that was already set. */}
      <section className={`healthCard ${STATE_TONE[health.state] ?? ''}`}>
        <div className="healthCard__main">
          <span className="healthCard__dot" aria-hidden="true" />
          <div>
            <h2>{health.headline}</h2>
            <p>{health.detail}</p>
            {health.action && <p className="healthCard__action">{health.action}</p>}
          </div>
        </div>

        {health.tables.length > 0 && (
          <ul className="healthCard__tables">
            {health.tables.map((t) => (
              <li key={t.name} className={t.exists ? 'is-ok' : 'is-missing'}>
                <code>{t.name}</code>
                <span>{t.exists ? `${t.rows ?? 0} rows` : 'missing'}</span>
              </li>
            ))}
            <li className={health.bucketReady ? 'is-ok' : 'is-missing'}>
              <code>storage</code>
              <span>{health.bucketReady ? 'ready' : 'on first upload'}</span>
            </li>
          </ul>
        )}
      </section>

      {/* ── What can be edited ── */}
      <section className="adminSection">
        <h2>Edit the site</h2>
        <div className="tileGrid">
          {PAGES.map((p) => {
            const list = blocksByPage(p.id)
            const changed = list.filter((b) => edited.has(b.key)).length
            return (
              <Link key={p.id} href={`/admin/content/${p.id}`} className="tile">
                <span className="tile__eyebrow">{list.length} sections</span>
                <strong>{p.label}</strong>
                <span className="tile__note">
                  {changed > 0 ? `${changed} edited` : 'All original copy'}
                </span>
                <span className="tile__go">
                  Edit <Icon name="arrow" size={13} />
                </span>
              </Link>
            )
          })}

          <Link href="/admin/media" className="tile">
            <span className="tile__eyebrow">Images · video · PDFs</span>
            <strong>Media</strong>
            <span className="tile__note">
              {health.bucketReady ? 'Storage ready' : 'Created on first upload'}
            </span>
            <span className="tile__go">
              Open <Icon name="arrow" size={13} />
            </span>
          </Link>

          <Link href="/admin/properties" className="tile">
            <span className="tile__eyebrow">{props.data.length} listings</span>
            <strong>Marketplace</strong>
            <span className="tile__note">
              {props.data.filter((p) => p.status === 'Live').length} live
            </span>
            <span className="tile__go">
              Manage <Icon name="arrow" size={13} />
            </span>
          </Link>

          <Link href="/admin/leads" className="tile">
            <span className="tile__eyebrow">{leads.data.length} total</span>
            <strong>Leads</strong>
            <span className="tile__note">
              {newLeads.length > 0 ? `${newLeads.length} new` : 'Nothing new'}
            </span>
            <span className="tile__go">
              Open <Icon name="arrow" size={13} />
            </span>
          </Link>
        </div>
      </section>

      {/* ── Recently changed ── */}
      <section className="adminSection">
        <h2>Content status</h2>
        <div className="tableWrap">
          <table className="adminTable">
            <thead>
              <tr>
                <th>Section</th>
                <th>Page</th>
                <th>State</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {blocks.map((b) => (
                <tr key={b.key}>
                  <td>
                    <strong>{b.title}</strong>
                  </td>
                  <td className="muted">{PAGES.find((p) => p.id === b.page)?.label ?? b.page}</td>
                  <td>
                    <span className={`pill ${edited.has(b.key) ? 'is-edited' : ''}`}>
                      {edited.has(b.key) ? 'Edited' : 'Original'}
                    </span>
                  </td>
                  <td>
                    <Link href={`/admin/content/${b.page}`} className="link-arrow">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!canEdit && (
          <p className="muted" style={{ marginTop: 12, fontSize: '.85rem' }}>
            Everything above is readable, but saving needs the database reachable with its tables
            created.
          </p>
        )}
      </section>
    </>
  )
}
