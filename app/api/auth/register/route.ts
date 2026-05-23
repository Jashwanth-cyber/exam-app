import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, createUser } from '@/lib/store';

export async function POST(req: NextRequest) {
  const { name, email, password, role } = await req.json();
  if (!name || !email || !password) {
    return NextResponse.json({ error: 'All fields required' }, { status: 400 });
  }
  if (getUserByEmail(email)) {
    return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
  }
  const user = createUser({ name, email, password, role: role || 'student' });
  const { password: _, ...safeUser } = user;
  return NextResponse.json({ user: safeUser });
}
