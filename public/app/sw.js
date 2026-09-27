/* Service worker for the iPhone home-screen app (served at /app/sw.js).
   It only handles notifications: the server pushes team updates and
   timed reminders (lib/webpush.ts), this shows them, and a tap opens
   the app on the right screen. No caching — the shell revalidates on
   every launch so a new export reaches phones straight away. */

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { title: 'Bhumi', body: event.data ? event.data.text() : '' }
  }
  const path = data.path || '/notifications'
  event.waitUntil(
    self.registration.showNotification(data.title || 'Bhumi', {
      body: data.body || '',
      tag: data.tag,
      icon: '/app/icon-192.png',
      badge: '/app/icon-192.png',
      data: { url: '/app' + (path === '/' ? '' : path) },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || '/app'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      const win = wins.find((w) => new URL(w.url).pathname.startsWith('/app'))
      // An open app routes itself (lib/webPush.ts listens for this), which
      // works whether or not this worker controls the page.
      if (win) {
        win.postMessage({ type: 'bhumi-open', url })
        return win.focus()
      }
      return self.clients.openWindow(url)
    }),
  )
})
