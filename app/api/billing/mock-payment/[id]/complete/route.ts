import { NextRequest, NextResponse } from 'next/server';
import { completePayment } from '@/lib/mock-store';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = completePayment(id);
  if (!result.ok) return NextResponse.json(result, { status: result.status });
  return NextResponse.json({ payment: result.payment, wallet: result.wallet, transaction: result.transaction, idempotent: result.idempotent });
}
