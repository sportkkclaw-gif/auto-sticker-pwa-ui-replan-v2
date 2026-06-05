import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import zlib from 'node:zlib';

const seed = JSON.parse(readFileSync(new URL('../data/seed.json', import.meta.url), 'utf8'));
let unit = 0;
let api = 0;
let e2e = 0;

function ok(cond, msg, kind = 'unit') {
  assert.ok(cond, msg);
  if (kind === 'unit') unit++;
  if (kind === 'api') api++;
  if (kind === 'e2e') e2e++;
  console.log(`PASS ${kind}: ${msg}`);
}

ok(Object.keys(seed).length >= 18, '18+ seed data models present');
ok(seed.templates.length >= 8, 'template seed count >=8');
ok(seed.templateCategories.length >= 8, 'template categories seed count >=8');
ok(seed.promptPresets.every((p) => p.maxChars <= 200), 'prompt presets enforce 200-char contract');
ok(seed.sourceAssets.every((a) => a.consent === true), 'source assets carry consent flag');
ok(seed.cropStates.every((c) => Number.isFinite(c.width) && Number.isFinite(c.height)), 'crop states have dimensions');
ok(seed.projects.some((p) => p.status === 'completed'), 'completed project seed present');
ok(seed.generationSettings.every((s) => s.outputKind === 'static_png'), 'generation outputKind seeded');
ok(seed.generationJobs.some((j) => j.provider === 'mock'), 'mock AI job seeded');
ok(seed.stickerResults.every((s) => s.width === 370 && s.height === 370), 'LINE sticker dimensions seeded');
ok(seed.exportPackages.some((e) => e.type === 'line_static_zip'), 'LINE ZIP export seed present');
ok(existsSync('public/manifest.webmanifest') && existsSync('public/sw.js'), 'PWA manifest and service worker exist');
ok(readFileSync('app/create/page.tsx', 'utf8').includes('line_static_png'), 'create page targets LINE static output');
ok(readFileSync('app/create/page.tsx', 'utf8').includes("useState<GenerationMode>('batch_sheet')") && readFileSync('app/create/page.tsx', 'utf8').includes('sheet_crop'), 'create page defaults to batch-sheet production flow while keeping low-cost sheet crop');
ok(readFileSync('app/create/page.tsx', 'utf8').includes('manual_sheet') && readFileSync('app/create/page.tsx', 'utf8').includes('不呼叫 API'), 'create page supports subscription-generated sticker sheet crop testing');
const templatesPage = readFileSync('app/templates/page.tsx', 'utf8');
ok(!templatesPage.includes('市場依據') && !templatesPage.includes('適合素材'), 'templates page uses creator-facing UX copy');
ok(templatesPage.includes('preview_image') && templatesPage.includes('<img'), 'templates page renders real preview images');
ok(templatesPage.includes('preview_image_gpt_image_2') && templatesPage.includes('template-compare-preview'), 'templates page supports gpt-image comparison previews');
const generatedPreviewManifest = JSON.parse(readFileSync('public/template-previews/generated-manifest.json', 'utf8'));
ok(generatedPreviewManifest.provider === 'openai' && generatedPreviewManifest.count === 8, 'template previews are OpenAI generated artifacts');
const gptImage2PreviewManifest = JSON.parse(readFileSync('public/template-previews/gpt-image-2-manifest.json', 'utf8'));
ok(gptImage2PreviewManifest.provider === 'openai' && gptImage2PreviewManifest.model === 'gpt-image-2' && gptImage2PreviewManifest.count === 8, 'template previews include gpt-image-2 comparison artifacts');
for (const file of ['daily-big-text','pet-character','work-reply','big-face-reaction','taiwan-slang','love-cute','cry-emotion','jelly-healing']) {
  ok(existsSync(`public/template-previews/${file}-generated.png`), `generated template preview asset exists: ${file}`);
  ok(existsSync(`public/template-previews/${file}-gpt-image-2.png`), `gpt-image-2 template preview asset exists: ${file}`);
}

