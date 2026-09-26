import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Field, MediaField, TextField } from '@/components/form'
import { colors, radius, space, text } from '@/lib/theme'

/* Renders one field of a content block from the backend's schema
   (lib/content/schema.ts). The schema is the contract: this component
   understands exactly the field types it declares — text, textarea,
   url, image, video, a list of strings, and a group of sub-fields —
   so a field added on the web appears here with no app change. */

export interface SchemaField {
  key: string
  label: string
  type: 'text' | 'textarea' | 'image' | 'video' | 'url' | 'list' | 'group'
  help?: string
  limit?: number
  fields?: SchemaField[]
}

type Value = unknown

const str = (v: Value) => (typeof v === 'string' ? v : v == null ? '' : String(v))

export function FieldEditor({ field, value, onChange }: { field: SchemaField; value: Value; onChange: (v: Value) => void }) {
  switch (field.type) {
    case 'text':
    case 'url':
    case 'textarea': {
      const v = str(value)
      const over = field.limit && v.length > field.limit
      return (
        <TextField
          label={field.label}
          value={v}
          onChange={onChange}
          multiline={field.type === 'textarea'}
          keyboard={field.type === 'url' ? 'url' : 'default'}
          hint={[field.help, field.limit ? `${v.length}/${field.limit}${over ? ' — longer than recommended' : ''}` : ''].filter(Boolean).join(' · ') || undefined}
        />
      )
    }
    case 'image':
    case 'video':
      return <MediaField label={field.label} value={str(value)} onChange={onChange} kind={field.type} />
    case 'list': {
      const items = Array.isArray(value) ? (value as string[]) : []
      return (
        <Field label={field.label} hint={field.help}>
          {items.map((it, i) => (
            <View key={i} style={s.listRow}>
              <View style={{ flex: 1 }}>
                <TextField label="" value={str(it)} onChange={(v) => onChange(items.map((x, j) => (j === i ? v : x)))} />
              </View>
              <TouchableOpacity style={s.remove} onPress={() => onChange(items.filter((_, j) => j !== i))}>
                <Text style={s.removeText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={s.add} onPress={() => onChange([...items, ''])}>
            <Text style={s.addText}>+ Add item</Text>
          </TouchableOpacity>
        </Field>
      )
    }
    case 'group': {
      const obj = (value && typeof value === 'object' ? value : {}) as Record<string, Value>
      return (
        <View style={s.group}>
          <Text style={s.groupTitle}>{field.label}</Text>
          {field.help ? <Text style={s.groupHelp}>{field.help}</Text> : null}
          {(field.fields ?? []).map((sub) => (
            <FieldEditor key={sub.key} field={sub} value={obj[sub.key]} onChange={(v) => onChange({ ...obj, [sub.key]: v })} />
          ))}
        </View>
      )
    }
    default:
      return null
  }
}

const s = StyleSheet.create({
  listRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  remove: { paddingHorizontal: 12, paddingVertical: 13, borderRadius: radius.base, backgroundColor: colors.flaggedBg },
  removeText: { color: colors.flagged, fontWeight: '700' },
  add: { paddingVertical: 10, alignItems: 'center', borderRadius: radius.base, backgroundColor: colors.navyTint },
  addText: { color: colors.navy700, fontWeight: '700', fontSize: text.sm },
  group: { borderLeftWidth: 3, borderLeftColor: colors.line, paddingLeft: space.md, marginBottom: space.md },
  groupTitle: { fontSize: text.md, fontWeight: '700', color: colors.navy, marginBottom: 4 },
  groupHelp: { fontSize: text.xs, color: colors.muted, marginBottom: space.sm },
})
