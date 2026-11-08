import { db, findStaff, pinOk } from '@/lib/server';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const staff = await findStaff(body.staffId);
  if (!staff || !pinOk(staff, body.pin)) return Response.json({ error: 'Not allowed.' }, { status: 403 });

  const sub = body.subscription;
  if (!sub || typeof sub.endpoint !== 'string' || !sub.endpoint.startsWith('https://')
      || typeof sub.keys?.p256dh !== 'string' || typeof sub.keys?.auth !== 'string') {
    return Response.json({ error: 'Bad request.' }, { status: 400 });
  }

  const { error } = await db().from('push_subscriptions').upsert(
    { staff_id: staff.id, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
    { onConflict: 'endpoint' }
  );
  if (error) return Response.json({ error: 'Could not save.' }, { status: 500 });
  return Response.json({ ok: true });
}
