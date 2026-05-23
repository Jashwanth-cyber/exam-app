import { NextRequest, NextResponse } from 'next/server';
import { getAllExams, createExam } from '@/lib/store';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  return NextResponse.json({ exams: getAllExams() });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, subject, description, questions, timeLimit, passingMarks, createdBy, isActive } = body;
  if (!title || !questions?.length) {
    return NextResponse.json({ error: 'Title and questions are required' }, { status: 400 });
  }
  const totalMarks = questions.reduce((sum: number, q: { marks: number }) => sum + q.marks, 0);
  const exam = createExam({
    title,
    subject,
    description,
    questions: questions.map((q: Record<string, unknown>) => ({ ...q, id: q.id || uuidv4() })),
    timeLimit: timeLimit || 30,
    totalMarks,
    passingMarks: passingMarks || Math.floor(totalMarks * 0.5),
    createdBy: createdBy || 'admin-1',
    isActive: isActive !== undefined ? isActive : true,
  });
  return NextResponse.json({ exam });
}
