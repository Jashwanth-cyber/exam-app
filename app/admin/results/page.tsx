'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/auth';
import Navbar from '@/components/shared/Navbar';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface EnrichedResult {
  id: string;
  examTitle: string;
  studentName: string;
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  submittedAt: string;
  timeTaken: number;
  autoSubmitted: boolean;
  subjectScores: Record<string, { scored: number; total: number }>;
}

export default function AdminResultsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [results, setResults] = useState<EnrichedResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const session = getSession();
    if (!session || session.role !== 'admin') { router.push('/login'); return; }
    setUser(session);
    fetch('/api/admin/results').then(r => r.json()).then(d => { setResults(d.results || []); setLoading(false); });
  }, [router]);

  const filtered = filter === 'all' ? results : results.filter(r => filter === 'pass' ? r.passed : !r.passed);
  const passRate = results.length ? Math.round(results.filter(r => r.passed).length / results.length * 100) : 0;
  const avgScore = results.length ? Math.round(results.reduce((s, r) => s + r.percentage, 0) / results.length) : 0;

  // Chart data
  const examPerf = Object.values(
    results.reduce((acc, r) => {
      if (!acc[r.examTitle]) acc[r.examTitle] = { name: r.examTitle.slice(0, 15), avg: 0, count: 0, total: 0 };
      acc[r.examTitle].total += r.percentage;
      acc[r.examTitle].count++;
      acc[r.examTitle].avg = Math.round(acc[r.examTitle].total / acc[r.examTitle].count);
      return acc;
    }, {} as Record<string, { name: string; avg: number; count: number; total: number }>)
  );

  const pieData = [
    { name: 'Passed', value: results.filter(r => r.passed).length, color: '#10b981' },
    { name: 'Failed', value: results.filter(r => !r.passed).length, color: '#ef4444' },
  ];

  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar user={user} />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 28, fontWeight: 700, margin: '0 0 8px' }}>Exam Results</h1>
        <p style={{ color: 'var(--muted)', marginBottom: 32, fontSize: 14 }}>Overview of all student performance</p>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'Total Attempts', value: results.length, icon: '📝', color: 'var(--accent)' },
            { label: 'Pass Rate', value: `${passRate}%`, icon: '✅', color: 'var(--success)' },
            { label: 'Avg Score', value: `${avgScore}%`, icon: '📊', color: 'var(--accent2)' },
            { label: 'Auto-Submitted', value: results.filter(r => r.autoSubmitted).length, icon: '⚠️', color: 'var(--warning)' },
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

        {/* Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 32 }}>
          <div className="card fade-in" style={{ animationDelay: '0.2s' }}>
            <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, margin: '0 0 20px', fontSize: 16 }}>Average Score by Exam</h3>
            {examPerf.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={examPerf}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: '#131929', border: '1px solid #1e2d4a', borderRadius: 8 }} />
                  <Bar dataKey="avg" fill="url(#barGrad)" radius={[4, 4, 0, 0]} />
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            ) : <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>No data yet</div>}
          </div>
          <div className="card fade-in" style={{ animationDelay: '0.25s' }}>
            <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, margin: '0 0 20px', fontSize: 16 }}>Pass vs Fail</h3>
            {results.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value">
                      {pieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#131929', border: '1px solid #1e2d4a', borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', gap: 20, marginTop: 8 }}>
                  {pieData.map(d => (
                    <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: d.color }} />
                      <span style={{ fontSize: 13, color: 'var(--muted)' }}>{d.name} ({d.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>No data yet</div>}
          </div>
        </div>

        {/* Results Table */}
        <div className="card fade-in" style={{ animationDelay: '0.3s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, margin: 0, fontSize: 16 }}>All Submissions</h3>
            <div style={{ display: 'flex', gap: 6 }}>
              {['all', 'pass', 'fail'].map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  padding: '5px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                  background: filter === f ? 'var(--accent)' : 'var(--card2)', color: filter === f ? '#fff' : 'var(--muted)',
                }}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
              ))}
            </div>
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>No results found</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Student', 'Exam', 'Score', 'Percentage', 'Status', 'Time', 'Submitted'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 12, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid rgba(30,45,74,0.5)', transition: 'background 0.2s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--card2)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td style={{ padding: '12px', fontSize: 14, fontWeight: 500 }}>{r.studentName}</td>
                      <td style={{ padding: '12px', fontSize: 13, color: 'var(--muted)' }}>{r.examTitle}</td>
                      <td style={{ padding: '12px', fontSize: 14 }}>{r.score}/{r.totalMarks}</td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 60, height: 6, background: 'var(--card2)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ width: `${r.percentage}%`, height: '100%', background: r.percentage >= 50 ? 'var(--success)' : 'var(--danger)', borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: 13 }}>{r.percentage}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span className={r.passed ? 'badge-pass' : 'badge-fail'}>{r.passed ? 'Passed' : 'Failed'}</span>
                        {r.autoSubmitted && <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--warning)' }}>⚠️ Auto</span>}
                      </td>
                      <td style={{ padding: '12px', fontSize: 13, color: 'var(--muted)' }}>{Math.floor(r.timeTaken / 60)}m {r.timeTaken % 60}s</td>
                      <td style={{ padding: '12px', fontSize: 13, color: 'var(--muted)' }}>{new Date(r.submittedAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
