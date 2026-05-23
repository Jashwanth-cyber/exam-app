'use client';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { clearSession } from '@/lib/auth';

interface NavProps {
  user: { name: string; role: string };
}

const adminLinks = [
  { href: '/admin/exams', label: 'Exams', icon: '📋' },
  { href: '/admin/create-exam', label: 'Create Exam', icon: '➕' },
  { href: '/admin/results', label: 'Results', icon: '📊' },
  { href: '/admin/students', label: 'Students', icon: '👩‍🎓' },
];

const studentLinks = [
  { href: '/student/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/student/results', label: 'My Results', icon: '📈' },
  { href: '/student/history', label: 'History', icon: '🗂️' },
];

export default function Navbar({ user }: NavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const links = user.role === 'admin' ? adminLinks : studentLinks;

  function handleLogout() {
    clearSession();
    router.push('/login');
  }

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(10,14,26,0.92)', backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', height: 60,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>📝</span>
          <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 18, color: 'var(--text)' }}>ExamPro</span>
        </Link>
        <div style={{ display: 'flex', gap: 4 }}>
          {links.map(link => (
            <Link key={link.href} href={link.href} style={{
              textDecoration: 'none', padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: 6,
              background: pathname === link.href ? 'rgba(59,130,246,0.15)' : 'transparent',
              color: pathname === link.href ? 'var(--accent)' : 'var(--muted)',
              border: pathname === link.href ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
              transition: 'all 0.2s',
            }}>
              <span>{link.icon}</span> {link.label}
            </Link>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{user.name}</div>
          <div style={{ fontSize: 11, color: user.role === 'admin' ? 'var(--accent2)' : 'var(--success)', fontWeight: 600, textTransform: 'uppercase' }}>{user.role}</div>
        </div>
        <button onClick={handleLogout} className="btn-ghost" style={{ padding: '6px 14px', fontSize: 13 }}>Sign Out</button>
      </div>
    </nav>
  );
}
