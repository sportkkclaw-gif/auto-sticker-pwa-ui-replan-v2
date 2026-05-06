import { NextRequest, NextResponse } from 'next/server';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const result = {
    id: 'result_' + Date.now(),
    stickerId: id,
    projectId: 'w1',
    index: 0,
    text: '再生文字',
    imageUrl: '/mock-stickers/' + Date.now() + '.png',
    width: 370,
    height: 370,
    fileSize: 51200,
    kind: 'static_png',
    status: 'success',
    createdAt: new Date().toISOString(),
  };

  return NextResponse.json({ result });
}
