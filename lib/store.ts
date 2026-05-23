import { User, Exam, ExamResult } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// In-memory store (in production, replace with a real database)
let users: User[] = [
  {
    id: 'admin-1',
    name: 'Admin User',
    email: 'admin@examapp.com',
    password: 'admin123',
    role: 'admin',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'student-1',
    name: 'John Doe',
    email: 'student@examapp.com',
    password: 'student123',
    role: 'student',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'student-2',
    name: 'Jane Smith',
    email: 'jane@examapp.com',
    password: 'student123',
    role: 'student',
    createdAt: new Date().toISOString(),
  },
];

let exams: Exam[] = [
  {
    id: 'exam-1',
    title: 'JavaScript Fundamentals',
    subject: 'JavaScript',
    description: 'Test your JavaScript knowledge with this comprehensive exam.',
    timeLimit: 30,
    totalMarks: 50,
    passingMarks: 25,
    createdBy: 'admin-1',
    createdAt: new Date().toISOString(),
    isActive: true,
    questions: [
      {
        id: 'q1',
        text: 'What is the output of typeof null?',
        subject: 'JavaScript',
        marks: 5,
        options: [
          { id: 'a', text: '"null"' },
          { id: 'b', text: '"object"' },
          { id: 'c', text: '"undefined"' },
          { id: 'd', text: '"string"' },
        ],
        correctOptionId: 'b',
      },
      {
        id: 'q2',
        text: 'Which method is used to add elements to the end of an array?',
        subject: 'JavaScript',
        marks: 5,
        options: [
          { id: 'a', text: 'push()' },
          { id: 'b', text: 'pop()' },
          { id: 'c', text: 'shift()' },
          { id: 'd', text: 'unshift()' },
        ],
        correctOptionId: 'a',
      },
      {
        id: 'q3',
        text: 'What does === check in JavaScript?',
        subject: 'JavaScript',
        marks: 5,
        options: [
          { id: 'a', text: 'Value only' },
          { id: 'b', text: 'Type only' },
          { id: 'c', text: 'Both value and type' },
          { id: 'd', text: 'Reference equality' },
        ],
        correctOptionId: 'c',
      },
      {
        id: 'q4',
        text: 'What is a closure in JavaScript?',
        subject: 'JavaScript',
        marks: 5,
        options: [
          { id: 'a', text: 'A function with no return value' },
          { id: 'b', text: 'A function that remembers its lexical scope' },
          { id: 'c', text: 'An object method' },
          { id: 'd', text: 'A built-in JavaScript function' },
        ],
        correctOptionId: 'b',
      },
      {
        id: 'q5',
        text: 'Which keyword declares a block-scoped variable?',
        subject: 'JavaScript',
        marks: 5,
        options: [
          { id: 'a', text: 'var' },
          { id: 'b', text: 'let' },
          { id: 'c', text: 'function' },
          { id: 'd', text: 'global' },
        ],
        correctOptionId: 'b',
      },
      {
        id: 'q6',
        text: 'What does the Array.map() method return?',
        subject: 'Arrays',
        marks: 5,
        options: [
          { id: 'a', text: 'A filtered array' },
          { id: 'b', text: 'A single value' },
          { id: 'c', text: 'A new transformed array' },
          { id: 'd', text: 'The original array modified' },
        ],
        correctOptionId: 'c',
      },
      {
        id: 'q7',
        text: 'What is a Promise in JavaScript?',
        subject: 'Async',
        marks: 5,
        options: [
          { id: 'a', text: 'A synchronous function' },
          { id: 'b', text: 'An object representing eventual completion or failure' },
          { id: 'c', text: 'A type of loop' },
          { id: 'd', text: 'A special variable type' },
        ],
        correctOptionId: 'b',
      },
      {
        id: 'q8',
        text: 'Which operator is used for optional chaining?',
        subject: 'JavaScript',
        marks: 5,
        options: [
          { id: 'a', text: '??' },
          { id: 'b', text: '?.' },
          { id: 'c', text: '&&' },
          { id: 'd', text: '||' },
        ],
        correctOptionId: 'b',
      },
      {
        id: 'q9',
        text: 'What does JSON.stringify() do?',
        subject: 'JavaScript',
        marks: 5,
        options: [
          { id: 'a', text: 'Parses JSON string to object' },
          { id: 'b', text: 'Converts object to JSON string' },
          { id: 'c', text: 'Validates JSON format' },
          { id: 'd', text: 'Creates a JSON file' },
        ],
        correctOptionId: 'b',
      },
      {
        id: 'q10',
        text: 'Which method removes the last element from an array and returns it?',
        subject: 'Arrays',
        marks: 5,
        options: [
          { id: 'a', text: 'push()' },
          { id: 'b', text: 'shift()' },
          { id: 'c', text: 'pop()' },
          { id: 'd', text: 'splice()' },
        ],
        correctOptionId: 'c',
      },
    ],
  },
  {
    id: 'exam-2',
    title: 'React & Next.js Basics',
    subject: 'React',
    description: 'Evaluate your understanding of React and Next.js concepts.',
    timeLimit: 20,
    totalMarks: 30,
    passingMarks: 15,
    createdBy: 'admin-1',
    createdAt: new Date().toISOString(),
    isActive: true,
    questions: [
      {
        id: 'rq1',
        text: 'What is JSX?',
        subject: 'React',
        marks: 5,
        options: [
          { id: 'a', text: 'A database query language' },
          { id: 'b', text: 'JavaScript XML syntax extension' },
          { id: 'c', text: 'A CSS framework' },
          { id: 'd', text: 'A testing library' },
        ],
        correctOptionId: 'b',
      },
      {
        id: 'rq2',
        text: 'What hook is used for side effects in React?',
        subject: 'Hooks',
        marks: 5,
        options: [
          { id: 'a', text: 'useState' },
          { id: 'b', text: 'useContext' },
          { id: 'c', text: 'useEffect' },
          { id: 'd', text: 'useRef' },
        ],
        correctOptionId: 'c',
      },
      {
        id: 'rq3',
        text: 'What is the virtual DOM?',
        subject: 'React',
        marks: 5,
        options: [
          { id: 'a', text: 'A real browser DOM copy' },
          { id: 'b', text: 'A lightweight JS representation of the DOM' },
          { id: 'c', text: 'A CSS rendering engine' },
          { id: 'd', text: 'A type of database' },
        ],
        correctOptionId: 'b',
      },
      {
        id: 'rq4',
        text: 'What does Next.js getServerSideProps do?',
        subject: 'Next.js',
        marks: 5,
        options: [
          { id: 'a', text: 'Fetches data at build time' },
          { id: 'b', text: 'Fetches data on every request server-side' },
          { id: 'c', text: 'Fetches data on the client' },
          { id: 'd', text: 'Creates API routes' },
        ],
        correctOptionId: 'b',
      },
      {
        id: 'rq5',
        text: 'What is the purpose of React keys?',
        subject: 'React',
        marks: 5,
        options: [
          { id: 'a', text: 'CSS styling' },
          { id: 'b', text: 'Security tokens' },
          { id: 'c', text: 'Help React identify which items changed in a list' },
          { id: 'd', text: 'Database primary keys' },
        ],
        correctOptionId: 'c',
      },
      {
        id: 'rq6',
        text: 'What is the App Router in Next.js 13+?',
        subject: 'Next.js',
        marks: 5,
        options: [
          { id: 'a', text: 'A routing library' },
          { id: 'b', text: 'File-system based routing with server components' },
          { id: 'c', text: 'A state management tool' },
          { id: 'd', text: 'A database ORM' },
        ],
        correctOptionId: 'b',
      },
    ],
  },
];

