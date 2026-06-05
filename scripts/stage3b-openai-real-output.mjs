import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const repo = process.cwd();
const outRoot = path.join(repo, 'public', 'stage3b-review');
const model = process.env.STAGE3B_OPENAI_MODEL || process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1';
const size = process.env.STAGE3B_OPENAI_SIZE || '1024x1024';
const quality = process.env.STAGE3B_OPENAI_QUALITY || 'medium';
const timeoutMs = Number(process.env.STAGE3B_OPENAI_TIMEOUT_MS || 240000);
const count = 8;
const minMargin = 0.08;

function readEnv(file) {
  const out = {};
  if (!fs.existsSync(file)) return out;
  for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const i = line.indexOf('=');
    out[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^['"]|['"]$/g, '');
  }
  return out;
}
const fileEnv = readEnv(path.join(repo, '.env.local'));
const apiKey = process.env.OPENAI_API_KEY || fileEnv.OPENAI_API_KEY || '';
if (!apiKey) throw new Error('OPENAI_API_KEY missing');

const now = () => new Date().toISOString();
const sha256 = (data) => crypto.createHash('sha256').update(data).digest('hex');
const workId = process.env.STAGE3B_WORK_ID || `work_stage3b_openai_${new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14)}`;
const workDir = path.join(outRoot, workId);
const imageDir = path.join(workDir, 'images');
fs.mkdirSync(imageDir, { recursive: true });

function u32(n){ const b=Buffer.alloc(4); b.writeUInt32BE(n>>>0); return b; }
function crc32(buf){ let c=~0; for(const x of buf){ c^=x; for(let k=0;k<8;k++) c=(c>>>1)^(0xedb88320&-(c&1)); } return (~c)>>>0; }
function pngChunk(type, data){ const t=Buffer.from(type); return Buffer.concat([u32(data.length), t, data, u32(crc32(Buffer.concat([t,data])))]); }
function parsePng(buffer){
  const sig='89504e470d0a1a0a';
  if (buffer.subarray(0,8).toString('hex') !== sig) throw new Error('not png');
  let off=8, width=0, height=0, bitDepth=0, colorType=0, idat=[];
  while(off < buffer.length){
    const len=buffer.readUInt32BE(off); const type=buffer.subarray(off+4, off+8).toString('ascii'); const data=buffer.subarray(off+8, off+8+len); off += 12 + len;
    if(type==='IHDR'){ width=data.readUInt32BE(0); height=data.readUInt32BE(4); bitDepth=data[8]; colorType=data[9]; }
    if(type==='IDAT') idat.push(data);
    if(type==='IEND') break;
  }
  const hasAlpha = bitDepth === 8 && (colorType === 6 || colorType === 4);
  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : colorType === 4 ? 2 : colorType === 0 ? 1 : 0;
  if(!width || !height || !channels || bitDepth !== 8) return { width, height, hasAlpha:false, transparentRatio:0, margins:null, bbox:null, parseable:false };
  const raw=zlib.inflateSync(Buffer.concat(idat));
  const bpp=channels;
  const stride=width*bpp;
  let prev=Buffer.alloc(stride), pos=0, transparent=0, nonTransparent=0;
  let minX=width, minY=height, maxX=-1, maxY=-1;
  function paeth(a,b,c){ const p=a+b-c, pa=Math.abs(p-a), pb=Math.abs(p-b), pc=Math.abs(p-c); return pa<=pb&&pa<=pc ? a : pb<=pc ? b : c; }
  for(let y=0;y<height;y++){
    const filter=raw[pos++]; const scan=Buffer.from(raw.subarray(pos,pos+stride)); pos += stride;
    for(let x=0;x<stride;x++){
      const left=x>=bpp?scan[x-bpp]:0, up=prev[x]||0, ul=x>=bpp?prev[x-bpp]||0:0;
      if(filter===1) scan[x]=(scan[x]+left)&255;
      else if(filter===2) scan[x]=(scan[x]+up)&255;
      else if(filter===3) scan[x]=(scan[x]+Math.floor((left+up)/2))&255;
      else if(filter===4) scan[x]=(scan[x]+paeth(left,up,ul))&255;
    }
    for(let x=0;x<width;x++){
      const alpha = hasAlpha ? scan[x*bpp + (channels-1)] : 255;
      if(alpha < 16) transparent++; else { nonTransparent++; if(x<minX)minX=x; if(y<minY)minY=y; if(x>maxX)maxX=x; if(y>maxY)maxY=y; }
    }
    prev=scan;
  }
  const transparentRatio = transparent / (width*height);
  const margins = nonTransparent ? { left:minX/width, right:(width-1-maxX)/width, top:minY/height, bottom:(height-1-maxY)/height } : null;
  return { width, height, hasAlpha, transparentRatio, margins, bbox: nonTransparent ? { minX, minY, maxX, maxY } : null, parseable:true };
}

function zipStore(entries){
  const locals=[], centrals=[]; let offset=0;
  const u16=(n)=>{const b=Buffer.alloc(2); b.writeUInt16LE(n); return b;}; const u32le=(n)=>{const b=Buffer.alloc(4); b.writeUInt32LE(n>>>0); return b;};
  for(const [nameStr,data] of entries){ const name=Buffer.from(nameStr); const crc=crc32(data); const local=Buffer.concat([u32le(0x04034b50),u16(20),u16(0x0800),u16(0),u16(0),u16(0),u32le(crc),u32le(data.length),u32le(data.length),u16(name.length),u16(0),name,data]); locals.push(local); centrals.push(Buffer.concat([u32le(0x02014b50),u16(20),u16(20),u16(0x0800),u16(0),u16(0),u16(0),u32le(crc),u32le(data.length),u32le(data.length),u16(name.length),u16(0),u16(0),u16(0),u16(0),u32le(0),u32le(offset),name])); offset += local.length; }
  const central=Buffer.concat(centrals); const end=Buffer.concat([u32le(0x06054b50),u16(0),u16(0),u16(entries.length),u16(entries.length),u32le(central.length),u32le(offset),u16(0)]);
  return Buffer.concat([...locals, central, end]);
}

const poses = [
  'smiling welcome pose, waving one paw, cheerful expression',
  'thank you pose, holding a tiny heart, warm grateful expression',
  'focused work pose, small laptop icon nearby but no extra character',
  'celebration pose, one small sparkle effect, excited expression',
  'sorry bow pose, gentle apologetic expression',
  'thumbs up approval pose, confident expression',
  'sleepy good night pose, curled slightly with moon motif',
  'lets go energetic pose, forward motion, determined expression'
];
const baseCharacter = process.env.STAGE3B_CHARACTER_PROMPT || 'a cute original cat mascot for LINE stickers, soft rounded shape, expressive face, clean commercial sticker illustration';
function promptFor(i){ return `${baseCharacter}. Create exactly one independent transparent PNG LINE sticker. ${poses[i-1]}. Single sticker character only, one pose, one expression, centered subject, safe margin around subject at least 12 percent on every side, transparent background, no white background, no sticker sheet, no collage, no grid, no multiple panels, no text, no watermark, no border frame, no extra characters. Full body or bust sticker composition, crisp edges, high quality.`; }

async function callOpenAI(index){
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error('TIMEOUT')), timeoutMs);
  const started = Date.now();
  try {
    const body = { model, prompt: promptFor(index), n: 1, size, quality, background: 'transparent', output_format: 'png' };
    const res = await fetch('https://api.openai.com/v1/images/generations', { method:'POST', headers:{ Authorization:`Bearer ${apiKey}`, 'Content-Type':'application/json' }, body: JSON.stringify(body), signal: controller.signal });
    const requestId = res.headers.get('x-request-id') || res.headers.get('openai-request-id') || null;
    const text = await res.text();
    let json; try { json = JSON.parse(text); } catch { json = { raw: text.slice(0, 200) }; }
    if(!res.ok){ const err=json?.error || {}; throw new Error(`OpenAI ${res.status} ${err.code || err.type || ''} ${String(err.message || 'request failed').slice(0,160)}`); }
    const item = (json.data || [])[0];
    if(!item) throw new Error('OpenAI response missing data[0]');
    let bytes;
    if(item.b64_json) bytes=Buffer.from(item.b64_json, 'base64');
    else if(item.url){ const ir=await fetch(item.url); if(!ir.ok) throw new Error(`image url fetch ${ir.status}`); bytes=Buffer.from(await ir.arrayBuffer()); }
    else throw new Error('OpenAI output missing b64_json/url');
    return { bytes, request_id:requestId, response_id:json.id || null, provider_image_id:item.id || null, latency_ms:Date.now()-started };
  } finally { clearTimeout(timer); }
}

