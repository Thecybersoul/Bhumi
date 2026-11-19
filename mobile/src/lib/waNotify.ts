import { Platform } from 'react-native'
import { requireOptionalNativeModule } from 'expo'

/* WhatsApp capture from this phone's notifications (the native module in
   modules/wa-notify). Android only, and only in APKs built after it was
   added: on older APKs, iPhone and the web the module is absent and the
   Profile row doesn't show, so OTA updates stay safe. */

interface Native {
  isPermissionGranted(): boolean
  openPermissionSettings(): void
  configure(url: string, token: string | null, enabled: boolean): void
  status(): { enabled: boolean; granted: boolean; lastSentAt: number; lastError: string | null; queued: number }
}

const native: Native | null = Platform.OS === 'android' ? requireOptionalNativeModule<Native>('WaNotify') : null

export const waCaptureAvailable = () => !!native
export const waCapture = native
