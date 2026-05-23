'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import Navbar from '@/components/shared/Navbar';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';

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

function ResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resultId = searchParams.get('resultId');
  const [user, setUser] = useState<{ id: string; name: string; role: string } | null>(null);
  const [results, setResults] = useState<EnrichedResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [highlighted, setHighlighted] = useState<EnrichedResult | null>(null);

  useEffect(() => {
    const session = getSession();
    if (!session || session.role !== 'student') { router.push('/login'); return; }
    const u = session as { id: string; name: string; role: string };
    setUser(u);
    fetch(`/api/student/results?studentId=${u.id}`).then(r => r.json()).then(d => {
      const r = d.results || [];
      setResults(r);
      if (resultId) setHighlighted(r.find((x: EnrichedResult) => x.id === resultId) || null);
      setLoading(false);
    });
  }, [router, resultId]);

  // Weak subjects: percentage < 50
  const allSubjects = results.flatMap(r =>
    Object.entries(r.subjectScores).map(([subj, s]) => ({ subject: subj, pct: Math.round(s.scored / s.total * 100) }))
  );
  const subjectMap: Record<string, number[]> = {};
  allSubjects.forEach(({ subject, pct }) => { if (!subjectMap[subject]) subjectMap[subject] = []; subjectMap[subject].push(pct); });
  const subjectAvgs = Object.entries(subjectMap).map(([subject, pcts]) => ({
    subject, avg: Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length),
  }));
  const weakSubjects = subjectAvgs.filter(s => s.avg < 50);

  // Performance over time
  const perfData = [...results].sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime())
    .map(r => ({ name: r.examTitle.slice(0, 12), score: r.percentage, date: new Date(r.submittedAt).toLocaleDateString() }));

  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar user={user} />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 28, fontWeight: 700, margin: '0 0 8px' }}>My Results</h1>
        <p style={{ color: 'var(--muted)', marginBottom: 32, fontSize: 14 }}>Track your performance over time</p>

        {/* Latest result highlight */}
        {highlighted && (
          <div className="card fade-in" style={{
            marginBottom: 32, padding: '28px',
            background: highlighted.passed
              ? 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(5,150,105,0.08))'
              : 'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(185,28,28,0.08))',
            borderColor: highlighted.passed ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: 8 }}>Latest Result</div>
                <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 22, fontWeight: 700, margin: '0 0 8px' }}>{highlighted.examTitle}</h2>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <span className={highlighted.passed ? 'badge-pass' : 'badge-fail'} style={{ fontSize: 13 }}>
                    {highlighted.passed ? '🎉 Passed!' : '❌ Failed'}
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--muted)' }}>⏱ {Math.floor(highlighted.timeTaken / 60)}m {highlighted.timeTaken % 60}s</span>
                  {highlighted.autoSubmitted && <span style={{ fontSize: 13, color: 'var(--warning)' }}>⚠️ Auto-submitted</span>}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: 90, height: 90, borderRadius: '50%',
                  border: `5px solid ${highlighted.passed ? 'var(--success)' : 'var(--danger)'}`,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{ fontSize: 22, fontWeight: 700 }}>{highlighted.percentage}%</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{highlighted.score}/{highlighted.totalMarks}</div>
                </div>
              </div>
            </div>
            {Object.keys(highlighted.subjectScores).length > 0 && (
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 10, fontWeight: 600 }}>Subject Breakdown</div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {Object.entries(highlighted.subjectScores).map(([subj, s]) => {
                    const pct = Math.round(s.scored / s.total * 100);
                    return (
                      <div key={subj} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: '8px 14px', minWidth: 100 }}>
                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>{subj}</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: pct >= 50 ? 'var(--success)' : 'var(--danger)' }}>{pct}%</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>{s.scored}/{s.total}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 80, color: 'var(--muted)' }}>Loading...</div>
        ) : results.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 80 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
            <h3 style={{ fontFamily: 'Space Grotesk', margin: 0 }}>No results yet</h3>
            <p style={{ color: 'var(--muted)', marginTop: 8 }}>Take your first exam to see results here</p>
            <Link href="/student/dashboard" className="btn-primary" style={{ display: 'inline-block', marginTop: 20, textDecoration: 'none' }}>Browse Exams</Link>
          </div>
        ) : (
          <>
            {/* Charts Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 32 }}>
              <div className="card fade-in">
                <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, margin: '0 0 20px', fontSize: 16 }}>📈 Score Trend</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={perfData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ background: '#131929', border: '1px solid #1e2d4a', borderRadius: 8, fontSize: 13 }}
                      formatter={(val) => [`${val}%`, 'Score']}
                    />
                    <Line type="monotone" dataKey="score" stroke="var(--accent)" strokeWidth={2.5} dot={{ fill: 'var(--accent)', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="card fade-in" style={{ animationDelay: '0.1s' }}>
                <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, margin: '0 0 20px', fontSize: 16 }}>🎯 Subject Performance</h3>
                {subjectAvgs.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <RadarChart data={subjectAvgs}>
                      <PolarGrid stroke="rgba(255,255,255,0.08)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11 }} />
                      <Radar name="Score" dataKey="avg" stroke="var(--accent2)" fill="var(--accent2)" fillOpacity={0.25} />
                      <Tooltip contentStyle={{ background: '#131929', border: '1px solid #1e2d4a', borderRadius: 8 }} />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>No data</div>}
              </div>
            </div>

            {/* Weak Subjects */}
            {weakSubjects.length > 0 && (
              <div className="card fade-in" style={{ marginBottom: 32, animationDelay: '0.15s', borderColor: 'rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.05)' }}>
                <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, margin: '0 0 16px', fontSize: 16, color: 'var(--warning)' }}>
                  ⚡ Weak Areas (Below 50%)
                </h3>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {weakSubjects.map(s => (
                    <div key={s.subject} style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, padding: '10px 16px' }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{s.subject}</div>
                      <div style={{ color: 'var(--danger)', fontWeight: 700 }}>{s.avg}% avg</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>Needs improvement</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All Results Table */}
            <div className="card fade-in" style={{ animationDelay: '0.2s' }}>
              <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, margin: '0 0 20px', fontSize: 16 }}>📋 All Attempts</h3>
              <div style={{ display: 'grid', gap: 10 }}>
                {[...results].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()).map(r => (
                  <div key={r.id} style={{
                    background: 'var(--card2)', borderRadius: 10, padding: '16px 20px',
                    display: 'flex', alignItems: 'center', gap: 16,
                    border: r.id === resultId ? '1px solid var(--accent)' : '1px solid transparent',
                  }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
                      border: `3px solid ${r.passed ? 'var(--success)' : 'var(--danger)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: 14, color: r.passed ? 'var(--success)' : 'var(--danger)',
                    }}>{r.percentage}%</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>{r.examTitle}</div>
                      <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 3 }}>
                        {r.score}/{r.totalMarks} marks · {new Date(r.submittedAt).toLocaleDateString()} · {Math.floor(r.timeTaken / 60)}m {r.timeTaken % 60}s
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {r.autoSubmitted && <span style={{ fontSize: 11, color: 'var(--warning)', background: 'rgba(245,158,11,0.15)', padding: '2px 8px', borderRadius: 20 }}>Auto</span>}
                      <span className={r.passed ? 'badge-pass' : 'badge-fail'}>{r.passed ? 'Passed' : 'Failed'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function StudentResultsPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--muted)' }}>Loading...</div>}>
      <ResultsContent />
    </Suspense>
  );
}
