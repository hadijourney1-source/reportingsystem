import { createClient } from '@supabase/supabase-js';

// Server-only. The service key never reaches the browser.
export const db = () =>
  createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });

export const READER_ROLES = ['director', 'head_of_school'];
export const isDate = (s: unknown): s is string => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
export const isId = (s: unknown): s is string =>
  typeof s === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

export type StaffRow = { id: string; name: string; role: string; reports_to: string | null; pin: string | null };

export async function findStaff(id: unknown): Promise<StaffRow | null> {
  if (!isId(id)) return null;
  const { data } = await db().from('staff').select('id, name, role, reports_to, pin').eq('id', id).maybeSingle();
  return (data as StaffRow) ?? null;
}

// Readers (director, head of school) must give their PIN; everyone else just picks their name.
export function pinOk(staff: StaffRow, pin: unknown): boolean {
  if (!READER_ROLES.includes(staff.role)) return true;
  return !!staff.pin && typeof pin === 'string' && pin === staff.pin;
}
