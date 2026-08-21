import { redirect } from 'next/navigation'

/* Folded into the single /resources hub. The detail pages
   (/corridors/[slug]) are unchanged; only this index is retired. */
export default function Page() {
  redirect('/resources')
}
