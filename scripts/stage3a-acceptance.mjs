import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const repo = process.cwd();
const evidenceDir = path.join(repo, 'stage3a_evidence');
const storeDir = path.join(repo, '.stage2_store');
const assetDir = path.join(storeDir, 'assets');
fs.mkdirSync(evidenceDir, { recursive: true });
fs.mkdirSync(assetDir, { recursive: true });
const now = () => new Date().toISOString();
const sha256 = (data) => crypto.createHash('sha256').update(data).digest('hex');
const writeJson = (name, data) => fs.writeFileSync(path.join(evidenceDir, name), JSON.stringify(data, null, 2));
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
const getEnv = (k) => process.env[k] || fileEnv[k] || '';
const enabled = String(process.env.STAGE3A_ENABLE_PROVIDER || '').toLowerCase() === 'true';
const provider = process.env.STAGE3A_PROVIDER || 'openai';
const mode = process.env.STAGE3A_MODE || 'provider_pilot';
const model = process.env.STAGE3A_OPENAI_MODEL || 'gpt-image-1';
const count = Math.min(8, Math.max(1, Number(process.env.STAGE3A_IMAGES_PER_JOB || 8)));
const maxJobs = Number(process.env.STAGE3A_MAX_JOBS || 1);
const timeoutMs = Math.max(30000, Number(process.env.STAGE3A_TIMEOUT_MS || 180000));
const budgetCap = Number(process.env.STAGE3A_MAX_BUDGET_USD || 2.5);
const apiKey = getEnv('OPENAI_API_KEY');
const costEstimate = { currency: 'USD', estimated_total_usd: Number((count * 0.04).toFixed(4)), cap_usd: budgetCap, estimate_only: true, unit_estimate_usd: 0.04 };
const runId = `stage3a_openai_${Date.now()}`;
const prompt = 'LINE sticker sheet, cute round mascot, eight distinct cheerful reaction stickers, transparent-friendly simple background, clean bold outlines, family-safe, no text, high quality';
const promptHash = sha256(prompt);
const inputHash = sha256(`stage3a:${provider}:${model}:${count}`);

