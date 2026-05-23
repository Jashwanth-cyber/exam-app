'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/auth';
import Navbar from '@/components/shared/Navbar';

interface StudentRow {
  id: string;
  name: string;
  email: string;
  attempts: number;
  avgScore: number;
  passed: number;
  lastActive: string | null;
}

export default function AdminStudentsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = getSession();
    if (!session || session.role !== 'admin') { router.push('/login'); return; }
    setUser(session);

    Promise.all([
      fetch('/api/admin/users').then(r => r.json()),
      fetch('/api/admin/results').then(r => r.json()),
    ]).then(([usersData, resultsData]) => {
      const allUsers = (usersData.users || []).filter((u: { role: string }) => u.role === 'student');
      const results = resultsData.results || [];

      const rows: StudentRow[] = allUsers.map((u: { id: string; name: string; email: string }) => {
        const userResults = results.filter((r: { studentId: string }) => r.studentId === u.id);
        const attempts = userResults.length;
        const avgScore = attempts
          ? Math.round(userResults.reduce((s: number, r: { percentage: number }) => s + r.percentage, 0) / attempts)
          : 0;
        const passed = userResults.filter((r: { passed: boolean }) => r.passed).length;
        const lastActive = attempts
          ? userResults.sort((a: { submittedAt: string }, b: { submittedAt: string }) =>
              new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())[0].submittedAt
          : null;
        return { id: u.id, name: u.name, email: u.email, attempts, avgScore, passed, lastActive };
      });

      setStudents(rows);
      setLoading(false);
    });
  }, [router]);

  if (!user) return null;

  const totalAttempts = students.reduce((s, r) => s + r.attempts, 0);
  const activeStudents = students.filter(s => s.attempts > 0).length;

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar user={user} />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 28, fontWeight: 700, margin: '0 0 8px' }}>Students</h1>
        <p style={{ color: 'var(--muted)', marginBottom: 32, fontSize: 14 }}>All registered students and their activity</p>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'Total Students', value: students.length, icon: '👩‍🎓', color: 'var(--accent)' },
            { label: 'Active (Attempted)', value: activeStudents, icon: '✅', color: 'var(--success)' },
            { label: 'Total Attempts', value: totalAttempts, icon: '📝', color: 'var(--accent2)' },
          ].map((s, i) => (
            <div key={s.label} className="card fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'Space Grotesk', color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>{s.label}</div>
                </div>
                <span style={{ fontSize: 28 }}>{s.icon}</span>
              </div>
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 80, color: 'var(--muted)' }}>Loading students...</div>
        ) : students.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>👩‍🎓</div>
            <h3 style={{ fontFamily: 'Space Grotesk', margin: 0 }}>No students registered</h3>
            <p style={{ color: 'var(--muted)', marginTop: 8 }}>Students who register will appear here</p>
          </div>
        ) : (
          <div className="card">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Student', 'Email', 'Attempts', 'Avg Score', 'Passed', 'Pass Rate', 'Last Active'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 12, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map(s => {
                  const passRate = s.attempts > 0 ? Math.round(s.passed / s.attempts * 100) : 0;
                  return (
                    <tr key={s.id} style={{ borderBottom: '1px solid rgba(30,45,74,0.5)', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--card2)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td style={{ padding: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                            background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, fontSize: 14, color: '#fff',
                          }}>{s.name[0].toUpperCase()}</div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</div>
                        </div>
                      </td>
                      <td style={{ padding: '14px', fontSize: 13, color: 'var(--muted)' }}>{s.email}</td>
                      <td style={{ padding: '14px', fontWeight: 600 }}>{s.attempts}</td>
                      <td style={{ padding: '14px' }}>
                        {s.attempts > 0 ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 60, height: 6, background: 'var(--card2)', borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ width: `${s.avgScore}%`, height: '100%', background: s.avgScore >= 50 ? 'var(--success)' : 'var(--danger)', borderRadius: 3 }} />
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 600 }}>{s.avgScore}%</span>
                          </div>
                        ) : <span style={{ color: 'var(--muted)', fontSize: 13 }}>—</span>}
                      </td>
                      <td style={{ padding: '14px', color: 'var(--success)', fontWeight: 600 }}>{s.passed}</td>
                      <td style={{ padding: '14px' }}>
                        {s.attempts > 0 ? (
                          <span style={{
                            fontSize: 12, fontWeight: 700, padding: '2px 10px', borderRadius: 20,
                            background: passRate >= 50 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                            color: passRate >= 50 ? 'var(--success)' : 'var(--danger)',
                          }}>{passRate}%</span>
                        ) : <span style={{ color: 'var(--muted)', fontSize: 13 }}>—</span>}
                      </td>
                      <td style={{ padding: '14px', fontSize: 13, color: 'var(--muted)' }}>
                        {s.lastActive
                          ? new Date(s.lastActive).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                          : 'Never'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
