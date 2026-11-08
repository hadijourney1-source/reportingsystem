'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export type Me = { id: string; name: string; role: string; pin?: string };

const KEY = 'staff-me';

export const saveMe = (me: Me) => localStorage.setItem(KEY, JSON.stringify(me));
export const clearMe = () => localStorage.removeItem(KEY);

// The person chosen on this device, or sends you back to the name list.
export function useMe(): Me | null {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return setMe(JSON.parse(raw) as Me);
    } catch {}
    router.replace('/');
  }, [router]);

  return me;
}
