'use client';
import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/auth';
import Navbar from '@/components/shared/Navbar';
import { Question, Option, Exam } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const EMPTY_OPTION = (): Option => ({ id: uuidv4().slice(0, 4), text: '' });
const EMPTY_QUESTION = (): Question => ({
  id: uuidv4(),
  text: '',
  subject: '',
  marks: 5,
  options: [EMPTY_OPTION(), EMPTY_OPTION(), EMPTY_OPTION(), EMPTY_OPTION()],
  correctOptionId: '',
});

export default function EditExamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; name: string; role: string } | null>(null);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [timeLimit, setTimeLimit] = useState(30);
  const [passingPercent, setPassingPercent] = useState(50);
  const [questions, setQuestions] = useState<Question[]>([EMPTY_QUESTION()]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const session = getSession();
    if (!session || session.role !== 'admin') { router.push('/login'); return; }
    setUser(session as { id: string; name: string; role: string });
    fetch(`/api/admin/exams/${id}`).then(r => r.json()).then(d => {
      const exam: Exam = d.exam;
      if (!exam) { router.push('/admin/exams'); return; }
      setTitle(exam.title);
      setSubject(exam.subject);
      setDescription(exam.description);
      setTimeLimit(exam.timeLimit);
      setPassingPercent(Math.round(exam.passingMarks / exam.totalMarks * 100));
      setQuestions(exam.questions);
      setLoading(false);
    });
  }, [id, router]);

  function addQuestion() { setQuestions(q => [...q, EMPTY_QUESTION()]); }
  function removeQuestion(idx: number) { setQuestions(q => q.filter((_, i) => i !== idx)); }
  function updateQuestion(idx: number, field: string, value: string | number) {
    setQuestions(q => q.map((question, i) => i === idx ? { ...question, [field]: value } : question));
  }
  function updateOption(qIdx: number, oIdx: number, text: string) {
    setQuestions(q => q.map((question, i) => {
      if (i !== qIdx) return question;
      return { ...question, options: question.options.map((o, oi) => oi === oIdx ? { ...o, text } : o) };
    }));
  }
  function setCorrect(qIdx: number, optId: string) {
    setQuestions(q => q.map((question, i) => i === qIdx ? { ...question, correctOptionId: optId } : question));
  }

  async function handlePdfUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('pdf', file);
    const res = await fetch('/api/admin/upload-pdf', { method: 'POST', body: formData });
    const data = await res.json();
    if (data.questions?.length > 0) setQuestions(prev => [...prev, ...data.questions]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const validQs = questions.filter(q => q.text && q.correctOptionId && q.options.every(o => o.text));
    if (validQs.length === 0) { setError('Add at least one complete question'); return; }
    setSaving(true);
    const totalMarks = validQs.reduce((s, q) => s + q.marks, 0);
    const res = await fetch(`/api/admin/exams/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title, subject, description, timeLimit,
        passingMarks: Math.floor(totalMarks * passingPercent / 100),
        questions: validQs, totalMarks,
      }),
    });
    setSaving(false);
    if (res.ok) router.push('/admin/exams');
    else setError('Failed to update exam');
  }

  if (!user || loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--muted)' }}>Loading...</div>;

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar user={user} />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          <button className="btn-ghost" onClick={() => router.push('/admin/exams')} style={{ padding: '8px 14px', fontSize: 13 }}>← Back</button>
          <div>
            <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 26, fontWeight: 700, margin: 0 }}>Edit Exam</h1>
            <p style={{ color: 'var(--muted)', marginTop: 4, fontSize: 13 }}>Update exam details and questions</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Exam Details */}
          <div className="card fade-in" style={{ marginBottom: 24 }}>
            <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 18, margin: '0 0 20px' }}>📋 Exam Details</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Exam Title *</label>
                <input className="input-field" value={title} onChange={e => setTitle(e.target.value)} required />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Subject *</label>
                <input className="input-field" value={subject} onChange={e => setSubject(e.target.value)} required />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Description</label>
                <textarea className="input-field" value={description} onChange={e => setDescription(e.target.value)} rows={2} style={{ resize: 'vertical' }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>⏱ Time Limit (minutes)</label>
                <input className="input-field" type="number" min={5} max={300} value={timeLimit} onChange={e => setTimeLimit(Number(e.target.value))} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>✅ Passing Percentage (%)</label>
                <input className="input-field" type="number" min={0} max={100} value={passingPercent} onChange={e => setPassingPercent(Number(e.target.value))} />
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="card fade-in" style={{ marginBottom: 24, animationDelay: '0.05s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 18, margin: 0 }}>❓ Questions ({questions.length})</h2>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => fileRef.current?.click()} className="btn-ghost" style={{ fontSize: 13, padding: '6px 14px' }}>
                  📄 Import PDF
                </button>
                <input ref={fileRef} type="file" accept=".pdf,.txt" onChange={handlePdfUpload} style={{ display: 'none' }} />
              </div>
            </div>
            <div style={{ display: 'grid', gap: 16 }}>
              {questions.map((q, qIdx) => (
                <div key={q.id} style={{ background: 'var(--card2)', borderRadius: 12, padding: 20, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--accent)' }}>Q{qIdx + 1}</span>
                    <button type="button" onClick={() => removeQuestion(qIdx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: 16 }}>✕</button>
                  </div>
                  <input className="input-field" placeholder="Question text..." value={q.text}
                    onChange={e => updateQuestion(qIdx, 'text', e.target.value)}
                    style={{ marginBottom: 12, background: 'var(--card)' }} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                    <div>
                      <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Subject</label>
                      <input className="input-field" placeholder="e.g. JavaScript" value={q.subject}
                        onChange={e => updateQuestion(qIdx, 'subject', e.target.value)}
                        style={{ background: 'var(--card)', fontSize: 13 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Marks</label>
                      <input className="input-field" type="number" min={1} value={q.marks}
                        onChange={e => updateQuestion(qIdx, 'marks', Number(e.target.value))}
                        style={{ background: 'var(--card)', fontSize: 13 }} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {q.options.map((opt, oIdx) => (
                      <div key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input type="radio" name={`correct-${q.id}`} checked={q.correctOptionId === opt.id}
                          onChange={() => setCorrect(qIdx, opt.id)}
                          style={{ accentColor: 'var(--success)', width: 16, height: 16, flexShrink: 0 }} />
                        <input className="input-field" placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                          value={opt.text} onChange={e => updateOption(qIdx, oIdx, e.target.value)}
                          style={{
                            background: q.correctOptionId === opt.id ? 'rgba(16,185,129,0.1)' : 'var(--card)',
                            borderColor: q.correctOptionId === opt.id ? 'rgba(16,185,129,0.4)' : 'var(--border)',
                            fontSize: 13,
                          }} />
                      </div>
                    ))}
                  </div>
                  {!q.correctOptionId && <p style={{ fontSize: 12, color: 'var(--warning)', marginTop: 8, marginBottom: 0 }}>⚠️ Select correct answer (radio button)</p>}
                </div>
              ))}
            </div>
            <button type="button" onClick={addQuestion} className="btn-ghost" style={{ marginTop: 16, width: '100%', padding: '12px', borderStyle: 'dashed' }}>
              + Add Question
            </button>
          </div>

          {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '12px 16px', fontSize: 13, color: 'var(--danger)', marginBottom: 16 }}>{error}</div>}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" className="btn-ghost" onClick={() => router.push('/admin/exams')}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving} style={{ padding: '10px 32px' }}>
              {saving ? 'Saving...' : '💾 Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