async function startServer() {
  const candidates = [process.env.TEST_BASE_URL, 'http://127.0.0.1:3001'].filter(Boolean);
  for (const base of candidates) {
    try {
      const res = await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(6000) });
      if (res.status < 500) return { child: null, base };
    } catch {}
  }
  const port = String(3300 + Math.floor(Math.random() * 200));
  const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '--hostname', '127.0.0.1', '--port', port], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: port, NEXT_TELEMETRY_DISABLED: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let logs = '';
  child.stdout.on('data', (d) => { logs += d; });
  child.stderr.on('data', (d) => { logs += d; });
  for (let i = 0; i < 80; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/health`, { signal: AbortSignal.timeout(1200) });
      if (res.status < 500) return { child, base: `http://127.0.0.1:${port}` };
    } catch {}
    await delay(500);
    if (child.exitCode !== null) throw new Error(`next dev exited early: ${logs}`);
  }
  child.kill('SIGTERM');
  throw new Error(`server did not become ready: ${logs}`);
}

async function jsonFetch(base, route, init) {
  const res = await fetch(base + route, { headers: { 'content-type': 'application/json' }, ...init });
  let body;
  try { body = await res.json(); } catch { body = {}; }
  return { status: res.status, body, headers: res.headers };
}

function zipEntries(buffer) {
  const names = [];
  for (let i = 0; i < buffer.length - 46; i++) {
    if (buffer.readUInt32LE(i) === 0x02014b50) {
      const nameLen = buffer.readUInt16LE(i + 28);
      const extraLen = buffer.readUInt16LE(i + 30);
      const commentLen = buffer.readUInt16LE(i + 32);
      names.push(buffer.subarray(i + 46, i + 46 + nameLen).toString('utf8'));
      i += 45 + nameLen + extraLen + commentLen;
    }
  }
  return names;
}

function unzipStored(buffer) {
  const files = {};
  for (let i = 0; i < buffer.length - 30; i++) {
    if (buffer.readUInt32LE(i) === 0x04034b50) {
      const method = buffer.readUInt16LE(i + 8);
      const size = buffer.readUInt32LE(i + 18);
      const nameLen = buffer.readUInt16LE(i + 26);
      const extraLen = buffer.readUInt16LE(i + 28);
      const name = buffer.subarray(i + 30, i + 30 + nameLen).toString('utf8');
      const start = i + 30 + nameLen + extraLen;
      if (method === 0) files[name] = buffer.subarray(start, start + size);
      i = start + size - 1;
    }
  }
  return files;
}

function pngDim(buffer) {
  return buffer?.[0] === 0x89 && buffer?.[1] === 0x50 ? `${buffer.readUInt32BE(16)}x${buffer.readUInt32BE(20)}` : '';
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (const byte of buf) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const name = Buffer.from(type);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([len, name, data, crc]);
}

function encodeRgbaPng(width, height, rgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    const dst = y * (width * 4 + 1);
    raw[dst] = 0;
    rgba.copy(raw, dst + 1, y * width * 4, (y + 1) * width * 4);
  }
  return Buffer.concat([signature, pngChunk('IHDR', ihdr), pngChunk('IDAT', zlib.deflateSync(raw)), pngChunk('IEND', Buffer.alloc(0))]);
}

function makeEdgeTouchingSheet() {
  const width = 1024;
  const height = 1024;
  const rgba = Buffer.alloc(width * height * 4);
  const cols = 4;
  const rows = 2;
  const cellW = width / cols;
  const cellH = height / rows;
  for (let index = 0; index < 8; index++) {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const left = col * cellW;
    const top = row * cellH;
    for (let y = top; y < top + Math.floor(cellH * 0.78); y++) {
      for (let x = left; x < left + Math.floor(cellW * 0.78); x++) {
        const i = (y * width + x) * 4;
        rgba[i] = 240;
        rgba[i + 1] = 60;
        rgba[i + 2] = 80;
        rgba[i + 3] = 255;
      }
    }
  }
  return encodeRgbaPng(width, height, rgba);
}

function makeDamagedInteriorSheet() {
  const width = 1024;
  const height = 1024;
  const rgba = Buffer.alloc(width * height * 4);
  const cols = 4;
  const rows = 2;
  const cellW = width / cols;
  const cellH = height / rows;
  for (let index = 0; index < 8; index++) {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const cx = Math.floor(col * cellW + cellW / 2);
    const cy = Math.floor(row * cellH + cellH / 2);
    const rx = Math.floor(cellW * 0.22);
    const ry = Math.floor(cellH * 0.18);
    for (let y = cy - ry; y <= cy + ry; y++) {
      for (let x = cx - rx; x <= cx + rx; x++) {
        const inSubject = ((x - cx) ** 2) / (rx ** 2) + ((y - cy) ** 2) / (ry ** 2) <= 1;
        const inHole = index === 3 && ((x - cx) ** 2) / ((rx * 0.62) ** 2) + ((y - cy) ** 2) / ((ry * 0.62) ** 2) <= 1;
        if (inSubject && !inHole) {
          const i = (y * width + x) * 4;
          rgba[i] = 80;
          rgba[i + 1] = 120;
          rgba[i + 2] = 220;
          rgba[i + 3] = 255;
        }
      }
    }
  }
  return encodeRgbaPng(width, height, rgba);
}

