import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const settings = {
    id: 'gs_' + Date.now(),
    projectId: id,
    removeBackground: body.removeBackground ?? true,
    addText: body.addText ?? false,
    whiteStroke: body.whiteStroke ?? true,
    styleStrength: body.styleStrength ?? 0.8,
    language: body.language ?? 'zh-TW',
    outputKind: body.outputKind ?? 'static_png',
    updatedAt: new Date().toISOString(),
  };

  return NextResponse.json({ settings });
}
