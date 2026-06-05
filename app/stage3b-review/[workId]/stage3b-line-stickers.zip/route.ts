import fs from 'node:fs';
import path from 'node:path';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, context: { params: Promise<{ workId: string }> }) {
  const { workId } = await context.params;
  const filePath = path.join(process.cwd(), 'public', 'stage3b-review', workId, 'stage3b-line-stickers.zip');
  if (!fs.existsSync(filePath)) return new Response('zip_not_found', { status: 404 });
  const bytes = fs.readFileSync(filePath);
  return new Response(new Uint8Array(bytes), {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${workId}-stage3b-line-stickers.zip"`,
      'Cache-Control': 'no-store'
    }
  });
}
