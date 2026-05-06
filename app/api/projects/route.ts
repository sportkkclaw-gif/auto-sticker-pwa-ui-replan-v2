import { NextRequest, NextResponse } from 'next/server';
import { createProject, listProjects } from '@/lib/registry';
export async function GET(req: NextRequest) {
  const status = new URL(req.url).searchParams.get('status');
  const projects = listProjects(status);
  return NextResponse.json({ projects, total: projects.length, source: 'seed-and-demo-registry' });
}
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const project = createProject(body);
  return NextResponse.json({ project }, { status: 201 });
}
