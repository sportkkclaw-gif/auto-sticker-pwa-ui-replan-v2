import { NextResponse } from 'next/server';
import { modelCount } from '@/lib/registry';
export async function GET() {
  return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0', mock: true, mode: process.env.MOCK_AI ?? 'true', seedModelCount: modelCount() });
}
