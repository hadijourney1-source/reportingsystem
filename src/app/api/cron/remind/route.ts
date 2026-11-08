import * as webpush from 'web-push';
import { db } from '@/lib/server';
import { expectedFor } from '@/lib/templates';
import { periodFor, weekday } from '@/lib/period';

// Called by Vercel Cron at 15:00 Lagos time, Monday to Friday.
// Vercel sends: Authorization: Bearer <CRON_SECRET>
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ error: 'Not allowed.' }, { status: 401 });
  }
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return Response.json({ error: 'Push keys are not set.' }, { status: 500 });
  }
  webpush.setVapidDetails('mailto:admin@eunifrance.com', process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' });
  const isFriday = weekday(today) === 5;
  const supabase = db();

  const { data: subs } = await supabase.from('push_subscriptions')
    .select('id, endpoint, p256dh, auth, staff:staff_id(id, name, role)');
  const rows = (subs ?? []) as unknown as {
    id: string; endpoint: string; p256dh: string; auth: string;
    staff: { id: string; name: string; role: string } | null;
  }[];

  // Daily reports are chased every weekday; weekly reports on Friday. Duty reports are never chased.
  const pendingFor = (role: string) =>
    expectedFor(role).filter((t) => t.frequency === 'daily' || isFriday);
  const due = rows.filter((r) => r.staff && pendingFor(r.staff.role).length > 0);
  if (!due.length) return Response.json({ sent: 0 });

  const staffIds = [...new Set(due.map((r) => r.staff!.id))];
  const { data: done } = await supabase.from('submissions').select('staff_id, template, period')
    .in('staff_id', staffIds).in('period', [periodFor('daily', today), periodFor('weekly', today)]);
  const submitted = new Set((done ?? []).map((d) => `${d.staff_id}|${d.template}|${d.period}`));

  let sent = 0;
  for (const r of due) {
    const missing = pendingFor(r.staff!.role)
      .filter((t) => !submitted.has(`${r.staff!.id}|${t.key}|${periodFor(t.frequency, today)}`));
    if (!missing.length) continue;
    const kinds = missing.map((t) => (t.frequency === 'daily' ? "today's" : "this week's"));
    try {
      await webpush.sendNotification(
        { endpoint: r.endpoint, keys: { p256dh: r.p256dh, auth: r.auth } },
        JSON.stringify({
          title: 'Report reminder',
          body: `${kinds.join(' and ')} report ${missing.length > 1 ? 'are' : 'is'} not in yet.`.replace(/^./, (c) => c.toUpperCase()),
          url: '/report',
        })
      );
      sent++;
    } catch (err) {
      const code = (err as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) await supabase.from('push_subscriptions').delete().eq('id', r.id);
    }
  }
  return Response.json({ sent });
}
