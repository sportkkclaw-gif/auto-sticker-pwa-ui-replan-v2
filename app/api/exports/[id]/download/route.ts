import { NextRequest } from 'next/server';
import { exportManifest } from '@/lib/registry';
import { createStoredZip } from '@/lib/zip';

const transparentPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/luzH7wAAAABJRU5ErkJggg==',
  'base64',
);

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const manifest = exportManifest(id);
  const files = [
    { name: 'main.png', data: transparentPng },
    { name: 'tab.png', data: transparentPng },
    ...Array.from({ length: 8 }, (_, index) => ({
      name: `${String(index + 1).padStart(2, '0')}.png`,
      data: transparentPng,
    })),
    { name: 'metadata.json', data: JSON.stringify({ ...manifest, generatedBy: 'AUTO動態貼圖 mock ZIP exporter' }, null, 2) },
    { name: 'qc_report.html', data: `<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><title>LINE QC</title><body><h1>LINE QC PASS</h1><p>Export ${id} contains LINE static sticker package entries.</p></body></html>` },
  ];
  const zip = createStoredZip(files);
  return new Response(new Uint8Array(zip), {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${id}.zip"`,
      'Content-Length': String(zip.length),
      'Cache-Control': 'no-store',
    },
  });
}
