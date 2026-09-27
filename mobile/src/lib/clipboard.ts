import { Platform } from 'react-native'
import { requireOptionalNativeModule } from 'expo'

/* Reading what was copied — for "Paste a WhatsApp message". The
   browser's clipboard in the iPhone web app (Safari shows its own Paste
   bubble to allow it), expo-clipboard in the Android app. Like the
   speech module, expo-clipboard's native half only exists in newer
   builds, so it's loaded only once it's known to be there. */

export function canPaste(): boolean {
  if (Platform.OS === 'web') return typeof navigator !== 'undefined' && !!navigator.clipboard?.readText
  return !!requireOptionalNativeModule('ExpoClipboard')
}

export async function readClipboard(): Promise<string> {
  if (Platform.OS === 'web') return (await navigator.clipboard.readText()) ?? ''
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Clipboard = require('expo-clipboard') as { getStringAsync: () => Promise<string> }
  return (await Clipboard.getStringAsync()) ?? ''
}
