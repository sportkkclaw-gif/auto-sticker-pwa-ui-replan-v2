import { NextRequest, NextResponse } from 'next/server';
import { createAsset } from '@/lib/registry';
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { mimeType, fileSize, consent } = body;
  if (consent === false) return NextResponse.json({ error: { code: 'CONSENT_REQUIRED', message: '需確認擁有圖片/角色使用權', details: {} } }, { status: 400 });
  if (!mimeType || !['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) return NextResponse.json({ error: { code: 'UNSUPPORTED_FORMAT', message: '不支援的格式，請上傳 JPG/PNG/WebP', details: {} } }, { status: 400 });
  if (fileSize && fileSize > 10 * 1024 * 1024) return NextResponse.json({ error: { code: 'PHOTO_TOO_LARGE', message: '檔案過大，最大 10MB', details: { maxSize: '10MB' } } }, { status: 400 });
  return NextResponse.json({ asset: createAsset(body) }, { status: 201 });
}
