import { createElement, useState } from 'react'
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import DateTimePicker, { DateTimePickerAndroid, type DateTimePickerEvent } from '@react-native-community/datetimepicker'
import Ionicons from '@expo/vector-icons/Ionicons'
import { Field } from '@/components/form'
import { colors, radius, space, text } from '@/lib/theme'

/* Date and time: the phone's own pickers (Android dialogs, iOS
   spinners), plus one-tap presets for the times that cover most
   follow-ups and meetings. On the web (the iPhone home-screen app) it's
   a datetime-local input, which iOS Safari shows as its own date and
   time wheels. Value: ISO string or ''. */

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
/** Local time as `YYYY-MM-DDTHH:mm`, what a datetime-local input holds. */
function toLocalInput(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/* A real <input type="datetime-local">: react-native-web renders DOM
   elements passed to createElement as they are. */
function WebDateTime({ value, onChange }: { value: string; onChange: (iso: string) => void }) {
  return createElement('input', {
    type: 'datetime-local',
    value: toLocalInput(value),
    onChange: (e: { target: { value: string } }) => {
      const v = e.target.value
      // Parsed as local time, like the phone pickers.
      onChange(v ? new Date(v).toISOString() : '')
    },
    style: {
      boxSizing: 'border-box',
      width: '100%',
      minHeight: 48,
      border: `1px solid ${colors.line}`,
      borderRadius: radius.base,
      padding: `0 ${space.md}px`,
      fontSize: 16, // below 16px iOS zooms the page on focus
      fontFamily: 'inherit',
      fontWeight: 700,
      color: value ? colors.ink : colors.muted,
      backgroundColor: colors.white,
      WebkitAppearance: 'none',
      appearance: 'none',
    },
  })
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
        <View style={s.pickers}>
          <View style={{ flex: 1 }}>
            <WebDateTime value={value} onChange={onChange} />
          </View>
          {value && clearable ? (
            <TouchableOpacity style={s.clear} onPress={() => onChange('')} hitSlop={8}>
              <Ionicons name="close" size={18} color={colors.muted} />
            </TouchableOpacity>
          ) : null}
        </View>
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
})
