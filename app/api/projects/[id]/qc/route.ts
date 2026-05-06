import { NextRequest, NextResponse } from 'next/server';
import { getProject, runQc } from '@/lib/registry';
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const body = await req.json().catch(() => ({}));
  if (!getProject(id)) return NextResponse.json({ error: { code: 'PROJECT_NOT_FOUND', message: '作品不存在', details: { id } } }, { status: 404 });
  return NextResponse.json(runQc(id, body.forceFail === true));
}
