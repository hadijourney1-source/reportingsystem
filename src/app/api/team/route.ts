import { db, findStaff, isDate, pinOk, READER_ROLES } from '@/lib/server';
import { reportsFor } from '@/lib/templates';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const me = await findStaff(body.staffId);
  if (!me || !READER_ROLES.includes(me.role) || !pinOk(me, body.pin)) {
    return Response.json({ error: 'Not allowed.' }, { status: 403 });
  }
  const periods = Array.isArray(body.periods) ? body.periods.filter(isDate).slice(0, 7) : [];

  // The director reads everyone; the others read the people who report to them.
  let q = db().from('staff').select('id, name, role').neq('id', me.id).order('name');
  if (me.role !== 'director') q = q.eq('reports_to', me.id);
  const { data: rows } = await q;
  const staff = (rows ?? []).filter((s) => reportsFor(s.role).length > 0);
  if (!staff.length) return Response.json({ staff: [], subs: [] });

  const { data: subs } = await db().from('submissions').select('staff_id, template, period, answers, submitted_at')
    .in('staff_id', staff.map((s) => s.id)).in('period', periods);
  return Response.json({ staff, subs: subs ?? [] });
}
