// Se importa en el service worker generado por Workbox (ver vite.config.ts › workbox.importScripts).

// Aviso push del servidor (worker/push): llega cifrado y el navegador ya lo da descifrado; se enseña tal cual
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {}
  event.waitUntil(
    self.registration.showNotification(data.title || 'Pokérancho', {
      body: data.body || '',
      icon: 'icons/icon-192.png',
      badge: 'icons/icon-192.png',
      tag: data.tag,
    }),
  )
})

// Al tocar una notificación se trae al frente la app si ya está abierta; si no, se abre.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const open = windows.find((w) => 'focus' in w)
      return open ? open.focus() : self.clients.openWindow(self.registration.scope)
    }),
  )
})
