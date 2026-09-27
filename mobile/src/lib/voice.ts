import { useCallback, useEffect, useRef, useState } from 'react'
import { Platform } from 'react-native'
import { requireOptionalNativeModule } from 'expo'

/* ═══════════════════════════════════════════════════════════
   Speaking instead of typing: the assistant's mic and the chat's.

   expo-speech-recognition does the work: the phone's own recogniser
   on Android, the browser's Web Speech API in the iPhone home-screen
   app. Its native half only exists in builds made after it was added,
   and importing the package without it throws, so the package is
   loaded only once the native module is known to be there. On an
   older APK, or a browser without speech recognition, `available` is
   false and the mic simply isn't shown.

   Indian English by default, so names like Devanahalli and figures
   like "4.5 crore" come through as they're said.
   ═══════════════════════════════════════════════════════════ */

type Sub = { remove: () => void }
type SpeechModule = {
  start: (o: Record<string, unknown>) => void
  stop: () => void
  abort: () => void
  requestPermissionsAsync: () => Promise<{ granted: boolean }>
  addListener: (event: string, fn: (e: never) => void) => Sub
}

function speechAvailable(): boolean {
  if (Platform.OS === 'web') {
    const w = typeof window !== 'undefined' ? (window as unknown as Record<string, unknown>) : null
    return !!(w && (w.SpeechRecognition || w.webkitSpeechRecognition))
  }
  return !!requireOptionalNativeModule('ExpoSpeechRecognition')
}

let cached: SpeechModule | null = null
function speech(): SpeechModule | null {
  if (cached) return cached
  if (!speechAvailable()) return null
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cached = require('expo-speech-recognition').ExpoSpeechRecognitionModule as SpeechModule
  } catch {
    cached = null
  }
  return cached
}

const MESSAGES: Record<string, string> = {
  'not-allowed': 'Microphone access is off. Allow it for Bhumi in your phone’s settings.',
  'service-not-allowed': 'Speech recognition is off on this phone. Turn it on in Settings.',
  'audio-capture': 'The microphone isn’t available right now.',
  network: 'Speech recognition needs an internet connection.',
  'language-not-supported': 'This phone can’t recognise Indian English.',
}

/** Live dictation. `start()` begins listening; the transcript grows as
    you speak; `stop()` ends it and calls `onDone` with the full text. */
export function useVoice(onDone?: (text: string) => void) {
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const subs = useRef<Sub[]>([])
  const finalText = useRef('')
  const interim = useRef('')
  const done = useRef(onDone)
  done.current = onDone
  const available = speechAvailable()

  const cleanup = () => {
    subs.current.forEach((s) => s.remove())
    subs.current = []
  }
  useEffect(() => () => {
    cleanup()
    speech()?.abort()
  }, [])

  const start = useCallback(async () => {
    const m = speech()
    if (!m) return
    setError(null)
    const perm = await m.requestPermissionsAsync().catch(() => ({ granted: false }))
    if (!perm.granted) {
      setError(MESSAGES['not-allowed'])
      return
    }
    finalText.current = ''
    interim.current = ''
    setTranscript('')
    cleanup()
    subs.current = [
      m.addListener('result', ((e: { isFinal: boolean; results: { transcript: string }[] }) => {
        const said = e.results?.[0]?.transcript ?? ''
        if (e.isFinal) {
          finalText.current = `${finalText.current} ${said}`.trim()
          interim.current = ''
        } else interim.current = said
        setTranscript(`${finalText.current} ${interim.current}`.trim())
      }) as never),
      m.addListener('error', ((e: { error: string; message?: string }) => {
        if (e.error !== 'aborted' && e.error !== 'no-speech') setError(MESSAGES[e.error] ?? e.message ?? 'Couldn’t hear that. Try again.')
      }) as never),
      m.addListener('end', (() => {
        setListening(false)
        cleanup()
        const text = `${finalText.current} ${interim.current}`.trim()
        if (text) done.current?.(text)
      }) as never),
    ]
    setListening(true)
    m.start({ lang: 'en-IN', interimResults: true, continuous: true, addsPunctuation: true })
  }, [])

  const stop = useCallback(() => speech()?.stop(), [])
  const cancel = useCallback(() => {
    finalText.current = ''
    interim.current = ''
    setTranscript('')
    speech()?.abort()
  }, [])

  return { available, listening, transcript, error, start, stop, cancel }
}
