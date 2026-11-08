import { db } from '@/lib/server';

export async function GET(req: Request) {
  new URL(req.url);
  const { data, error } = await db().from('staff').select('id, name, role, pin').order('name');
  if (error) return Response.json({ error: 'Could not load names.' }, { status: 500 });
  return Response.json((data ?? []).map(({ pin, ...p }) => ({ ...p, hasPin: !!pin })));
}
