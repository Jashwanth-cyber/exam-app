'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// /admin just redirects to /admin/exams
export default function AdminRoot() {
  const router = useRouter();
  useEffect(() => { router.replace('/admin/exams'); }, [router]);
  return null;
}
