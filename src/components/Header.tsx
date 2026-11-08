'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { clearMe, type Me } from '@/lib/useMe';

const READERS = ['director', 'head_of_school'];

export function Header({ me }: { me: Me }) {
  const router = useRouter();
  const links = [
    ...(me.role !== 'director' ? [{ href: '/report', label: 'My report' }] : []),
    ...(READERS.includes(me.role) ? [{ href: '/team', label: 'Team' }] : []),
  ];

  function switchPerson() {
    clearMe();
    router.replace('/');
  }

  return (
    <header className="bg-brand-dark shadow-sm">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
        <nav className="flex gap-4">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="py-2 text-base font-medium text-white/90 hover:text-white">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3 text-sm text-white/80">
          <span className="hidden sm:inline">{me.name}</span>
          <Link href="/pin" className="py-2 underline-offset-2 hover:underline">PIN</Link>
          <button onClick={switchPerson} className="min-h-11 rounded border border-white/40 px-3 text-white">
            Not you?
          </button>
        </div>
      </div>
    </header>
  );
}
