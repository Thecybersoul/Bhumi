import { useEffect, useState } from 'react'
import { router, useLocalSearchParams, useNavigation } from 'expo-router'
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useApi, ApiError } from '@/lib/api'
import { colors, radius, space, text } from '@/lib/theme'
import { Card, ErrorBanner, LoadingScreen, Screen } from '@/components/ui'
import { Button, SectionTitle, TextField, ToggleRow } from '@/components/form'
import { WhenField } from '@/components/when'
import { EntityPicker, type LinkValue } from '@/components/entityPicker'
import { DocumentsPanel } from '@/components/documents'
import { PeoplePanel } from '@/components/contacts'
import { ActivityFeed } from '@/components/activity'
import { ByLine } from '@/components/people'
import { syncReminders } from '@/lib/notify'
import { EmailButton, EmailLog, MeetAttendance } from '@/components/google'
import { KIND_ICON, KIND_TINT, KINDS } from '@/lib/meetings'
import type { Meeting, MeetingKind, MeetingStatus } from '@/lib/types'

const DURATIONS = [15, 30, 45, 60, 90, 120]
const STATUSES: MeetingStatus[] = ['Scheduled', 'Completed', 'Cancelled']

/* Upcoming → a confirmation with time, place and Meet link.
   Completed → the minutes, from the outcome written up here. */
function meetingEmail(m: Meeting) {
  const when = new Date(m.scheduled_at).toLocaleString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' })
  if (m.status === 'Completed') {
    return {
      subject: `Minutes: ${m.title}`,
      body: [
        'Dear all,',
        `Thank you for your time on ${when}. A summary of what we discussed and agreed:`,
        m.outcome || '• ',
        'Please reply if anything needs correcting.',
        'Warm regards,',
      ].join('\n\n'),
    }
  }
  const lines = [
    `When: ${when} (${m.duration_min} min)`,
    m.google_meet_url ? `Join on Google Meet: ${m.google_meet_url}` : m.location ? `Where: ${m.location}` : '',
    m.entity_label ? `Regarding: ${m.entity_label}` : '',
  ].filter(Boolean)
  return {
    subject: `${m.kind === 'Site visit' ? 'Site visit' : 'Meeting'} confirmed: ${m.title}`,
    body: ['Dear Sir / Madam,', `This is to confirm our ${m.kind.toLowerCase()}.`, lines.join('\n'), m.agenda ? `Agenda:\n${m.agenda}` : '', 'Looking forward to it.', 'Warm regards,']
      .filter(Boolean)
      .join('\n\n'),
  }
}

