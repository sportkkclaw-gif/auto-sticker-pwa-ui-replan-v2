import fs from 'node:fs';
import path from 'node:path';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, context: { params: Promise<{ workId: string; file: string }> }) {
  const { workId, file } = await context.params;
  if (!/^\d{2}\.png$/.test(file)) return new Response('invalid_image', { status: 400 });
  const filePath = path.join(process.cwd(), 'public', 'stage3b-review', workId, 'images', file);
  if (!fs.existsSync(filePath)) return new Response('image_not_found', { status: 404 });
  const bytes = fs.readFileSync(filePath);
  return new Response(new Uint8Array(bytes), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'no-store'
    }
  });
}
