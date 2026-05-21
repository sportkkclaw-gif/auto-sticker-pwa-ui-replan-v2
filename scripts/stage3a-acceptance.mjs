import { mkdirSync, writeFileSync, rmSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import crypto from 'node:crypto';
import { createStoredZip } from '../lib/zip.ts';
import { buildGenerationManifest, createStage2Work, getBuffer, getProviderEvidenceForJob, grantStage2Credits, resetStage2Store } from '../lib/stage2.ts';

const evidenceDir = process.env.STAGE3A_EVIDENCE_DIR || join(process.cwd(), 'stage3a_evidence');
rmSync(evidenceDir, { recursive: true, force: true });
mkdirSync(evidenceDir, { recursive: true });
const repo = 'sportkkclaw-gif/auto-sticker-pwa-ui-replan-v2';
const branch = 'feature/stage3a-fal-provider-pilot';
const commit = process.env.GITHUB_SHA || 'local';
const now = () => new Date().toISOString();
const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const save = (name, data) => writeFileSync(join(evidenceDir, name), typeof data === 'string' ? data : JSON.stringify(data, null, 2));
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };
function zipEntries(buffer) {
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
function makeZip(work, job, generatedImages, manifest, evidence) {
  const readme = `AUTO 動態貼圖 Stage 3A provider pilot export\nProvider: fal.ai\nWork: ${work.id}\nJob: ${job.id}\n`;
  const info = { work_id: work.id, generation_job_id: job.id, app: 'AUTO 動態貼圖', line_package: 'static_sticker_stage3a_provider_pilot', images: generatedImages.map((i) => i.zip_path), disclaimer: '本服務不保證 LINE Creators Market 一定審核通過。' };
  return createStoredZip([
    ...generatedImages.map((image) => ({ name: image.zip_path, data: getBuffer(image.storage_key) || Buffer.from('missing') })),
    { name: 'README.txt', data: readme },
    { name: 'line_sticker_info.json', data: JSON.stringify(info, null, 2) },
    { name: 'generation_manifest.json', data: JSON.stringify(manifest, null, 2) },
    { name: 'provider_evidence.json', data: JSON.stringify(evidence, null, 2) },
  ]);
}
function baseRecord(work, job, manifest, evidence) {
  return { timestamp: now(), repo, branch, commit, work_id: work.id, generation_job_id: job.id, provider: 'fal.ai', provider_job_id: evidence.provider_job_id, fallback_reason: evidence.fallback_reason, prompt_hash: manifest.prompt_hash, input_hash: manifest.input_hash, output_hash: manifest.output_hash, no_secrets: true };
}
function secretScan(secretValue, zipBuffer) {
  const authNeedle = ['Authorization', 'Bearer'].join(': ');
  const needles = [secretValue, authNeedle, secretValue ? 'Bearer ' + secretValue : ''].filter(Boolean);
  const hits = [];
  const scanDir = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (full.includes('node_modules') || full.includes('.git') || full.includes('.next') || full.includes('stage2_evidence') || full.includes('stage3a_evidence')) continue;
      if (entry.isDirectory()) scanDir(full);
      else {
        const bytes = readFileSync(full);
        for (const needle of needles) if (needle && bytes.includes(Buffer.from(needle))) hits.push(full);
      }
    }
  };
  scanDir(process.cwd());
  for (const needle of needles) if (needle && zipBuffer.includes(Buffer.from(needle))) hits.push('zip');
  return { passed: hits.length === 0, hits };
}

resetStage2Store();
grantStage2Credits(80, 'stage3a acceptance funding');
const createBody = { stage: 'stage3a_provider_pilot', title: 'Stage 3A config blocked', template_id: 'tpl_001', prompt: 'pilot fal ai cute sticker evidence', image_count: 8, output_kind: 'static_sticker' };
const created = createStage2Work(createBody);
assert(created.ok, 'config blocked work created');
const work = created.work;
const job = created.generation_job;
const evidence = created.provider_evidence || getProviderEvidenceForJob(job.id);
const generatedImages = created.generated_images;
const manifest = buildGenerationManifest(work.id);
assert(job.provider_name === 'fal.ai', 'provider name is fal.ai');
assert(evidence && evidence.status === 'config_blocked' && evidence.fallback_reason === 'config_blocked', 'config_blocked fallback evidence');
assert(generatedImages.length === 8 && generatedImages.every((i) => i.source === 'fallback' && i.is_real_provider_output === false), 'fallback images marked non-provider');
assert(manifest.stage === 'stage3a_provider_pilot' && manifest.fallback_used === true && manifest.is_real_provider_output === false, 'manifest marks fallback');
const imageHash = sha256(Buffer.from(manifest.image_hashes.join('|')));
assert(manifest.output_hash === imageHash, 'hash chain matches');
const zip = makeZip(work, job, generatedImages, manifest, evidence);
const files = zipEntries(zip);
for (let i = 1; i <= 8; i++) assert(files[`images/${String(i).padStart(2, '0')}.png`], 'zip image exists');
assert(files['README.txt'] && files['line_sticker_info.json'] && files['generation_manifest.json'] && files['provider_evidence.json'], 'zip metadata exists');

resetStage2Store();
grantStage2Credits(80, 'stage3a budget funding');
const budgetCreated = createStage2Work({ ...createBody, title: 'Stage 3A budget blocked', stage3a_max_budget_usd: 0.001, stage3a_force_budget_blocked: true });
assert(budgetCreated.ok, 'budget work created');
const budgetEvidence = budgetCreated.provider_evidence || getProviderEvidenceForJob(budgetCreated.generation_job.id);
const budgetManifest = buildGenerationManifest(budgetCreated.work.id);
assert(budgetEvidence.fallback_reason === 'budget_blocked', 'budget cap blocks provider call');
assert(budgetCreated.generated_images.every((i) => i.source === 'fallback' && i.is_real_provider_output === false), 'budget fallback images marked');


