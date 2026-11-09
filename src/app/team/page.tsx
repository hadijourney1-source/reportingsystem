'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { clearMe, useMe } from '@/lib/useMe';
import { Header } from '@/components/Header';
import { TEMPLATES, expectedFor, type Template } from '@/lib/templates';
import { mondayOf, periodFor, prettyDate, todayLagos, weekday } from '@/lib/period';

type StaffRow = { id: string; name: string; role: string };
type Sub = {
  staff_id: string;
  template: string;
  period: string;
  answers: Record<string, string | string[]>;
  submitted_at: string;
};

const READERS = ['director', 'head_of_school', 'vice_principal', 'operations_manager'];
const roleLabel = (r: string) => r.replace(/_/g, ' ');
const kind = (t: Template) => (t.frequency === 'daily' ? 'Daily report' : 'Weekly report');
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

function addDays(date: string, n: number): string {
  const d = new Date(date + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function Answers({ template, answers }: { template: string; answers: Sub['answers'] }) {
  const t = TEMPLATES[template];
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

function Mark({ state }: { state: 'done' | 'missing' | 'open' }) {
  const look = {
    done: 'bg-green-100 text-green-900',
    missing: 'bg-red-100 text-red-900',
    open: 'bg-brand/10 text-muted',
  }[state];
  const sign = { done: '✓', missing: '✗', open: '○' }[state];
  const word = { done: 'Submitted', missing: 'Missing', open: 'Not yet' }[state];
  return (
    <span role="img" aria-label={word} className={`inline-flex h-9 w-9 items-center justify-center rounded-md text-base font-semibold ${look}`}>
      {sign}
    </span>
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
  const [view, setView] = useState<'day' | 'week'>('day');

  useEffect(() => {
    const t = todayLagos();
    setToday(t);
    setDay(t);
  }, []);

  useEffect(() => {
    if (me && !READERS.includes(me.role)) router.replace('/report');
  }, [me, router]);

  useEffect(() => {
    if (!me || !day || !READERS.includes(me.role)) return;
    setOpen(null);
    const monday = mondayOf(day);
    const periods = view === 'week' ? [0, 1, 2, 3, 4].map((i) => addDays(monday, i)) : [day, monday];
    fetch('/api/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staffId: me.id, pin: me.pin, periods }),
    })
      .then((r) => {
        if (r.status === 403) clearMe();
        return r.ok ? r.json() : Promise.reject(r.status);
      })
      .then((d) => { setStaff(d.staff); setSubs(d.subs); })
      .catch((status) => (status === 403 ? router.replace('/') : setStaff([])));
  }, [me, day, view]);

  if (!me || !today || !day) return null;

  const step = (dir: number) => {
    const next = addDays(day, dir * (view === 'week' ? 7 : 1));
    setDay(next > today ? today : next);
  };

  const monday = mondayOf(day);
  const weekDates = [0, 1, 2, 3, 4].map((i) => addDays(monday, i));
  const rows = (staff ?? []).flatMap((s) => expectedFor(s.role).map((t) => ({ s, t })));

  function state(staffId: string, t: Template, date: string): 'done' | 'missing' | 'open' {
    const period = periodFor(t.frequency, date);
    if (subs.some((x) => x.staff_id === staffId && x.template === t.key && x.period === period)) return 'done';
    return period < periodFor(t.frequency, today) ? 'missing' : 'open';
  }

  return (
    <>
      <Header me={me} />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="text-2xl font-semibold text-brand-dark">Team</h1>

        <div className="mt-3 flex gap-2" role="tablist">
          {(['day', 'week'] as const).map((v) => (
            <button
              key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)}
              className={`min-h-11 flex-1 rounded-md border text-base font-medium ${
                view === v ? 'border-brand bg-brand text-white' : 'border-brand/40 bg-white'
              }`}
            >
              {v === 'day' ? 'Day' : 'Week'}
            </button>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button onClick={() => step(-1)} aria-label={view === 'week' ? 'Previous week' : 'Previous day'} className="min-h-11 min-w-11 rounded-md border border-brand/40 bg-white text-lg">‹</button>
          <input
            type="date" value={day} max={today}
            onChange={(e) => e.target.value && e.target.value <= today && setDay(e.target.value)}
            className="min-h-11 flex-1 rounded-md border border-brand/40 bg-white px-3 text-base"
          />
          <button
            onClick={() => step(1)} disabled={view === 'week' ? monday >= mondayOf(today) : day >= today}
            aria-label={view === 'week' ? 'Next week' : 'Next day'}
            className="min-h-11 min-w-11 rounded-md border border-brand/40 bg-white text-lg disabled:opacity-40"
          >›</button>
          {day !== today && (
            <button onClick={() => setDay(today)} className="min-h-11 rounded-md border border-brand/40 bg-white px-3 text-sm">Today</button>
          )}
        </div>
        <p className="mt-2 text-sm text-muted">
          {view === 'week' ? `Week of ${prettyDate(monday)}` : prettyDate(day)}
        </p>

        {staff && rows.length === 0 && <p className="mt-6 text-muted">No staff yet.</p>}

        {view === 'week' ? (
          <div className="mt-4 overflow-x-auto border-y border-brand/20 bg-white">
            <table className="w-full min-w-[420px] border-collapse text-left">
              <thead>
                <tr className="border-b border-brand/20 text-xs uppercase tracking-wide text-brand">
                  <th className="sticky left-0 bg-white px-3 py-2 font-semibold">Name</th>
                  {weekDates.map((d, i) => (
                    <th key={d} className={`px-1 py-2 text-center font-semibold ${d === today ? 'text-brand-dark underline' : ''}`}>
                      {DAY_NAMES[i]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-brand/10">
                {rows.map(({ s, t }) => (
                  <tr key={`${s.id}|${t.key}`}>
                    <td className="sticky left-0 bg-white px-3 py-2">
                      <span className="block text-base font-medium">{s.name}</span>
                      <span className="block text-xs capitalize text-muted">{roleLabel(s.role)} · {kind(t).toLowerCase()}</span>
                    </td>
                    {t.frequency === 'weekly' ? (
                      <td colSpan={5} className="px-1 py-2 text-center">
                        <Mark state={state(s.id, t, monday)} />
                        <span className="ml-2 text-sm text-muted">whole week</span>
                      </td>
                    ) : (
                      weekDates.map((d) => (
                        <td key={d} className="px-1 py-2 text-center">
                          <Mark state={state(s.id, t, d)} />
                        </td>
                      ))
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <>
            <ul className="mt-4 divide-y divide-brand/20 border-y border-brand/20">
              {rows.map(({ s, t }) => {
                const id = `${s.id}|${t.key}`;
                const period = periodFor(t.frequency, day);
                const sub = subs.find((x) => x.staff_id === s.id && x.template === t.key && x.period === period);
                const weekend = t.frequency === 'daily' && weekday(day) >= 6;
                const missed = !sub && !weekend && period < periodFor(t.frequency, today);
                const isOpen = open === id;
                return (
                  <li key={id} className="bg-white">
                    <button
                      onClick={() => sub && setOpen(isOpen ? null : id)}
                      className="flex min-h-14 w-full items-center justify-between gap-3 px-3 py-2 text-left"
                      disabled={!sub}
                    >
                      <span>
                        <span className="block text-base font-medium">{s.name}</span>
                        <span className="block text-sm capitalize text-muted">
                          {roleLabel(s.role)} · {kind(t).toLowerCase()}
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
                        <Answers template={t.key} answers={sub.answers} />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </main>
    </>
  );
}
