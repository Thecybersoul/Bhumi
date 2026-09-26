import { useCallback, useState } from 'react'
import { router, useFocusEffect } from 'expo-router'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useApi, ApiError } from '@/lib/api'
import { colors, space, text } from '@/lib/theme'
import { Badge, ErrorBanner, LoadingScreen, Screen } from '@/components/ui'
import type { SchemaField } from '@/components/fieldEditor'

export interface SchemaBlock {
  key: string
  page: string
  title: string
  description?: string
  preview?: string
  fields: SchemaField[]
  value: Record<string, unknown>
  edited: boolean
}
export interface SchemaResponse {
  pages: { id: string; label: string }[]
  blocks: SchemaBlock[]
}

export default function ContentIndex() {
  const api = useApi()
  const [data, setData] = useState<SchemaResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useFocusEffect(
    useCallback(() => {
      api
        .get<SchemaResponse>('/api/content/schema')
        .then((d) => {
          setData(d)
          setError(null)
        })
        .catch((e) => setError(e instanceof ApiError ? e.message : 'Could not load content'))
    }, [api])
  )

  if (!data && !error) return <LoadingScreen />

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: 60 }}>
        {error && <ErrorBanner message={error} />}
        <Text style={s.intro}>Changes save straight to the live website.</Text>
        {data?.pages.map((p) => (
          <View key={p.id} style={{ marginBottom: space.lg }}>
            <Text style={s.page}>{p.label}</Text>
            {data.blocks
              .filter((b) => b.page === p.id)
              .map((b) => (
                <TouchableOpacity key={b.key} style={s.card} onPress={() => router.push(`/content/${encodeURIComponent(b.key)}`)}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.title}>{b.title}</Text>
                    {b.description ? <Text style={s.desc} numberOfLines={2}>{b.description}</Text> : null}
                  </View>
                  {b.edited ? <Badge label="Edited" tone="verified" /> : null}
                </TouchableOpacity>
              ))}
          </View>
        ))}
      </ScrollView>
    </Screen>
  )
}

const s = StyleSheet.create({
  intro: { fontSize: text.sm, color: colors.muted, marginBottom: space.md },
  page: { fontSize: text.lg, fontWeight: '700', color: colors.navy, marginBottom: space.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.md,
    marginBottom: 8,
  },
  title: { fontSize: text.base, fontWeight: '700', color: colors.ink },
  desc: { fontSize: text.sm, color: colors.muted, marginTop: 2 },
})