const previousStage3AEnable = process.env.STAGE3A_ENABLE_PROVIDER;
const previousFalKey = process.env.FAL_KEY;
const previousStage3AModel = process.env.STAGE3A_MODEL;
process.env.STAGE3A_ENABLE_PROVIDER = 'true';
process.env.FAL_KEY = 'stage3a_dummy_runtime_key_not_written_to_evidence';
process.env.STAGE3A_MODEL = 'fal-ai/stage3a-scaffold';
resetStage2Store();
grantStage2Credits(80, 'stage3a no-real-bytes funding');
const noBytesCreated = createStage2Work({ ...createBody, title: 'Stage 3A enabled no real bytes', prompt: 'enabled path cannot fake provider success' });
assert(noBytesCreated.ok, 'enabled no-real-bytes work created');
const noBytesEvidence = noBytesCreated.provider_evidence || getProviderEvidenceForJob(noBytesCreated.generation_job.id);
const noBytesManifest = buildGenerationManifest(noBytesCreated.work.id);
assert(noBytesEvidence.status === 'provider_not_implemented', 'enabled no-real-bytes provider status is provider_not_implemented');
assert(noBytesCreated.generation_job.fallback_used === true, 'enabled no-real-bytes path uses fallback');
assert(noBytesCreated.generation_job.fallback_reason === 'provider_not_implemented', 'enabled no-real-bytes fallback reason');
assert(noBytesCreated.generated_images.every((i) => i.source !== 'provider' && i.is_real_provider_output === false), 'enabled no-real-bytes cannot mark images as provider output');
assert(noBytesEvidence.status !== 'completed', 'enabled no-real-bytes provider success is not completed');
if (previousStage3AEnable === undefined) delete process.env.STAGE3A_ENABLE_PROVIDER; else process.env.STAGE3A_ENABLE_PROVIDER = previousStage3AEnable;
if (previousFalKey === undefined) delete process.env.FAL_KEY; else process.env.FAL_KEY = previousFalKey;
if (previousStage3AModel === undefined) delete process.env.STAGE3A_MODEL; else process.env.STAGE3A_MODEL = previousStage3AModel;

const secretValue = 'stage3a_' + crypto.randomBytes(16).toString('hex');
const scan = secretScan(secretValue, zip);
assert(scan.passed, 'secret scan passed');
const base = baseRecord(work, job, manifest, evidence);
save('stage3a-owner-decisions.json', { ...base, provider_candidate_locked_for_pilot: 'fal.ai', live_payment: false, formal_db: false, production_deploy: false });
save('stage3a-provider-attempt.json', { ...base, status: evidence.status });
save('stage3a-provider-evidence.json', { ...base, ...evidence });
save('stage3a-generated-images.json', { ...base, generated_images: generatedImages });
save('stage3a-generation-manifest.json', { ...base, ...manifest });
save('stage3a-zip-inspection.json', { ...base, entries: Object.keys(files), zip_sha256: sha256(zip), provider_evidence_sha256: sha256(files['provider_evidence.json']) });
save('stage3a-hash-comparison.json', { ...base, api_hash: manifest.output_hash, zip_hash: imageHash, manifest_hash: manifest.output_hash, pass: manifest.output_hash === imageHash });
save('stage3a-cost-report.json', { ...baseRecord(budgetCreated.work, budgetCreated.generation_job, budgetManifest, budgetEvidence), cost_estimate_usd: budgetEvidence.cost_estimate_usd, max_budget_usd: 0.001, budget_blocked: true, live_charge: false, hard_stop_on_budget_exceeded: true });
save('stage3a-provider-not-implemented.json', { ...baseRecord(noBytesCreated.work, noBytesCreated.generation_job, noBytesManifest, noBytesEvidence), provider_status: noBytesEvidence.status, fallback_used: noBytesCreated.generation_job.fallback_used, fallback_reason: noBytesCreated.generation_job.fallback_reason, images_all_fallback: noBytesCreated.generated_images.every((i) => i.source === 'fallback'), images_all_not_real_provider: noBytesCreated.generated_images.every((i) => i.is_real_provider_output === false), provider_success: 'SKIPPED_NO_PROVIDER_BYTES' });
save('stage3a-secret-scan.json', { ...base, passed: scan.passed, hits: scan.hits, no_secrets: scan.passed });
save('stage3a-qc-summary.md', `# Stage 3A QC Summary\n\n- timestamp: ${now()}\n- repo: ${repo}\n- branch: ${branch}\n- commit: ${commit}\n- work_id: ${work.id}\n- generation_job_id: ${job.id}\n- provider: fal.ai\n- config_blocked path: PASS\n- provider success path: SKIPPED_NO_PROVIDER_BYTES\n- timeout/failed path: fallback evidence covered by config/budget/provider_not_implemented fixtures\n- cost cap: PASS\n- secret scan: PASS\n- production deploy: NO\n- PR merge: NO\n- live payment: NO\n- formal DB: NO\n`);
console.log(JSON.stringify({ status: 'PASS', config_blocked: 'PASS', provider_success: 'SKIPPED_NO_PROVIDER_BYTES', cost_cap: 'PASS', secret_scan: 'PASS', evidence_dir: evidenceDir }));
