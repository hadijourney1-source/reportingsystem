'use client';
import { useEffect, useState } from 'react';
import type { Me } from '@/lib/useMe';

type State = 'checking' | 'unsupported' | 'install' | 'off' | 'on' | 'denied' | 'busy' | 'error';

function keyBytes(base64Url: string): Uint8Array<ArrayBuffer> {
  const pad = '='.repeat((4 - (base64Url.length % 4)) % 4);
  const raw = atob((base64Url + pad).replace(/-/g, '+').replace(/_/g, '/'));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function ReminderToggle({ me }: { me: Me }) {
  const [state, setState] = useState<State>('checking');

  useEffect(() => {
    const iOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const standalone = (navigator as unknown as { standalone?: boolean }).standalone === true
      || window.matchMedia('(display-mode: standalone)').matches;
    if (iOS && !standalone) return setState('install');
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      return setState('unsupported');
    }
    if (Notification.permission === 'denied') return setState('denied');
    navigator.serviceWorker.getRegistration('/sw.js')
      .then((reg) => reg?.pushManager.getSubscription())
      .then((sub) => setState(sub ? 'on' : 'off'))
      .catch(() => setState('off'));
  }, []);

  async function turnOn() {
    setState('busy');
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return setState(permission === 'denied' ? 'denied' : 'off');
      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: keyBytes(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''),
      });
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId: me.id, pin: me.pin, subscription: sub.toJSON() }),
      });
      setState(res.ok ? 'on' : 'error');
    } catch {
      setState('error');
    }
  }

  if (state === 'checking' || state === 'unsupported') return null;

  return (
    <div className="mt-4 rounded-md border border-brand/20 bg-white px-3 py-3">
      {state === 'on' && <p className="text-base text-green-900">✓ Reminders are on for this phone.</p>}
      {state === 'install' && (
        <p className="text-base text-muted">
          For reminders on iPhone: tap Share, choose Add to Home Screen, then open Reports from your Home Screen.
        </p>
      )}
      {state === 'denied' && (
        <p className="text-base text-muted">Notifications are blocked for this site. Allow them in your phone settings to get reminders.</p>
      )}
      {(state === 'off' || state === 'busy' || state === 'error') && (
        <div className="flex flex-col gap-2">
          <button
            onClick={turnOn} disabled={state === 'busy'}
            className="min-h-12 rounded-md bg-brand px-4 text-base font-medium text-white disabled:opacity-60"
          >
            {state === 'busy' ? 'Turning on…' : 'Turn on reminders'}
          </button>
          {state === 'error' && <p role="alert" className="text-sm text-red-700">Could not turn on reminders. Try again.</p>}
        </div>
      )}
    </div>
  );
}
