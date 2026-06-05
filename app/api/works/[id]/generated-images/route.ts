import { NextRequest, NextResponse } from 'next/server';
import { getGeneratedImagesForWork, WorkRepository } from '@/lib/stage2';
import { getLineStaticWork, readLineStaticFile } from '@/lib/line-static';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const file = new URL(req.url).searchParams.get('file');
  const lineStaticWork = getLineStaticWork(id);
  if (lineStaticWork) {
    if (file) {
      const bytes = readLineStaticFile(id, file);
      if (!bytes) return NextResponse.json({ error: 'FILE_NOT_FOUND', message: '找不到檔案。' }, { status: 404 });
      const contentType = file.endsWith('.png') ? 'image/png' : file.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/json; charset=utf-8';
      return new Response(new Uint8Array(bytes), { headers: { 'Content-Type': contentType, 'Cache-Control': 'no-store' } });
    }
    return NextResponse.json({ generated_images: lineStaticWork.images, main_image: lineStaticWork.main_image, tab_image: lineStaticWork.tab_image });
  }
  if (!WorkRepository.get(id)) return NextResponse.json({ error: 'WORK_NOT_FOUND', message: '作品不存在。' }, { status: 404 });
  return NextResponse.json({ generated_images: getGeneratedImagesForWork(id) });
}
