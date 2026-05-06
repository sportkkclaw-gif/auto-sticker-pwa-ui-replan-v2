import { NextRequest, NextResponse } from 'next/server';
import { createExport, getProject, latestQc } from '@/lib/registry';
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!getProject(id)) return NextResponse.json({ error: { code: 'PROJECT_NOT_FOUND', message: '作品不存在', details: { id } } }, { status: 404 });
  const qc = latestQc(id);
  if (!qc?.passed) return NextResponse.json({ error: { code: 'QC_NOT_PASSED', message: 'LINE QC 未通過，禁止匯出 ZIP', details: { qc } } }, { status: 409 });
  return NextResponse.json({ exportPackage: createExport(id) }, { status: 201 });
}
