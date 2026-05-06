import { NextRequest, NextResponse } from 'next/server';
import { getProject, getStickers } from '@/lib/registry';
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = getProject(id);
  if (!project) return NextResponse.json({ error: { code: 'PROJECT_NOT_FOUND', message: '作品不存在', details: { id } } }, { status: 404 });
  return NextResponse.json({ project, stickers: getStickers(id) });
}
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const project = getProject(id); const body = await req.json().catch(() => ({}));
  if (!project) return NextResponse.json({ error: { code: 'PROJECT_NOT_FOUND', message: '作品不存在', details: { id } } }, { status: 404 });
  Object.assign(project, { title: body.title ?? project.title, status: body.status ?? project.status, updatedAt: new Date().toISOString() });
  return NextResponse.json({ project });
}
