'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import Navbar from '@/components/shared/Navbar';
import { Exam } from '@/types';

export default function StudentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; name: string; role: string } | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = getSession();
    if (!session || session.role !== 'student') { router.push('/login'); return; }
    setUser(session as { id: string; name: string; role: string });
    fetch('/api/student/exams').then(r => r.json()).then(d => { setExams(d.exams || []); setLoading(false); });
  }, [router]);

  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar user={user} />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        {/* Hero */}
        <div className="card fade-in" style={{
          marginBottom: 32, padding: '32px',
          background: 'linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(99,102,241,0.12) 100%)',
          borderColor: 'rgba(99,102,241,0.2)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', right: 24, top: -20, fontSize: 100, opacity: 0.06 }}>🎓</div>
          <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 26, fontWeight: 700, margin: 0 }}>
            Welcome back, {user.name}! 👋
          </h1>
          <p style={{ color: 'var(--muted)', marginTop: 8, marginBottom: 20 }}>
            Ready to test your knowledge? Choose an exam below.
          </p>
          <div style={{ display: 'flex', gap: 20 }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent)' }}>{exams.length}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>Available Exams</div>
            </div>
            <div style={{ width: 1, background: 'var(--border)' }} />
            <Link href="/student/results" style={{ textDecoration: 'none' }}>
              <div style={{ cursor: 'pointer' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--success)' }}>📈</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>View My Results</div>
              </div>
            </Link>
          </div>
        </div>

        {/* Exams Grid */}
        <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 20, margin: '0 0 16px' }}>Available Exams</h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 80, color: 'var(--muted)' }}>Loading exams...</div>
        ) : exams.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
            <h3 style={{ fontFamily: 'Space Grotesk', margin: 0 }}>No exams available</h3>
            <p style={{ color: 'var(--muted)', marginTop: 8 }}>Check back later for new exams</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
            {exams.map((exam, i) => (
              <div key={exam.id} className="card fade-in" style={{
                animationDelay: `${i * 0.08}s`,
                transition: 'all 0.3s',
                cursor: 'pointer',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(59,130,246,0.5)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 10,
                    background: `hsl(${(i * 60) % 360}, 60%, 30%)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                  }}>📚</div>
                  <span style={{ fontSize: 12, color: 'var(--muted)', background: 'var(--card2)', padding: '3px 10px', borderRadius: 20 }}>
                    {exam.subject}
                  </span>
                </div>
                <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 16, margin: '0 0 6px' }}>{exam.title}</h3>
                <p style={{ color: 'var(--muted)', fontSize: 13, margin: '0 0 16px', lineClamp: 2 }}>{exam.description}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 20 }}>
                  {[
                    { icon: '❓', val: exam.questions.length, label: 'Questions' },
                    { icon: '⏱️', val: `${exam.timeLimit}m`, label: 'Duration' },
                    { icon: '🏆', val: exam.totalMarks, label: 'Marks' },
                  ].map(s => (
                    <div key={s.label} style={{ background: 'var(--card2)', borderRadius: 8, padding: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: 12 }}>{s.icon}</div>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>{s.val}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                <Link href={`/student/exam?id=${exam.id}`} style={{ textDecoration: 'none' }}>
                  <button className="btn-primary" style={{ width: '100%', padding: '10px' }}>Start Exam →</button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
