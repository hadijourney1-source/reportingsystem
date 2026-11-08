self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) {}
  event.waitUntil(
    self.registration.showNotification(data.title || 'Staff Reports', {
      body: data.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'daily-reminder',
      data: { url: data.url || '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ('focus' in c) { c.navigate(url); return c.focus(); }
      }
      return clients.openWindow(url);
    })
  );
});
