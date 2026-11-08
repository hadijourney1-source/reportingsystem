'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveMe, type Me } from '@/lib/useMe';
import { NO_PIN_ROLES } from '@/lib/templates';

type Person = { id: string; name: string; role: string; hasPin: boolean };

const READERS = ['director', 'head_of_school', 'vice_principal', 'operations_manager'];
const roleLabel = (r: string) => r.replace(/_/g, ' ');
const box = 'min-h-12 rounded-md border border-brand/40 bg-white px-3 text-base';

export default function Page() {
  const router = useRouter();
  const [people, setPeople] = useState<Person[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [asking, setAsking] = useState<Person | null>(null);
  const [pin, setPin] = useState('');
  const [again, setAgain] = useState('');
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

  function back() {
    setAsking(null);
    setPin('');
    setAgain('');
    setError('');
  }

  async function enter(p: Person, pinValue: string, claim: boolean) {
    setBusy(true);
    setError('');
    const res = await fetch(claim ? '/api/claim' : '/api/me', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(claim ? { staffId: p.id, newPin: pinValue } : { staffId: p.id, pin: pinValue }),
    }).catch(() => null);
    setBusy(false);
    if (!res) return setError('Check your connection and try again.');
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setError(data.error ?? 'Wrong PIN.');
    const me = data as Me;
    saveMe({ ...me, pin: pinValue });
    router.replace(me.role === 'director' ? '/team' : '/report');
  }

  if (asking) {
    const claiming = !asking.hasPin && !READERS.includes(asking.role);
    const blocked = !asking.hasPin && READERS.includes(asking.role);

    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 px-4">
        <h1 className="text-2xl font-semibold text-brand-dark">{asking.name}</h1>
        {blocked ? (
          <p className="text-base text-muted">No PIN has been set for this person yet. Ask the administrator.</p>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (claiming) {
                if (!/^\d{4,8}$/.test(pin)) return setError('Use 4 to 8 digits.');
                if (pin !== again) return setError('The PINs do not match.');
              }
              enter(asking, pin, claiming);
            }}
            className="flex flex-col gap-4"
          >
            {claiming && <p className="text-base text-muted">Choose a PIN you will remember.</p>}
            <input
              type="password" inputMode="numeric" autoFocus autoComplete="off"
              placeholder={claiming ? 'Choose a PIN (4 to 8 digits)' : 'PIN'} value={pin}
              onChange={(e) => setPin(e.target.value)} className={box}
            />
            {claiming && (
              <input
                type="password" inputMode="numeric" autoComplete="off" placeholder="PIN again" value={again}
                onChange={(e) => setAgain(e.target.value)} className={box}
              />
            )}
            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
            <button disabled={busy} className="min-h-12 rounded-md bg-brand px-4 text-base font-medium text-white disabled:opacity-60">
              {claiming ? 'Save PIN and continue' : 'Continue'}
            </button>
          </form>
        )}
        <button type="button" onClick={back} className="min-h-12 text-base text-muted">
          Back
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-sm px-4 py-10">
      <p className="text-sm font-semibold uppercase tracking-widest text-brand">Eunifrance Schools</p>
      <h1 className="mt-1 text-3xl font-semibold text-brand-dark">Who are you?</h1>
      {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
      {failed && <p role="alert" className="mt-6 text-red-700">Could not load names. Check your connection and refresh.</p>}
      {people && people.length === 0 && <p className="mt-6 text-muted">No names added yet.</p>}
      <ul className="mt-6 flex flex-col gap-3">
        {(people ?? []).map((p) => (
          <li key={p.id}>
            <button
              disabled={busy}
              onClick={() => (NO_PIN_ROLES.includes(p.role) ? enter(p, '', false) : setAsking(p))}
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
