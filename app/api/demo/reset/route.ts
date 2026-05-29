import { NextResponse } from 'next/server';
import { getTransactions, getWallet, resetMockStore } from '@/lib/mock-store';
import { resetLineStaticStore } from '@/lib/line-static';

export async function POST() {
  resetMockStore();
  resetLineStaticStore();
  return NextResponse.json({ wallet: getWallet(), transactions: getTransactions(), reset: true });
}
