import { NextResponse } from 'next/server';
import { getAllExams } from '@/lib/store';

export async function GET() {
  const exams = getAllExams().filter(e => e.isActive).map(e => ({
    ...e,
    questions: e.questions.map(q => ({
      ...q,
      correctOptionId: undefined, // hide answers
    })),
  }));
  return NextResponse.json({ exams });
}
