import { NextResponse } from 'next/server';
import { getGeneratedImagesForWork, WorkRepository } from '@/lib/stage2';
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!WorkRepository.get(id)) return NextResponse.json({ error: 'WORK_NOT_FOUND', message: '作品不存在。' }, { status: 404 });
  return NextResponse.json({ generated_images: getGeneratedImagesForWork(id) });
}
