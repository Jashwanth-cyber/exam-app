import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail } from '@/lib/store';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  const user = getUserByEmail(email);
  if (!user || user.password !== password) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }
  const { password: _, ...safeUser } = user;
  return NextResponse.json({ user: safeUser });
}
