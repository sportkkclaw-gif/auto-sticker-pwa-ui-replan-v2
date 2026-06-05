import { NextResponse } from 'next/server';
import { mockRouteBlockedResponse, mockRoutesEnabled } from '@/lib/mock-guard';
import { getTransactions, getWallet, resetMockStore } from '@/lib/mock-store';
import { resetLineStaticStore } from '@/lib/line-static';

export async function POST() {
  if (!mockRoutesEnabled()) return mockRouteBlockedResponse('Demo reset');

  resetMockStore();
  resetLineStaticStore();
  return NextResponse.json({ wallet: getWallet(), transactions: getTransactions(), reset: true });
}
