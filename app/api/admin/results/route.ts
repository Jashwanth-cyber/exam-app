import { NextResponse } from 'next/server';
import { getAllResults, getAllExams, getAllUsers } from '@/lib/store';

export async function GET() {
  const results = getAllResults();
  const exams = getAllExams();
  const users = getAllUsers();

  const enriched = results.map(r => ({
    ...r,
    examTitle: exams.find(e => e.id === r.examId)?.title || 'Unknown',
    studentName: users.find(u => u.id === r.studentId)?.name || r.studentName,
  }));

  return NextResponse.json({ results: enriched });
}
