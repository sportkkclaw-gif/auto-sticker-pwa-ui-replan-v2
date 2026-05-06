import { NextRequest, NextResponse } from 'next/server';
import { listTemplates } from '@/lib/registry';
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search')?.toLowerCase();
  const category = searchParams.get('category');
  let templates = listTemplates();
  if (search) templates = templates.filter((t: any) => t.name.toLowerCase().includes(search) || t.tags.some((tag: string) => tag.toLowerCase().includes(search)));
  if (category) templates = templates.filter((t: any) => t.categoryId === category || t.tags.includes(category));
  return NextResponse.json({ templates, total: templates.length, source: 'seed-data' });
}
