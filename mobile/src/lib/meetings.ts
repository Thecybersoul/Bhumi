import type Ionicons from '@expo/vector-icons/Ionicons'
import type { Meeting, MeetingKind } from './types'

export const KINDS: MeetingKind[] = ['In person', 'Site visit', 'Call', 'Video call', 'Discussion']

export const KIND_ICON: Record<MeetingKind, keyof typeof Ionicons.glyphMap> = {
  'In person': 'people',
  'Site visit': 'navigate',
  Call: 'call',
  'Video call': 'videocam',
  Discussion: 'chatbubbles',
}

export const KIND_TINT: Record<MeetingKind, string> = {
  'In person': '#0E3B2E',
  'Site visit': '#9E7833',
  Call: '#1B6FA8',
  'Video call': '#6B4FA8',
  Discussion: '#2F8462',
}

/** Held in the past but never marked Completed: the minutes are still owed. */
export const needsOutcome = (m: Meeting) =>
  m.status === 'Scheduled' && new Date(m.scheduled_at).getTime() + m.duration_min * 60_000 < Date.now()

export function dayLabel(iso: string) {
  const d = new Date(iso)
  const start = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const diff = Math.round((start(d) - start(new Date())) / 86_400_000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })
}

export const timeOf = (iso: string) => new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
