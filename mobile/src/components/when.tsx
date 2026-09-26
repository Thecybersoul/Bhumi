import { useState } from 'react'
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import DateTimePicker, { DateTimePickerAndroid, type DateTimePickerEvent } from '@react-native-community/datetimepicker'
import Ionicons from '@expo/vector-icons/Ionicons'
import { Field } from '@/components/form'
import { colors, radius, space, text } from '@/lib/theme'

/* Date and time: the phone's own pickers (Android dialogs, iOS
   spinners), plus one-tap presets for the times that cover most
   follow-ups and meetings. The web preview has no native picker, so
   it keeps a typed `YYYY-MM-DD HH:mm` field. Value: ISO string or ''. */

function at(daysFromNow: number, hour: number, minute = 0) {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  d.setHours(hour, minute, 0, 0)
  return d
}

function nextHalfHour() {
  const d = new Date()
  d.setMinutes(d.getMinutes() < 30 ? 30 : 60, 0, 0)
  return d
}

const PRESETS: { label: string; make: () => Date }[] = [
  { label: 'In 30 min', make: nextHalfHour },
  { label: 'Today 5 PM', make: () => at(0, 17) },
  { label: 'Tomorrow 11 AM', make: () => at(1, 11) },
  { label: 'In 3 days', make: () => at(3, 11) },
  { label: 'Next week', make: () => at(7, 11) },
]

const pad = (n: number) => String(n).padStart(2, '0')
function toTyped(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function WhenField({
  label,
  value,
  onChange,
  clearable = true,
}: {
  label: string
  value: string
  onChange: (iso: string) => void
  clearable?: boolean
}) {
  const [typed, setTyped] = useState(toTyped(value))
  const [iosMode, setIosMode] = useState<'date' | 'time' | null>(null)
  const current = value ? new Date(value) : at(1, 11)

  function pick(mode: 'date' | 'time') {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: current,
        mode,
        is24Hour: false,
        onChange: (e: DateTimePickerEvent, d?: Date) => {
          if (e.type !== 'set' || !d) return
          const next = new Date(current)
          if (mode === 'date') next.setFullYear(d.getFullYear(), d.getMonth(), d.getDate())
          else next.setHours(d.getHours(), d.getMinutes(), 0, 0)
          onChange(next.toISOString())
        },
      })
    } else setIosMode(mode)
  }

  function commit(t: string) {
    setTyped(t)
    const m = t.trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?$/)
    if (m) onChange(new Date(+m[1], +m[2] - 1, +m[3], +(m[4] ?? 9), +(m[5] ?? 0)).toISOString())
    else if (!t.trim()) onChange('')
  }

  const native = Platform.OS !== 'web'

  return (
    <Field label={label}>
      {native ? (
        <View style={s.pickers}>
          <TouchableOpacity style={s.picker} onPress={() => pick('date')}>
            <Ionicons name="calendar-outline" size={18} color={colors.navy} />
            <Text style={[s.pickerText, !value && s.placeholder]}>
              {value ? current.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) : 'Date'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.picker} onPress={() => pick('time')}>
            <Ionicons name="time-outline" size={18} color={colors.navy} />
            <Text style={[s.pickerText, !value && s.placeholder]}>
              {value ? current.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) : 'Time'}
            </Text>
          </TouchableOpacity>
          {value && clearable ? (
            <TouchableOpacity style={s.clear} onPress={() => onChange('')} hitSlop={8}>
              <Ionicons name="close" size={18} color={colors.muted} />
            </TouchableOpacity>
          ) : null}
        </View>
      ) : (
        <TextInput
          style={s.input}
          value={typed}
          onChangeText={commit}
          placeholder="YYYY-MM-DD HH:mm"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
        />
      )}
      {iosMode ? (
        <DateTimePicker
          value={current}
          mode={iosMode}
          display="spinner"
          onChange={(_e, d) => {
            if (!d) return
            const next = new Date(current)
            if (iosMode === 'date') next.setFullYear(d.getFullYear(), d.getMonth(), d.getDate())
            else next.setHours(d.getHours(), d.getMinutes(), 0, 0)
            onChange(next.toISOString())
          }}
        />
      ) : null}
      <View style={s.row}>
        {PRESETS.map((p) => (
          <TouchableOpacity
            key={p.label}
            style={s.chip}
            onPress={() => {
              const iso = p.make().toISOString()
              setTyped(toTyped(iso))
              setIosMode(null)
              onChange(iso)
            }}
          >
            <Text style={s.chipText}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </Field>
  )
}

const s = StyleSheet.create({
  pickers: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  picker: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.base,
    paddingHorizontal: space.md,
    paddingVertical: 13,
    backgroundColor: colors.white,
  },
  pickerText: { fontSize: text.md, fontWeight: '700', color: colors.ink },
  placeholder: { color: colors.muted, fontWeight: '500' },
  clear: { padding: 6 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  chip: { paddingHorizontal: 11, paddingVertical: 6, borderRadius: 100, backgroundColor: colors.navyTint },
  chipText: { fontSize: text.xs, fontWeight: '700', color: colors.navy },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.base,
    padding: space.md,
    fontSize: text.md,
    backgroundColor: colors.white,
    color: colors.ink,
  },
})
