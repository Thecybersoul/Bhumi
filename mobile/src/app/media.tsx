import { useCallback, useState } from 'react'
import { useFocusEffect } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useApi, ApiError } from '@/lib/api'
import { colors, space, text } from '@/lib/theme'
import { EmptyState, ErrorBanner, LoadingScreen, Screen } from '@/components/ui'
import { Button } from '@/components/form'

interface Row {
  id: string
  url: string
  kind: 'image' | 'video' | 'document'
  title: string | null
  bytes: number | null
}

const human = (n: number | null) => (!n ? '' : n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`)

export default function MediaScreen() {
  const api = useApi()
  const [rows, setRows] = useState<Row[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      const r = await api.get<{ data: Row[]; error?: string }>('/api/media?kind=all')
      setRows(r.data ?? [])
      setError(r.error ?? null)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not load')
    }
  }, [api])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  async function upload() {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images', 'videos'], allowsMultipleSelection: true, quality: 0.85 })
    if (res.canceled) return
    setBusy(true)
    setError(null)
    for (const a of res.assets) {
      try {
        const video = a.type === 'video' || (a.mimeType ?? '').startsWith('video')
        const fd = new FormData()
        fd.append('file', {
          uri: a.uri,
          name: a.fileName ?? (video ? 'upload.mp4' : 'upload.jpg'),
          type: a.mimeType ?? (video ? 'video/mp4' : 'image/jpeg'),
        } as unknown as Blob)
        fd.append('folder', video ? 'video' : 'general')
        await api.upload('/api/media', fd)
      } catch (e) {
        setError((e as Error).message)
      }
    }
    setBusy(false)
    load()
  }

  function remove(r: Row) {
    Alert.alert('Delete file?', 'This removes the file itself, not just the entry.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.del(`/api/media?id=${r.id}`)
            setRows((p) => p?.filter((x) => x.id !== r.id) ?? null)
          } catch (e) {
            setError((e as Error).message)
          }
        },
      },
    ])
  }

  if (rows === null && !error) return <LoadingScreen />

  return (
    <Screen>
      {error && <ErrorBanner message={error} />}
      <FlatList
        data={rows ?? []}
        numColumns={2}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ padding: space.lg }}
        columnWrapperStyle={{ gap: space.sm }}
        ListHeaderComponent={
          <View style={{ marginBottom: space.md }}>
            <Button label="Upload photos / videos" onPress={upload} busy={busy} />
            <Text style={s.hint}>Pick any of these from a content or listing field to use it on the site.</Text>
          </View>
        }
        ListEmptyComponent={<EmptyState text="Nothing uploaded yet." />}
        renderItem={({ item: r }) => (
          <TouchableOpacity style={s.tile} onLongPress={() => remove(r)}>
            {r.kind === 'image' ? (
              <Image source={{ uri: r.url }} style={s.thumb} />
            ) : (
              <View style={[s.thumb, s.doc]}>
                <Text style={s.docText}>{r.kind === 'video' ? '▶ Video' : 'PDF'}</Text>
              </View>
            )}
            <Text style={s.name} numberOfLines={1}>{r.title ?? r.url.split('/').pop()}</Text>
            <Text style={s.size}>{human(r.bytes)} · hold to delete</Text>
          </TouchableOpacity>
        )}
      />
    </Screen>
  )
}

const s = StyleSheet.create({
  hint: { fontSize: text.xs, color: colors.muted, marginTop: 8 },
  tile: { flex: 1, backgroundColor: colors.white, borderRadius: 14, borderWidth: 1, borderColor: colors.line, padding: 8, marginBottom: space.sm, maxWidth: '50%' },
  thumb: { width: '100%', height: 110, borderRadius: 10, backgroundColor: colors.line2 },
  doc: { alignItems: 'center', justifyContent: 'center' },
  docText: { color: colors.muted, fontWeight: '700' },
  name: { fontSize: text.sm, fontWeight: '600', color: colors.ink, marginTop: 6 },
  size: { fontSize: text['2xs'], color: colors.muted },
})
