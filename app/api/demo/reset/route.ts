import { NextResponse } from 'next/server';
import { getTransactions, getWallet, resetMockStore } from '@/lib/mock-store';

export async function POST() {
  resetMockStore();
  return NextResponse.json({ wallet: getWallet(), transactions: getTransactions(), reset: true });
}
