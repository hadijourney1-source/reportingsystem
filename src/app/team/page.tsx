'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMe } from '@/lib/useMe';
import { Header } from '@/components/Header';
import { TEMPLATES } from '@/lib/templates';
import { mondayOf, periodFor, prettyDate, todayLagos, weekday } from '@/lib/period';

type StaffRow = { id: string; name: string; role: string };
type Sub = { staff_id: string; period: string; answers: Record<string, string | string[]>; submitted_at: string };

const roleLabel = (r: string) => r.replace(/_/g, ' ');

function Answers({ role, answers }: { role: string; answers: Sub['answers'] }) {
  const t = TEMPLATES[role];
  if (!t) return null;
  return (
    <div className="mt-3 flex flex-col gap-5 border-t border-brand/10 pt-4">
      {t.sections.map((s) => {
        const rows = s.fields.filter((f) => answers[f.id] !== undefined && answers[f.id] !== '');
        if (!rows.length) return null;
        return (
          <div key={s.title}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand">{s.title}</h3>
            {rows.map((f) => {
              const v = answers[f.id];
              const detail = answers[f.id + '__detail'];
              return (
                <div key={f.id} className="mb-3">
                  <p className="text-sm text-muted">{f.label}</p>
                  <p className="whitespace-pre-wrap text-base">
                    {Array.isArray(v) ? v.join(', ') : v}
                    {typeof detail === 'string' && detail ? ` — ${detail}` : ''}
                  </p>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

export default function TeamPage() {
  const router = useRouter();
  const me = useMe();
  const [staff, setStaff] = useState<StaffRow[] | null>(null);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [today, setToday] = useState('');
  const [day, setDay] = useState('');
  useEffect(() => {
    const t = todayLagos();
    setToday(t);
    setDay(t);
  }, []);

  useEffect(() => {
    if (me && !['director', 'head_of_school'].includes(me.role)) router.replace('/report');
  }, [me, router]);

  useEffect(() => {
    if (!me || !day || !['director', 'head_of_school'].includes(me.role)) return;
    setOpen(null);
    fetch('/api/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staffId: me.id, pin: me.pin, periods: [day, mondayOf(day)] }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => { setStaff(d.staff); setSubs(d.subs); })
      .catch(() => setStaff([]));
  }, [me, day]);

  if (!me || !today || !day) return null;

  const step = (n: number) => {
    const d = new Date(day + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() + n);
    const next = d.toISOString().slice(0, 10);
    if (next <= today) setDay(next);
  };

  return (
    <>
      <Header me={me} />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="text-2xl font-semibold text-brand-dark">Team</h1>
        <div className="mt-3 flex items-center gap-2">
          <button onClick={() => step(-1)} aria-label="Previous day" className="min-h-11 min-w-11 rounded-md border border-brand/40 bg-white text-lg">‹</button>
          <input
            type="date" value={day} max={today}
            onChange={(e) => e.target.value && e.target.value <= today && setDay(e.target.value)}
            className="min-h-11 flex-1 rounded-md border border-brand/40 bg-white px-3 text-base"
          />
          <button onClick={() => step(1)} disabled={day >= today} aria-label="Next day" className="min-h-11 min-w-11 rounded-md border border-brand/40 bg-white text-lg disabled:opacity-40">›</button>
          {day !== today && (
            <button onClick={() => setDay(today)} className="min-h-11 rounded-md border border-brand/40 bg-white px-3 text-sm">Today</button>
          )}
        </div>
        <p className="mt-2 text-sm text-muted">{prettyDate(day)}</p>

        {staff && staff.length === 0 && <p className="mt-6 text-muted">No staff yet.</p>}

        <ul className="mt-4 divide-y divide-brand/20 border-y border-brand/20">
          {(staff ?? []).map((s) => {
            const t = TEMPLATES[s.role];
            const period = periodFor(t.frequency, day);
            const sub = subs.find((x) => x.staff_id === s.id && x.period === period);
            const weekend = t.frequency === 'daily' && weekday(day) >= 6;
            const missed = !sub && !weekend && period < periodFor(t.frequency, today);
            const isOpen = open === s.id;
            return (
              <li key={s.id} className="bg-white">
                <button
                  onClick={() => sub && setOpen(isOpen ? null : s.id)}
                  className="flex min-h-14 w-full items-center justify-between gap-3 px-3 py-2 text-left"
                  disabled={!sub}
                >
                  <span>
                    <span className="block text-base font-medium">{s.name}</span>
                    <span className="block text-sm capitalize text-muted">
                      {roleLabel(s.role)} · {t.frequency}
                    </span>
                  </span>
                  <span className={`rounded px-2 py-1 text-sm font-medium ${sub ? 'bg-green-100 text-green-900' : missed ? 'bg-red-100 text-red-900' : 'bg-brand/10 text-muted'}`}>
                    {sub ? 'Submitted' : missed ? 'Missing' : weekend ? 'Weekend' : 'Not yet'}
                  </span>
                </button>
                {sub && isOpen && (
                  <div className="px-3 pb-4">
                    <p className="text-sm text-muted">
                      {new Date(sub.submitted_at).toLocaleString('en-GB', { timeZone: 'Africa/Lagos' })}
                    </p>
                    <Answers role={s.role} answers={sub.answers} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </main>
    </>
  );
}
