import { NextRequest, NextResponse } from 'next/server';
import { getTemplate, db } from '@/lib/registry';
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const template = getTemplate(id);
  if (!template) return NextResponse.json({ error: { code: 'TEMPLATE_NOT_FOUND', message: '模板不存在', details: { id } } }, { status: 404 });
  const promptPresets = db.promptPresets.filter((p: any) => p.templateId === id);
  return NextResponse.json({ template, promptPresets });
}
