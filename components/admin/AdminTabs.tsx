'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'

/* A shared tab shell for admin pages that fold several related
   views into one nav entry (Deals: pipeline/leads/document
   requests; Properties: listings/verification). Every tab's
   content is already rendered server-side and handed in as a
   prop — switching tabs only ever toggles visibility, never
   remounts, so a filter typed into one tab survives a trip to
   another and back. */

export default function AdminTabs({
  tabs,
  defaultTab,
}: {
  tabs: { id: string; label: string; count?: number; content: ReactNode }[]
  defaultTab?: string
}) {
  const [active, setActive] = useState(defaultTab && tabs.some((t) => t.id === defaultTab) ? defaultTab : tabs[0].id)

  return (
    <>
      <div className="adminTabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`adminTabs__item ${active === t.id ? 'is-active' : ''}`}
            onClick={() => setActive(t.id)}
          >
            {t.label}
            {t.count != null && <span className="adminTabs__count">{t.count}</span>}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div key={t.id} style={{ display: active === t.id ? 'block' : 'none' }}>
          {t.content}
        </div>
      ))}
    </>
  )
}