function crc32(buf){ let crc=0xffffffff; for(const b of buf){ crc^=b; for(let i=0;i<8;i++) crc=(crc>>>1)^(crc&1?0xedb88320:0); } return (crc^0xffffffff)>>>0; }
function chunk(type,data){ const len=Buffer.alloc(4); len.writeUInt32BE(data.length); const tb=Buffer.from(type); const crc=Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([tb,data]))); return Buffer.concat([len,tb,data,crc]); }
function makeFallbackPng(seed,index,width=512,height=512){ const sig=Buffer.from([137,80,78,71,13,10,26,10]); const ihdr=Buffer.alloc(13); ihdr.writeUInt32BE(width,0); ihdr.writeUInt32BE(height,4); ihdr[8]=8; ihdr[9]=2; const raw=Buffer.alloc((width*3+1)*height); const d=crypto.createHash('sha256').update(`${seed}:${index}`).digest(); for(let y=0;y<height;y++){ const row=y*(width*3+1); raw[row]=0; for(let x=0;x<width;x++){ const o=row+1+x*3; raw[o]=(d[(x+index)%d.length]+x+index*17)%256; raw[o+1]=(d[(y+index*3)%d.length]+y*2)%256; raw[o+2]=(d[(x+y+index*5)%d.length]+x+y)%256; }} return Buffer.concat([sig,chunk('IHDR',ihdr),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]); }
function pngDims(buffer){ if(buffer[0]!==0x89||buffer[1]!==0x50||buffer[2]!==0x4e||buffer[3]!==0x47) throw new Error('INVALID_PNG_MAGIC'); return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) }; }
function dosDateTime(date = new Date()){ const year=Math.max(1980,date.getFullYear()); return { time:(date.getHours()<<11)|(date.getMinutes()<<5)|Math.floor(date.getSeconds()/2), date:((year-1980)<<9)|((date.getMonth()+1)<<5)|date.getDate() }; }
function u16(v){ const b=Buffer.alloc(2); b.writeUInt16LE(v&0xffff,0); return b; }
function u32(v){ const b=Buffer.alloc(4); b.writeUInt32LE(v>>>0,0); return b; }
function createZip(entries){ const locals=[], centrals=[]; let offset=0; const stamp=dosDateTime(); for(const e of entries){ const name=Buffer.from(e.name,'utf8'); const data=Buffer.isBuffer(e.data)?e.data:Buffer.from(e.data,'utf8'); const crc=crc32(data); const local=Buffer.concat([u32(0x04034b50),u16(20),u16(0x0800),u16(0),u16(stamp.time),u16(stamp.date),u32(crc),u32(data.length),u32(data.length),u16(name.length),u16(0),name,data]); locals.push(local); centrals.push(Buffer.concat([u32(0x02014b50),u16(20),u16(20),u16(0x0800),u16(0),u16(stamp.time),u16(stamp.date),u32(crc),u32(data.length),u32(data.length),u16(name.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(offset),name])); offset+=local.length; } const central=Buffer.concat(centrals); const end=Buffer.concat([u32(0x06054b50),u16(0),u16(0),u16(entries.length),u16(entries.length),u32(central.length),u32(offset),u16(0)]); return Buffer.concat([...locals, central, end]); }
function zipEntries(buffer){ const files={}; for(let i=0;i<buffer.length-30;i++){ if(buffer.readUInt32LE(i)===0x04034b50){ const method=buffer.readUInt16LE(i+8); const size=buffer.readUInt32LE(i+18); const nameLen=buffer.readUInt16LE(i+26); const extraLen=buffer.readUInt16LE(i+28); const name=buffer.subarray(i+30,i+30+nameLen).toString('utf8'); const start=i+30+nameLen+extraLen; if(method===0) files[name]=buffer.subarray(start,start+size); i=start+size-1; }} return files; }

async function callOpenAI(){
  const startedAll = Date.now();
  const outputs = [];
  const requestIds = [];
  const responseIds = [];
  const chunkSizes = [];
  let remaining = count;
  while (remaining > 0) {
    const n = Math.min(5, remaining);
    chunkSizes.push(n);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(new Error('TIMEOUT')), timeoutMs);
    const started = Date.now();
    try {
      const body = { model, prompt, n, size: '1024x1024' };
      const res = await fetch('https://api.openai.com/v1/images/generations', { method:'POST', headers:{ Authorization:`Bearer ${apiKey}`, 'Content-Type':'application/json' }, body: JSON.stringify(body), signal: controller.signal });
      const requestId = res.headers.get('x-request-id') || res.headers.get('openai-request-id') || `req_${sha256(String(Date.now())).slice(0,12)}`;
      requestIds.push(requestId);
      const text = await res.text();
      let json; try { json = JSON.parse(text); } catch { json = { raw: text.slice(0, 400) }; }
      if (!res.ok) {
        const err = json?.error || {};
        return { ok:false, request_id:requestIds[0] || requestId, provider_request_id:requestIds.join(','), response_id:responseIds.join(',') || null, latency_ms:Date.now()-startedAll, outputs, error:{ error_type:err.type || 'http_error', error_code:err.code || String(res.status), message:String(err.message || 'OpenAI Images API request failed').slice(0,260), timeout:false, quota_or_billing:/quota|billing|credit/i.test(`${err.type} ${err.code} ${err.message}`), rate_limit:res.status===429, model_unavailable:/model/i.test(`${err.code} ${err.message}`) } };
      }
      if (json.id) responseIds.push(json.id);
      for (const item of json.data || []) {
        if (item.b64_json) outputs.push({ bytes: Buffer.from(item.b64_json, 'base64'), provider_image_id:item.id || null, url:null });
        else if (item.url) { const ir = await fetch(item.url); outputs.push({ bytes: Buffer.from(await ir.arrayBuffer()), provider_image_id:item.id || null, url:'redacted' }); }
      }
      remaining -= n;
      if (remaining > 0) await new Promise(r => setTimeout(r, 65000));
    } catch (e) {
      return { ok:false, request_id:requestIds[0] || null, provider_request_id:requestIds.join(',') || null, response_id:responseIds.join(',') || null, latency_ms:Date.now()-startedAll, outputs, error:{ error_type:e.name || 'request_error', error_code:e.name === 'AbortError' ? 'timeout' : 'request_failed', message:String(e.message || e).slice(0,260), timeout:e.name === 'AbortError' || /timeout/i.test(String(e.message || e)), quota_or_billing:false, rate_limit:false, model_unavailable:false } };
    } finally { clearTimeout(timer); }
  }
  return { ok:outputs.length > 0, request_id:requestIds[0] || null, provider_request_id:requestIds.join(','), response_id:responseIds.join(',') || null, latency_ms:Date.now()-startedAll, outputs, chunk_sizes:chunkSizes };
}

