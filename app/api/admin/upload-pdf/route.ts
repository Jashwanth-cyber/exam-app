import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('pdf') as File;
    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

    const text = await file.text();
    const questions = parsePdfText(text);
    return NextResponse.json({ questions, rawText: text });
  } catch {
    return NextResponse.json({ error: 'Failed to process PDF' }, { status: 500 });
  }
}

function parsePdfText(text: string) {
  const questions = [];
  // Pattern: Q1. Question text? a) opt b) opt c) opt d) opt Answer: a
  const qRegex = /Q\d+[\.\)]\s*(.+?)(?=Q\d+[\.\)]|$)/gis;
  const matches = [...text.matchAll(qRegex)];

  for (const match of matches) {
    const block = match[1];
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) continue;

    const qText = lines[0];
    const options: { id: string; text: string }[] = [];
    let correctOptionId = 'a';

    const optRegex = /^([a-d])[\.\)]\s*(.+)/i;
    const ansRegex = /^answer[:\s]+([a-d])/i;

    for (const line of lines.slice(1)) {
      const optMatch = line.match(optRegex);
      const ansMatch = line.match(ansRegex);
      if (optMatch) {
        options.push({ id: optMatch[1].toLowerCase(), text: optMatch[2].trim() });
      } else if (ansMatch) {
        correctOptionId = ansMatch[1].toLowerCase();
      }
    }

    if (options.length >= 2) {
      questions.push({
        id: Math.random().toString(36).substr(2, 9),
        text: qText,
        options,
        correctOptionId,
        subject: 'General',
        marks: 5,
      });
    }
  }

  // Fallback: try numbered format
  if (questions.length === 0) {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    let currentQ: { id: string; text: string; options: { id: string; text: string }[]; correctOptionId: string; subject: string; marks: number } | null = null;

    for (const line of lines) {
      const numMatch = line.match(/^\d+[\.\)]\s*(.+)/);
      const optMatch = line.match(/^([a-d])[\.\)]\s*(.+)/i);
      const ansMatch = line.match(/answer[:\s]+([a-d])/i);

      if (numMatch) {
        if (currentQ && currentQ.options.length >= 2) questions.push(currentQ);
        currentQ = {
          id: Math.random().toString(36).substr(2, 9),
          text: numMatch[1],
          options: [],
          correctOptionId: 'a',
          subject: 'General',
          marks: 5,
        };
      } else if (optMatch && currentQ) {
        currentQ.options.push({ id: optMatch[1].toLowerCase(), text: optMatch[2].trim() });
      } else if (ansMatch && currentQ) {
        currentQ.correctOptionId = ansMatch[1].toLowerCase();
      }
    }
    if (currentQ && currentQ.options.length >= 2) questions.push(currentQ);
  }

  return questions;
}
