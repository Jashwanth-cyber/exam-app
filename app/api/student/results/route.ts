import { NextRequest, NextResponse } from 'next/server';
import { getResultsByStudent, getAllExams } from '@/lib/store';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get('studentId');
  if (!studentId) return NextResponse.json({ error: 'Missing studentId' }, { status: 400 });

  const results = getResultsByStudent(studentId);
  const exams = getAllExams();

  const enriched = results.map(r => ({
    ...r,
    examTitle: exams.find(e => e.id === r.examId)?.title || 'Unknown',
    examSubject: exams.find(e => e.id === r.examId)?.subject || 'Unknown',
  }));

  return NextResponse.json({ results: enriched });
}
