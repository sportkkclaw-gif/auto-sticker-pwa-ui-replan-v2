import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
const port = process.env.PORT || String(3400 + Math.floor(Math.random()*200));
const base = process.env.AUTO_STICKER_BASE_URL || process.env.BASE_URL || `http://127.0.0.1:${port}`;
let child;
if (!process.env.AUTO_STICKER_BASE_URL && !process.env.BASE_URL) {
  child = spawn('./node_modules/.bin/next',['start'],{env:{...process.env,PORT:port,NEXT_TELEMETRY_DISABLED:'1'},stdio:['ignore','pipe','pipe']});
  let logs=''; child.stdout.on('data',d=>logs+=d); child.stderr.on('data',d=>logs+=d);
  for (let i=0;i<60;i++) { try { const r=await fetch(`${base}/api/health`); if(r.status<500) break; } catch {} await delay(500); if(i===59){ child.kill('SIGTERM'); throw new Error('server not ready '+logs); } }
}
async function expect(path, status=200, init){ const r=await fetch(base+path,{headers:{'content-type':'application/json'},...init}); if(r.status!==status) throw new Error(`${path} expected ${status} got ${r.status}: ${await r.text()}`); return r; }
function zipEntries(buffer){ const names=[]; for(let i=0;i<buffer.length-46;i++){ if(buffer.readUInt32LE(i)===0x02014b50){ const nameLen=buffer.readUInt16LE(i+28); const extraLen=buffer.readUInt16LE(i+30); const commentLen=buffer.readUInt16LE(i+32); names.push(buffer.subarray(i+46,i+46+nameLen).toString('utf8')); i += 45 + nameLen + extraLen + commentLen; } } return names; }
function unzipStored(buffer){ const files={}; for(let i=0;i<buffer.length-30;i++){ if(buffer.readUInt32LE(i)===0x04034b50){ const compMethod=buffer.readUInt16LE(i+8); const size=buffer.readUInt32LE(i+18); const nameLen=buffer.readUInt16LE(i+26); const extraLen=buffer.readUInt16LE(i+28); const name=buffer.subarray(i+30,i+30+nameLen).toString('utf8'); const dataStart=i+30+nameLen+extraLen; if(compMethod===0) files[name]=buffer.subarray(dataStart,dataStart+size); i=dataStart+size-1; } } return files; }
function requireLegacyZip(buffer){ if(buffer[0]!==0x50 || buffer[1]!==0x4b) throw new Error('legacy download is not ZIP magic PK'); const entries=zipEntries(buffer); const required=['main.png','tab.png','01.png','02.png','03.png','04.png','05.png','06.png','07.png','08.png','metadata.json','qc_report.html']; const missing=required.filter(name=>!entries.includes(name)); if(missing.length) throw new Error(`legacy ZIP missing entries: ${missing.join(', ')}; got ${entries.join(', ')}`); return entries; }
function requireCommercialZip(buffer){
  if(buffer[0]!==0x50 || buffer[1]!==0x4b) throw new Error('commercial works download is not ZIP magic PK');
  const entries=zipEntries(buffer);
  const required=['images/01.png','images/02.png','images/03.png','images/04.png','images/05.png','images/06.png','images/07.png','images/08.png','README.txt','line_sticker_info.json'];
  const missing=required.filter(name=>!entries.includes(name)); if(missing.length) throw new Error(`commercial ZIP missing entries: ${missing.join(', ')}; got ${entries.join(', ')}`);
  const files=unzipStored(buffer);
  const readme=(files['README.txt']||Buffer.from('')).toString('utf8');
  for (const kw of ['AUTO 動態貼圖','LINE Creators Market','不保證 LINE 一定審核通過','肖像權','著作權','商業使用權','取得當事人同意']) if(!readme.includes(kw)) throw new Error(`commercial README missing keyword: ${kw}`);
  const info=JSON.parse((files['line_sticker_info.json']||Buffer.from('{}')).toString('utf8'));
  if(info.work_id!=='demo') throw new Error(`line_sticker_info work_id expected demo got ${info.work_id}`);
  if(info.app!=='AUTO 動態貼圖') throw new Error(`line_sticker_info app mismatch`);
  if(info.line_package!=='static_sticker_mvp') throw new Error(`line_sticker_info line_package mismatch`);
  for (const name of required.filter(x=>x.startsWith('images/'))) if(!info.images?.includes(name)) throw new Error(`line_sticker_info images missing ${name}`);
  return entries;
}
try {
  for (const p of ['/', '/templates', '/create', '/preview', '/export', '/works', '/account', '/billing']) await expect(p,200);

  const initial = await (await expect('/api/credits/balance',200)).json();
  const paymentCreated = await (await expect('/api/billing/mock-payment',201,{method:'POST',body:JSON.stringify({packageId:'business'})})).json();
  if(paymentCreated.payment.status !== 'created' || paymentCreated.payment.credits !== 600) throw new Error('mock payment create contract failed');
  const paymentCompleted = await (await expect(`/api/billing/mock-payment/${paymentCreated.payment.id}/complete`,200,{method:'POST',body:JSON.stringify({})})).json();
  if((paymentCompleted.wallet.paid_credits - initial.paid_credits) !== 600) throw new Error(`paid_credits did not increase by 600: before ${initial.paid_credits} after ${paymentCompleted.wallet.paid_credits}`);
  const paymentCompletedAgain = await (await expect(`/api/billing/mock-payment/${paymentCreated.payment.id}/complete`,200,{method:'POST',body:JSON.stringify({})})).json();
  if(paymentCompletedAgain.wallet.paid_credits !== paymentCompleted.wallet.paid_credits) throw new Error('complete payment idempotency failed: paid credits changed on second call');
  const afterPayment = await (await expect('/api/credits/balance',200)).json();
  if(afterPayment.paid_credits !== paymentCompleted.wallet.paid_credits) throw new Error('balance after payment did not persist');
  const consumed = await (await expect('/api/credits/balance',200,{method:'POST',body:JSON.stringify({type:'consume',amount:-8,description:'acceptance deduct probe'})})).json();
  if(consumed.wallet.total !== afterPayment.total - 8) throw new Error(`consume did not reduce total by 8: before ${afterPayment.total} after ${consumed.wallet.total}`);
  if(consumed.transaction.balance_after.total !== consumed.wallet.total) throw new Error('consume ledger balance_after mismatch');
  const afterConsume = await (await expect('/api/credits/balance',200)).json();
  if(afterConsume.total !== consumed.wallet.total) throw new Error('balance after consume did not persist');
  console.log(`Commercial credits API verified: initial=${initial.total} afterPayment=${afterPayment.total} afterConsume=${afterConsume.total}`);

  const commercialDownload = await expect('/api/works/demo/download',200);
  const commercialType = commercialDownload.headers.get('content-type') || '';
  if(!commercialType.includes('application/zip')) throw new Error(`/api/works/demo/download expected application/zip got ${commercialType}`);
  const commercialEntries = requireCommercialZip(Buffer.from(await commercialDownload.arrayBuffer()));
  console.log(`Commercial works ZIP verified: status=200 content-type=${commercialType} entries=${commercialEntries.join(',')}`);

  const asset = await (await expect('/api/assets/upload',201,{method:'POST',body:JSON.stringify({mimeType:'image/png',fileSize:1024,consent:true})})).json();
  const project = await (await expect('/api/projects',201,{method:'POST',body:JSON.stringify({templateId:'tpl_001',sourceAssetId:asset.asset.id,count:8,title:'Acceptance'})})).json();
  const pid=project.project.id;
  await expect(`/api/assets/${asset.asset.id}/crop`,200,{method:'POST',body:JSON.stringify({width:512,height:512})});
  await expect('/api/generation/jobs',201,{method:'POST',body:JSON.stringify({projectId:pid,templateId:'tpl_001',sourceAssetId:asset.asset.id,count:8,prompt:'acceptance'})});
  await expect(`/api/projects/${pid}/qc`,200,{method:'POST',body:JSON.stringify({forceFail:true})});
  await expect(`/api/projects/${pid}/export`,409,{method:'POST'});
  await expect(`/api/projects/${pid}/qc`,200,{method:'POST',body:JSON.stringify({})});
  const exportResponse = await (await expect(`/api/projects/${pid}/export`,201,{method:'POST'})).json();
  const download = await expect(`/api/exports/${exportResponse.exportPackage.id}/download`,200);
  const contentType = download.headers.get('content-type') || '';
  if(!contentType.includes('application/zip')) throw new Error(`legacy download expected application/zip got ${contentType}`);
  const entries = requireLegacyZip(Buffer.from(await download.arrayBuffer()));
  console.log(`Legacy export ZIP verified (secondary): status=200 content-type=${contentType} entries=${entries.join(',')}`);
  console.log('All acceptance gates PASSED');
} finally { if(child){ child.kill('SIGKILL'); await delay(300); } }