let results: ExamResult[] = [
  {
    id: 'result-1',
    examId: 'exam-1',
    studentId: 'student-1',
    studentName: 'John Doe',
    answers: [],
    score: 35,
    totalMarks: 50,
    percentage: 70,
    passed: true,
    submittedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    timeTaken: 1200,
    subjectScores: {
      JavaScript: { scored: 20, total: 35 },
      Arrays: { scored: 10, total: 10 },
      Async: { scored: 5, total: 5 },
    },
    autoSubmitted: false,
  },
  {
    id: 'result-2',
    examId: 'exam-2',
    studentId: 'student-1',
    studentName: 'John Doe',
    answers: [],
    score: 12,
    totalMarks: 30,
    percentage: 40,
    passed: false,
    submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    timeTaken: 900,
    subjectScores: {
      React: { scored: 5, total: 15 },
      Hooks: { scored: 5, total: 5 },
      'Next.js': { scored: 2, total: 10 },
    },
    autoSubmitted: false,
  },
];

// Users
export function getAllUsers(): User[] { return users; }
export function getUserById(id: string): User | undefined { return users.find(u => u.id === id); }
export function getUserByEmail(email: string): User | undefined { return users.find(u => u.email === email); }
export function createUser(data: Omit<User, 'id' | 'createdAt'>): User {
  const user: User = { ...data, id: uuidv4(), createdAt: new Date().toISOString() };
  users.push(user);
  return user;
}

// Exams
export function getAllExams(): Exam[] { return exams; }
export function getExamById(id: string): Exam | undefined { return exams.find(e => e.id === id); }
export function createExam(data: Omit<Exam, 'id' | 'createdAt'>): Exam {
  const exam: Exam = { ...data, id: uuidv4(), createdAt: new Date().toISOString() };
  exams.push(exam);
  return exam;
}
export function updateExam(id: string, data: Partial<Exam>): Exam | null {
  const idx = exams.findIndex(e => e.id === id);
  if (idx === -1) return null;
  exams[idx] = { ...exams[idx], ...data };
  return exams[idx];
}
export function deleteExam(id: string): boolean {
  const len = exams.length;
  exams = exams.filter(e => e.id !== id);
  return exams.length < len;
}

// Results
export function getAllResults(): ExamResult[] { return results; }
export function getResultsByStudent(studentId: string): ExamResult[] { return results.filter(r => r.studentId === studentId); }
export function getResultsByExam(examId: string): ExamResult[] { return results.filter(r => r.examId === examId); }
export function createResult(data: Omit<ExamResult, 'id'>): ExamResult {
  const result: ExamResult = { ...data, id: uuidv4() };
  results.push(result);
  return result;
}
