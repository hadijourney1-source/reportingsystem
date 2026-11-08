'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMe } from '@/lib/useMe';
import { Header } from '@/components/Header';
import { TEMPLATES, type Field } from '@/lib/templates';
import { periodFor, prettyDate, todayLagos, weekday } from '@/lib/period';

type Answers = Record<string, string | string[]>;

const input = 'min-h-12 w-full rounded-md border border-brand/40 bg-white px-3 py-2 text-base';
const pick = (on: boolean) =>
  on ? 'border-brand bg-brand text-white' : 'border-brand/40 bg-white';

function FieldInput({ field, answers, set, error }: {
  field: Field; answers: Answers; set: (id: string, v: string | string[]) => void; error?: string;
}) {
  const value = answers[field.id];
  const str = typeof value === 'string' ? value : '';
  const required = !('optional' in field && field.optional);
  const detail = answers[field.id + '__detail'];

  return (
    <div className="flex flex-col gap-2" id={`f-${field.id}`}>
      <label className="text-base font-medium">
        {field.label}{required && <span className="text-red-700"> *</span>}
      </label>

      {field.type === 'yesno' && (
        <>
          <div className="flex gap-3">
            {['Yes', 'No'].map((v) => (
              <button
                key={v} type="button" onClick={() => set(field.id, v)}
                className={`min-h-12 flex-1 rounded-md border text-base font-medium ${pick(str === v)}`}
              >
                {v}
              </button>
            ))}
          </div>
          {field.detail && str === (field.detail.on === 'yes' ? 'Yes' : 'No') && (
            <input
              className={input} placeholder={field.detail.label}
              value={typeof detail === 'string' ? detail : ''}
              onChange={(e) => set(field.id + '__detail', e.target.value)}
            />
          )}
        </>
      )}

      {field.type === 'text' && <input className={input} value={str} onChange={(e) => set(field.id, e.target.value)} />}
      {field.type === 'number' && (
        <input className={input} type="number" inputMode="numeric" min={0} value={str} onChange={(e) => set(field.id, e.target.value)} />
      )}
      {field.type === 'date' && <input className={input} type="date" value={str} onChange={(e) => set(field.id, e.target.value)} />}
      {field.type === 'long' && (
        <textarea className={input} rows={4} value={str} onChange={(e) => set(field.id, e.target.value)} />
      )}
      {field.type === 'list' && (
        <textarea
          className={input} rows={4} placeholder="One per line" value={str}
          onChange={(e) => set(field.id, e.target.value)}
        />
      )}

      {field.type === 'choice' && (
        <div className="flex flex-col gap-2">
          {field.options.map((o) => (
            <button
              key={o} type="button" onClick={() => set(field.id, o)}
              className={`min-h-12 rounded-md border px-3 text-left text-base ${pick(str === o)}`}
            >
              {o}
            </button>
          ))}
        </div>
      )}

      {field.type === 'checks' && (
        <div className="flex flex-col gap-2">
          {field.options.map((o) => {
            const picked = Array.isArray(value) && value.includes(o);
            return (
              <button
                key={o} type="button"
                onClick={() => {
                  const cur = Array.isArray(value) ? value : [];
                  set(field.id, picked ? cur.filter((x) => x !== o) : [...cur, o]);
                }}
                className={`min-h-12 rounded-md border px-3 text-left text-base ${pick(picked)}`}
              >
                {picked ? '✓ ' : ''}{o}
              </button>
            );
          })}
        </div>
      )}

      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </div>
  );
}

export default function ReportPage() {
  const router = useRouter();
  const me = useMe();
  const [answers, setAnswers] = useState<Answers>({});
  const [loaded, setLoaded] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const template = me ? TEMPLATES[me.role] : undefined;
  const [today, setToday] = useState('');
  useEffect(() => setToday(todayLagos()), []);
  const period = template && today ? periodFor(template.frequency, today) : '';

  useEffect(() => {
    if (me?.role === 'director') router.replace('/team');
  }, [me, router]);

  useEffect(() => {
    if (!me || !template || !period) return;
    fetch(`/api/report?staffId=${me.id}&period=${period}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setAnswers(data.answers as Answers);
          setSavedAt(data.submitted_at);
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [me, template, period]);

  if (!me || !today) return null;
  if (!template) return <><Header me={me} /><p className="p-4">No report for your role.</p></>;

  const sections = template.sections.filter((s) => !s.days || s.days.includes(weekday(today)));

  function set(id: string, v: string | string[]) {
    setAnswers((a) => ({ ...a, [id]: v }));
    setErrors((e) => { const n = { ...e }; delete n[id]; return n; });
    setMessage('');
  }

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};
    for (const s of sections) for (const f of s.fields) {
      const v = answers[f.id];
      const optional = 'optional' in f && f.optional;
      const empty = v === undefined || (typeof v === 'string' && !v.trim()) || (Array.isArray(v) && !v.length);
      if (!optional && empty) errs[f.id] = f.type === 'yesno' ? 'Choose Yes or No.' : 'Please fill this in.';
      else if (f.type === 'yesno' && f.detail && v === (f.detail.on === 'yes' ? 'Yes' : 'No')) {
        const d = answers[f.id + '__detail'];
        if (typeof d !== 'string' || !d.trim()) errs[f.id] = `Please add: ${f.detail.label}`;
      }
    }
    return errs;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    const first = Object.keys(errs)[0];
    if (first) {
      document.getElementById(`f-${first}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setBusy(true);
    const res = await fetch('/api/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staffId: me!.id, period, answers }),
    }).catch(() => null);
    setBusy(false);
    if (!res || !res.ok) return setMessage('Could not submit. Check your connection and try again.');
    setSavedAt((await res.json()).submitted_at);
    setMessage('Submitted. You can still edit and resubmit.');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <>
      <Header me={me} />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="text-2xl font-semibold text-brand-dark">{template.title}</h1>
        <p className="mt-1 text-sm text-muted">
          {template.frequency === 'daily' ? prettyDate(today) : `Week of ${prettyDate(period)}`} · to {template.reportsTo}
        </p>

        {savedAt && (
          <p role="status" className="mt-4 rounded-md border border-green-700 bg-green-50 px-3 py-2 text-sm text-green-900">
            {message || 'Submitted'} · {new Date(savedAt).toLocaleString('en-GB', { timeZone: 'Africa/Lagos' })}
          </p>
        )}
        {!savedAt && message && <p role="alert" className="mt-4 text-sm text-red-700">{message}</p>}

        {loaded && (
          <form onSubmit={submit} className="mt-6 flex flex-col gap-8" noValidate>
            {sections.map((s) => (
              <section key={s.title} className="flex flex-col gap-5">
                <h2 className="border-b border-brand/20 pb-1 text-sm font-semibold uppercase tracking-wide text-brand">
                  {s.title}
                </h2>
                {s.fields.map((f) => (
                  <FieldInput key={f.id} field={f} answers={answers} set={set} error={errors[f.id]} />
                ))}
              </section>
            ))}
            <button disabled={busy} className="min-h-12 rounded-md bg-brand px-4 text-base font-medium text-white disabled:opacity-60">
              {busy ? 'Submitting…' : savedAt ? 'Resubmit' : 'Submit'}
            </button>
          </form>
        )}
      </main>
    </>
  );
}
