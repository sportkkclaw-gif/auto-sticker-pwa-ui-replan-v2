import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';

const repo = process.cwd();
const workId = 'work_stage3b_demo_8';
const base = path.join(repo, 'public', 'stage3b-review', workId);
const manifestPath = path.join(base, 'generation_manifest.json');
const providerPath = path.join(base, 'provider_evidence.json');
const zipPath = path.join(base, 'stage3b-line-stickers.zip');
const reviewPagePath = path.join(repo, 'app', 'stage3b-review', '[workId]', 'page.tsx');
const createPagePath = path.join(repo, 'app', 'stage3b-create', 'page.tsx');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function parsePng(buffer) {
  assert(buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47, 'invalid png magic');
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  let pos = 8;
  let colorType = null;
  const idats = [];
  while (pos < buffer.length) {
    const length = buffer.readUInt32BE(pos);
    const type = buffer.subarray(pos + 4, pos + 8).toString('ascii');
    const data = buffer.subarray(pos + 8, pos + 8 + length);
    if (type === 'IHDR') colorType = data[9];
    if (type === 'IDAT') idats.push(data);
    pos += 12 + length;
  }
  return { width, height, colorType, raw: zlib.inflateSync(Buffer.concat(idats)) };
}

function alphaStats(buffer) {
  const parsed = parsePng(buffer);
  assert(parsed.colorType === 6, 'png must be RGBA with alpha; white background is not transparent');
  const stride = parsed.width * 4 + 1;
  let transparent = 0;
  let minX = parsed.width;
  let minY = parsed.height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < parsed.height; y += 1) {
    const row = parsed.raw.subarray(y * stride, (y + 1) * stride);
    assert(row[0] === 0, 'acceptance fixture uses non-filtered PNG rows');
    for (let x = 0; x < parsed.width; x += 1) {
      const alpha = row[1 + x * 4 + 3];
      if (alpha === 0) transparent += 1;
      else {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  const margins = {
    left: minX / parsed.width,
    right: (parsed.width - 1 - maxX) / parsed.width,
    top: minY / parsed.height,
    bottom: (parsed.height - 1 - maxY) / parsed.height,
  };
  return { width: parsed.width, height: parsed.height, transparentRatio: transparent / (parsed.width * parsed.height), margins };
}

assert(fs.existsSync(createPagePath), 'stage3b create page exists');
assert(fs.existsSync(reviewPagePath), 'stage3b review page exists');
assert(fs.existsSync(manifestPath), 'manifest exists');
assert(fs.existsSync(providerPath), 'provider evidence exists');
assert(fs.existsSync(zipPath), 'zip exists');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
assert(manifest.work_id === workId, 'manifest work id matches');
assert(manifest.generated_images_count === 8, '8 generated images');
assert(manifest.independent_png_count === 8, '8 independent png count');
assert(manifest.grid_collage_output === false, 'no grid/collage output flag');
assert(Array.isArray(manifest.generated_images) && manifest.generated_images.length === 8, 'manifest has 8 image records');
for (let i = 1; i <= 8; i += 1) {
  const rel = `images/${String(i).padStart(2, '0')}.png`;
  const imgPath = path.join(base, rel);
  assert(fs.existsSync(imgPath), `${rel} exists`);
  const buffer = fs.readFileSync(imgPath);
  const sha = crypto.createHash('sha256').update(buffer).digest('hex');
  const record = manifest.generated_images[i - 1];
  assert(record.zip_path === rel, `${rel} zip path`);
  assert(record.sha256 === sha, `${rel} sha256 recorded`);
  assert(record.source === 'provider' || record.source === 'fallback', `${rel} source explicit`);
  assert(typeof record.is_real_provider_output === 'boolean', `${rel} real provider boolean`);
  assert(record.grid_collage_detected === false, `${rel} not grid/collage`);
  assert(record.transparent_background_status !== 'pass' || record.alpha_channel === true, `${rel} transparent pass cannot be fake`);
  assert(record.safe_margin_status !== 'pass' || record.needs_regeneration === false, `${rel} safe margin pass cannot be fake`);
  const stats = alphaStats(buffer);
  assert(stats.transparentRatio > 0.15 && stats.transparentRatio < 0.95, `${rel} transparent ratio reasonable`);
  assert(Object.values(stats.margins).every((v) => v >= 0.08), `${rel} safe margin >= 8%`);
  assert(record.width === stats.width && record.height === stats.height, `${rel} dimensions recorded`);
  assert(record.transparent_background_status === 'pass', `${rel} transparent status pass from alpha`);
  assert(record.safe_margin_status === 'pass', `${rel} safe margin status pass from bbox`);
}
const reviewSource = fs.readFileSync(reviewPagePath, 'utf8');
assert(reviewSource.includes('Zoom inspect'), 'review page has zoom inspect');
assert(reviewSource.includes('checker') && reviewSource.includes('dark') && reviewSource.includes('white'), 'review page has background switcher');
assert(reviewSource.includes('Download ZIP'), 'review page has ZIP download');
console.log('acceptance:stage3b PASS');
