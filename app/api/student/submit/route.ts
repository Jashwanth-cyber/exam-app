import { NextRequest, NextResponse } from 'next/server';
import { getExamById, createResult, getUserById } from '@/lib/store';
import { Answer } from '@/types';

export async function POST(req: NextRequest) {
  const { examId, studentId, answers, timeTaken, autoSubmitted } = await req.json();

  const exam = getExamById(examId);
  if (!exam) return NextResponse.json({ error: 'Exam not found' }, { status: 404 });

  const user = getUserById(studentId);
  const studentName = user?.name || 'Unknown';

  let score = 0;
  const subjectScores: Record<string, { scored: number; total: number }> = {};

  for (const question of exam.questions) {
    const subj = question.subject;
    if (!subjectScores[subj]) subjectScores[subj] = { scored: 0, total: 0 };
    subjectScores[subj].total += question.marks;

    const ans = answers.find((a: Answer) => a.questionId === question.id);
    if (ans?.selectedOptionId === question.correctOptionId) {
      score += question.marks;
      subjectScores[subj].scored += question.marks;
    }
  }

  const percentage = Math.round((score / exam.totalMarks) * 100);

  const result = createResult({
    examId,
    studentId,
    studentName,
    answers,
    score,
    totalMarks: exam.totalMarks,
    percentage,
    passed: score >= exam.passingMarks,
    submittedAt: new Date().toISOString(),
    timeTaken: timeTaken || 0,
    subjectScores,
    autoSubmitted: autoSubmitted || false,
  });

  return NextResponse.json({ result });
}
