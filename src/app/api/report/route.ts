import { db, findStaff, isDate, isId } from '@/lib/server';
import { TEMPLATES } from '@/lib/templates';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const staffId = url.searchParams.get('staffId');
  const period = url.searchParams.get('period');
  if (!isId(staffId) || !isDate(period)) return Response.json({ error: 'Bad request.' }, { status: 400 });
  const { data } = await db().from('submissions').select('answers, submitted_at')
    .eq('staff_id', staffId).eq('period', period).maybeSingle();
  return Response.json(data ?? null);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const staff = await findStaff(body.staffId);
  const template = staff && TEMPLATES[staff.role];
  if (!staff || !template || !isDate(body.period) || typeof body.answers !== 'object' || body.answers === null) {
    return Response.json({ error: 'Bad request.' }, { status: 400 });
  }
  if (JSON.stringify(body.answers).length > 100_000) {
    return Response.json({ error: 'Report is too long.' }, { status: 413 });
  }
  const submitted_at = new Date().toISOString();
  const { error } = await db().from('submissions').upsert(
    { staff_id: staff.id, template: template.key, period: body.period, answers: body.answers, submitted_at },
    { onConflict: 'staff_id,period' }
  );
  if (error) return Response.json({ error: 'Could not save.' }, { status: 500 });
  return Response.json({ submitted_at });
}
