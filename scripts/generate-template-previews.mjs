import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const repo = process.cwd();
const outDir = path.join(repo, 'public', 'template-previews');
const model = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1';
const outputSuffix = process.env.TEMPLATE_PREVIEW_OUTPUT_SUFFIX || 'generated';
const manifestPath = path.join(outDir, `${outputSuffix}-manifest.json`);
const size = process.env.TEMPLATE_PREVIEW_IMAGE_SIZE || '1024x1024';
const quality = process.env.TEMPLATE_PREVIEW_IMAGE_QUALITY || 'medium';
const timeoutMs = Number(process.env.TEMPLATE_PREVIEW_TIMEOUT_MS || 240000);
const supportsTransparentBackground = !model.includes('gpt-image-2');

function readEnv(file) {
  const out = {};
  if (!fs.existsSync(file)) return out;
  for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const index = line.indexOf('=');
    out[line.slice(0, index).trim()] = line.slice(index + 1).trim().replace(/^['"]|['"]$/g, '');
  }
  return out;
}

const fileEnv = readEnv(path.join(repo, '.env.local'));
const apiKey = process.env.OPENAI_API_KEY || fileEnv.OPENAI_API_KEY || '';
if (!apiKey) throw new Error('OPENAI_API_KEY missing');

const templates = [
  {
    id: 'tpl_001',
    name: '日常大字包',
    slug: 'daily-big-text',
    prompt: 'Create one finished LINE static sticker PNG preview for a daily big text sticker pack. Original cute round character holding a sign with large Traditional Chinese text "早安". Transparent background, single sticker, centered, safe margin, clean commercial sticker art, crisp edges, no collage, no grid, no watermark, not imitating any existing IP.',
  },
  {
    id: 'tpl_002',
    name: '寵物變貼圖',
    slug: 'pet-character',
    prompt: 'Create one finished LINE static sticker PNG preview for a pet character sticker pack. Original cute small dog or cat mascot, happy expression, soft rounded body, transparent background, single sticker, centered, safe margin, clean commercial sticker art, no text, no collage, no grid, no watermark, not imitating any existing IP.',
  },
  {
    id: 'tpl_003',
    name: '上班快速回覆',
    slug: 'work-reply',
    prompt: 'Create one finished LINE static sticker PNG preview for an office quick reply sticker pack. Original cute office worker mascot with briefcase, slightly tired but friendly, holding a small sign with Traditional Chinese text "收到". Transparent background, single sticker, centered, safe margin, clean commercial sticker art, no collage, no grid, no watermark.',
  },
  {
    id: 'tpl_004',
    name: '大臉反應包',
    slug: 'big-face-reaction',
    prompt: 'Create one finished LINE static sticker PNG preview for a big face reaction sticker pack. Original cute character with oversized face, shocked expression, tiny motion marks, transparent background, single sticker, centered, safe margin, clean commercial sticker art, no text, no collage, no grid, no watermark.',
  },
  {
    id: 'tpl_005',
    name: '台味口頭禪',
    slug: 'taiwan-slang',
    prompt: 'Create one finished LINE static sticker PNG preview for a Taiwanese daily slang sticker pack. Original cute character with bubble tea, cheerful expression, holding a small sign with Traditional Chinese text "賀啦". Transparent background, single sticker, centered, safe margin, warm Taiwan street-life feeling, clean commercial sticker art, no collage, no grid, no watermark.',
  },
  {
    id: 'tpl_006',
    name: '戀愛撒嬌包',
    slug: 'love-cute',
    prompt: 'Create one finished LINE static sticker PNG preview for a love and cute flirting sticker pack. Original cute character hugging a heart, warm affectionate expression, transparent background, single sticker, centered, safe margin, clean commercial sticker art, no text, no collage, no grid, no watermark, do not imitate LOVE RABBIT or any existing IP.',
  },
  {
    id: 'tpl_007',
    name: '眼淚情緒包',
    slug: 'cry-emotion',
    prompt: 'Create one finished LINE static sticker PNG preview for a crying emotion sticker pack. Original cute character crying dramatically with big tears, still adorable and safe, transparent background, single sticker, centered, safe margin, clean commercial sticker art, no text, no collage, no grid, no watermark.',
  },
  {
    id: 'tpl_008',
    name: '水潤療癒風',
    slug: 'jelly-healing',
    prompt: 'Create one finished LINE static sticker PNG preview for a watery jelly healing sticker pack. Original small translucent jelly-drop mascot with sparkling eyes, soft glossy texture, transparent background, single sticker, centered, safe margin, clean commercial sticker art, no text, no collage, no grid, no watermark.',
  },
];

const sha256 = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex');
fs.mkdirSync(outDir, { recursive: true });

async function generate(template) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error('TIMEOUT')), timeoutMs);
  const started = Date.now();
  try {
    const body = {
      model,
      prompt: supportsTransparentBackground ? template.prompt : `${template.prompt} Use a plain light neutral background if transparent background is not available from the model.`,
      n: 1,
      size,
      quality,
      output_format: 'png',
    };
    if (supportsTransparentBackground) body.background = 'transparent';
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const requestId = res.headers.get('x-request-id') || res.headers.get('openai-request-id') || null;
    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch { json = { raw: text.slice(0, 300) }; }
    if (!res.ok) {
      const err = json?.error || {};
      throw new Error(`OpenAI ${res.status} ${err.code || err.type || ''} ${String(err.message || 'request failed').slice(0, 180)}`);
    }
    const item = json?.data?.[0];
    if (!item) throw new Error('OpenAI response missing data[0]');
    let bytes;
    if (item.b64_json) bytes = Buffer.from(item.b64_json, 'base64');
    else if (item.url) {
      const imageRes = await fetch(item.url);
      if (!imageRes.ok) throw new Error(`image url fetch ${imageRes.status}`);
      bytes = Buffer.from(await imageRes.arrayBuffer());
    } else {
      throw new Error('OpenAI output missing b64_json/url');
    }
    const fileName = `${template.slug}-${outputSuffix}.png`;
    const filePath = path.join(outDir, fileName);
    fs.writeFileSync(filePath, bytes);
    return {
      id: template.id,
      name: template.name,
      file: `/template-previews/${fileName}`,
      provider: 'openai',
      provider_name: 'OpenAI Images API',
      model,
      request_id: requestId,
      response_id: json.id || null,
      provider_image_id: item.id || null,
      prompt: template.prompt,
      byte_size: bytes.length,
      sha256: sha256(bytes),
      latency_ms: Date.now() - started,
      generated_at: new Date().toISOString(),
      is_generated_preview: true,
    };
  } finally {
    clearTimeout(timer);
  }
}

const outputs = [];
for (const template of templates) {
  console.log(`generate_template_preview ${template.id} ${template.name}`);
  outputs.push(await generate(template));
}

fs.writeFileSync(manifestPath, JSON.stringify({
  generated_at: new Date().toISOString(),
  provider: 'openai',
  provider_name: 'OpenAI Images API',
  model,
  output_suffix: outputSuffix,
  size,
  quality,
  transparent_background_requested: supportsTransparentBackground,
  count: outputs.length,
  outputs,
}, null, 2));

console.log(`generated ${outputs.length} template previews`);
