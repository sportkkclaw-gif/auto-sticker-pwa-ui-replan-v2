import { NextResponse } from 'next/server';
import { getWork } from '@/lib/mock-store';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const work = getWork(id);
  if (!work) return NextResponse.json({ error: 'WORK_NOT_FOUND', message: '作品不存在。' }, { status: 404 });
  return NextResponse.json({ work });
}
