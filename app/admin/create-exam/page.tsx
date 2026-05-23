'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/auth';
import Navbar from '@/components/shared/Navbar';
import { Question, Option } from '@/types';
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

export default function CreateExamPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; name: string; role: string } | null>(null);
  const [tab, setTab] = useState<'manual' | 'pdf'>('manual');
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [timeLimit, setTimeLimit] = useState(30);
  const [passingPercent, setPassingPercent] = useState(50);
  const [questions, setQuestions] = useState<Question[]>([EMPTY_QUESTION()]);
  const [saving, setSaving] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const session = getSession();
    if (!session || session.role !== 'admin') { router.push('/login'); return; }
    setUser(session as { id: string; name: string; role: string });
  }, [router]);

  function addQuestion() {
    setQuestions(q => [...q, EMPTY_QUESTION()]);
  }

  function removeQuestion(idx: number) {
    setQuestions(q => q.filter((_, i) => i !== idx));
  }

  function updateQuestion(idx: number, field: string, value: string | number) {
    setQuestions(q => q.map((question, i) => i === idx ? { ...question, [field]: value } : question));
  }

  function updateOption(qIdx: number, oIdx: number, text: string) {
    setQuestions(q => q.map((question, i) => {
      if (i !== qIdx) return question;
      const opts = question.options.map((o, oi) => oi === oIdx ? { ...o, text } : o);
      return { ...question, options: opts };
    }));
  }

  function setCorrect(qIdx: number, optId: string) {
    setQuestions(q => q.map((question, i) => i === qIdx ? { ...question, correctOptionId: optId } : question));
  }

  async function handlePdfUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfLoading(true);
    const formData = new FormData();
    formData.append('pdf', file);
    try {
      const res = await fetch('/api/admin/upload-pdf', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.questions?.length > 0) {
        setQuestions(data.questions);
        setSuccess(`✅ Imported ${data.questions.length} questions from PDF`);
      } else {
        setError('Could not parse questions from PDF. Please check the format.');
      }
    } catch {
      setError('Failed to process PDF');
    }
    setPdfLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!title || !subject) { setError('Title and subject are required'); return; }
    const validQs = questions.filter(q => q.text && q.correctOptionId && q.options.every(o => o.text));
    if (validQs.length === 0) { setError('Add at least one complete question with all options filled'); return; }

    setSaving(true);
    const totalMarks = validQs.reduce((s, q) => s + q.marks, 0);
    const res = await fetch('/api/admin/exams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title, subject, description, timeLimit,
        passingMarks: Math.floor(totalMarks * passingPercent / 100),
        questions: validQs,
        createdBy: user?.id,
        isActive: true,
      }),
    });
    setSaving(false);
    if (res.ok) { router.push('/admin/exams'); } else { setError('Failed to create exam'); }
  }

  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar user={user} />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 28, fontWeight: 700, margin: 0 }}>Create New Exam</h1>
          <p style={{ color: 'var(--muted)', marginTop: 6, fontSize: 14 }}>Set up exam details and add questions</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Exam Details */}
          <div className="card fade-in" style={{ marginBottom: 24 }}>
            <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 18, margin: '0 0 20px' }}>📋 Exam Details</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Exam Title *</label>
                <input className="input-field" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. JavaScript Fundamentals" required />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Subject *</label>
                <input className="input-field" value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Programming" required />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Description</label>
                <textarea className="input-field" value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description of this exam..." rows={2} style={{ resize: 'vertical' }} />
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

          {/* Questions Source */}
          <div className="card fade-in" style={{ marginBottom: 24, animationDelay: '0.05s' }}>
            <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 18, margin: '0 0 16px' }}>❓ Questions</h2>

            {/* Tab Toggle */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 24, background: 'var(--card2)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
              {(['manual', 'pdf'] as const).map(t => (
                <button key={t} type="button" onClick={() => setTab(t)} style={{
                  padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  background: tab === t ? 'linear-gradient(135deg, var(--accent), var(--accent2))' : 'transparent',
                  color: tab === t ? '#fff' : 'var(--muted)',
                  transition: 'all 0.2s',
                }}>
                  {t === 'manual' ? '✏️ Manual Entry' : '📄 Upload PDF'}
                </button>
              ))}
            </div>

            {tab === 'pdf' && (
              <div style={{ marginBottom: 24 }}>
                <div style={{
                  border: '2px dashed var(--border)', borderRadius: 12, padding: 40, textAlign: 'center',
                  cursor: 'pointer', transition: 'all 0.2s',
                }} onClick={() => fileRef.current?.click()}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Click to upload PDF</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)' }}>Format: Q1. Question? a) Opt b) Opt c) Opt d) Opt Answer: a</div>
                  {pdfLoading && <div style={{ marginTop: 12, color: 'var(--accent)' }}>Parsing PDF...</div>}
                </div>
                <input ref={fileRef} type="file" accept=".pdf,.txt" onChange={handlePdfUpload} style={{ display: 'none' }} />
                {success && <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--success)', marginTop: 12 }}>{success}</div>}
              </div>
            )}

            {/* Questions List */}
            <div style={{ display: 'grid', gap: 16 }}>
              {questions.map((q, qIdx) => (
                <div key={q.id} style={{ background: 'var(--card2)', borderRadius: 12, padding: 20, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--accent)' }}>Q{qIdx + 1}</span>
                    <button type="button" onClick={() => removeQuestion(qIdx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: 16, padding: '2px 6px' }}>✕</button>
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
                  {!q.correctOptionId && <p style={{ fontSize: 12, color: 'var(--warning)', marginTop: 8, marginBottom: 0 }}>⚠️ Select the correct answer (radio button)</p>}
                </div>
              ))}
            </div>

            <button type="button" onClick={addQuestion} className="btn-ghost" style={{ marginTop: 16, width: '100%', padding: '12px', borderStyle: 'dashed' }}>
              + Add Question
            </button>
          </div>

          {/* Summary */}
          <div className="card fade-in" style={{ marginBottom: 24, animationDelay: '0.1s', background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(99,102,241,0.08))' }}>
            <h3 style={{ fontFamily: 'Space Grotesk', margin: '0 0 16px', fontSize: 16 }}>📊 Exam Summary</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              {[
                { label: 'Questions', value: questions.filter(q => q.text).length },
                { label: 'Total Marks', value: questions.reduce((s, q) => s + q.marks, 0) },
                { label: 'Time Limit', value: `${timeLimit} min` },
                { label: 'Passing', value: `${passingPercent}%` },
              ].map(stat => (
                <div key={stat.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'Space Grotesk', color: 'var(--accent)' }}>{stat.value}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '12px 16px', fontSize: 13, color: 'var(--danger)', marginBottom: 16 }}>{error}</div>}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" className="btn-ghost" onClick={() => router.push('/admin/exams')}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving} style={{ padding: '10px 32px' }}>
              {saving ? 'Creating...' : '🚀 Create Exam'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