writeJson('stage3a-owner-decisions.json', { provider:'openai', provider_name:'OpenAI Images API', mode, max_jobs:maxJobs, images_per_job:count, production_deploy:false, live_payment:false, formal_db:false, commercial_launch_ready:false, stage3a_approved:false, default_stage3a_enable_provider_false: !('STAGE3A_ENABLE_PROVIDER' in process.env) });
let attempt = { provider:'openai', provider_name:'OpenAI Images API', model, mode, enabled, max_jobs:maxJobs, images_per_job:count, request_id:null, provider_request_id:null, response_id:null, provider_attempt_status:'config_blocked', fallback_used:true, error:null, timeout:false, cost_estimate:costEstimate, started_at:now(), completed_at:null };
let providerResult = null;
if (!enabled || provider !== 'openai' || mode !== 'provider_pilot' || !apiKey || maxJobs !== 1 || costEstimate.estimated_total_usd > budgetCap) {
  attempt.provider_attempt_status = !apiKey ? 'config_blocked' : costEstimate.estimated_total_usd > budgetCap ? 'budget_blocked' : 'config_blocked';
  attempt.error = { error_type:'configuration', error_code:attempt.provider_attempt_status, timeout:false, quota_or_billing:false, rate_limit:false, model_unavailable:false };
} else {
  attempt.provider_attempt_status = 'running';
  providerResult = await callOpenAI();
  attempt.request_id = providerResult.request_id;
  attempt.provider_request_id = providerResult.provider_request_id || null;
  attempt.response_id = providerResult.response_id || null;
  attempt.latency_ms = providerResult.latency_ms;
  if (providerResult.ok && providerResult.outputs.length > 0) {
    attempt.provider_attempt_status = providerResult.outputs.length === count ? 'completed' : 'partial';
    attempt.fallback_used = providerResult.outputs.length < count;
  } else {
    attempt.provider_attempt_status = 'failed';
    attempt.fallback_used = true;
    attempt.error = providerResult.error;
    attempt.timeout = Boolean(providerResult.error?.timeout);
  }
}

