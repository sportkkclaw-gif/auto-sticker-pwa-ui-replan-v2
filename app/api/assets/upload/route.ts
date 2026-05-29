import { NextRequest, NextResponse } from 'next/server';
import { createAsset } from '@/lib/registry';
import { createLineStaticAsset } from '@/lib/line-static';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { mimeType, fileSize, consent } = body;

  const isLineStaticUpload = body.outputKind === 'line_static_png' || body.dataUrl || body.base64 || body.demo;
  if (isLineStaticUpload && consent !== true) {
    return NextResponse.json({ error: { code: 'CONSENT_REQUIRED', message: '請先確認素材授權、肖像權與 AI 處理告知事項。', details: {} } }, { status: 400 });
  }
  if (consent === false) {
    return NextResponse.json({ error: { code: 'CONSENT_REQUIRED', message: '請確認擁有圖片、角色或人像使用權。', details: {} } }, { status: 400 });
  }
  if (!mimeType || !['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
    return NextResponse.json({ error: { code: 'UNSUPPORTED_FORMAT', message: '不支援的格式，請上傳 JPG、PNG 或 WebP。', details: {} } }, { status: 400 });
  }
  if (fileSize && fileSize > 10 * 1024 * 1024) {
    return NextResponse.json({ error: { code: 'PHOTO_TOO_LARGE', message: '檔案過大，最大 10MB。', details: { maxSize: '10MB' } } }, { status: 400 });
  }

  if (isLineStaticUpload) {
    try {
      const asset = createLineStaticAsset({
        dataUrl: body.dataUrl,
        base64: body.base64,
        mimeType,
        fileName: body.fileName,
        demo: body.demo === true,
        sourceKind: body.sourceKind === 'sticker_sheet' ? 'sticker_sheet' : 'material',
      });
      return NextResponse.json({ asset }, { status: 201 });
    } catch (error) {
      return NextResponse.json({
        error: {
          code: error instanceof Error ? error.message : 'UPLOAD_FAILED',
          message: '素材上傳失敗。',
          details: {},
        },
      }, { status: 400 });
    }
  }

  return NextResponse.json({ asset: createAsset(body) }, { status: 201 });
}
