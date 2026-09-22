import { useCallback, useState } from 'react'
import { useFocusEffect } from 'expo-router'
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { useApi, ApiError } from '@/lib/api'
import { colors, space, text } from '@/lib/theme'
import { EmptyState, ErrorBanner, LoadingScreen, Screen } from '@/components/ui'
import type { ApiResult, Note, Task } from '@/lib/types'

function isOverdue(t: Task) {
  return t.status === 'Open' && !!t.due_at && new Date(t.due_at).getTime() < Date.now()
}
function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function NotesTasksScreen() {
  const api = useApi()
  const [view, setView] = useState<'tasks' | 'notes'>('tasks')
  const [tasks, setTasks] = useState<Task[] | null>(null)
  const [notes, setNotes] = useState<Note[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newNote, setNewNote] = useState('')
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const [t, n] = await Promise.all([
        api.get<ApiResult<Task[]>>('/api/tasks'),
        api.get<ApiResult<Note[]>>('/api/notes'),
      ])
      setTasks(t.data)
      setNotes(n.data)
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

  async function onRefresh() {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  async function addTask() {
    if (!newTitle.trim()) return
    setBusy('add')
    try {
      await api.post('/api/tasks', { title: newTitle.trim() })
      setNewTitle('')
      await load()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not add task')
    } finally {
      setBusy(null)
    }
  }

  async function toggleTask(t: Task) {
    setBusy(t.id)
    try {
      await api.patch(`/api/tasks/${t.id}`, { status: t.status === 'Open' ? 'Done' : 'Open' })
      setTasks((prev) => prev?.map((x) => (x.id === t.id ? { ...x, status: x.status === 'Open' ? 'Done' : 'Open' } : x)) ?? null)
    } finally {
      setBusy(null)
    }
  }

  async function addNote() {
    if (!newNote.trim()) return
    setBusy('add-note')
    try {
      await api.post('/api/notes', { body: newNote.trim() })
      setNewNote('')
      await load()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not add note')
    } finally {
      setBusy(null)
    }
  }

  const loading = tasks === null && notes === null && !error
  const openTasks = (tasks ?? []).filter((t) => t.status === 'Open')

  return (
    <Screen>
      <View style={styles.switcher}>
        <TouchableOpacity style={[styles.switchBtn, view === 'tasks' && styles.switchBtnActive]} onPress={() => setView('tasks')}>
          <Text style={[styles.switchText, view === 'tasks' && styles.switchTextActive]}>Tasks ({openTasks.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.switchBtn, view === 'notes' && styles.switchBtnActive]} onPress={() => setView('notes')}>
          <Text style={[styles.switchText, view === 'notes' && styles.switchTextActive]}>Notes ({notes?.length ?? 0})</Text>
        </TouchableOpacity>
      </View>

      {error && <ErrorBanner message={error} />}
      {loading ? (
        <LoadingScreen />
      ) : view === 'tasks' ? (
        <FlatList
          data={openTasks}
          keyExtractor={(t) => t.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.navy} />}
          ListHeaderComponent={
            <View style={styles.addRow}>
              <TextInput
                style={styles.addInput}
                placeholder="Add a task…"
                placeholderTextColor={colors.muted}
                value={newTitle}
                onChangeText={setNewTitle}
                onSubmitEditing={addTask}
              />
              <TouchableOpacity style={styles.addBtn} onPress={addTask} disabled={busy === 'add'}>
                <Text style={styles.addBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
          }
          ListEmptyComponent={<EmptyState text="Nothing open. Clear desk." />}
          renderItem={({ item: t }) => (
            <TouchableOpacity style={styles.taskRow} onPress={() => toggleTask(t)} disabled={busy === t.id}>
              <View style={styles.checkbox} />
              <View style={{ flex: 1 }}>
                <Text style={styles.taskTitle}>{t.title}</Text>
                <Text style={[styles.taskMeta, isOverdue(t) && { color: colors.flagged }]}>
                  {t.due_at ? fmtDateTime(t.due_at) : 'No due date'}
                  {t.entity_label ? ` · ${t.entity_label}` : ''}
                </Text>
                {t.google_meet_url && <Text style={styles.meetLink}>📅 Synced to Calendar</Text>}
              </View>
            </TouchableOpacity>
          )}
        />
      ) : (
        <FlatList
          data={notes ?? []}
          keyExtractor={(n) => n.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.navy} />}
          ListHeaderComponent={
            <View style={styles.addRow}>
              <TextInput
                style={styles.addInput}
                placeholder="What was said, what to remember…"
                placeholderTextColor={colors.muted}
                value={newNote}
                onChangeText={setNewNote}
                onSubmitEditing={addNote}
                multiline
              />
              <TouchableOpacity style={styles.addBtn} onPress={addNote} disabled={busy === 'add-note'}>
                <Text style={styles.addBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
          }
          ListEmptyComponent={<EmptyState text="Nothing logged yet." />}
          renderItem={({ item: n }) => (
            <View style={styles.noteRow}>
              <Text style={styles.noteBody}>{n.body}</Text>
              <Text style={styles.taskMeta}>
                {new Date(n.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                {n.entity_label ? ` · ${n.entity_label}` : ''}
              </Text>
            </View>
          )}
        />
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  switcher: { flexDirection: 'row', gap: 8, padding: space.lg, paddingBottom: space.sm },
  switchBtn: { flex: 1, paddingVertical: 10, borderRadius: 100, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, alignItems: 'center' },
  switchBtnActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  switchText: { fontSize: text.sm, fontWeight: '600', color: colors.ink2 },
  switchTextActive: { color: colors.white },
  list: { padding: space.lg, paddingTop: space.sm },
  addRow: { flexDirection: 'row', gap: 8, marginBottom: space.md },
  addInput: { flex: 1, borderWidth: 1, borderColor: colors.line, borderRadius: 12, padding: 10, fontSize: text.md, backgroundColor: colors.white, color: colors.ink },
  addBtn: { backgroundColor: colors.navy, borderRadius: 12, paddingHorizontal: 16, justifyContent: 'center' },
  addBtnText: { color: colors.white, fontWeight: '700', fontSize: text.sm },
  taskRow: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.md,
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 2, borderColor: colors.navy500, marginTop: 2 },
  taskTitle: { fontSize: text.base, fontWeight: '600', color: colors.navy },
  taskMeta: { fontSize: text.sm, color: colors.muted, marginTop: 2 },
  meetLink: { fontSize: text.sm, color: colors.goldDeep, fontWeight: '600', marginTop: 4 },
  noteRow: { backgroundColor: colors.white, borderRadius: 14, borderWidth: 1, borderColor: colors.line, padding: space.md, marginBottom: 8 },
  noteBody: { fontSize: text.md, color: colors.ink, lineHeight: 20 },
})
