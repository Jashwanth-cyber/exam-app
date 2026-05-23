'use client';
import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { Exam, Answer } from '@/types';

const MAX_TAB_SWITCHES = 3;

function ExamContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const examId = searchParams.get('id');
  const [user, setUser] = useState<{ id: string; name: string; role: string } | null>(null);
  const [exam, setExam] = useState<Exam | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [started, setStarted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [tabWarnings, setTabWarnings] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMsg, setWarningMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const startTime = useRef<number>(0);

  const submitExam = useCallback(async (auto = false) => {
    if (submitted || submitting || !exam || !user) return;
    setSubmitting(true);
    const timeTaken = Math.floor((Date.now() - startTime.current) / 1000);
    const res = await fetch('/api/student/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ examId: exam.id, studentId: user.id, answers, timeTaken, autoSubmitted: auto }),
    });
    const data = await res.json();
    setSubmitted(true);
    router.push(`/student/results?resultId=${data.result.id}`);
  }, [submitted, submitting, exam, user, answers, router]);

  useEffect(() => {
    const session = getSession();
    if (!session || session.role !== 'student') { router.push('/login'); return; }
    setUser(session as { id: string; name: string; role: string });
    if (examId) {
      fetch('/api/student/exams').then(r => r.json()).then(d => {
        const found = d.exams?.find((e: Exam) => e.id === examId);
        if (found) { setExam(found); setTimeLeft(found.timeLimit * 60); }
        else router.push('/student/dashboard');
      });
    }
  }, [examId, router]);

  // Timer
  useEffect(() => {
    if (!started || submitted || timeLeft <= 0) return;
    if (timeLeft === 0) { submitExam(true); return; }
    const t = setInterval(() => setTimeLeft(p => {
      if (p <= 1) { clearInterval(t); submitExam(true); return 0; }
      return p - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [started, submitted, timeLeft, submitExam]);

  // Anti-cheat: tab switch
  useEffect(() => {
    if (!started || submitted) return;
    const handleVisibility = () => {
      if (document.hidden) {
        setTabWarnings(prev => {
          const next = prev + 1;
          if (next >= MAX_TAB_SWITCHES) {
            setWarningMsg('🚨 Maximum tab switches exceeded! Exam auto-submitted.');
            setShowWarning(true);
            setTimeout(() => submitExam(true), 2000);
          } else {
            setWarningMsg(`⚠️ Tab switch detected! Warning ${next}/${MAX_TAB_SWITCHES}. Exam will auto-submit on ${MAX_TAB_SWITCHES}.`);
            setShowWarning(true);
            setTimeout(() => setShowWarning(false), 4000);
          }
          return next;
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [started, submitted, submitExam]);

  // Anti-cheat: right click
  useEffect(() => {
    if (!started || submitted) return;
    const noContext = (e: MouseEvent) => e.preventDefault();
    document.addEventListener('contextmenu', noContext);
    return () => document.removeEventListener('contextmenu', noContext);
  }, [started, submitted]);

  function handleStart() {
    startTime.current = Date.now();
    setStarted(true);
  }

  function selectAnswer(questionId: string, optionId: string) {
    setAnswers(prev => {
      const existing = prev.find(a => a.questionId === questionId);
      if (existing) return prev.map(a => a.questionId === questionId ? { ...a, selectedOptionId: optionId } : a);
      return [...prev, { questionId, selectedOptionId: optionId }];
    });
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const timeColor = timeLeft < 60 ? 'var(--danger)' : timeLeft < 300 ? 'var(--warning)' : 'var(--success)';

  if (!exam || !user) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--muted)' }}>Loading exam...</div>;

  if (!started) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'radial-gradient(ellipse at center, rgba(59,130,246,0.08), transparent 70%), var(--bg)',
        padding: 24,
      }}>
        <div className="card fade-in" style={{ maxWidth: 540, width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>📝</div>
            <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 24, fontWeight: 700, margin: 0 }}>{exam.title}</h1>
            <p style={{ color: 'var(--muted)', marginTop: 8 }}>{exam.description}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 28 }}>
            {[
              { label: 'Questions', value: exam.questions.length, icon: '❓' },
              { label: 'Time Limit', value: `${exam.timeLimit} min`, icon: '⏱️' },
              { label: 'Total Marks', value: exam.totalMarks, icon: '🏆' },
              { label: 'Passing Marks', value: exam.passingMarks, icon: '✅' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--card2)', borderRadius: 10, padding: '14px', display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ fontSize: 22 }}>{s.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 18 }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '14px 18px', marginBottom: 24 }}>
            <h4 style={{ margin: '0 0 8px', color: 'var(--danger)', fontSize: 14, fontWeight: 700 }}>⚠️ Anti-Cheating Policy</h4>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--muted)', lineHeight: 1.8 }}>
              <li>Switching tabs/windows is monitored</li>
              <li>3 tab switches = automatic submission</li>
              <li>Right-click is disabled during exam</li>
              <li>Timer auto-submits when expired</li>
            </ul>
          </div>
          <button className="btn-primary" onClick={handleStart} style={{ width: '100%', padding: '14px', fontSize: 16 }}>
            Begin Exam →
          </button>
          <button className="btn-ghost" onClick={() => router.push('/student/dashboard')} style={{ width: '100%', marginTop: 10, padding: '10px' }}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const question = exam.questions[currentQ];
  const selectedOption = answers.find(a => a.questionId === question.id)?.selectedOptionId;
  const answeredCount = answers.length;
  const progress = (currentQ + 1) / exam.questions.length * 100;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Warning Banner */}
      {showWarning && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 999,
          background: tabWarnings >= MAX_TAB_SWITCHES ? 'var(--danger)' : 'var(--warning)',
          color: '#fff', padding: '12px 24px', textAlign: 'center',
          fontWeight: 700, fontSize: 15,
          animation: 'slideIn 0.3s ease',
        }}>{warningMsg}</div>
      )}

      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(10,14,26,0.95)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 24px',
      }}>
        <div>
          <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 16 }}>{exam.title}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>Q{currentQ + 1} of {exam.questions.length} · {answeredCount} answered</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {tabWarnings > 0 && (
            <div style={{ fontSize: 13, color: 'var(--warning)', fontWeight: 600 }}>
              ⚠️ {tabWarnings}/{MAX_TAB_SWITCHES} warnings
            </div>
          )}
          <div style={{
            fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 22,
            color: timeColor,
            padding: '6px 16px', background: `${timeColor}15`, borderRadius: 8,
            border: `1px solid ${timeColor}30`,
          }}>
            ⏱ {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ height: 3, background: 'var(--card2)' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, var(--accent), var(--accent2))', transition: 'width 0.3s' }} />
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px', display: 'grid', gridTemplateColumns: '1fr 240px', gap: 24 }}>
        {/* Question */}
        <div>
          <div className="card fade-in" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Question {currentQ + 1} · {question.subject}
              </span>
              <span style={{ fontSize: 12, color: 'var(--muted)', background: 'var(--card2)', padding: '2px 10px', borderRadius: 20 }}>
                {question.marks} mark{question.marks !== 1 ? 's' : ''}
              </span>
            </div>
            <p style={{ fontSize: 17, lineHeight: 1.7, fontWeight: 500, margin: 0 }}>{question.text}</p>
          </div>

          <div style={{ display: 'grid', gap: 10 }}>
            {question.options.map((opt, oIdx) => {
              const isSelected = selectedOption === opt.id;
              return (
                <div key={opt.id} onClick={() => selectAnswer(question.id, opt.id)}
                  style={{
                    padding: '16px 20px', borderRadius: 10, cursor: 'pointer', transition: 'all 0.2s',
                    border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                    background: isSelected ? 'rgba(59,130,246,0.12)' : 'var(--card)',
                    display: 'flex', alignItems: 'center', gap: 14,
                  }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                    background: isSelected ? 'var(--accent)' : 'transparent',
                    fontWeight: 700, fontSize: 13, color: isSelected ? '#fff' : 'var(--muted)',
                    transition: 'all 0.2s',
                  }}>
                    {String.fromCharCode(65 + oIdx)}
                  </div>
                  <span style={{ fontSize: 15, fontWeight: isSelected ? 600 : 400 }}>{opt.text}</span>
                  {isSelected && <span style={{ marginLeft: 'auto', color: 'var(--accent)', fontWeight: 700 }}>✓</span>}
                </div>
              );
            })}
          </div>

          {/* Nav Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
            <button className="btn-ghost" onClick={() => setCurrentQ(p => Math.max(0, p - 1))} disabled={currentQ === 0}>
              ← Previous
            </button>
            <div style={{ display: 'flex', gap: 10 }}>
              {currentQ < exam.questions.length - 1 ? (
                <button className="btn-primary" onClick={() => setCurrentQ(p => p + 1)}>
                  Next →
                </button>
              ) : (
                <button className="btn-primary" onClick={() => {
                  if (confirm(`Submit exam? You've answered ${answeredCount}/${exam.questions.length} questions.`)) submitExam(false);
                }} disabled={submitting} style={{ background: 'linear-gradient(135deg, var(--success), #059669)' }}>
                  {submitting ? 'Submitting...' : '✅ Submit Exam'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Question Map */}
        <div>
          <div className="card" style={{ position: 'sticky', top: 80 }}>
            <h4 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, margin: '0 0 14px', fontSize: 13, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Question Map</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
              {exam.questions.map((q, idx) => {
                const ans = answers.find(a => a.questionId === q.id);
                const isCurrent = idx === currentQ;
                return (
                  <div key={q.id} onClick={() => setCurrentQ(idx)}
                    style={{
                      width: '100%', aspectRatio: '1', borderRadius: 6, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700, transition: 'all 0.2s',
                      border: isCurrent ? '2px solid var(--accent)' : '2px solid transparent',
                      background: isCurrent ? 'rgba(59,130,246,0.2)' : ans ? 'rgba(16,185,129,0.2)' : 'var(--card2)',
                      color: isCurrent ? 'var(--accent)' : ans ? 'var(--success)' : 'var(--muted)',
                    }}>{idx + 1}</div>
                );
              })}
            </div>
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { color: 'var(--accent)', bg: 'rgba(59,130,246,0.2)', label: 'Current' },
                { color: 'var(--success)', bg: 'rgba(16,185,129,0.2)', label: 'Answered' },
                { color: 'var(--muted)', bg: 'var(--card2)', label: 'Unanswered' },
              ].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: l.bg, border: `1px solid ${l.color}` }} />
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>{l.label}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 20, padding: '12px', background: 'var(--card2)', borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--success)' }}>{answeredCount}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>of {exam.questions.length} answered</div>
            </div>
            <button onClick={() => {
              if (confirm(`Submit exam? Answered: ${answeredCount}/${exam.questions.length}`)) submitExam(false);
            }} disabled={submitting}
              style={{ width: '100%', marginTop: 14, padding: '10px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, color: 'var(--success)', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
              Submit Exam
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ExamPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--muted)' }}>Loading...</div>}>
      <ExamContent />
    </Suspense>
  );
}
