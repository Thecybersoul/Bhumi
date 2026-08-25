import Link from 'next/link'
import { notFound } from 'next/navigation'
import Icon from '@/components/site/Icon'
import BlockEditor from '@/components/admin/BlockEditor'
import { blocksByPage, PAGES, type Block } from '@/lib/content/schema'
import { getAllContent, editedKeys, checkHealth } from '@/lib/cms'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ page: string }> }) {
  const { page } = await params
  const def = PAGES.find((p) => p.id === page)
  return { title: `${def?.label ?? 'Content'} · Admin` }
}

export default async function ContentPage({ params }: { params: Promise<{ page: string }> }) {
  const { page } = await params
  const def = PAGES.find((p) => p.id === page)
  if (!def) notFound()

  const [content, edited, health] = await Promise.all([
    getAllContent(),
    editedKeys(),
    checkHealth(),
  ])
  const blocks = blocksByPage(def.id as Block['page'])
  const canSave = health.state === 'empty' || health.state === 'live'

  return (
    <>
      <div className="adminHead">
        <div>
          <h1>{def.label}</h1>
          <p>
            Each block below is a section of the live page. Saving overrides the copy compiled into the
            codebase; reverting removes the override and puts the original back.
          </p>
        </div>
        <div className="row-wrap">
          {def.href && (
            <a href={def.href} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-ghost">
              Open page <Icon name="arrow" size={12} />
            </a>
          )}
        </div>
      </div>

      {!canSave && (
        <div className="adminNote">
          <Icon name="flag" size={15} />
          <span>
            <strong>{health.headline}.</strong> {health.detail}
            {health.action && <> {health.action}</>} Until then these forms show the current copy but
            cannot save.
          </span>
        </div>
      )}

      <nav className="contentTabs">
        {PAGES.map((p) => (
          <Link key={p.id} href={`/admin/content/${p.id}`} className={p.id === def.id ? 'is-active' : ''}>
            {p.label}
            <em>{blocksByPage(p.id).length}</em>
          </Link>
        ))}
      </nav>

      <div className="blockList">
        {blocks.map((b) => (
          <BlockEditor
            key={b.key}
            block={b}
            initial={(content[b.key] ?? b.default) as Record<string, unknown>}
            isEdited={edited.has(b.key)}
          />
        ))}
      </div>
    </>
  )
}
