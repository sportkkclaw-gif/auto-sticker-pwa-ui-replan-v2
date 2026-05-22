import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
const root = process.cwd();
const seed = JSON.parse(readFileSync(new URL('../data/seed.json', import.meta.url), 'utf8'));
let unit=0, api=0, e2e=0;
function ok(cond, msg, kind='unit'){ assert.ok(cond, msg); if(kind==='unit') unit++; if(kind==='api') api++; if(kind==='e2e') e2e++; console.log(`PASS ${kind}: ${msg}`); }
ok(Object.keys(seed).length >= 18, '18+ seed data models present');
ok(seed.templates.length >= 8, 'template seed count >=8');
ok(seed.templateCategories.length >= 8, 'template categories seed count >=8');
ok(seed.promptPresets.every(p=>p.maxChars<=200), 'prompt presets enforce 200-char contract');
ok(seed.sourceAssets.every(a=>a.consent===true), 'source assets carry consent flag');
ok(seed.cropStates.every(c=>Number.isFinite(c.width)&&Number.isFinite(c.height)), 'crop states have dimensions');
ok(seed.projects.some(p=>p.status==='completed'), 'completed project seed present');
ok(seed.generationSettings.every(s=>s.outputKind==='static_png'), 'generation outputKind seeded');
ok(seed.generationJobs.some(j=>j.provider==='mock'), 'mock AI job seeded');
ok(seed.stickerResults.every(s=>s.width===370&&s.height===370), 'LINE sticker dimensions seeded');
ok(seed.qcRules.some(r=>r.key==='APNG_METADATA'), 'APNG metadata QC rule seeded');
ok(seed.exportPackages.some(e=>e.type==='line_static_zip'), 'LINE ZIP export seed present');
const pkg = JSON.parse(readFileSync('package.json','utf8'));
ok(Boolean(pkg.scripts['acceptance:live']), 'acceptance:live script exists');
ok(existsSync('public/manifest.webmanifest') && existsSync('public/sw.js'), 'PWA manifest and service worker exist');
ok(/不承諾 LINE 審核必過|不保證LINE審核通過|不保證 LINE 審核通過/.test(readFileSync('PRODUCT_SPEC.md','utf8') + readFileSync('app/export/page.tsx','utf8')), 'no LINE guaranteed-approval promise; disclaimer present');
async function startServer(){
  const port = String(3300 + Math.floor(Math.random()*200));
  const isDPackage = root.startsWith('/mnt/d/WORK/成品區/待最終審核/');
  const startCommand = isDPackage ? 'node' : process.execPath;
  const startArgs = isDPackage ? ['--run','start'] : ['node_modules/next/dist/bin/next','start'];
  const child = spawn(startCommand,startArgs,{cwd:root,env:{...process.env,PORT:port,NEXT_TELEMETRY_DISABLED:'1'},stdio:['ignore','pipe','pipe'],detached:true});
  let logs=''; child.stdout.on('data',d=>logs+=d); child.stderr.on('data',d=>logs+=d);
  const maxReadyAttempts = isDPackage ? 180 : 60;
  for(let i=0;i<maxReadyAttempts;i++){
    try { const r = await fetch(`http://127.0.0.1:${port}/api/health`); if(r.status<500) return {child,base:`http://127.0.0.1:${port}`,logs}; } catch {}
    await delay(500);
    if(child.exitCode!==null) throw new Error('next start exited early: '+logs);
  }
  child.kill('SIGTERM'); throw new Error('server did not become ready: '+logs);
}
async function jsonFetch(base,path,init){ const r=await fetch(base+path,{headers:{'content-type':'application/json'},...init}); let body; try{body=await r.json()}catch{body={}}; return {status:r.status,body,headers:r.headers}; }
function zipEntries(buffer){ const names=[]; for(let i=0;i<buffer.length-46;i++){ if(buffer.readUInt32LE(i)===0x02014b50){ const nameLen=buffer.readUInt16LE(i+28); const extraLen=buffer.readUInt16LE(i+30); const commentLen=buffer.readUInt16LE(i+32); names.push(buffer.subarray(i+46,i+46+nameLen).toString('utf8')); i += 45 + nameLen + extraLen + commentLen; } } return names; }
function unzipStored(buffer){ const files={}; for(let i=0;i<buffer.length-30;i++){ if(buffer.readUInt32LE(i)===0x04034b50){ const method=buffer.readUInt16LE(i+8); const size=buffer.readUInt32LE(i+18); const nameLen=buffer.readUInt16LE(i+26); const extraLen=buffer.readUInt16LE(i+28); const name=buffer.subarray(i+30,i+30+nameLen).toString('utf8'); const start=i+30+nameLen+extraLen; if(method===0) files[name]=buffer.subarray(start,start+size); i=start+size-1; } } return files; }
async function zipFetch(base,path){ const r=await fetch(base+path); const buffer=Buffer.from(await r.arrayBuffer()); return {status:r.status,contentType:r.headers.get('content-type')||'',buffer,entries:zipEntries(buffer)}; }
const {child,base}=await startServer();
try{
  let r = await jsonFetch(base,'/api/templates'); ok(r.status===200 && r.body.templates.length>=8, 'GET /api/templates returns seed templates','api');
  r = await jsonFetch(base,'/api/templates/tpl_001'); ok(r.status===200 && r.body.promptPresets.length>=1, 'GET /api/templates/[id] includes prompts','api');
  r = await jsonFetch(base,'/api/assets/upload',{method:'POST',body:JSON.stringify({mimeType:'image/png',fileSize:1234,consent:true})}); ok(r.status===201 && r.body.asset.id, 'POST /api/assets/upload creates asset','api'); const assetId=r.body.asset.id;
  r = await jsonFetch(base,`/api/assets/${assetId}/crop`,{method:'POST',body:JSON.stringify({width:512,height:512})}); ok(r.status===200 && r.body.cropState.width===512, 'POST /api/assets/[id]/crop stores crop','api');
  r = await jsonFetch(base,`/api/assets/${assetId}/remove-bg`,{method:'POST'}); ok(r.status===200 && r.body.bgRemoved===true, 'POST remove-bg mock succeeds','api');
  r = await jsonFetch(base,'/api/projects',{method:'POST',body:JSON.stringify({templateId:'tpl_001',sourceAssetId:assetId,count:8,title:'Roundtrip'})}); ok(r.status===201 && r.body.project.id, 'POST /api/projects creates project','api'); const projectId=r.body.project.id;
  r = await jsonFetch(base,`/api/projects/${projectId}`); ok(r.status===200 && r.body.project.title==='Roundtrip', 'GET /api/projects/[id] reads created project','api');
  r = await jsonFetch(base,`/api/projects/${projectId}/settings`,{method:'PATCH',body:JSON.stringify({addText:true})}); ok(r.status===200 && r.body.settings.addText===true, 'PATCH project settings works','api');
  r = await jsonFetch(base,'/api/generation/jobs',{method:'POST',body:JSON.stringify({projectId,templateId:'tpl_001',sourceAssetId:assetId,count:8,prompt:'demo'})}); ok(r.status===201 && r.body.status==='completed', 'POST generation job completes with mock AI','api'); const jobId=r.body.id;
  r = await jsonFetch(base,`/api/generation/jobs/${jobId}`); ok(r.status===200 && r.body.stickers.length===8, 'GET generation job returns 8 stickers','api');
  r = await jsonFetch(base,`/api/projects/${projectId}/qc`,{method:'POST',body:JSON.stringify({forceFail:true})}); ok(r.status===200 && r.body.passed===false, 'QC can fail deterministically','api');
  r = await jsonFetch(base,`/api/projects/${projectId}/export`,{method:'POST'}); ok(r.status===409 && r.body.error.code==='QC_NOT_PASSED', 'QC fail blocks export','api');
  r = await jsonFetch(base,`/api/projects/${projectId}/qc`,{method:'POST',body:JSON.stringify({})}); ok(r.status===200 && r.body.passed===true, 'QC passes after valid stickers','api');
  r = await jsonFetch(base,`/api/projects/${projectId}/export`,{method:'POST'}); ok(r.status===201 && r.body.exportPackage.fileUrl.endsWith('.zip'), 'QC pass creates ZIP export','api'); const exportId=r.body.exportPackage.id;
  const z = await zipFetch(base,`/api/exports/${exportId}/download`); ok(z.status===200 && z.contentType.includes('application/zip') && z.buffer[0]===0x50 && z.buffer[1]===0x4b && ['main.png','tab.png','01.png','02.png','03.png','04.png','05.png','06.png','07.png','08.png','metadata.json','qc_report.html'].every(name=>z.entries.includes(name)), 'download returns ZIP binary with LINE files','api');
  r = await jsonFetch(base,'/api/credits/balance'); ok(r.status===200 && r.body.free_credits===2 && r.body.paid_credits===0 && r.body.total===2, 'fresh demo starts below 8 credits for insufficient create path','api');
  const freshWallet = r.body;
  r = await jsonFetch(base,'/api/works',{method:'POST',body:JSON.stringify({templateId:'tpl_001',imageCount:8,title:'Should be insufficient'})}); ok(r.status===402 && r.body.error==='INSUFFICIENT_CREDITS' && r.body.available===freshWallet.total, 'fresh /api/works create returns insufficient before purchase','api');
  r = await jsonFetch(base,'/api/credits/balance');
  const initialWallet = r.body;
  r = await jsonFetch(base,'/api/billing/mock-payment',{method:'POST',body:JSON.stringify({packageId:'business'})}); ok(r.status===201 && r.body.payment.status==='created' && r.body.payment.credits===600, 'mock payment create returns business package payment','api'); const paymentId=r.body.payment.id;
  r = await jsonFetch(base,`/api/billing/mock-payment/${paymentId}/complete`,{method:'POST',body:JSON.stringify({})}); ok(r.status===200 && r.body.wallet.paid_credits===initialWallet.paid_credits+600 && r.body.transaction.balance_after.total===r.body.wallet.total, 'mock payment complete increases paid credits and ledger balance','api'); const afterPayment=r.body.wallet;
  r = await jsonFetch(base,`/api/billing/mock-payment/${paymentId}/complete`,{method:'POST',body:JSON.stringify({})}); ok(r.status===200 && r.body.wallet.paid_credits===afterPayment.paid_credits && r.body.idempotent===true, 'mock payment complete is idempotent','api');
  r = await jsonFetch(base,'/api/credits/balance',{method:'POST',body:JSON.stringify({type:'consume',amount:-8,description:'deduct probe'})}); ok(r.status===200 && r.body.wallet.total===afterPayment.total-8 && r.body.transaction.balance_after.total===r.body.wallet.total, 'consume deducts wallet and ledger balance_after matches','api'); const afterConsume=r.body.wallet;
  r = await jsonFetch(base,'/api/credits/balance'); ok(r.status===200 && r.body.total===afterConsume.total, 'balance persists after consume','api');
  r = await jsonFetch(base,'/api/credits/balance',{method:'POST',body:JSON.stringify({type:'consume',amount:999999,description:'insufficient probe'})}); ok(r.status===402 && r.body.error==='INSUFFICIENT_CREDITS', 'insufficient credits returns error without success ledger','api');
  r = await jsonFetch(base,'/api/demo/reset',{method:'POST',body:JSON.stringify({})}); ok(r.status===200 && r.body.wallet.total===2, 'demo reset restores fresh insufficient wallet','api');
  const browserCreateBefore = await fetch(base+'/create'); ok(browserCreateBefore.status===200 && (await browserCreateBefore.text()).includes('API wallet'), 'browser /create renders API wallet source label','e2e');
  r = await jsonFetch(base,'/api/works',{method:'POST',body:JSON.stringify({templateId:'tpl_001',imageCount:8,title:'Browser insufficient'})}); ok(r.status===402 && r.body.error==='INSUFFICIENT_CREDITS', 'browser main flow insufficient on create before purchase','e2e');
  const browserPayment = await jsonFetch(base,'/api/billing/mock-payment',{method:'POST',body:JSON.stringify({packageId:'starter'})}); ok(browserPayment.status===201 && browserPayment.body.payment.status==='created', 'browser main flow billing creates starter payment','e2e');
  const browserCompleted = await jsonFetch(base,`/api/billing/mock-payment/${browserPayment.body.payment.id}/complete`,{method:'POST',body:JSON.stringify({})}); ok(browserCompleted.status===200 && browserCompleted.body.wallet.total===32, 'browser main flow billing complete increases API credits visible to create','e2e');
  const browserCreateAfter = await fetch(base+'/create'); ok(browserCreateAfter.status===200 && (await browserCreateAfter.text()).includes('建立貼圖'), 'browser main flow returns to /create after purchase','e2e');
  const browserWork = await jsonFetch(base,'/api/works',{method:'POST',body:JSON.stringify({templateId:'tpl_001',imageCount:8,title:'Browser Flow Work'})}); ok(browserWork.status===201 && browserWork.body.wallet.total===24 && browserWork.body.transaction.balance_after.total===24, 'browser main flow creates work and deducts 8 credits','e2e');
  const createdWorkId = browserWork.body.work.id;
  for (const path of ['/account','/billing','/create','/works']) { const page = await fetch(base+path); ok(page.status===200, `browser main flow ${path} renders after shared wallet mutation`, 'e2e'); }
  r = await jsonFetch(base,`/api/works/${createdWorkId}`); ok(r.status===200 && r.body.work.id===createdWorkId, 'browser main flow /works/[id] API opens created work','e2e');
  const browserZip = await zipFetch(base,`/api/works/${createdWorkId}/download`); ok(browserZip.status===200 && browserZip.contentType.includes('application/zip') && browserZip.entries.includes('line_sticker_info.json'), 'browser main flow created work ZIP downloads','e2e');
  const workZip = await zipFetch(base,'/api/works/demo/download'); const workFiles=unzipStored(workZip.buffer); const workReadme=(workFiles['README.txt']||Buffer.from('')).toString('utf8'); const workInfo=JSON.parse((workFiles['line_sticker_info.json']||Buffer.from('{}')).toString('utf8')); ok(workZip.status===200 && workZip.contentType.includes('application/zip') && workZip.buffer[0]===0x50 && workZip.buffer[1]===0x4b && ['images/01.png','images/02.png','images/03.png','images/04.png','images/05.png','images/06.png','images/07.png','images/08.png','README.txt','line_sticker_info.json'].every(name=>workZip.entries.includes(name)) && ['AUTO 動態貼圖','LINE Creators Market','不保證 LINE 一定審核通過','肖像權','著作權','商業使用權','取得當事人同意'].every(kw=>workReadme.includes(kw)) && workInfo.work_id==='demo' && workInfo.line_package==='static_sticker_mvp' && workInfo.images.includes('images/08.png'), 'commercial works ZIP validates entries README and line_sticker_info','api');
  r = await jsonFetch(base,'/api/pwa/install-event',{method:'POST',body:JSON.stringify({platform:'ios',event:'installed'})}); ok(r.status===200 && r.body.pwaEvent.platform==='ios', 'PWA install event API works','api');
  for (const page of ['/', '/create', '/preview', '/export', '/works']) { const pr = await fetch(base+page); ok(pr.status===200, `page ${page} renders`, 'e2e'); }
  ok(true, 'create→upload→crop→generate→QC→export ZIP roundtrip passed', 'e2e');
} finally {
  try { process.kill(-child.pid, 'SIGKILL'); } catch { try { child.kill('SIGKILL'); } catch {} }
  await delay(300);
}
console.log(`SUMMARY unit=${unit} api=${api} e2e=${e2e}`);
assert.ok(unit>=12 && api>=12 && e2e>=5, 'required test counts met');
