import { useEffect, useState } from 'react'
import { router, useLocalSearchParams } from 'expo-router'
import { Alert, ScrollView, Text } from 'react-native'
import { useApi, ApiError } from '@/lib/api'
import { colors, space, text } from '@/lib/theme'
import { Card, ErrorBanner, LoadingScreen, Screen } from '@/components/ui'
import { Button } from '@/components/form'
import { FieldEditor } from '@/components/fieldEditor'
import type { SchemaBlock, SchemaResponse } from './index'

export default function ContentBlockScreen() {
  const { key: rawKey } = useLocalSearchParams<{ key: string }>()
  const key = decodeURIComponent(rawKey)
  const api = useApi()
  const [block, setBlock] = useState<SchemaBlock | null>(null)
  const [value, setValue] = useState<Record<string, unknown>>({})
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api
      .get<SchemaResponse>('/api/content/schema')
      .then((d) => {
        const b = d.blocks.find((x) => x.key === key)
        if (!b) return setError('Block not found')
        setBlock(b)
        setValue(b.value)
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Could not load'))
  }, [api, key])

  async function save() {
    setBusy(true)
    setError(null)
    try {
      await api.put('/api/content', { key, value })
      setSaved(true)
      setTimeout(() => router.back(), 600)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  function revert() {
    Alert.alert('Revert to original?', 'This restores the copy that shipped with the site.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Revert',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.del(`/api/content?key=${encodeURIComponent(key)}`)
            router.back()
          } catch (e) {
            setError((e as Error).message)
          }
        },
      },
    ])
  }

  if (!block && !error) return <LoadingScreen />

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: 70 }} keyboardShouldPersistTaps="handled">
        {error && <ErrorBanner message={error} />}
        {block && (
          <>
            <Text style={{ fontSize: text.xl, fontWeight: '700', color: colors.navy }}>{block.title}</Text>
            {block.preview ? <Text style={{ fontSize: text.sm, color: colors.muted, marginBottom: space.md }}>Appears: {block.preview}</Text> : null}
            <Card>
              {block.fields.map((f) => (
                <FieldEditor key={f.key} field={f} value={value[f.key]} onChange={(v) => setValue((p) => ({ ...p, [f.key]: v }))} />
              ))}
            </Card>
            <Button label={saved ? 'Published ✓' : 'Publish to the live site'} onPress={save} busy={busy} />
            {block.edited ? (
              <Button label="Revert to original" tone="ghost" onPress={revert} />
            ) : null}
          </>
        )}
      </ScrollView>
    </Screen>
  )
}
