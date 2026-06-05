import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, context: { params: Promise<{ workId: string }> }) {
  const { workId } = await context.params;
  const filePath = path.join(process.cwd(), 'public', 'stage3b-review', workId, 'provider_evidence.json');
  if (!fs.existsSync(filePath)) return NextResponse.json({ error: 'provider_evidence_not_found' }, { status: 404 });
  return NextResponse.json(JSON.parse(fs.readFileSync(filePath, 'utf8')));
}
