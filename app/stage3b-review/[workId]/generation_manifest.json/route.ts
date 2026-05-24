import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, context: { params: Promise<{ workId: string }> }) {
  const { workId } = await context.params;
  const filePath = path.join(process.cwd(), 'public', 'stage3b-review', workId, 'generation_manifest.json');
  if (!fs.existsSync(filePath)) return NextResponse.json({ error: 'manifest_not_found' }, { status: 404 });
  const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return NextResponse.json(json);
}
