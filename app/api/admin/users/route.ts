import { NextResponse } from 'next/server';
import { getAllUsers } from '@/lib/store';

export async function GET() {
  const users = getAllUsers().map(({ password: _, ...u }) => u);
  return NextResponse.json({ users });
}
