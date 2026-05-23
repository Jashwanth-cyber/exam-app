'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/auth';

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    const session = getSession();
    if (session) {
      router.push(session.role === 'admin' ? '/admin/exams' : '/student/dashboard');
    } else {
      router.push('/login');
    }
  }, [router]);
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div style={{ color: 'var(--muted)' }}>Loading...</div>
    </div>
  );
}
