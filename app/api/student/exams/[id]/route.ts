import { NextRequest, NextResponse } from 'next/server';
import { getExamById } from '@/lib/store';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const exam = getExamById(id);
  if (!exam || !exam.isActive) return NextResponse.json({ error: 'Exam not found' }, { status: 404 });

  // Strip correct answers for students
  const safeExam = {
    ...exam,
    questions: exam.questions.map(q => ({
      ...q,
      correctOptionId: undefined,
    })),
  };
  return NextResponse.json({ exam: safeExam });
}
