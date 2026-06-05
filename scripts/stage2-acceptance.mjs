import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import crypto from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';

const evidenceDir = process.env.STAGE2_EVIDENCE_DIR || join(process.cwd(), 'stage2_evidence');
mkdirSync(evidenceDir, { recursive: true });
const port = process.env.PORT || String(3600 + Math.floor(Math.random()*300));
const base = process.env.BASE_URL || process.env.AUTO_STICKER_BASE_URL || `http://127.0.0.1:${port}`;
let child;
let transcript = [];
const cloudMode = Boolean(process.env.BASE_URL || process.env.AUTO_STICKER_BASE_URL);
let buildInfo = null;
function save(name, data){ writeFileSync(join(evidenceDir, name), typeof data === 'string' ? data : JSON.stringify(data, null, 2)); }
function cloudName(name){ return cloudMode ? name.replace(/^stage2-/, 'stage2-cloud-') : name; }
function meta(extra={}){ return { timestamp:new Date().toISOString(), cloud_base_url:base, deployed_commit_sha:buildInfo?.commit_sha || null, deployment_id:buildInfo?.deployment_id || null, build_id:buildInfo?.build_id || null, provider_name:'mock_non_placeholder', ...extra }; }
function saveStage2(name, data, extra={}){ if (cloudMode) { save(cloudName(name), { ...meta(extra), payload:data }); } else { save(name, data); } }
function sha256(buf){ return crypto.createHash('sha256').update(buf).digest('hex'); }
async function start(){
  if (process.env.BASE_URL || process.env.AUTO_STICKER_BASE_URL) return;
  child = spawn('node', ['--run','start'], { env:{...process.env, PORT:port, NEXT_TELEMETRY_DISABLED:'1'}, stdio:['ignore','pipe','pipe'], detached:true });
  let logs=''; child.stdout.on('data', d=>logs+=d); child.stderr.on('data', d=>logs+=d);
  for(let i=0;i<90;i++){
    try{ const r=await fetch(`${base}/api/health`); if(r.status<500) return; }catch{}
    if(child.exitCode!==null) throw new Error(`server exited early ${child.exitCode}: ${logs}`);
    await delay(500);
  }
  throw new Error(`server not ready: ${logs}`);
}
async function request(path, expected, init={}){
  const r = await fetch(base+path, { headers:{'content-type':'application/json', ...(init.headers||{})}, ...init });
  const ct = r.headers.get('content-type') || '';
  let body;
  if (ct.includes('application/json')) body = await r.json(); else body = Buffer.from(await r.arrayBuffer());
  transcript.push({ method:init.method||'GET', path, status:r.status, content_type:ct, expected });
  if (r.status !== expected) throw new Error(`${path} expected ${expected} got ${r.status}: ${Buffer.isBuffer(body)?body.slice(0,80).toString('hex'):JSON.stringify(body).slice(0,500)}`);
  return { r, body, contentType:ct };
}
function entries(buffer){ const files={}; for(let i=0;i<buffer.length-30;i++){ if(buffer.readUInt32LE(i)===0x04034b50){ const method=buffer.readUInt16LE(i+8); const size=buffer.readUInt32LE(i+18); const nameLen=buffer.readUInt16LE(i+26); const extraLen=buffer.readUInt16LE(i+28); const name=buffer.subarray(i+30,i+30+nameLen).toString('utf8'); const start=i+30+nameLen+extraLen; if(method===0) files[name]=buffer.subarray(start,start+size); i=start+size-1; }} return files; }
function assert(cond,msg){ if(!cond) throw new Error(msg); }
try{
  await start();
  try { const bi = await request('/api/build-info', 200); buildInfo = bi.body; } catch (err) { if (cloudMode) throw err; }
  saveStage2('stage2-owner-decisions.json', { generation_mode:'mock_non_placeholder', ai_provider:'none', data_layer:'repository_backed_mock_file_store', storage:'local_file_backed', payment:'mock_sandbox_only', stage2_approved:false, commercial_launch_ready:false });
  await request('/api/stage2/reset', 200, { method:'POST', body:'{}' });
  const insufficient = await request('/api/works', 402, { method:'POST', body:JSON.stringify({ title:'insufficient', prompt:'cute', image_count:8 }) });
  assert(insufficient.body.error === 'INSUFFICIENT_CREDITS', 'fresh wallet must be insufficient');
  await request('/api/stage2/fund', 200, { method:'POST', body:JSON.stringify({ amount:80, description:'acceptance funding' }) });
  const createBody = { title:'Stage 2 acceptance', template_id:'tpl_001', prompt:'可愛貓咪 LINE 貼圖 eight emotions', image_count:8, output_kind:'static_sticker' };
  const created = await request('/api/works', 201, { method:'POST', headers:{'idempotency-key':'stage2-success-001'}, body:JSON.stringify(createBody) });
  assert(created.body.work && created.body.generation_job && created.body.transaction.type==='generation_reserve', 'create returns work/job/reserve');
  assert(created.body.commit_transaction.type === 'generation_commit', 'success path commits reserve');
  assert(created.body.generation_job.status === 'succeeded', 'job succeeded');
  assert(created.body.generated_images.length === 8, '8 generated images returned');
  assert(created.body.generated_images.every(i=>i.provider_name==='mock_non_placeholder' && i.is_placeholder===false && i.width===512 && i.height===512 && i.byte_size>1000), 'generated images are non-placeholder 512 PNG records');
  const idem = await request('/api/works', 200, { method:'POST', headers:{'idempotency-key':'stage2-success-001'}, body:JSON.stringify(createBody) });
  assert(idem.body.idempotent === true && idem.body.work.id === created.body.work.id, 'idempotency repeat returns same work');
  await request('/api/works', 409, { method:'POST', headers:{'idempotency-key':'stage2-success-001'}, body:JSON.stringify({...createBody,prompt:'different prompt'}) });
  const workId = created.body.work.id;
  const jobId = created.body.generation_job.id;
  const workDetail = await request(`/api/works/${workId}`, 200);
  const jobDetail = await request(`/api/generation/jobs/${jobId}`, 200);
  const imagesDetail = await request(`/api/works/${workId}/generated-images`, 200);
  const zipRes = await request(`/api/works/${workId}/download`, 200);
  assert(zipRes.contentType.includes('application/zip'), 'download content-type is application/zip');
  const zip = zipRes.body;
  assert(zip[0]===0x50 && zip[1]===0x4b, 'ZIP magic PK');
  const files = entries(zip);
  const required = ['generation_manifest.json','line_sticker_info.json','README.txt', ...Array.from({length:8},(_,i)=>`images/${String(i+1).padStart(2,'0')}.png`)];
  const missing = required.filter(k=>!files[k]);
  assert(missing.length===0, `missing ZIP entries: ${missing.join(',')}`);
  const manifest = JSON.parse(files['generation_manifest.json'].toString('utf8'));
  assert(manifest.work_id===workId && manifest.generation_job_id===jobId, 'manifest work/job ids match');
  const hashComparison=[];
  for (const img of imagesDetail.body.generated_images){
    const actual = sha256(files[img.zip_path]);
    const manifestRow = manifest.generated_images.find(x=>x.zip_path===img.zip_path);
    assert(actual===img.sha256, `API hash mismatch for ${img.zip_path}`);
    assert(actual===manifestRow.sha256, `manifest hash mismatch for ${img.zip_path}`);
    hashComparison.push({ zip_path:img.zip_path, api_sha256:img.sha256, manifest_sha256:manifestRow.sha256, zip_sha256:actual, bytes:files[img.zip_path].length });
  }
  await request('/api/stage2/fund', 200, { method:'POST', body:JSON.stringify({ amount:16, description:'failure retry funding' }) });
  const failed = await request('/api/works', 201, { method:'POST', headers:{'idempotency-key':'stage2-fail-001'}, body:JSON.stringify({...createBody,title:'failure path',simulate_failure:true}) });
  assert(failed.body.generation_job.status === 'refunded', 'failure path ended refunded');
  assert(failed.body.refund_transaction.type === 'generation_refund', 'failure path refunded once');
  const retry = await request(`/api/works/${failed.body.work.id}/retry`, 200, { method:'POST', headers:{'idempotency-key':'stage2-retry-001'}, body:'{}' });
  assert(retry.body.generation_job.status === 'succeeded' && retry.body.generation_job.attempt_no===2, 'retry succeeds as attempt 2');
  const ledger = await request('/api/stage2/transactions', 200);
  const failureRefunds = ledger.body.transactions.filter(t=>t.work_id===failed.body.work.id && t.type==='generation_refund');
  assert(failureRefunds.length===1, 'failure refund exactly once');
  saveStage2('stage2-api-transcript.json', transcript, { work_id:workId, generation_job_id:jobId });
  if (cloudMode) save('stage2-cloud-api-transcript.passed.json', { ...meta({ work_id:workId, generation_job_id:jobId }), payload:transcript });
  saveStage2('stage2-work-detail.json', workDetail.body, { work_id:workId, generation_job_id:jobId });
  saveStage2('stage2-generation-job.json', jobDetail.body, { work_id:workId, generation_job_id:jobId });
  saveStage2('stage2-generated-images.json', imagesDetail.body, { work_id:workId, generation_job_id:jobId, image_hashes:imagesDetail.body.generated_images?.map(i=>i.sha256) });
  saveStage2('stage2-transactions-ledger.json', ledger.body, { work_id:workId, generation_job_id:jobId });
  saveStage2('stage2-zip-inspection.json', { content_type:zipRes.contentType, bytes:zip.length, magic:zip.subarray(0,2).toString('ascii'), entries:Object.keys(files).sort() }, { work_id:workId, generation_job_id:jobId });
  saveStage2('stage2-generation-manifest.json', manifest, { work_id:workId, generation_job_id:jobId, image_hashes:manifest.generated_images?.map(i=>i.sha256) });
  saveStage2('stage2-hash-comparison.json', hashComparison, { work_id:workId, generation_job_id:jobId, image_hashes:hashComparison.map(i=>i.zip_sha256) });
  save(cloudMode ? 'stage2-cloud-qc-summary.md' : 'stage2-qc-summary.md', `# Stage 2 QC Summary\n\n- API create/detail/job/generated-images/download: PASS\n- ZIP entries: PASS\n- Hash comparison API vs manifest vs ZIP: PASS\n- Credit semantics reserve/commit/refund/retry: PASS\n- Provider mode: mock_non_placeholder\n- Stage 2 approved: NO\n- Commercial launch ready: NO\n`);
  console.log('STAGE2_ACCEPTANCE PASS', JSON.stringify({workId,jobId,evidenceDir,hashes:hashComparison.length}));
} finally {
  if (!cloudMode) save('stage2-cloud-api-transcript.json', transcript); else save('stage2-cloud-api-transcript.json', { ...meta(), payload:transcript });
  if (child) { try { process.kill(-child.pid, 'SIGTERM'); } catch { try { child.kill('SIGTERM'); } catch {} } await delay(500); try { if(child.exitCode===null) process.kill(-child.pid, 'SIGKILL'); } catch { try { child.kill('SIGKILL'); } catch {} } child.stdout?.destroy(); child.stderr?.destroy(); }
}
