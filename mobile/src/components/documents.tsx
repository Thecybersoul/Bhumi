import { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Alert, Image, Linking, Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import * as DocumentPicker from 'expo-document-picker'
import * as ImagePicker from 'expo-image-picker'
import { useApi } from '@/lib/api'
import { CATEGORIES, docIcon, formatBytes, uploadDocument, type Doc, type DocEntity, type PickedFile } from '@/lib/documents'
import { colors, radius, space, text } from '@/lib/theme'

/* ─── Picking ────────────────────────────────────────────── */

/** Files from anywhere the phone can reach — its storage, Google
    Drive, WhatsApp downloads — through the system picker. */
export async function pickFiles(): Promise<PickedFile[]> {
  const res = await DocumentPicker.getDocumentAsync({ multiple: true, copyToCacheDirectory: true, type: '*/*' })
  if (res.canceled) return []
  return res.assets.map((a) => ({ uri: a.uri, name: a.name, mime: a.mimeType ?? 'application/octet-stream', size: a.size }))
}

/** A photo taken on the spot — a site visit, a signed page. */
export async function takePhoto(): Promise<PickedFile[]> {
  const perm = await ImagePicker.requestCameraPermissionsAsync()
  if (!perm.granted) {
    Alert.alert('Camera access needed', 'Allow camera access in Settings to photograph documents.')
    return []
  }
  const res = await ImagePicker.launchCameraAsync({ quality: 0.7 })
  if (res.canceled || !res.assets[0]) return []
  const a = res.assets[0]
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')
  return [{ uri: a.uri, name: a.fileName ?? `photo-${stamp}.jpg`, mime: a.mimeType ?? 'image/jpeg', size: a.fileSize }]
}

/* ─── One row ────────────────────────────────────────────── */

export function DocRow({ doc, onOpen, onRemove }: { doc: Doc; onOpen: () => void; onRemove?: () => void }) {
  const { icon, tint } = docIcon(doc.mime, doc.name)
  return (
    <Pressable style={({ pressed }) => [s.row, pressed && { backgroundColor: colors.cream }]} onPress={onOpen} onLongPress={onRemove}>
      <View style={[s.fileIcon, { backgroundColor: `${tint}14` }]}>
        <Ionicons name={icon} size={20} color={tint} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.name} numberOfLines={1}>
          {doc.name}
        </Text>
        <View style={s.metaRow}>
          <Text style={s.cat}>{doc.category}</Text>
          <Text style={s.meta}>
            {[formatBytes(doc.bytes), new Date(doc.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })]
              .filter(Boolean)
              .join(' · ')}
          </Text>
          {doc.storage === 'drive' ? (
            <View style={s.drive}>
              <Ionicons name="logo-google" size={10} color={colors.progress} />
              <Text style={s.driveText}>Drive</Text>
            </View>
          ) : null}
        </View>
      </View>
      {onRemove ? (
        <TouchableOpacity onPress={onRemove} hitSlop={10}>
          <Ionicons name="ellipsis-vertical" size={18} color={colors.muted} />
        </TouchableOpacity>
      ) : null}
    </Pressable>
  )
}

/* ─── The panel ──────────────────────────────────────────── */

/** Every document on one record, with upload (files, camera, or a
    Drive link) and open/rename/remove. Drop it into any detail
    screen with the record's type, id and a human label — the label
    also names its folder in Google Drive. */
