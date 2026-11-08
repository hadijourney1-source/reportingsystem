import { badNewPin, db, findStaff, READER_ROLES } from '@/lib/server';

// First sign-in: a person with no PIN chooses their own.
// The director and head of school cannot be claimed this way (they can read everyone's reports).
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const staff = await findStaff(body.staffId);
  if (!staff || staff.pin || READER_ROLES.includes(staff.role)) {
    return Response.json({ error: 'This name already has a PIN.' }, { status: 403 });
  }
  const bad = badNewPin(body.newPin);
  if (bad) return Response.json({ error: bad }, { status: 400 });

  // Only succeeds if the PIN is still empty, so two people cannot claim the same name at once.
  const { data, error } = await db().from('staff').update({ pin: body.newPin })
    .eq('id', staff.id).is('pin', null).select('id').maybeSingle();
  if (error || !data) return Response.json({ error: 'This name already has a PIN.' }, { status: 409 });
  return Response.json({ id: staff.id, name: staff.name, role: staff.role });
}