async function zipFetch(base, route) {
  const res = await fetch(base + route);
  const buffer = Buffer.from(await res.arrayBuffer());
  return { status: res.status, contentType: res.headers.get('content-type') || '', buffer, entries: zipEntries(buffer) };
}

const { child, base } = await startServer();
try {
  let res = await jsonFetch(base, '/api/templates');
  ok(res.status === 200 && res.body.templates.length >= 8, 'GET /api/templates returns seed templates', 'api');

  res = await jsonFetch(base, '/api/assets/upload', { method: 'POST', body: JSON.stringify({ mimeType: 'image/png', fileSize: 1234, consent: true }) });
  ok(res.status === 201 && res.body.asset.id, 'legacy metadata upload still creates registry asset', 'api');
  const legacyAssetId = res.body.asset.id;

  res = await jsonFetch(base, `/api/assets/${legacyAssetId}/crop`, { method: 'POST', body: JSON.stringify({ width: 512, height: 512 }) });
  ok(res.status === 200 && res.body.cropState.width === 512, 'legacy crop endpoint still stores crop', 'api');

  res = await jsonFetch(base, '/api/assets/upload', { method: 'POST', body: JSON.stringify({ outputKind: 'line_static_png', demo: true, mimeType: 'image/png', fileSize: 2048 }) });
  ok(res.status === 400 && res.body.error?.code === 'CONSENT_REQUIRED', 'LINE static upload requires explicit consent', 'api');

  res = await jsonFetch(base, '/api/demo/reset', { method: 'POST', body: JSON.stringify({}) });
  ok(res.status === 200 && res.body.wallet.total === 2, 'demo reset restores insufficient wallet', 'api');

  res = await jsonFetch(base, '/api/works', { method: 'POST', body: JSON.stringify({ outputKind: 'line_static_png', sourceAssetId: 'missing', stylePrompt: 'cute sticker', stickerCount: 8 }) });
  ok(res.status === 404 && res.body.error === 'ASSET_NOT_FOUND', 'LINE static work rejects missing source asset without charging', 'api');

  res = await jsonFetch(base, '/api/billing/mock-payment', { method: 'POST', body: JSON.stringify({ packageId: 'starter' }) });
  ok(res.status === 201 && res.body.payment.status === 'created', 'mock payment creates starter package', 'api');
  const paymentId = res.body.payment.id;

  res = await jsonFetch(base, `/api/billing/mock-payment/${paymentId}/complete`, { method: 'POST', body: JSON.stringify({}) });
  ok(res.status === 200 && res.body.wallet.total === 32, 'mock payment completion funds shared wallet', 'api');

  const staticAsset = await jsonFetch(base, '/api/assets/upload', { method: 'POST', body: JSON.stringify({ outputKind: 'line_static_png', demo: true, mimeType: 'image/png', fileSize: 2048, consent: true, fileName: 'demo.png' }) });
  ok(staticAsset.status === 201 && staticAsset.body.asset.id, 'LINE static upload accepts demo source asset', 'api');

  const staticWork = await jsonFetch(base, '/api/works', { method: 'POST', body: JSON.stringify({ outputKind: 'line_static_png', sourceAssetId: staticAsset.body.asset.id, stylePrompt: 'cute bright transparent daily chat sticker', stickerCount: 8, generationMode: 'sheet_crop', title: 'LINE Static Flow Work' }) });
  ok(staticWork.status === 201 && staticWork.body.work.qc_status === 'passed' && staticWork.body.work.generation_strategy === 'sheet_crop' && staticWork.body.work.provider_request_count === 1 && staticWork.body.wallet.total === 26, 'LINE static sheet-crop work generates QC-passed package and commits reduced credits', 'api');

  const detail = await jsonFetch(base, `/api/works/${staticWork.body.work.id}`);
  ok(detail.status === 200 && detail.body.work.images.length === 8 && detail.body.work.download_url, 'LINE static work detail returns images and download URL', 'api');

  const staticZip = await zipFetch(base, `/api/works/${staticWork.body.work.id}/download`);
  const staticFiles = unzipStored(staticZip.buffer);
  ok(staticZip.status === 200 && staticZip.contentType.includes('application/zip'), 'LINE static download returns ZIP', 'api');
  ok(['main.png', 'tab.png', 'images/01.png', 'images/08.png', 'line_sticker_info.json', 'generation_manifest.json', 'qc_report.html'].every((name) => staticZip.entries.includes(name)), 'LINE static ZIP contains required entries', 'api');
  ok(pngDim(staticFiles['main.png']) === '240x240' && pngDim(staticFiles['tab.png']) === '96x74' && pngDim(staticFiles['images/01.png']) === '370x320', 'LINE static ZIP uses official static dimensions', 'api');

  const badSheet = makeEdgeTouchingSheet();
  const badAsset = await jsonFetch(base, '/api/assets/upload', { method: 'POST', body: JSON.stringify({ outputKind: 'line_static_png', dataUrl: `data:image/png;base64,${badSheet.toString('base64')}`, mimeType: 'image/png', fileSize: badSheet.length, consent: true, fileName: 'edge-touching-sheet.png', sourceKind: 'sticker_sheet' }) });
  const badWork = await jsonFetch(base, '/api/works', { method: 'POST', body: JSON.stringify({ outputKind: 'line_static_png', sourceAssetId: badAsset.body.asset.id, stylePrompt: 'strict rejection edge touching sticker sheet', stickerCount: 8, generationMode: 'manual_sheet', title: 'Rejected edge sheet' }) });
  ok(badWork.status === 422 && badWork.body.work.qc_status === 'failed' && !badWork.body.work.download_url && badWork.body.wallet.total === 26 && badWork.body.work.qc_failures.some((failure) => failure.includes('source sheet rejected')), 'strict LINE static QC rejects edge-touching sticker sheets without charging credits', 'api');
  const badDownload = await jsonFetch(base, `/api/works/${badWork.body.work.id}/download`);
  ok(badDownload.status === 409 && badDownload.body.error === 'QC_NOT_PASSED', 'strict LINE static QC blocks download for rejected packages', 'api');

  const damagedSheet = makeDamagedInteriorSheet();
  const damagedAsset = await jsonFetch(base, '/api/assets/upload', { method: 'POST', body: JSON.stringify({ outputKind: 'line_static_png', dataUrl: `data:image/png;base64,${damagedSheet.toString('base64')}`, mimeType: 'image/png', fileSize: damagedSheet.length, consent: true, fileName: 'damaged-interior-sheet.png', sourceKind: 'sticker_sheet' }) });
  const damagedWork = await jsonFetch(base, '/api/works', { method: 'POST', body: JSON.stringify({ outputKind: 'line_static_png', sourceAssetId: damagedAsset.body.asset.id, stylePrompt: 'strict rejection damaged interior sticker sheet', stickerCount: 8, generationMode: 'manual_sheet', title: 'Rejected damaged sheet' }) });
  ok(damagedWork.status === 422 && damagedWork.body.work.qc_status === 'failed' && !damagedWork.body.work.download_url && damagedWork.body.wallet.total === 26 && damagedWork.body.work.qc_failures.some((failure) => failure.includes('interior')), 'strict LINE static QC rejects background-removal interior damage without charging credits', 'api');

  const legacyWork = await jsonFetch(base, '/api/works', { method: 'POST', body: JSON.stringify({ templateId: 'tpl_001', imageCount: 8, title: 'Legacy Browser Flow Work' }) });
  ok(legacyWork.status === 201 && legacyWork.body.wallet.total === 18, 'legacy work path remains available after LINE static flow', 'api');

  for (const page of ['/', '/create', '/works', `/works/${staticWork.body.work.id}`, '/line-guide']) {
    const pageRes = await fetch(base + page);
    ok(pageRes.status === 200, `page ${page} renders`, 'e2e');
  }
  const createHtml = await (await fetch(base + '/create')).text();
  ok(createHtml.length > 1000, 'create page returns hydrated application shell', 'e2e');
} finally {
  if (child) try { process.kill(-child.pid, 'SIGKILL'); } catch { try { child.kill('SIGKILL'); } catch {} }
  await delay(300);
}

console.log(`SUMMARY unit=${unit} api=${api} e2e=${e2e}`);
assert.ok(unit >= 10 && api >= 14 && e2e >= 4, 'required test counts met');
