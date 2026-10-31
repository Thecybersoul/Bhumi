import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Field } from '@/components/form'
import { addDays } from '@/lib/crm'
import { colors, text } from '@/lib/theme'

const STEPS: [string, number][] = [['Today', 0], ['+2 days', 2], ['+3 days', 3], ['+1 week', 7], ['+2 weeks', 14], ['+1 month', 30]]

/** A CRM next date in one tap: the follow-up gaps the playbook uses, no
    date picker (which differs on every platform). Shows the chosen date. */
export function DateChips({ label, value, onChange, hint, clearable = true }: { label: string; value: string | null; onChange: (v: string | null) => void; hint?: string; clearable?: boolean }) {
  return (
    <Field label={label} hint={hint}>
      <Text style={s.value}>{value ? new Date(`${value}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : 'No date'}</Text>
      <View style={s.chips}>
        {STEPS.map(([l, n]) => (
          <TouchableOpacity key={l} style={[s.chip, value === addDays(n) && s.on]} onPress={() => onChange(addDays(n))}>
            <Text style={[s.text, value === addDays(n) && s.textOn]}>{l}</Text>
          </TouchableOpacity>
        ))}
        {clearable && value ? (
          <TouchableOpacity style={s.chip} onPress={() => onChange(null)}>
            <Text style={s.text}>Clear</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </Field>
  )
}

const s = StyleSheet.create({
  value: { fontSize: text.md, fontWeight: '700', color: colors.ink, marginBottom: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 11, paddingVertical: 7, borderRadius: 100, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white },
  on: { backgroundColor: colors.navy, borderColor: colors.navy },
  text: { fontSize: text.xs, fontWeight: '700', color: colors.navy },
  textOn: { color: colors.white },
})
