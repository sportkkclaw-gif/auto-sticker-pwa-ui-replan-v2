import { NextRequest, NextResponse } from 'next/server';
import { createCrop } from '@/lib/registry';
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  return NextResponse.json({ cropState: createCrop(id, body) });
}
