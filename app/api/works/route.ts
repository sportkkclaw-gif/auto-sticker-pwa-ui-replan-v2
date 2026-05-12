import { NextRequest, NextResponse } from 'next/server';
import { createWork, getMockStore } from '@/lib/mock-store';

export async function GET() {
  return NextResponse.json({ works: Object.values(getMockStore().works) });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const result = createWork({ templateId: body.templateId, title: body.title, imageCount: body.imageCount });
  if (!result.ok) return NextResponse.json(result, { status: result.status });
  return NextResponse.json({ work: result.work, wallet: result.wallet, transaction: result.transaction }, { status: 201 });
}
