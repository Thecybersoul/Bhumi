import { Platform } from 'react-native'
import { router } from 'expo-router'
import type { NotifyPrefs } from './notify'

/* ═══════════════════════════════════════════════════════════
   Notifications in the iPhone home-screen app (the web export).

   A web app can't schedule alarms or poll in the background, so the
   server pushes instead (lib/webpush.ts on the site): team updates the
   moment they happen, and meeting reminders, due tasks, outcome nudges
   and the morning digest on time. This device's preferences travel
   with its subscription, so the settings screen works the same as on
   Android.

   iOS allows it from 16.4, only once the app has been added to the
   home screen, and only after a tap asks for permission.
   ═══════════════════════════════════════════════════════════ */

type Api = {
  get: <T>(path: string) => Promise<T>
  post: <T>(path: string, body?: unknown) => Promise<T>
  patch: <T>(path: string, body?: unknown) => Promise<T>
  put: <T>(path: string, body?: unknown) => Promise<T>
  del: <T>(path: string) => Promise<T>
}

type Nav = Navigator & { standalone?: boolean }

const w = (): (Window & typeof globalThis) | null => (Platform.OS === 'web' && typeof window !== 'undefined' ? window : null)

/** 'unsupported' (old iOS / browser), 'install' (in Safari, not yet on the
    home screen), 'denied', or 'ready' to turn on. */
export type PushAvailability = 'unsupported' | 'install' | 'denied' | 'ready'

export function isStandalone(): boolean {
  const win = w()
  if (!win) return false
  return (win.navigator as Nav).standalone === true || win.matchMedia?.('(display-mode: standalone)').matches === true
}

export function availability(): PushAvailability {
  const win = w()
  if (!win) return 'unsupported'
  const ios = /iPhone|iPad|iPod/.test(win.navigator.userAgent)
  if (ios && !isStandalone()) return 'install'
  if (!('serviceWorker' in win.navigator) || !('PushManager' in win) || !('Notification' in win)) return 'unsupported'
  if (win.Notification.permission === 'denied') return 'denied'
  return 'ready'
}

let registration: Promise<ServiceWorkerRegistration | null> | null = null

/** Register the worker once per launch, and route taps it forwards. */
export function registerWorker(): Promise<ServiceWorkerRegistration | null> {
  const win = w()
  if (!win || !('serviceWorker' in win.navigator)) return Promise.resolve(null)
  if (!registration) {
    registration = win.navigator.serviceWorker.register('/app/sw.js', { scope: '/app/' }).catch(() => null)
    win.navigator.serviceWorker.addEventListener('message', (e: MessageEvent) => {
      if (e.data?.type !== 'bhumi-open' || typeof e.data.url !== 'string') return
      const path = e.data.url.replace(/^\/app/, '') || '/'
      router.push(path as never)
    })
  }
  return registration
}

async function currentSubscription(): Promise<PushSubscription | null> {
  const reg = await registerWorker()
  return reg ? reg.pushManager.getSubscription() : null
}

/** Is this device subscribed, as far as both the browser and the server know? */
export async function isSubscribed(api: Api): Promise<boolean> {
  if (availability() !== 'ready' || w()?.Notification.permission !== 'granted') return false
  const sub = await currentSubscription()
  if (!sub) return false
  const r = await api.get<{ subscribed: boolean }>(`/api/push?endpoint=${encodeURIComponent(sub.endpoint)}`).catch(() => null)
  return !!r?.subscribed
}

function keyBytes(base64url: string): Uint8Array {
  const pad = '='.repeat((4 - (base64url.length % 4)) % 4)
  const raw = atob((base64url + pad).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}

/** Ask permission (must run from a tap) and subscribe this device. */
export async function enable(api: Api, prefs: NotifyPrefs): Promise<boolean> {
  const win = w()
  if (!win || availability() !== 'ready') return false
  const permission = await win.Notification.requestPermission()
  if (permission !== 'granted') return false
  const reg = await registerWorker()
  if (!reg) return false
  const { publicKey } = await api.get<{ publicKey: string }>('/api/push')
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) as BufferSource }))
  await api.post('/api/push', { subscription: sub.toJSON(), prefs })
  return true
}

export async function disable(api: Api) {
  const sub = await currentSubscription()
  if (!sub) return
  await api.del(`/api/push?endpoint=${encodeURIComponent(sub.endpoint)}`).catch(() => {})
  await sub.unsubscribe().catch(() => {})
}

/** Keep the server's copy of this device's preferences current. */
export async function syncPrefs(api: Api, prefs: NotifyPrefs) {
  const sub = await currentSubscription()
  if (sub) await api.patch('/api/push', { endpoint: sub.endpoint, prefs }).catch(() => {})
}

export async function sendTest(api: Api): Promise<boolean> {
  const sub = await currentSubscription()
  if (!sub) return false
  return api.put('/api/push', { endpoint: sub.endpoint }).then(() => true, () => false)
}

/** Signing out: this device stops receiving that person's notifications.
    (Without a token the server copy can't be deleted here; the push
    service reports the dead subscription and the server prunes it.) */
export async function forget() {
  const sub = await currentSubscription().catch(() => null)
  await sub?.unsubscribe().catch(() => {})
}
