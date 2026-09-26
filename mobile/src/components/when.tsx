import { useState } from 'react'
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { Field } from '@/components/form'
import { colors, radius, space, text } from '@/lib/theme'

/* A date-and-time picker without a native picker dependency: quick
   presets for the ones that cover almost every follow-up, plus a typed
   `YYYY-MM-DD HH:mm` for anything else. Value is an ISO string or ''. */

function at(daysFromNow: number, hour: number) {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  d.setHours(hour, 0, 0, 0)
  return d
}

const PRESETS: { label: string; make: () => Date }[] = [
  { label: 'Today 5 PM', make: () => at(0, 17) },
  { label: 'Tomorrow 11 AM', make: () => at(1, 11) },
  { label: 'In 3 days', make: () => at(3, 11) },
  { label: 'Next week', make: () => at(7, 11) },
]

function pad(n: number) {
  return String(n).padStart(2, '0')
}
function toTyped(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function WhenField({ label, value, onChange }: { label: string; value: string; onChange: (iso: string) => void }) {
  const [typed, setTyped] = useState(toTyped(value))

  function commit(t: string) {
    setTyped(t)
    const m = t.trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?$/)
    if (m) onChange(new Date(+m[1], +m[2] - 1, +m[3], +(m[4] ?? 9), +(m[5] ?? 0)).toISOString())
    else if (!t.trim()) onChange('')
  }

  return (
    <Field label={label} hint={value ? new Date(value).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'No date'}>
      <View style={s.row}>
        {PRESETS.map((p) => (
          <TouchableOpacity
            key={p.label}
            style={s.chip}
            onPress={() => {
              const iso = p.make().toISOString()
              setTyped(toTyped(iso))
              onChange(iso)
            }}
          >
            <Text style={s.chipText}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput
        style={s.input}
        value={typed}
        onChangeText={commit}
        placeholder="YYYY-MM-DD HH:mm"
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
      />
    </Field>
  )
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 100, backgroundColor: colors.navyTint },
  chipText: { fontSize: text.sm, fontWeight: '600', color: colors.navy700 },
  input: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.base, padding: space.md, fontSize: text.md, backgroundColor: colors.white, color: colors.ink },
})
