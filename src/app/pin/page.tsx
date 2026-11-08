'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useMe, saveMe } from '@/lib/useMe';
import { Header } from '@/components/Header';

const box = 'min-h-12 w-full rounded-md border border-brand/40 bg-white px-3 text-base';

export default function PinPage() {
  const me = useMe();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [again, setAgain] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!me) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!/^\d{4,8}$/.test(next)) return setError('Use 4 to 8 digits.');
    if (next !== again) return setError('The new PINs do not match.');
    setBusy(true);
    const res = await fetch('/api/pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staffId: me!.id, pin: current, newPin: next }),
    }).catch(() => null);
    setBusy(false);
    if (!res) return setError('Check your connection and try again.');
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setError(data.error ?? 'Could not change PIN.');
    saveMe({ ...me!, pin: next });
    setDone(true);
  }

  return (
    <>
      <Header me={me} />
      <main className="mx-auto max-w-sm px-4 py-8">
        <h1 className="text-2xl font-semibold text-brand-dark">Change PIN</h1>
        {done ? (
          <div className="mt-6 flex flex-col gap-4">
            <p role="status" className="rounded-md border border-green-700 bg-green-50 px-3 py-2 text-green-900">
              PIN changed. Use the new one next time.
            </p>
            <Link href={me.role === 'director' ? '/team' : '/report'} className="min-h-12 rounded-md bg-brand px-4 py-3 text-center text-base font-medium text-white">
              Continue
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 flex flex-col gap-4" noValidate>
            <input className={box} type="password" inputMode="numeric" autoComplete="off" placeholder="Current PIN" value={current} onChange={(e) => setCurrent(e.target.value)} />
            <input className={box} type="password" inputMode="numeric" autoComplete="off" placeholder="New PIN (4 to 8 digits)" value={next} onChange={(e) => setNext(e.target.value)} />
            <input className={box} type="password" inputMode="numeric" autoComplete="off" placeholder="New PIN again" value={again} onChange={(e) => setAgain(e.target.value)} />
            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
            <button disabled={busy} className="min-h-12 rounded-md bg-brand px-4 text-base font-medium text-white disabled:opacity-60">
              {busy ? 'Saving…' : 'Change PIN'}
            </button>
          </form>
        )}
      </main>
    </>
  );
}
