import { useState } from 'react'
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useSession } from '@/lib/auth'
import { colors, radius, space, text } from '@/lib/theme'

/* On an iPhone in Safari, point at Share → Add to Home Screen: that is how
   the web build installs, and nobody finds the menu on their own. Hidden
   once it is running from the home screen, and everywhere else. */
function installHint(): boolean {
  if (Platform.OS !== 'web') return false
  const nav = globalThis.navigator as (Navigator & { standalone?: boolean }) | undefined
  if (!nav || nav.standalone) return false
  return /iPhone|iPad|iPod/.test(nav.userAgent)
}

export default function LoginScreen() {
  const { signIn, error } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)

  async function submit() {
    if (!email.trim() || !password) return
    setBusy(true)
    await signIn(email.trim(), password)
    setBusy(false)
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Image source={require('../../assets/logo-dark.png')} style={styles.logo} resizeMode="contain" />
      <Text style={styles.tag}>ERP · Advisory desk</Text>

      <View style={styles.card}>
        <Text style={styles.title}>Sign in</Text>
        <Text style={styles.sub}>Use your own Bhumi Estates account. Everything you add or change is recorded under your name.</Text>

        <View style={styles.inputRow}>
          <Ionicons name="mail-outline" size={18} color={colors.muted} />
          <TextInput
            style={styles.input}
            placeholder="you@bhumiestates.in"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            autoComplete="email"
            textContentType="username"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
        </View>
        <View style={styles.inputRow}>
          <Ionicons name="lock-closed-outline" size={18} color={colors.muted} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={colors.muted}
            secureTextEntry={!show}
            autoCapitalize="none"
            autoComplete="password"
            textContentType="password"
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={submit}
          />
          <TouchableOpacity onPress={() => setShow((v) => !v)} hitSlop={10}>
            <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.muted} />
          </TouchableOpacity>
        </View>

        {error ? (
          <View style={styles.error}>
            <Ionicons name="alert-circle" size={16} color={colors.flagged} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity style={[styles.button, busy && styles.buttonBusy]} onPress={submit} disabled={busy}>
          {busy ? <ActivityIndicator color={colors.white} /> : <Text style={styles.buttonText}>Sign in</Text>}
        </TouchableOpacity>
      </View>
      <Text style={styles.foot}>Forgot your password? Ask another admin to reset it.</Text>
      {installHint() ? (
        <View style={styles.hint}>
          <Ionicons name="share-outline" size={18} color={colors.goldSoft} />
          <Text style={styles.hintText}>
            To install, tap Share, then <Text style={styles.hintStrong}>Add to Home Screen</Text>.
          </Text>
        </View>
      ) : null}
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center', padding: space.lg },
  logo: { width: 250, height: 250 * (260 / 1200) },
  tag: { color: colors.goldSoft, fontSize: text.xs, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase', marginTop: space.md, marginBottom: space.xl },
  card: { width: '100%', maxWidth: 400, backgroundColor: colors.white, borderRadius: radius.xl, padding: space.xl },
  title: { fontSize: text['2xl'], fontWeight: '800', color: colors.navy },
  sub: { fontSize: text.sm, color: colors.ink2, marginTop: 6, marginBottom: space.lg, lineHeight: 19 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.base,
    paddingHorizontal: space.md,
    marginBottom: space.sm,
    backgroundColor: colors.paper,
  },
  input: { flex: 1, paddingVertical: 14, fontSize: text.md, color: colors.ink },
  error: { flexDirection: 'row', gap: 6, alignItems: 'center', backgroundColor: colors.flaggedBg, padding: 10, borderRadius: 10, marginBottom: space.sm },
  errorText: { color: colors.flagged, fontSize: text.sm, flex: 1, fontWeight: '600' },
  button: { backgroundColor: colors.navy, borderRadius: radius.base, paddingVertical: 15, alignItems: 'center', marginTop: 6 },
  buttonBusy: { opacity: 0.7 },
  buttonText: { color: colors.white, fontSize: text.md, fontWeight: '800' },
  foot: { color: 'rgba(255,255,255,0.55)', fontSize: text.xs, marginTop: space.lg },
  hint: { flexDirection: 'row', alignItems: 'center', gap: 8, maxWidth: 400, marginTop: space.lg, padding: space.md, borderRadius: radius.base, backgroundColor: 'rgba(255,255,255,0.08)' },
  hintText: { color: colors.white, fontSize: text.sm, flexShrink: 1 },
  hintStrong: { fontWeight: '800' },
})
