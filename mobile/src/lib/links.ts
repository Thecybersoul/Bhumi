import { Alert, Linking } from 'react-native'

/** Open a tel:/wa.me link without ever throwing. A null link (no number,
    several numbers, or a landline asked to WhatsApp) does nothing; a link the
    phone can't open says so instead of failing silently. */
export function openUrl(url: string | null | undefined) {
  if (!url) return
  Linking.openURL(url).catch(() => Alert.alert('Could not open this link', url.startsWith('tel:') ? 'This phone cannot place calls.' : 'WhatsApp is not installed.'))
}
