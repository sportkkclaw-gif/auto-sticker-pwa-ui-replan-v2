import { NextRequest, NextResponse } from 'next/server';
import { mockRouteBlockedResponse, mockRoutesEnabled } from '@/lib/mock-guard';
import { CREDIT_PACKAGES, createPayment } from '@/lib/mock-store';

export async function GET() {
  if (!mockRoutesEnabled()) return mockRouteBlockedResponse('Mock billing packages');

  return NextResponse.json({ packages: CREDIT_PACKAGES });
}

export async function POST(req: NextRequest) {
  if (!mockRoutesEnabled()) return mockRouteBlockedResponse('Mock payment');

  const body = await req.json().catch(() => ({}));
  const payment = createPayment(body.packageId || 'standard');
  return NextResponse.json({ payment }, { status: 201 });
}
