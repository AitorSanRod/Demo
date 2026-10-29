// Se importa en el service worker generado por Workbox (ver vite.config.ts › workbox.importScripts).
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
