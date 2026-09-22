import { useState } from 'react'
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { useSession } from '@/lib/auth'
import { colors, radius, space, text } from '@/lib/theme'

export default function LoginScreen() {
  const { signIn, error } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit() {
    setBusy(true)
    await signIn(email.trim(), password)
    setBusy(false)
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.card}>
        <Text style={styles.brand}>BHUMI ESTATES</Text>
        <Text style={styles.title}>Advisory desk</Text>
        <Text style={styles.sub}>Deals, leads, verification and the notes that go with them.</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={colors.muted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity style={[styles.button, busy && styles.buttonBusy]} onPress={submit} disabled={busy}>
          <Text style={styles.buttonText}>{busy ? 'Signing in…' : 'Sign in'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center', padding: space.lg },
  card: { width: '100%', maxWidth: 380, backgroundColor: colors.white, borderRadius: radius.xl, padding: space.xl },
  brand: { fontSize: text.xs, fontWeight: '700', color: colors.goldDeep, letterSpacing: 2, marginBottom: 8 },
  title: { fontSize: text['2xl'], fontWeight: '700', color: colors.navy },
  sub: { fontSize: text.md, color: colors.ink2, marginTop: 6, marginBottom: space.lg },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.base,
    padding: space.md,
    fontSize: text.md,
    marginBottom: space.sm,
    color: colors.ink,
  },
  error: { color: colors.flagged, fontSize: text.sm, marginBottom: space.sm },
  button: { backgroundColor: colors.navy, borderRadius: radius.base, padding: space.md, alignItems: 'center', marginTop: 6 },
  buttonBusy: { opacity: 0.6 },
  buttonText: { color: colors.white, fontSize: text.md, fontWeight: '700' },
})
