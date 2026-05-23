'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import Navbar from '@/components/shared/Navbar';
import { Exam } from '@/types';

export default function AdminExamsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = getSession();
    if (!session || session.role !== 'admin') { router.push('/login'); return; }
    setUser(session);
    fetchExams();
  }, [router]);

  async function fetchExams() {
    const res = await fetch('/api/admin/exams');
    const data = await res.json();
    setExams(data.exams || []);
    setLoading(false);
  }

  async function toggleExam(id: string, isActive: boolean) {
    await fetch(`/api/admin/exams/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !isActive }),
    });
    fetchExams();
  }

  async function deleteExam(id: string) {
    if (!confirm('Delete this exam?')) return;
    await fetch(`/api/admin/exams/${id}`, { method: 'DELETE' });
    fetchExams();
  }

  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar user={user} />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 28, fontWeight: 700, margin: 0 }}>Manage Exams</h1>
            <p style={{ color: 'var(--muted)', marginTop: 6, fontSize: 14 }}>{exams.length} exam{exams.length !== 1 ? 's' : ''} total</p>
          </div>
          <Link href="/admin/create-exam" className="btn-primary" style={{ textDecoration: 'none', padding: '10px 20px', borderRadius: 8, background: 'linear-gradient(135deg,var(--accent),var(--accent2))', color: '#fff', fontWeight: 600, fontSize: 14 }}>
            + Create Exam
          </Link>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 80, color: 'var(--muted)' }}>Loading exams...</div>
        ) : exams.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 80 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
            <h3 style={{ fontFamily: 'Space Grotesk', margin: 0 }}>No exams yet</h3>
            <p style={{ color: 'var(--muted)', marginTop: 8 }}>Create your first exam to get started</p>
            <Link href="/admin/create-exam" className="btn-primary" style={{ display: 'inline-block', marginTop: 20, textDecoration: 'none' }}>Create Exam</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            {exams.map((exam, i) => (
              <div key={exam.id} className="card fade-in" style={{ animationDelay: `${i * 0.05}s`, display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 12, flexShrink: 0,
                  background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                }}>📚</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 16, margin: 0 }}>{exam.title}</h3>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, textTransform: 'uppercase',
                      background: exam.isActive ? 'rgba(16,185,129,0.15)' : 'rgba(100,116,139,0.15)',
                      color: exam.isActive ? 'var(--success)' : 'var(--muted)',
                      border: `1px solid ${exam.isActive ? 'rgba(16,185,129,0.3)' : 'rgba(100,116,139,0.3)'}`,
                    }}>{exam.isActive ? 'Active' : 'Inactive'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 20, marginTop: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, color: 'var(--muted)' }}>📂 {exam.subject}</span>
                    <span style={{ fontSize: 13, color: 'var(--muted)' }}>❓ {exam.questions.length} questions</span>
                    <span style={{ fontSize: 13, color: 'var(--muted)' }}>⏱️ {exam.timeLimit} min</span>
                    <span style={{ fontSize: 13, color: 'var(--muted)' }}>🏆 {exam.totalMarks} marks</span>
                    <span style={{ fontSize: 13, color: 'var(--muted)' }}>✅ Pass: {exam.passingMarks}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <Link href={`/admin/exams/${exam.id}/edit`} className="btn-ghost" style={{ fontSize: 12, padding: '6px 12px', textDecoration: 'none' }}>
                    ✏️ Edit
                  </Link>
                  <button onClick={() => toggleExam(exam.id, exam.isActive)} className="btn-ghost" style={{ fontSize: 12, padding: '6px 12px' }}>
                    {exam.isActive ? '⏸ Deactivate' : '▶ Activate'}
                  </button>
                  <button onClick={() => deleteExam(exam.id)} className="btn-danger" style={{ fontSize: 12, padding: '6px 12px' }}>
                    🗑 Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
