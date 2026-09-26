import { useState } from 'react'
import { ActivityIndicator, Image, Linking, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { useApi } from '@/lib/api'
import { colors, radius, space, text } from '@/lib/theme'

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      {children}
      {hint ? <Text style={s.hint}>{hint}</Text> : null}
    </View>
  )
}

export function TextField({
  label,
  value,
  onChange,
  multiline,
  keyboard,
  hint,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  multiline?: boolean
  keyboard?: 'default' | 'numeric' | 'email-address' | 'phone-pad' | 'url'
  hint?: string
  placeholder?: string
}) {
  return (
    <Field label={label} hint={hint}>
      <TextInput
        style={[s.input, multiline && { minHeight: 92, textAlignVertical: 'top' }]}
        value={value}
        onChangeText={onChange}
        multiline={multiline}
        keyboardType={keyboard}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        autoCapitalize={keyboard === 'url' || keyboard === 'email-address' ? 'none' : 'sentences'}
      />
    </Field>
  )
}

export function Chips<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: readonly T[]
  value: T | ''
  onChange: (v: T) => void
}) {
  return (
    <Field label={label}>
      <View style={s.chips}>
        {options.map((o) => (
          <TouchableOpacity key={o} style={[s.chip, value === o && s.chipOn]} onPress={() => onChange(o)}>
            <Text style={[s.chipText, value === o && s.chipTextOn]}>{o}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </Field>
  )
}

export function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={[s.field, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
      <Text style={s.label}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.navy600, false: colors.line }} />
    </View>
  )
}

export function Button({
  label,
  onPress,
  busy,
  tone = 'primary',
  disabled,
}: {
  label: string
  onPress: () => void
  busy?: boolean
  tone?: 'primary' | 'ghost' | 'danger'
  disabled?: boolean
}) {
  const bg = tone === 'primary' ? colors.navy : tone === 'danger' ? colors.flaggedBg : colors.white
  const fg = tone === 'primary' ? colors.white : tone === 'danger' ? colors.flagged : colors.navy
  return (
    <TouchableOpacity
      style={[s.btn, { backgroundColor: bg, borderColor: tone === 'primary' ? colors.navy : colors.line }, (busy || disabled) && { opacity: 0.55 }]}
      onPress={onPress}
      disabled={busy || disabled}
    >
      {busy ? <ActivityIndicator color={fg} /> : <Text style={[s.btnText, { color: fg }]}>{label}</Text>}
    </TouchableOpacity>
  )
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <Text style={s.section}>{children}</Text>
}

export function ExternalLink({ label, url }: { label: string; url: string }) {
  return (
    <TouchableOpacity onPress={() => Linking.openURL(url)}>
      <Text style={s.link}>{label}</Text>
    </TouchableOpacity>
  )
}

/** Pick an image or video from the phone and upload it straight to the
    site's media library (the same /api/media the web admin uses); the
    returned public URL becomes the field's value. A pasted path or URL
    also works, for files that ship with the codebase. */
export function MediaField({
  label,
  value,
  onChange,
  kind = 'image',
}: {
  label: string
  value: string
  onChange: (url: string) => void
  kind?: 'image' | 'video' | 'document'
}) {
  const api = useApi()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function pick() {
    setError(null)
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: kind === 'video' ? ['videos'] : ['images'],
      quality: 0.85,
    })
    if (res.canceled || !res.assets[0]) return
    const a = res.assets[0]
    setBusy(true)
    try {
      const fd = new FormData()
      fd.append('file', {
        uri: a.uri,
        name: a.fileName ?? (kind === 'video' ? 'upload.mp4' : 'upload.jpg'),
        type: a.mimeType ?? (kind === 'video' ? 'video/mp4' : 'image/jpeg'),
      } as unknown as Blob)
      fd.append('folder', kind === 'video' ? 'video' : 'general')
      const out = await api.upload<{ data: { url: string } }>('/api/media', fd)
      onChange(out.data.url)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Field label={label}>
      {value && kind === 'image' ? <Image source={{ uri: value.startsWith('/') ? undefined : value }} style={s.preview} /> : null}
      <TextInput
        style={s.input}
        value={value}
        onChangeText={onChange}
        placeholder="/img/example.jpg or a full URL"
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
      />
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
        <View style={{ flex: 1 }}>
          <Button label={kind === 'video' ? 'Upload video' : 'Upload from phone'} onPress={pick} busy={busy} tone="ghost" />
        </View>
        {value ? (
          <View style={{ flex: 0.6 }}>
            <Button label="Clear" onPress={() => onChange('')} tone="ghost" />
          </View>
        ) : null}
      </View>
      {error ? <Text style={[s.hint, { color: colors.flagged }]}>{error}</Text> : null}
    </Field>
  )
}

const s = StyleSheet.create({
  field: { marginBottom: space.md },
  label: { fontSize: text.sm, fontWeight: '700', color: colors.ink2, marginBottom: 6 },
  hint: { fontSize: text.xs, color: colors.muted, marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.base,
    padding: space.md,
    fontSize: text.md,
    backgroundColor: colors.white,
    color: colors.ink,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 100, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white },
  chipOn: { backgroundColor: colors.navy, borderColor: colors.navy },
  chipText: { fontSize: text.sm, fontWeight: '600', color: colors.ink2 },
  chipTextOn: { color: colors.white },
  btn: { borderRadius: radius.base, borderWidth: 1, paddingVertical: 13, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontSize: text.md, fontWeight: '700' },
  section: { fontSize: text.lg, fontWeight: '700', color: colors.navy, marginTop: space.md, marginBottom: space.sm },
  link: { color: colors.goldDeep, fontWeight: '700', fontSize: text.sm },
  preview: { width: '100%', height: 150, borderRadius: radius.base, marginBottom: 8, backgroundColor: colors.line2 },
})
