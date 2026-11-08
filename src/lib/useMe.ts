'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { NO_PIN_ROLES } from './templates';

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
      if (raw) {
        const saved = JSON.parse(raw) as Me;
        if (saved.pin || NO_PIN_ROLES.includes(saved.role)) return setMe(saved);
        clearMe();
      }
    } catch {}
    router.replace('/');
  }, [router]);

  return me;
}
