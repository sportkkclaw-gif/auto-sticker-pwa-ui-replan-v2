import { NextRequest, NextResponse } from 'next/server';
import { createJob, db, getProject, getTemplate } from '@/lib/registry';
export async function GET(req: NextRequest) {
  const projectId = new URL(req.url).searchParams.get('projectId');
  const jobs = projectId ? db.generationJobs.filter((j: any) => j.projectId === projectId) : db.generationJobs;
  return NextResponse.json({ jobs, total: jobs.length });
}
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { projectId, templateId, count } = body;
  if (!projectId || !templateId) return NextResponse.json({ error: { code: 'MISSING_FIELDS', message: '缺少必要欄位', details: {} } }, { status: 400 });
  if (!getProject(projectId)) return NextResponse.json({ error: { code: 'PROJECT_NOT_FOUND', message: '作品不存在', details: { projectId } } }, { status: 404 });
  if (!getTemplate(templateId)) return NextResponse.json({ error: { code: 'TEMPLATE_NOT_FOUND', message: '模板不存在', details: { templateId } } }, { status: 404 });
  if (![4,8,16].includes(count || 8)) return NextResponse.json({ error: { code: 'INVALID_COUNT', message: '張數需為 4/8/16', details: {} } }, { status: 400 });
  return NextResponse.json(createJob(body), { status: 201 });
}
