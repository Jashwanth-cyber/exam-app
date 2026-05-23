export type Role = 'admin' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  createdAt: string;
}

export interface Option {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  text: string;
  options: Option[];
  correctOptionId: string;
  subject: string;
  marks: number;
}

export interface Exam {
  id: string;
  title: string;
  subject: string;
  description: string;
  questions: Question[];
  timeLimit: number; // minutes
  totalMarks: number;
  createdBy: string;
  createdAt: string;
  isActive: boolean;
  passingMarks: number;
}

export interface Answer {
  questionId: string;
  selectedOptionId: string;
}

export interface ExamResult {
  id: string;
  examId: string;
  studentId: string;
  studentName: string;
  answers: Answer[];
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  submittedAt: string;
  timeTaken: number; // seconds
  subjectScores: Record<string, { scored: number; total: number }>;
  autoSubmitted: boolean;
}

export interface TabSwitchWarning {
  count: number;
  maxWarnings: number;
}
