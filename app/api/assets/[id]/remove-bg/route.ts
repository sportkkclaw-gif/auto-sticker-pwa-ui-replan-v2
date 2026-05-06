import { NextRequest, NextResponse } from 'next/server';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Mock remove-bg
  return NextResponse.json({
    success: true,
    assetId: id,
    maskUrl: `/mock-masks/${id}.png`,
    bgRemoved: true,
  });
}
