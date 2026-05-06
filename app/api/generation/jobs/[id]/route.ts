import { NextRequest, NextResponse } from 'next/server';
import { getJob, getStickers } from '@/lib/registry';
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const job = getJob(id);
  if (!job) return NextResponse.json({ error: { code: 'JOB_NOT_FOUND', message: '生成任務不存在', details: { id } } }, { status: 404 });
  return NextResponse.json({ job, stickers: getStickers(job.projectId) });
}
