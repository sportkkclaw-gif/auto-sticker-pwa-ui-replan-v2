import { NextResponse } from 'next/server';
import { getWork } from '@/lib/mock-store';
import { getStage2WorkDetail } from '@/lib/stage2';
import { getLineStaticWork } from '@/lib/line-static';
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lineStaticWork = getLineStaticWork(id);
  if (lineStaticWork) return NextResponse.json({ work: lineStaticWork });
  const detail = getStage2WorkDetail(id);
  if (detail) return NextResponse.json(detail);
  const work = getWork(id);
  if (!work) return NextResponse.json({ error: 'WORK_NOT_FOUND', message: '作品不存在。' }, { status: 404 });
  return NextResponse.json({ work });
}
