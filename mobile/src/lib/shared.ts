import type { PickedFile } from './documents'

/* Something shared into Bhumi from another app (WhatsApp's Share or
   Forward → Bhumi, on Android builds that include expo-share-intent).
   The root layout receives it and parks it here; the assistant takes
   it once, uploads any photos, and asks for it to be filed. */

export interface SharedPayload {
  text: string
  files: PickedFile[]
}

let pending: SharedPayload | null = null

export function setShared(p: SharedPayload) {
  pending = p
}

/** The waiting share, if any; reading it clears it. */
export function takeShared(): SharedPayload | null {
  const p = pending
  pending = null
  return p
}

/** What the assistant is told alongside a forwarded message. */
export function forwardedPrompt(text: string, photos: number): string {
  const lines = [
    '[Forwarded from WhatsApp]',
    text.trim() || '(no text, only photos)',
    '',
    photos
      ? `File this in the ERP. ${photos === 1 ? 'The photo attached came' : `The ${photos} photos attached came`} with the message.`
      : 'File this in the ERP.',
  ]
  return lines.join('\n')
}
