import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest) {
  const wallet = {
    userId: 'user_demo_001',
    freeCredits: 2,
    paidCredits: 10,
    total: 12,
    updatedAt: new Date().toISOString(),
  };

  return NextResponse.json(wallet);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { type, amount } = body;

  const ledger = {
    id: 'ledger_' + Date.now(),
    userId: 'user_demo_001',
    type,
    amount,
    reason: type === 'purchase' ? '購買點數包' : type === 'grant' ? '新用戶獎勵' : '消費',
    createdAt: new Date().toISOString(),
  };

  return NextResponse.json({ ledger });
}
