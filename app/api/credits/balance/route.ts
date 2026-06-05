import { NextRequest, NextResponse } from 'next/server';
import { consumeCredits, getTransactions, getWallet } from '@/lib/mock-store';

export async function GET(_req: NextRequest) {
  return NextResponse.json({ ...getWallet(), transactions: getTransactions() });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const type = body.type || 'consume';
  if (type === 'consume') {
    const result = consumeCredits(Number(body.amount || 0), body.description || '點數扣除', body.work_id);
    if (!result.ok) return NextResponse.json(result, { status: result.status });
    return NextResponse.json({ wallet: result.wallet, transaction: result.transaction });
  }
  return NextResponse.json({ error: 'UNSUPPORTED_CREDIT_OPERATION', message: 'Commercial MVP Stage 1 API only supports type=consume here; purchases must use mock-payment complete API.' }, { status: 400 });
}
