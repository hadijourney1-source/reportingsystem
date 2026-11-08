import { db, findStaff, pinOk } from '@/lib/server';

const WEAK = ['1234', '123456', '12345678', '4321', '654321', '1212', '0123'];

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const staff = await findStaff(body.staffId);
  if (!staff || !pinOk(staff, body.pin)) return Response.json({ error: 'Current PIN is wrong.' }, { status: 403 });

  const next = body.newPin;
  if (typeof next !== 'string' || !/^\d{4,8}$/.test(next)) {
    return Response.json({ error: 'Use 4 to 8 digits.' }, { status: 400 });
  }
  if (next === staff.pin) return Response.json({ error: 'Choose a different PIN.' }, { status: 400 });
  if (/^(\d)\1+$/.test(next) || WEAK.includes(next)) {
    return Response.json({ error: 'That PIN is too easy to guess.' }, { status: 400 });
  }

  const { error } = await db().from('staff').update({ pin: next }).eq('id', staff.id);
  if (error) return Response.json({ error: 'Could not save. Try again.' }, { status: 500 });
  return Response.json({ ok: true });
}