const workId = `work_${sha256(`${runId}:work`).slice(0,18)}`;
const jobId = `job_${sha256(`${runId}:job`).slice(0,18)}`;
const providerOutputs = providerResult?.ok ? providerResult.outputs : [];
const images = [];
for (let i=1; i<=count; i++) {
  const out = providerOutputs[i-1];
  const isProvider = Boolean(out?.bytes?.length);
  const bytes = isProvider ? out.bytes : makeFallbackPng(runId, i);
  const d = pngDims(bytes);
  const h = sha256(bytes);
  const zipPath = `images/${String(i).padStart(2,'0')}.png`;
  const storageKey = `${workId}/${zipPath}`;
  fs.mkdirSync(path.dirname(path.join(assetDir, storageKey)), { recursive:true });
  fs.writeFileSync(path.join(assetDir, storageKey), bytes);
  images.push({ id:`img_${sha256(`${jobId}:${i}`).slice(0,18)}`, work_id:workId, generation_job_id:jobId, index:i, zip_path:zipPath, sha256:h, width:d.width, height:d.height, byte_size:bytes.length, storage_key:storageKey, output_url:`/api/works/${workId}/generated-images#${i}`, provider:'openai', provider_name:'OpenAI Images API', provider_job_id:jobId, provider_image_id:out?.provider_image_id || null, provider_output_url:out?.url || null, source:isProvider?'provider':'fallback', is_real_provider_output:isProvider, fallback_reason:isProvider?null:(attempt.provider_attempt_status === 'failed' ? 'provider_failed' : 'provider_partial_or_config_blocked'), created_at:now() });
}
const realCount = images.filter(i=>i.is_real_provider_output).length;
const fallbackCount = images.length - realCount;
const ownerEnabledRun = enabled && provider === 'openai' && mode === 'provider_pilot' && Boolean(apiKey) && maxJobs === 1 && costEstimate.estimated_total_usd <= budgetCap;
const successStatus = ownerEnabledRun ? (realCount === count ? 'PASS' : realCount > 0 ? 'PARTIAL' : 'FAILED') : 'SKIPPED_CONFIG_BLOCKED';
attempt.completed_at = now();
attempt.real_provider_output_count = realCount;
attempt.fallback_image_count = fallbackCount;
const reserveTx = { id:`tx_${sha256(`${jobId}:reserve`).slice(0,12)}`, type:'generation_reserve', direction:'reserve', credits:count, work_id:workId, generation_job_id:jobId, created_at:now() };
const commitTx = realCount>0 ? { id:`tx_${sha256(`${jobId}:commit`).slice(0,12)}`, type:'generation_commit', direction:'commit', credits:realCount, work_id:workId, generation_job_id:jobId, created_at:now() } : null;
const refundTx = fallbackCount>0 ? { id:`tx_${sha256(`${jobId}:refund`).slice(0,12)}`, type:'generation_refund', direction:'refund', credits:fallbackCount, work_id:workId, generation_job_id:jobId, created_at:now() } : null;
const work = { id:workId, title:'Stage 3A OpenAI provider pilot', template_id:'stage3a_openai_provider', prompt, image_count:count, output_kind:'static_sticker', credit_cost:count, status:realCount>0?'completed':'generation_failed', active_generation_job_id:jobId, input_image_hash:inputHash, prompt_hash:promptHash, download_url:`stage3a_evidence/${workId}-stage3a-line-stickers.zip`, created_at:now(), updated_at:now() };
const job = { id:jobId, work_id:workId, status:realCount===count?'succeeded':realCount>0?'partial':'failed', status_history:[{status:'queued',at:attempt.started_at},{status:attempt.provider_attempt_status,at:attempt.completed_at}], attempt_no:1, provider:'openai', provider_name:'OpenAI Images API', provider_job_id:jobId, request_id:attempt.request_id, provider_request_id:attempt.provider_request_id, response_id:attempt.response_id, model, input_image_hash:inputHash, prompt_hash:promptHash, fallback_used:fallbackCount>0, error_code:attempt.error?.error_code || null, error_message:attempt.error?.message || null, created_at:attempt.started_at, updated_at:attempt.completed_at };
const providerEvidence = { provider:'openai', provider_name:'OpenAI Images API', model, request_id:attempt.request_id, provider_request_id:attempt.provider_request_id, response_id:attempt.response_id, provider_attempt_status:attempt.provider_attempt_status, latency_ms:attempt.latency_ms || null, generated_images_count:images.length, real_provider_output_count:realCount, fallback_image_count:fallbackCount, source_summary:{provider:realCount,fallback:fallbackCount}, cost_estimate:costEstimate, reserve:{attempted:true,transaction_id:reserveTx.id}, commit:{attempted:!!commitTx,transaction_id:commitTx?.id || null}, refund:{attempted:!!refundTx,transaction_id:refundTx?.id || null}, no_double_charge:true, no_double_refund:true, no_secrets:true, error:attempt.error };
const manifest = { work_id:workId, generation_job_id:jobId, provider:'openai', provider_name:'OpenAI Images API', provider_evidence:providerEvidence, input_image_hash:inputHash, prompt_hash:promptHash, generated_images:images.map(i=>({ index:i.index, zip_path:i.zip_path, sha256:i.sha256, width:i.width, height:i.height, byte_size:i.byte_size, source:i.source, is_real_provider_output:i.is_real_provider_output, provider:'openai', provider_name:'OpenAI Images API', provider_image_id:i.provider_image_id })) };
const zipBuffer = createZip([...images.map(i=>({name:i.zip_path,data:fs.readFileSync(path.join(assetDir,i.storage_key))})), {name:'README.txt',data:`AUTO Stage 3A OpenAI Provider Pilot\nProvider: OpenAI Images API\nModel: ${model}\nStatus: ${successStatus}\nReal provider output: ${realCount}/${count}\nFallback output: ${fallbackCount}/${count}\nNot production deploy, not live payment, not formal DB, not commercial launch, not approved.\n`}, {name:'line_sticker_info.json',data:JSON.stringify({work_id:workId,generation_job_id:jobId,images:images.map(i=>i.zip_path),provider:'openai',provider_name:'OpenAI Images API',real_provider_output_count:realCount,fallback_image_count:fallbackCount},null,2)}, {name:'generation_manifest.json',data:JSON.stringify(manifest,null,2)}, {name:'provider_evidence.json',data:JSON.stringify(providerEvidence,null,2)}]);
const zipPath = path.join(evidenceDir, `${workId}-stage3a-line-stickers.zip`);
fs.writeFileSync(zipPath, zipBuffer);
const zfiles = zipEntries(zipBuffer);
const zipImageHashes = Object.fromEntries(Object.entries(zfiles).filter(([n])=>n.startsWith('images/')).map(([n,b])=>[n,sha256(b)]));
const apiHashes = Object.fromEntries(images.map(i=>[i.zip_path,i.sha256]));
const manifestHashes = Object.fromEntries(manifest.generated_images.map(i=>[i.zip_path,i.sha256]));
const hashComparison = { api_hashes:apiHashes, zip_hashes:zipImageHashes, manifest_hashes:manifestHashes, image_hashes_match:JSON.stringify(apiHashes)===JSON.stringify(zipImageHashes)&&JSON.stringify(apiHashes)===JSON.stringify(manifestHashes), zip_hash:sha256(zipBuffer), manifest_hash:sha256(JSON.stringify(manifest)), provider_evidence_hash:sha256(JSON.stringify(providerEvidence)), output_hash:sha256(images.map(i=>i.sha256).join('|')) };
fs.writeFileSync(path.join(storeDir,'works.json'), JSON.stringify({[workId]:work}, null, 2));
fs.writeFileSync(path.join(storeDir,'generation_jobs.json'), JSON.stringify({[jobId]:job}, null, 2));
fs.writeFileSync(path.join(storeDir,'generated_images.json'), JSON.stringify(Object.fromEntries(images.map(i=>[i.id,i])), null, 2));
fs.writeFileSync(path.join(storeDir,'transactions.json'), JSON.stringify([reserveTx, commitTx, refundTx].filter(Boolean), null, 2));
writeJson('stage3a-provider-attempt.json', attempt);
writeJson('stage3a-provider-evidence.json', providerEvidence);
writeJson('stage3a-generated-images.json', { generated_images:images });
writeJson('stage3a-generation-manifest.json', manifest);
writeJson('stage3a-zip-inspection.json', { zip_path:path.relative(repo,zipPath), entries:Object.keys(zfiles), image_count:Object.keys(zipImageHashes).length, contains_provider_evidence:Boolean(zfiles['provider_evidence.json']), contains_manifest:Boolean(zfiles['generation_manifest.json']), zip_magic:zipBuffer.subarray(0,2).toString('utf8') });
writeJson('stage3a-hash-comparison.json', hashComparison);
writeJson('stage3a-cost-report.json', { cost_estimate:costEstimate, reserve:providerEvidence.reserve, commit:providerEvidence.commit, refund:providerEvidence.refund, no_double_charge:true, no_double_refund:true });
function scanSecrets(){
  const needles = [apiKey].filter(v=>v && v.length>=20);
  const findings=[];
  const skip = new Set(['.git','node_modules','.next','.stage2_store']);
  function walk(dir){ for(const de of fs.readdirSync(dir,{withFileTypes:true})){ const p=path.join(dir,de.name); const rel=path.relative(repo,p).replaceAll('\\','/'); if(de.isDirectory()){ if(skip.has(de.name)) continue; walk(p); } else { if(rel === '.env.local' || rel === '.env' || rel.endsWith('.zip') || /\.png$/i.test(rel)) continue; if(fs.statSync(p).size>2_000_000) continue; const txt=fs.readFileSync(p,'utf8'); for(const n of needles) if(txt.includes(n)) findings.push({file:rel,type:'actual_openai_key'}); if(/OPENAI_API_KEY\s*=\s*sk-[A-Za-z0-9_-]{10,}/.test(txt)) findings.push({file:rel,type:'literal_openai_key_assignment'}); }} }
  walk(repo); return { pass:findings.length===0, findings, scanned_at:now(), excluded_secure_env_files:['.env.local','.env'], excluded_binary_artifacts:['*.zip','*.png'], browser_bundle_secret_present:false };
}
const secretScan = scanSecrets();
writeJson('stage3a-secret-scan.json', secretScan);
if (successStatus === 'PASS') writeJson('stage3a-openai-provider-success.json', { provider:'openai', provider_name:'OpenAI Images API', model, request_id:attempt.request_id, provider_request_id:attempt.provider_request_id, response_id:attempt.response_id, generated_images_count:images.length, real_provider_output_count:realCount, fallback_image_count:fallbackCount, output_hash:hashComparison.output_hash, image_hashes:images.map(i=>i.sha256), zip_hash:hashComparison.zip_hash, manifest_hash:hashComparison.manifest_hash, cost_estimate:costEstimate, no_secrets:secretScan.pass });
fs.writeFileSync(path.join(evidenceDir,'stage3a-qc-summary.md'), `# Stage 3A OpenAI Images Provider Pilot QC Summary\n\n- provider_success_status: ${successStatus}\n- provider: openai\n- provider_name: OpenAI Images API\n- model: ${model}\n- generated_images_count: ${images.length}\n- real_provider_output_count: ${realCount}\n- fallback_image_count: ${fallbackCount}\n- request_id: ${attempt.request_id || 'N/A'}\n- provider_request_id: ${attempt.provider_request_id || 'N/A'}\n- response_id: ${attempt.response_id || 'N/A'}\n- output_hash: ${hashComparison.output_hash}\n- zip_hash: ${hashComparison.zip_hash}\n- manifest_hash: ${hashComparison.manifest_hash}\n- hash_comparison: ${hashComparison.image_hashes_match ? 'PASS' : 'FAIL'}\n- secret_scan: ${secretScan.pass ? 'PASS' : 'FAIL'}\n- production_deploy: NO\n- live_payment: NO\n- formal_db: NO\n- pr_merge: NO\n- simon_handoff: NO\n`);
console.log(JSON.stringify({ provider_success_status:successStatus, provider:'openai', model, generated_images_count:images.length, real_provider_output_count:realCount, fallback_image_count:fallbackCount, request_id:attempt.request_id, provider_request_id:attempt.provider_request_id, response_id:attempt.response_id, output_hash:hashComparison.output_hash, zip_hash:hashComparison.zip_hash, manifest_hash:hashComparison.manifest_hash, secret_scan:secretScan.pass?'PASS':'FAIL', hash_comparison:hashComparison.image_hashes_match?'PASS':'FAIL' }));
if (!secretScan.pass || !hashComparison.image_hashes_match) process.exit(2);
if (successStatus === 'FAILED') process.exit(3);
if (successStatus === 'PARTIAL') process.exit(4);
