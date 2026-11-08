'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveMe, type Me } from '@/lib/useMe';

type Person = { id: string; name: string; role: string };

const roleLabel = (r: string) => r.replace(/_/g, ' ');

export default function Page() {
  const router = useRouter();
  const [people, setPeople] = useState<Person[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [asking, setAsking] = useState<Person | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem('staff-me')) return router.replace('/report');
    } catch {}
    fetch('/api/people')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setPeople)
      .catch(() => setFailed(true));
  }, [router]);

  async function choose(p: Person, pinValue?: string) {
    setBusy(true);
    setError('');
    const res = await fetch('/api/me', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staffId: p.id, pin: pinValue }),
    });
    setBusy(false);
    if (!res.ok) return setError('Wrong PIN.');
    const me = (await res.json()) as Me;
    saveMe(pinValue ? { ...me, pin: pinValue } : me);
    router.replace(me.role === 'director' ? '/team' : '/report');
  }

  if (asking) {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 px-4">
        <h1 className="text-2xl font-semibold text-brand-dark">{asking.name}</h1>
        <form
          onSubmit={(e) => { e.preventDefault(); choose(asking, pin); }}
          className="flex flex-col gap-4"
        >
          <input
            type="password" inputMode="numeric" autoFocus placeholder="PIN" value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="min-h-12 rounded-md border border-brand/40 bg-white px-3 text-base"
          />
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <button disabled={busy} className="min-h-12 rounded-md bg-brand px-4 text-base font-medium text-white disabled:opacity-60">
            Continue
          </button>
          <button type="button" onClick={() => { setAsking(null); setPin(''); setError(''); }} className="min-h-12 text-base text-muted">
            Back
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-sm px-4 py-10">
      <p className="text-sm font-semibold uppercase tracking-widest text-brand">Eunifrance Schools</p>
      <h1 className="mt-1 text-3xl font-semibold text-brand-dark">Who are you?</h1>
      {failed && <p role="alert" className="mt-6 text-red-700">Could not load names. Check your connection and refresh.</p>}
      {people && people.length === 0 && <p className="mt-6 text-muted">No names added yet.</p>}
      <ul className="mt-6 flex flex-col gap-3">
        {(people ?? []).map((p) => (
          <li key={p.id}>
            <button
              disabled={busy}
              onClick={() => setAsking(p)}
              className="flex min-h-14 w-full flex-col items-start justify-center rounded-md border border-brand/40 bg-white px-4 py-2 text-left"
            >
              <span className="text-base font-medium">{p.name}</span>
              {p.name.toLowerCase() !== roleLabel(p.role) && (
                <span className="text-sm capitalize text-muted">{roleLabel(p.role)}</span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
