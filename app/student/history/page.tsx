'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import Navbar from '@/components/shared/Navbar';

interface EnrichedResult {
  id: string;
  examTitle: string;
  examSubject: string;
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  submittedAt: string;
  timeTaken: number;
  autoSubmitted: boolean;
  subjectScores: Record<string, { scored: number; total: number }>;
}

export default function HistoryPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; name: string; role: string } | null>(null);
  const [results, setResults] = useState<EnrichedResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const session = getSession();
    if (!session || session.role !== 'student') { router.push('/login'); return; }
    const u = session as { id: string; name: string; role: string };
    setUser(u);
    fetch(`/api/student/results?studentId=${u.id}`).then(r => r.json()).then(d => { setResults(d.results || []); setLoading(false); });
  }, [router]);

  const sorted = [...results].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  const totalPassed = results.filter(r => r.passed).length;
  const avgScore = results.length ? Math.round(results.reduce((s, r) => s + r.percentage, 0) / results.length) : 0;
  const bestScore = results.length ? Math.max(...results.map(r => r.percentage)) : 0;

  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar user={user} />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
        <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 28, fontWeight: 700, margin: '0 0 8px' }}>Exam History</h1>
        <p style={{ color: 'var(--muted)', marginBottom: 32, fontSize: 14 }}>All your past exam attempts</p>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'Total Exams', value: results.length, icon: '📝' },
            { label: 'Passed', value: totalPassed, icon: '✅', color: 'var(--success)' },
            { label: 'Avg Score', value: `${avgScore}%`, icon: '📊', color: 'var(--accent)' },
            { label: 'Best Score', value: `${bestScore}%`, icon: '🏆', color: 'var(--warning)' },
          ].map((s, i) => (
            <div key={s.label} className="card fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'Space Grotesk', color: s.color || 'var(--text)' }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 80, color: 'var(--muted)' }}>Loading history...</div>
        ) : sorted.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 80 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🗂️</div>
            <h3 style={{ fontFamily: 'Space Grotesk', margin: 0 }}>No exam history</h3>
            <p style={{ color: 'var(--muted)', marginTop: 8 }}>Your completed exams will appear here</p>
            <Link href="/student/dashboard" className="btn-primary" style={{ display: 'inline-block', marginTop: 20, textDecoration: 'none' }}>Take an Exam</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {sorted.map((r, i) => (
              <div key={r.id} className="card fade-in" style={{ animationDelay: `${i * 0.04}s`, padding: 0, overflow: 'hidden' }}>
                <div
                  onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                  style={{ padding: '18px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{
                    width: 50, height: 50, borderRadius: '50%', flexShrink: 0,
                    border: `3px solid ${r.passed ? 'var(--success)' : 'var(--danger)'}`,
                    background: `${r.passed ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 14, color: r.passed ? 'var(--success)' : 'var(--danger)',
                  }}>{r.percentage}%</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{r.examTitle}</div>
                    <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
                      {r.examSubject} · {new Date(r.submittedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                  </div>
                  <div style={{ display: 'flex', align: 'center', gap: 10, flexShrink: 0 }}>
                    <div style={{ textAlign: 'right', marginRight: 8 }}>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>{r.score}/{r.totalMarks}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>marks</div>
                    </div>
                    <span className={r.passed ? 'badge-pass' : 'badge-fail'}>{r.passed ? 'Pass' : 'Fail'}</span>
                    <span style={{ color: 'var(--muted)', fontSize: 18, marginLeft: 4 }}>{expanded === r.id ? '▲' : '▼'}</span>
                  </div>
                </div>

                {expanded === r.id && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: '18px 20px', background: 'var(--card2)', animation: 'fadeIn 0.2s ease' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
                      <div>
                        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Time Taken</div>
                        <div style={{ fontWeight: 600 }}>{Math.floor(r.timeTaken / 60)}m {r.timeTaken % 60}s</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Submission</div>
                        <div style={{ fontWeight: 600 }}>{r.autoSubmitted ? '⚠️ Auto-submitted' : '✅ Manual'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Result</div>
                        <div style={{ fontWeight: 600, color: r.passed ? 'var(--success)' : 'var(--danger)' }}>
                          {r.passed ? 'Passed ✓' : 'Failed ✗'}
                        </div>
                      </div>
                    </div>
                    {Object.keys(r.subjectScores).length > 0 && (
                      <>
                        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 10, fontWeight: 600 }}>Subject Scores</div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {Object.entries(r.subjectScores).map(([subj, s]) => {
                            const pct = Math.round(s.scored / s.total * 100);
                            return (
                              <div key={subj} style={{
                                background: 'var(--card)', border: `1px solid ${pct >= 50 ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                                borderRadius: 8, padding: '8px 14px',
                              }}>
                                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{subj}</div>
                                <div style={{ fontWeight: 700, color: pct >= 50 ? 'var(--success)' : 'var(--danger)' }}>{pct}%</div>
                                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{s.scored}/{s.total}</div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
