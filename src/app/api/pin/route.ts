import { badNewPin, db, findStaff, pinOk } from '@/lib/server';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const staff = await findStaff(body.staffId);
  if (!staff || !pinOk(staff, body.pin)) return Response.json({ error: 'Current PIN is wrong.' }, { status: 403 });

  const bad = badNewPin(body.newPin, staff.pin);
  if (bad) return Response.json({ error: bad }, { status: 400 });

  const { error } = await db().from('staff').update({ pin: body.newPin }).eq('id', staff.id);
  if (error) return Response.json({ error: 'Could not save. Try again.' }, { status: 500 });
  return Response.json({ ok: true });
}
