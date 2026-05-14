import { NextRequest, NextResponse } from 'next/server';
import { createWork, getMockStore } from '@/lib/mock-store';
import { createStage2Work, WorkRepository } from '@/lib/stage2';
export async function GET() { return NextResponse.json({ works: [...Object.values(getMockStore().works), ...WorkRepository.list()] }); }
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const isStage2 = Boolean(body.prompt || body.image_count || body.output_kind || body.simulate_failure || req.headers.get('idempotency-key'));
  if (!isStage2) {
    const result = createWork({ templateId: body.templateId, title: body.title, imageCount: body.imageCount });
    if (!result.ok) return NextResponse.json(result, { status: result.status });
    return NextResponse.json({ work: result.work, wallet: result.wallet, transaction: result.transaction }, { status: 201 });
  }
  const result = createStage2Work({ ...body, idempotency_key: req.headers.get('idempotency-key') || body.idempotency_key });
  if (!result.ok) return NextResponse.json(result, { status: result.status });
  return NextResponse.json(result, { status: result.status || 201 });
}
