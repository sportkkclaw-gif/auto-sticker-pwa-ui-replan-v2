import { NextRequest, NextResponse } from 'next/server';
import { CREDIT_PACKAGES, createPayment } from '@/lib/mock-store';

export async function GET() {
  return NextResponse.json({ packages: CREDIT_PACKAGES });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const payment = createPayment(body.packageId || 'standard');
  return NextResponse.json({ payment }, { status: 201 });
}
