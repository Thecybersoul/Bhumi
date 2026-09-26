import { useCallback, useState } from 'react'
import { useFocusEffect } from 'expo-router'
import { Alert, FlatList, Linking, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useApi, ApiError } from '@/lib/api'
import { colors, space, text } from '@/lib/theme'
import { Badge, EmptyState, ErrorBanner, LoadingScreen, Screen } from '@/components/ui'
import { Button, Chips, TextField } from '@/components/form'
import { WhenField } from '@/components/when'
import Ionicons from '@expo/vector-icons/Ionicons'
import { DocRow, DocumentsPanel, pickFiles, takePhoto } from '@/components/documents'
import { uploadDocument, type Doc, type PickedFile } from '@/lib/documents'
import type { ApiResult, Note, Task, TaskPriority } from '@/lib/types'

const PRIORITIES: TaskPriority[] = ['Low', 'Normal', 'High']
const overdue = (t: Task) => t.status === 'Open' && !!t.due_at && new Date(t.due_at).getTime() < Date.now()
const fmt = (iso: string) => new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

export default function NotesTasksScreen() {
  const api = useApi()
  const [view, setView] = useState<'open' | 'done' | 'notes'>('open')
  const [tasks, setTasks] = useState<Task[] | null>(null)
  const [notes, setNotes] = useState<Note[] | null>(null)
  const [google, setGoogle] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  const [title, setTitle] = useState('')
  const [due, setDue] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('Normal')
  const [related, setRelated] = useState('')
  const [noteBody, setNoteBody] = useState('')
  const [noteRel, setNoteRel] = useState('')
  const [noteFiles, setNoteFiles] = useState<PickedFile[]>([])
  const [noteDocs, setNoteDocs] = useState<Record<string, Doc[]>>({})
  const [openNote, setOpenNote] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const [t, n, g, d] = await Promise.all([
        api.get<ApiResult<Task[]>>('/api/tasks'),
        api.get<ApiResult<Note[]>>('/api/notes'),
        api.get<{ connected: boolean }>('/api/admin/google/status').catch(() => ({ connected: false })),
        api.get<{ data: Doc[] }>('/api/documents?entity_type=note').catch(() => ({ data: [] as Doc[] })),
      ])
      setTasks(t.data)
      setNotes(n.data)
      const byNote: Record<string, Doc[]> = {}
      for (const doc of d.data) if (doc.entity_id) (byNote[doc.entity_id] ??= []).push(doc)
      setNoteDocs(byNote)
      setGoogle(g.connected)
      setError(null)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not load')
    }
  }, [api])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  async function refresh() {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  async function addTask() {
    if (!title.trim()) return
    setBusy('add')
    try {
      await api.post('/api/tasks', { title: title.trim(), due_at: due || undefined, priority, entity_label: related.trim() })
      setTitle('')
      setDue('')
      setRelated('')
      setPriority('Normal')
      setAdding(false)
      await load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  async function toggle(t: Task) {
    const status = t.status === 'Open' ? 'Done' : 'Open'
    setTasks((p) => p?.map((x) => (x.id === t.id ? { ...x, status } : x)) ?? null)
    try {
      await api.patch(`/api/tasks/${t.id}`, { status })
    } catch (e) {
      setError((e as Error).message)
      load()
    }
  }

  async function sync(t: Task) {
    setBusy(`c${t.id}`)
    try {
      if (t.google_event_id) {
        await api.del(`/api/tasks/${t.id}/calendar?event_id=${encodeURIComponent(t.google_event_id)}`)
      } else {
        await api.post(`/api/tasks/${t.id}/calendar`, { title: t.title, due_at: t.due_at, entity_label: t.entity_label })
      }
      await load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  function removeTask(t: Task) {
    Alert.alert('Remove task?', t.title, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setTasks((p) => p?.filter((x) => x.id !== t.id) ?? null)
          await api.del(`/api/tasks/${t.id}`).catch(() => load())
        },
      },
    ])
  }

  async function addNote() {
    if (!noteBody.trim()) return
    setBusy('note')
    try {
      const body = noteBody.trim()
      const out = await api.post<{ id?: string }>('/api/notes', { body, entity_label: noteRel.trim() })
      if (noteFiles.length && out.id) {
        const label = (noteRel.trim() || body).slice(0, 60)
        for (const f of noteFiles) {
          await uploadDocument(api, f, { entity_type: 'note', entity_id: out.id, entity_label: label, category: 'Attachment' })
        }
      }
      setNoteBody('')
      setNoteRel('')
      setNoteFiles([])
      await load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  function removeNote(n: Note) {
    Alert.alert('Remove note?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setNotes((p) => p?.filter((x) => x.id !== n.id) ?? null)
          await api.del(`/api/notes/${n.id}`).catch(() => load())
        },
      },
    ])
  }

  if (tasks === null && notes === null && !error) return <LoadingScreen />

  const open = (tasks ?? [])
    .filter((t) => t.status === 'Open')
    .sort((a, b) => Number(overdue(b)) - Number(overdue(a)) || (a.due_at ?? '9').localeCompare(b.due_at ?? '9'))
  const done = (tasks ?? []).filter((t) => t.status === 'Done')
  const rc = <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.navy} />

  const taskRow = ({ item: t }: { item: Task }) => (
    <View style={s.card}>
      <View style={s.top}>
        <TouchableOpacity onPress={() => toggle(t)} hitSlop={10}>
          <View style={[s.box, t.status === 'Done' && s.boxOn]}>{t.status === 'Done' ? <Ionicons name="checkmark" size={16} color={colors.white} /> : null}</View>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[s.title, t.status === 'Done' && s.strike]}>{t.title}</Text>
          <Text style={[s.meta, overdue(t) && { color: colors.flagged }]}>
            {t.due_at ? fmt(t.due_at) : 'No due date'}
            {t.entity_label ? ` · ${t.entity_label}` : ''}
          </Text>
        </View>
        {t.priority === 'High' ? <Badge label="High" tone="flagged" /> : null}
      </View>
      {t.google_meet_url ? (
        <TouchableOpacity onPress={() => Linking.openURL(t.google_meet_url as string)}>
          <Text style={s.meet}><Ionicons name="videocam" size={13} color={colors.goldDeep} /> Join Google Meet</Text>
        </TouchableOpacity>
      ) : null}
      <View style={s.actions}>
        {google && t.due_at && t.status === 'Open' ? (
          <View style={{ flex: 1 }}>
            <Button label={t.google_event_id ? 'Synced ✓ (remove)' : 'Add to Calendar + Meet'} tone="ghost" busy={busy === `c${t.id}`} onPress={() => sync(t)} />
          </View>
        ) : null}
        <View style={{ flex: 0.5 }}><Button label="Remove" tone="danger" onPress={() => removeTask(t)} /></View>
      </View>
    </View>
  )

  return (
    <Screen>
      <View style={s.switcher}>
        {([
          ['open', `Open (${open.length})`],
          ['done', `Done (${done.length})`],
          ['notes', `Notes (${notes?.length ?? 0})`],
        ] as const).map(([id, label]) => (
          <TouchableOpacity key={id} style={[s.sw, view === id && s.swOn]} onPress={() => setView(id)}>
            <Text style={[s.swText, view === id && s.swTextOn]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {error && <ErrorBanner message={error} />}

      {view === 'notes' ? (
        <FlatList
          data={notes ?? []}
          keyExtractor={(n) => n.id}
          contentContainerStyle={s.list}
          refreshControl={rc}
          ListHeaderComponent={
            <View style={s.card}>
              <TextField label="New note" value={noteBody} onChange={setNoteBody} multiline placeholder="What was said, what to remember…" />
              <TextField label="Related to (optional)" value={noteRel} onChange={setNoteRel} placeholder="A lead, deal or listing" />
              {noteFiles.map((f, i) => (
                <View key={f.uri} style={s.pending}>
                  <Ionicons name="attach" size={16} color={colors.navy} />
                  <Text style={s.pendingName} numberOfLines={1}>{f.name}</Text>
                  <TouchableOpacity hitSlop={10} onPress={() => setNoteFiles((p) => p.filter((_, j) => j !== i))}>
                    <Ionicons name="close-circle" size={18} color={colors.muted} />
                  </TouchableOpacity>
                </View>
              ))}
              <View style={s.attachRow}>
                <TouchableOpacity style={s.attachBtn} onPress={async () => { const f = await pickFiles(); setNoteFiles((p) => [...p, ...f]) }}>
                  <Ionicons name="attach" size={17} color={colors.navy} />
                  <Text style={s.attachText}>Attach file</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.attachBtn} onPress={async () => { const f = await takePhoto(); setNoteFiles((p) => [...p, ...f]) }}>
                  <Ionicons name="camera-outline" size={17} color={colors.navy} />
                  <Text style={s.attachText}>Photo</Text>
                </TouchableOpacity>
              </View>
              <Button
                label={noteFiles.length ? `Save note + ${noteFiles.length} file${noteFiles.length > 1 ? 's' : ''}` : 'Save note'}
                onPress={addNote}
                busy={busy === 'note'}
              />
            </View>
          }
          ListEmptyComponent={<EmptyState text="Nothing logged yet." />}
          renderItem={({ item: n }) => {
            const docs = noteDocs[n.id] ?? []
            const expanded = openNote === n.id
            return (
              <View style={s.card}>
                <TouchableOpacity onPress={() => setOpenNote(expanded ? null : n.id)} onLongPress={() => removeNote(n)}>
                  <Text style={s.noteBody}>{n.body}</Text>
                  <View style={s.noteMeta}>
                    <Text style={[s.meta, { flex: 1 }]}>
                      {new Date(n.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      {n.entity_label ? ` · ${n.entity_label}` : ''}
                    </Text>
                    <View style={s.clip}>
                      <Ionicons name="attach" size={15} color={docs.length ? colors.goldDeep : colors.muted} />
                      <Text style={[s.clipText, docs.length > 0 && { color: colors.goldDeep }]}>{docs.length || 'Attach'}</Text>
                      <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={colors.muted} />
                    </View>
                  </View>
                </TouchableOpacity>
                {!expanded && docs.length > 0 ? (
                  <View style={{ marginTop: 6 }}>
                    {docs.slice(0, 2).map((d) => (
                      <DocRow key={d.id} doc={d} onOpen={() => setOpenNote(n.id)} />
                    ))}
                    {docs.length > 2 ? <Text style={s.meta}>+{docs.length - 2} more</Text> : null}
                  </View>
                ) : null}
                {expanded ? (
                  <View style={{ marginTop: space.sm }}>
                    <DocumentsPanel compact entityType="note" entityId={n.id} entityLabel={(n.entity_label || n.body).slice(0, 60)} onCount={() => load()} />
                  </View>
                ) : null}
              </View>
            )
          }}
        />
      ) : (
        <FlatList
          data={view === 'open' ? open : done}
          keyExtractor={(t) => t.id}
          contentContainerStyle={s.list}
          refreshControl={rc}
          ListHeaderComponent={
            view === 'open' ? (
              <View>
                <Button label={adding ? 'Cancel' : '+ New task'} tone={adding ? 'ghost' : 'primary'} onPress={() => setAdding((a) => !a)} />
                {adding ? (
                  <View style={[s.card, { marginTop: space.sm }]}>
                    <TextField label="Task" value={title} onChange={setTitle} placeholder="Call back the Devanahalli enquiry" />
                    <WhenField label="Due" value={due} onChange={setDue} />
                    <Chips label="Priority" options={PRIORITIES} value={priority} onChange={setPriority} />
                    <TextField label="Related to (optional)" value={related} onChange={setRelated} />
                    <Button label="Add task" onPress={addTask} busy={busy === 'add'} />
                  </View>
                ) : null}
              </View>
            ) : null
          }
          ListEmptyComponent={<EmptyState text={view === 'open' ? 'Nothing open. Clear desk.' : 'Nothing completed yet.'} />}
          renderItem={taskRow}
        />
      )}
    </Screen>
  )
}

const s = StyleSheet.create({
  switcher: { flexDirection: 'row', gap: 6, padding: space.lg, paddingBottom: space.sm },
  sw: { flex: 1, paddingVertical: 10, borderRadius: 100, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, alignItems: 'center' },
  swOn: { backgroundColor: colors.navy, borderColor: colors.navy },
  swText: { fontSize: text.xs, fontWeight: '700', color: colors.ink2 },
  swTextOn: { color: colors.white },
  list: { padding: space.lg, paddingTop: space.sm },
  card: { backgroundColor: colors.white, borderRadius: 16, borderWidth: 1, borderColor: colors.line, padding: space.md, marginBottom: 8, marginTop: 2 },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  box: { width: 24, height: 24, borderRadius: 7, borderWidth: 2, borderColor: colors.navy500, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  boxOn: { backgroundColor: colors.navy500 },
  tick: { color: colors.white, fontWeight: '800', fontSize: 14 },
  title: { fontSize: text.md, fontWeight: '700', color: colors.navy },
  strike: { textDecorationLine: 'line-through', color: colors.muted },
  meta: { fontSize: text.sm, color: colors.muted, marginTop: 2 },
  meet: { fontSize: text.sm, color: colors.goldDeep, fontWeight: '700', marginTop: 8 },
  actions: { flexDirection: 'row', gap: 8, marginTop: space.sm },
  noteBody: { fontSize: text.md, color: colors.ink, lineHeight: 21 },
  noteMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  clip: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingLeft: 8 },
  clipText: { fontSize: text.xs, fontWeight: '700', color: colors.muted },
  pending: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.navyTint, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 6 },
  pendingName: { flex: 1, fontSize: text.sm, color: colors.navy, fontWeight: '600' },
  attachRow: { flexDirection: 'row', gap: 8, marginBottom: space.md },
  attachBtn: { flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: colors.line, borderStyle: 'dashed' },
  attachText: { fontSize: text.sm, fontWeight: '700', color: colors.navy },
})