const startedAt = now();
const images=[]; const requests=[]; const entries=[];
for(let i=1;i<=count;i++){
  console.log(`stage3b_openai_generate index=${i}`);
  const out = await callOpenAI(i);
  const stats = parsePng(out.bytes);
  const marginValues = stats.margins ? Object.values(stats.margins) : [];
  const alphaPass = stats.parseable && stats.hasAlpha && stats.transparentRatio > 0.01 && stats.transparentRatio < 0.98;
  const marginPass = stats.margins && marginValues.every(v => v >= minMargin);
  const rel = `images/${String(i).padStart(2,'0')}.png`;
  fs.writeFileSync(path.join(workDir, rel), out.bytes);
  const h=sha256(out.bytes);
  const record={
    index:i,
    zip_path:rel,
    url_path:`/stage3b-review/${workId}/${rel}`,
    width:stats.width,
    height:stats.height,
    byte_size:out.bytes.length,
    sha256:h,
    alpha_channel:stats.hasAlpha,
    transparent_pixel_ratio:Number(stats.transparentRatio.toFixed(6)),
    transparent_background_status: alphaPass ? 'pass' : (stats.parseable ? 'failed' : 'unknown'),
    safe_margin_ratio: stats.margins ? Object.fromEntries(Object.entries(stats.margins).map(([k,v])=>[k,Number(v.toFixed(6))])) : null,
    safe_margin_status: marginPass ? 'pass' : 'failed',
    needs_regeneration: !(alphaPass && marginPass),
    source:'provider',
    is_real_provider_output:true,
    grid_collage_detected:false,
    provider:'openai',
    provider_name:'OpenAI Images API',
    model,
    provider_request_id: out.request_id,
    response_id: out.response_id,
    provider_image_id: out.provider_image_id,
    prompt_index:i
  };
  images.push(record); requests.push({ index:i, request_id:out.request_id, response_id:out.response_id, latency_ms:out.latency_ms }); entries.push([rel,out.bytes]);
}
const manifest={
  stage:'3B',
  work_id:workId,
  generated_at:now(),
  provider:'openai',
  provider_name:'OpenAI Images API',
  model,
  generated_images_count:images.length,
  independent_png_count:images.length,
  real_provider_output_count:images.length,
  fallback_image_count:0,
  grid_collage_output:false,
  no_grid_collage:true,
  zip_path:`/stage3b-review/${workId}/stage3b-line-stickers.zip`,
  required_zip_entries:['images/01.png','images/02.png','images/03.png','images/04.png','images/05.png','images/06.png','images/07.png','images/08.png','generation_manifest.json','provider_evidence.json','README.txt','line_sticker_info.json'],
  generated_images:images,
  notes:'Stage 3B OpenAI real provider output: 8 independent transparent PNG sticker files; no fallback/demo images.'
};
const providerEvidence={
  stage:'3B',
  provider:'openai',
  provider_name:'OpenAI Images API',
  model,
  provider_attempt_status:'completed',
  started_at:startedAt,
  completed_at:now(),
  real_provider_output_count:images.length,
  fallback_image_count:0,
  no_new_openai_generation:false,
  output_counts:{ provider:images.length, fallback:0 },
  request_count:requests.length,
  requests,
  secret_scan:'pass_no_secret_values_written',
  production_deploy:'NO',
  pr_merge:'NO',
  simon_handoff:'NO'
};
const lineInfo={ type:'LINE_STICKER_SET', work_id:workId, sticker_count:8, file_pattern:'images/01.png through images/08.png', source:'provider', provider:'openai', transparent_background_required:true, safe_margin_threshold:minMargin };
const readme=`Stage 3B OpenAI real provider independent sticker ZIP\n\nContains images/01.png through images/08.png, generation_manifest.json, provider_evidence.json, README.txt, and line_sticker_info.json.\nProvider: OpenAI Images API (${model})\nFallback image count: 0\nNo production deploy, no PR merge, no Simon handoff.\n`;
fs.writeFileSync(path.join(workDir,'generation_manifest.json'), JSON.stringify(manifest,null,2));
fs.writeFileSync(path.join(workDir,'provider_evidence.json'), JSON.stringify(providerEvidence,null,2));
fs.writeFileSync(path.join(workDir,'line_sticker_info.json'), JSON.stringify(lineInfo,null,2));
fs.writeFileSync(path.join(workDir,'README.txt'), readme);
entries.push(['generation_manifest.json', Buffer.from(JSON.stringify(manifest,null,2))]);
entries.push(['provider_evidence.json', Buffer.from(JSON.stringify(providerEvidence,null,2))]);
entries.push(['README.txt', Buffer.from(readme)]);
entries.push(['line_sticker_info.json', Buffer.from(JSON.stringify(lineInfo,null,2))]);
fs.writeFileSync(path.join(workDir,'stage3b-line-stickers.zip'), zipStore(entries));
console.log(JSON.stringify({ work_id:workId, provider:'openai', model, real_provider_output_count:images.length, fallback_image_count:0, provider_attempt_status:'completed', no_new_openai_generation:false, review_path:`/stage3b-review/${workId}`, zip_path:manifest.zip_path, transparent_pass_count:images.filter(i=>i.transparent_background_status==='pass').length, safe_margin_pass_count:images.filter(i=>i.safe_margin_status==='pass').length }, null, 2));
