import { findStaff, pinOk } from '@/lib/server';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const staff = await findStaff(body.staffId);
  if (!staff || !pinOk(staff, body.pin)) return Response.json({ error: 'Wrong PIN.' }, { status: 403 });
  return Response.json({ id: staff.id, name: staff.name, role: staff.role });
}