export default function MeetingScreen() {
  const params = useLocalSearchParams<{ id: string; entity_type?: string; entity_id?: string; entity_label?: string; kind?: string }>()
  const isNew = params.id === 'new'
  const api = useApi()
  const nav = useNavigation()

  const [m, setM] = useState<Meeting | null>(null)
  const [loading, setLoading] = useState(!isNew)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [google, setGoogle] = useState(false)

  const [kind, setKind] = useState<MeetingKind>((KINDS as string[]).includes(params.kind ?? '') ? (params.kind as MeetingKind) : 'In person')
  const [title, setTitle] = useState('')
  const [when, setWhen] = useState('')
  const [duration, setDuration] = useState(30)
  const [location, setLocation] = useState('')
  const [attendees, setAttendees] = useState('')
  const [agenda, setAgenda] = useState('')
  const [outcome, setOutcome] = useState('')
  const [status, setStatus] = useState<MeetingStatus>('Scheduled')
  const [calendar, setCalendar] = useState(true)
  const [link, setLink] = useState<LinkValue>({
    entity_type: (params.entity_type as LinkValue['entity_type']) ?? 'general',
    entity_id: params.entity_id ?? null,
    entity_label: params.entity_label ?? '',
  })

  const [followUp, setFollowUp] = useState('')
  const [followDue, setFollowDue] = useState('')
  const [followBusy, setFollowBusy] = useState(false)
  const [followDone, setFollowDone] = useState<string | null>(null)

  useEffect(() => {
    nav.setOptions({ title: isNew ? 'Log meeting' : 'Meeting' })
    api
      .get<{ connected: boolean }>('/api/admin/google/status')
      .then((g) => setGoogle(g.connected))
      .catch(() => {})
    if (isNew) return
    api
      .get<{ data: Meeting[] }>('/api/meetings')
      .then((r) => {
        const x = r.data.find((y) => y.id === params.id)
        if (!x) return setError('Meeting not found')
        setM(x)
        setKind(x.kind)
        setTitle(x.title)
        setWhen(x.scheduled_at)
        setDuration(x.duration_min)
        setLocation(x.location ?? '')
        setAttendees(x.attendees ?? '')
        setAgenda(x.agenda ?? '')
        setOutcome(x.outcome ?? '')
        setStatus(x.status)
        setLink({ entity_type: x.entity_type as LinkValue['entity_type'], entity_id: x.entity_id ?? null, entity_label: x.entity_label ?? '' })
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Could not load'))
      .finally(() => setLoading(false))
  }, [api, isNew, params.id, nav])

  async function save() {
    if (!title.trim()) return setError('Give the meeting a title, e.g. "Site visit with Mr. Rao"')
    if (!when) return setError('Pick a date and time')
    setBusy(true)
    setError(null)
    const body = {
      title: title.trim(),
      kind,
      scheduled_at: when,
      duration_min: duration,
      location: location.trim(),
      attendees: attendees.trim(),
      agenda: agenda.trim(),
      outcome: outcome.trim(),
      status,
      ...link,
    }
    try {
      if (isNew) {
        await api.post('/api/meetings', { ...body, calendar: google && calendar })
      } else {
        await api.patch(`/api/meetings/${params.id}`, body)
      }
      syncReminders().catch(() => {})
      router.back()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function toggleCalendar() {
    if (!m) return
    setBusy(true)
    try {
      const r = await api.patch<{ data: Meeting }>(`/api/meetings/${m.id}`, { calendar: !m.google_event_id })
      setM(r.data)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function addFollowUp() {
    if (!m || !followUp.trim()) return
    setFollowBusy(true)
    try {
      await api.post('/api/tasks', {
        title: followUp.trim(),
        due_at: followDue || undefined,
        priority: 'Normal',
        entity_type: link.entity_type !== 'general' && link.entity_type !== 'task' ? link.entity_type : 'meeting',
        entity_id: link.entity_type !== 'general' && link.entity_type !== 'task' ? link.entity_id : m.id,
        entity_label: link.entity_type !== 'general' && link.entity_type !== 'task' ? link.entity_label : m.title,
      })
      setFollowDone(followUp.trim())
      setFollowUp('')
      setFollowDue('')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setFollowBusy(false)
    }
  }

  function remove() {
    if (!m) return
    Alert.alert('Delete this meeting?', m.google_event_id ? 'It is also removed from Google Calendar.' : 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.del(`/api/meetings/${m.id}`)
            router.back()
          } catch (e) {
            setError((e as Error).message)
          }
        },
      },
    ])
  }

  if (loading) return <LoadingScreen />
  const past = when && new Date(when).getTime() < Date.now()

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: 70 }} keyboardShouldPersistTaps="handled">
        {error && <ErrorBanner message={error} />}

        {m ? (
          <View style={s.hero}>
            <View style={[s.heroIcon, { backgroundColor: `${KIND_TINT[m.kind]}18` }]}>
              <Ionicons name={KIND_ICON[m.kind]} size={22} color={KIND_TINT[m.kind]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.heroTitle}>{m.title}</Text>
              <Text style={s.heroSub}>
                {new Date(m.scheduled_at).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })} · {m.duration_min} min
              </Text>
              <ByLine record={m} createdAt={m.created_at} />
            </View>
          </View>
        ) : null}

        {m?.google_meet_url ? (
          <TouchableOpacity style={s.meet} onPress={() => Linking.openURL(m.google_meet_url as string)}>
            <Ionicons name="videocam" size={18} color={colors.white} />
            <Text style={s.meetText}>Join Google Meet</Text>
          </TouchableOpacity>
        ) : null}

        <Card>
          <SectionTitle>What kind</SectionTitle>
          <View style={s.kinds}>
            {KINDS.map((k) => (
              <TouchableOpacity key={k} style={[s.kind, kind === k && { backgroundColor: KIND_TINT[k], borderColor: KIND_TINT[k] }]} onPress={() => setKind(k)}>
                <Ionicons name={KIND_ICON[k]} size={18} color={kind === k ? colors.white : KIND_TINT[k]} />
                <Text style={[s.kindText, kind === k && { color: colors.white }]}>{k}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextField label="Title" value={title} onChange={setTitle} placeholder={kind === 'Site visit' ? 'Site visit — Doddasanne layout' : 'Price discussion with the seller'} />
          <EntityPicker value={link} onChange={setLink} />
        </Card>

        <Card>
          <SectionTitle>When & where</SectionTitle>
          <WhenField label="Starts" value={when} onChange={setWhen} clearable={false} />
          <Text style={s.label}>Duration</Text>
          <View style={s.durations}>
            {DURATIONS.map((d) => (
              <TouchableOpacity key={d} style={[s.dur, { flex: 1, paddingHorizontal: 0 }, duration === d && s.durOn]} onPress={() => setDuration(d)}>
                <Text style={[s.durText, duration === d && { color: colors.white }]}>{d < 60 ? `${d}m` : `${d / 60}h`.replace('.5h', '½h')}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextField
            label={kind === 'Call' || kind === 'Video call' ? 'Phone / link (optional)' : 'Location'}
            value={location}
            onChange={setLocation}
            placeholder={kind === 'Site visit' ? 'Survey no. 42, Doddasanne' : 'Bhumi office, Indiranagar'}
          />
          <TextField label="With" value={attendees} onChange={setAttendees} placeholder="Mr. Rao (buyer), Sanjog" />
          {isNew && google ? (
            <ToggleRow label={kind === 'Video call' ? 'Add to Google Calendar with a Meet link' : 'Add to the shared Google Calendar'} value={calendar} onChange={setCalendar} />
          ) : null}
        </Card>

        <Card>
          <SectionTitle>Notes</SectionTitle>
          <TextField label="Agenda" value={agenda} onChange={setAgenda} multiline placeholder="What needs to come out of this" />
          <Text style={s.label}>Status</Text>
          <View style={s.durations}>
            {STATUSES.map((st) => (
              <TouchableOpacity key={st} style={[s.dur, { flex: 1 }, status === st && s.durOn]} onPress={() => setStatus(st)}>
                <Text style={[s.durText, status === st && { color: colors.white }]}>{st}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextField
            label="Outcome / minutes"
            value={outcome}
            onChange={(v) => {
              setOutcome(v)
              if (v.trim() && status === 'Scheduled' && past) setStatus('Completed')
            }}
            multiline
            placeholder="What was agreed, next steps, who does what"
          />
        </Card>

        <Button label={isNew ? 'Save meeting' : 'Save changes'} onPress={save} busy={busy} />

        {m ? (
          <>
            <Card style={{ marginTop: space.lg }}>
              <SectionTitle>{m.status === 'Completed' ? 'Send the minutes' : 'Send a confirmation'}</SectionTitle>
              <EmailButton
                label={m.status === 'Completed' ? 'Email the minutes' : 'Email a confirmation'}
                draft={{ ...meetingEmail(m), entity_type: 'meeting', entity_id: m.id, entity_label: m.title }}
              />
              <View style={{ marginTop: space.sm }}>
                <EmailLog entityType="meeting" entityId={m.id} />
              </View>
            </Card>

            {m.google_meet_url ? (
              <Card>
                <SectionTitle>Who joined the Meet</SectionTitle>
                <MeetAttendance meetingId={m.id} />
              </Card>
            ) : null}

            <Card>
              <SectionTitle>Follow-up task</SectionTitle>
              {followDone ? (
                <View style={s.done}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.verified} />
                  <Text style={s.doneText}>Added “{followDone}” to Tasks</Text>
                </View>
              ) : null}
              <TextField label="" value={followUp} onChange={setFollowUp} placeholder="Send the revised layout plan" />
              <WhenField label="Due" value={followDue} onChange={setFollowDue} />
              <Button label="Add follow-up" tone="ghost" onPress={addFollowUp} busy={followBusy} />
            </Card>

            {google ? (
              <Card>
                <SectionTitle>Google Calendar</SectionTitle>
                <Text style={s.muted}>
                  {m.google_event_id ? 'On the shared calendar (info@bhumiestates.in). Changes here update it.' : 'Not on the calendar yet.'}
                </Text>
                <View style={{ marginTop: space.sm }}>
                  <Button label={m.google_event_id ? 'Remove from calendar' : 'Add to calendar'} tone="ghost" onPress={toggleCalendar} busy={busy} />
                </View>
              </Card>
            ) : null}

            <Card>
              <SectionTitle>People</SectionTitle>
              <PeoplePanel entityType="meeting" entityId={m.id} entityLabel={m.title} roles={['Attendee', 'Client', 'Owner', 'Broker', 'Lawyer', 'Other']} emptyText="Tag who was there from your contacts." />
            </Card>
            <Card>
              <SectionTitle>Documents & photos</SectionTitle>
              <DocumentsPanel compact entityType="meeting" entityId={m.id} entityLabel={m.title} />
            </Card>

            <Card>
              <SectionTitle>History</SectionTitle>
              <ActivityFeed entityType="meeting" entityId={m.id} />
            </Card>

            <Button label="Delete meeting" tone="danger" onPress={remove} />
          </>
        ) : null}
      </ScrollView>
    </Screen>
  )
}

const s = StyleSheet.create({
  hero: { flexDirection: 'row', gap: 12, marginBottom: space.md },
  heroIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontSize: text.lg, fontWeight: '800', color: colors.ink },
  heroSub: { fontSize: text.sm, color: colors.ink2, marginTop: 2 },
  meet: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.progress, borderRadius: radius.base, paddingVertical: 13, marginBottom: space.md },
  meetText: { color: colors.white, fontWeight: '800', fontSize: text.md },
  kinds: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: space.md },
  kind: { flexBasis: '30%', flexGrow: 1, alignItems: 'center', gap: 4, paddingVertical: 12, borderRadius: radius.base, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paper },
  kindText: { fontSize: text.xs, fontWeight: '700', color: colors.ink2 },
  label: { fontSize: text.sm, fontWeight: '700', color: colors.ink2, marginBottom: 6 },
  durations: { flexDirection: 'row', gap: 6, marginBottom: space.md },
  dur: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10, borderWidth: 1, borderColor: colors.line, alignItems: 'center', backgroundColor: colors.white },
  durOn: { backgroundColor: colors.navy, borderColor: colors.navy },
  durText: { fontSize: text.sm, fontWeight: '700', color: colors.ink2 },
  muted: { fontSize: text.sm, color: colors.muted },
  done: { flexDirection: 'row', gap: 6, alignItems: 'center', backgroundColor: colors.verifiedBg, padding: 10, borderRadius: 10, marginBottom: space.sm },
  doneText: { fontSize: text.sm, color: colors.verified, fontWeight: '700', flex: 1 },
})