export function DocumentsPanel({
  entityType,
  entityId,
  entityLabel,
  compact,
  onCount,
}: {
  entityType: DocEntity
  entityId: string
  entityLabel: string
  compact?: boolean
  onCount?: (n: number) => void
}) {
  const api = useApi()
  const [docs, setDocs] = useState<Doc[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<string | null>(null)
  const [category, setCategory] = useState(CATEGORIES[entityType][0])
  const [linking, setLinking] = useState(false)
  const [link, setLink] = useState('')
  const [linkName, setLinkName] = useState('')
  const [preview, setPreview] = useState<{ url: string; name: string } | null>(null)
  const [drive, setDrive] = useState(false)
  // Held in a ref so a parent passing an inline callback cannot make
  // load() change identity every render and re-fetch in a loop.
  const onCountRef = useRef(onCount)
  onCountRef.current = onCount
  const firstCount = useRef(true)

  const load = useCallback(async () => {
    try {
      const r = await api.get<{ data: Doc[]; error?: string }>(
        `/api/documents?entity_type=${entityType}&entity_id=${encodeURIComponent(entityId)}`
      )
      setDocs(r.data)
      if (!firstCount.current) onCountRef.current?.(r.data.length)
      firstCount.current = false
      if (r.error) setError(r.error.includes('documents') ? 'Documents table missing — run migration 011.' : r.error)
    } catch (e) {
      setError((e as Error).message)
      setDocs([])
    }
  }, [api, entityType, entityId])

  useEffect(() => {
    load()
    api
      .get<{ drive?: boolean }>('/api/admin/google/status')
      .then((r) => setDrive(Boolean(r.drive)))
      .catch(() => {})
  }, [load, api])

  async function add(files: PickedFile[]) {
    if (!files.length) return
    setError(null)
    try {
      for (let i = 0; i < files.length; i++) {
        setProgress(files.length > 1 ? `Uploading ${i + 1} of ${files.length}…` : `Uploading ${files[i].name}…`)
        await uploadDocument(api, files[i], { entity_type: entityType, entity_id: entityId, entity_label: entityLabel, category })
      }
      await load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setProgress(null)
    }
  }

  async function saveLink() {
    if (!link.trim()) return
    setProgress('Saving link…')
    try {
      await api.post('/api/documents', {
        action: 'record',
        link: link.trim(),
        name: linkName.trim() || 'Google Drive file',
        entity_type: entityType,
        entity_id: entityId,
        entity_label: entityLabel,
        category,
      })
      setLink('')
      setLinkName('')
      setLinking(false)
      await load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setProgress(null)
    }
  }

  async function open(doc: Doc) {
    try {
      const { url } = await api.get<{ url: string }>(`/api/documents/${doc.id}`)
      if (doc.storage === 'supabase' && doc.mime.startsWith('image/')) return setPreview({ url, name: doc.name })
      await Linking.openURL(url)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  function manage(doc: Doc) {
    const cats = CATEGORIES[entityType]
    Alert.alert(doc.name, doc.storage === 'drive' ? 'Stored in Google Drive' : 'Stored in Bhumi secure storage', [
      ...(cats.length > 1
        ? [
            {
              text: 'Change category',
              onPress: () =>
                Alert.alert(
                  'Category',
                  undefined,
                  cats.slice(0, 8).map((c) => ({
                    text: c,
                    onPress: async () => {
                      await api.patch(`/api/documents/${doc.id}`, { category: c }).catch((e) => setError(e.message))
                      load()
                    },
                  }))
                ),
            },
          ]
        : []),
      {
        text: 'Remove',
        style: 'destructive' as const,
        onPress: async () => {
          setDocs((p) => p?.filter((d) => d.id !== doc.id) ?? null)
          await api.del(`/api/documents/${doc.id}`).catch((e) => setError(e.message))
          load()
        },
      },
      { text: 'Cancel', style: 'cancel' as const },
    ])
  }

  const cats = CATEGORIES[entityType]

  return (
    <View>
      {!compact && cats.length > 1 ? (
        <View style={s.cats}>
          {cats.map((c) => (
            <TouchableOpacity key={c} onPress={() => setCategory(c)} style={[s.catChip, category === c && s.catChipOn]}>
              <Text style={[s.catChipText, category === c && s.catChipTextOn]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      <View style={s.actions}>
        <Action icon="cloud-upload-outline" label="Upload" onPress={async () => add(await pickFiles())} />
        <Action icon="camera-outline" label="Camera" onPress={async () => add(await takePhoto())} />
        <Action icon="logo-google" label="Drive link" onPress={() => setLinking((v) => !v)} />
      </View>

      <Text style={s.dest}>
        <Ionicons name={drive ? 'logo-google' : 'lock-closed'} size={11} color={colors.muted} />{' '}
        {drive ? 'New files are saved to Google Drive › Bhumi Estates ERP' : 'New files are saved to Bhumi secure storage'}
        {!compact && cats.length > 1 ? ` · as “${category}”` : ''}
      </Text>

      {linking ? (
        <View style={s.linkBox}>
          <TextInput style={s.input} value={link} onChangeText={setLink} placeholder="Paste a Google Drive link" placeholderTextColor={colors.muted} autoCapitalize="none" keyboardType="url" />
          <TextInput style={s.input} value={linkName} onChangeText={setLinkName} placeholder="Name (e.g. Sale deed 2019)" placeholderTextColor={colors.muted} />
          <TouchableOpacity style={s.linkSave} onPress={saveLink}>
            <Text style={s.linkSaveText}>Attach link</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {progress ? (
        <View style={s.progress}>
          <ActivityIndicator size="small" color={colors.navy} />
          <Text style={s.progressText}>{progress}</Text>
        </View>
      ) : null}
      {error ? <Text style={s.error}>{error}</Text> : null}

      {docs === null ? (
        <ActivityIndicator color={colors.navy} style={{ marginVertical: space.md }} />
      ) : docs.length === 0 ? (
        <View style={s.empty}>
          <Ionicons name="folder-open-outline" size={26} color={colors.line} />
          <Text style={s.emptyText}>No documents yet</Text>
        </View>
      ) : (
        <View style={s.list}>
          {docs.map((d) => (
            <DocRow key={d.id} doc={d} onOpen={() => open(d)} onRemove={() => manage(d)} />
          ))}
        </View>
      )}

      <Modal visible={!!preview} transparent animationType="fade" onRequestClose={() => setPreview(null)}>
        <Pressable style={s.modal} onPress={() => setPreview(null)}>
          {preview ? <Image source={{ uri: preview.url }} style={s.modalImg} resizeMode="contain" /> : null}
          <Text style={s.modalName}>{preview?.name}</Text>
          <TouchableOpacity style={s.modalBtn} onPress={() => preview && Linking.openURL(preview.url)}>
            <Ionicons name="open-outline" size={16} color={colors.white} />
            <Text style={s.modalBtnText}>Open full size</Text>
          </TouchableOpacity>
        </Pressable>
      </Modal>
    </View>
  )
}

function Action({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={s.action} onPress={onPress}>
      <Ionicons name={icon} size={18} color={colors.navy} />
      <Text style={s.actionText}>{label}</Text>
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  cats: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: space.sm },
  catChip: { paddingHorizontal: 11, paddingVertical: 6, borderRadius: 100, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white },
  catChipOn: { backgroundColor: colors.goldTint, borderColor: colors.gold },
  catChipText: { fontSize: text.xs, fontWeight: '600', color: colors.ink2 },
  catChipTextOn: { color: colors.goldDeep },
  actions: { flexDirection: 'row', gap: 8 },
  action: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: radius.base,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
  },
  actionText: { fontSize: text.sm, fontWeight: '700', color: colors.navy },
  dest: { fontSize: text['2xs'], color: colors.muted, marginTop: 8 },
  linkBox: { marginTop: space.sm, gap: 8 },
  input: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.base, padding: 12, fontSize: text.base, backgroundColor: colors.white, color: colors.ink },
  linkSave: { backgroundColor: colors.navy, borderRadius: radius.base, paddingVertical: 11, alignItems: 'center' },
  linkSaveText: { color: colors.white, fontWeight: '700', fontSize: text.sm },
  progress: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: space.sm, backgroundColor: colors.navyTint, borderRadius: radius.sm, padding: 10 },
  progressText: { fontSize: text.sm, color: colors.navy, fontWeight: '600', flex: 1 },
  error: { fontSize: text.sm, color: colors.flagged, marginTop: space.sm },
  empty: { alignItems: 'center', paddingVertical: space.lg, gap: 4 },
  emptyText: { fontSize: text.sm, color: colors.muted },
  list: { marginTop: space.sm, borderTopWidth: 1, borderTopColor: colors.line2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: colors.line2 },
  fileIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: text.base, fontWeight: '700', color: colors.ink },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3, flexWrap: 'wrap' },
  cat: { fontSize: text['2xs'], fontWeight: '700', color: colors.goldDeep, textTransform: 'uppercase', letterSpacing: 0.4 },
  meta: { fontSize: text.xs, color: colors.muted },
  drive: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colors.progressBg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 100 },
  driveText: { fontSize: 10, fontWeight: '700', color: colors.progress },
  modal: { flex: 1, backgroundColor: 'rgba(10,20,16,0.94)', alignItems: 'center', justifyContent: 'center', padding: space.lg },
  modalImg: { width: '100%', height: '75%' },
  modalName: { color: colors.white, fontSize: text.base, fontWeight: '600', marginTop: space.md },
  modalBtn: { flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: space.md, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 100, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  modalBtnText: { color: colors.white, fontWeight: '700', fontSize: text.sm },
})
