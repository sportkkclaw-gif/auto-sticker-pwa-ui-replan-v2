import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
const port = process.env.PORT || String(3400 + Math.floor(Math.random()*200));
const base = process.env.BASE_URL || `http://127.0.0.1:${port}`;
let child;
if (!process.env.BASE_URL) {
  child = spawn('./node_modules/.bin/next',['start'],{env:{...process.env,PORT:port,NEXT_TELEMETRY_DISABLED:'1'},stdio:['ignore','pipe','pipe']});
  let logs=''; child.stdout.on('data',d=>logs+=d); child.stderr.on('data',d=>logs+=d);
  for (let i=0;i<60;i++) { try { const r=await fetch(`${base}/api/health`); if(r.status<500) break; } catch {} await delay(500); if(i===59){ child.kill('SIGTERM'); throw new Error('server not ready '+logs); } }
}
async function expect(path, status=200, init){ const r=await fetch(base+path,{headers:{'content-type':'application/json'},...init}); if(r.status!==status) throw new Error(`${path} expected ${status} got ${r.status}: ${await r.text()}`); return r; }
function zipEntries(buffer){ const names=[]; for(let i=0;i<buffer.length-46;i++){ if(buffer.readUInt32LE(i)===0x02014b50){ const nameLen=buffer.readUInt16LE(i+28); const extraLen=buffer.readUInt16LE(i+30); const commentLen=buffer.readUInt16LE(i+32); names.push(buffer.subarray(i+46,i+46+nameLen).toString('utf8')); i += 45 + nameLen + extraLen + commentLen; } } return names; }
function requireZip(buffer){ if(buffer[0]!==0x50 || buffer[1]!==0x4b) throw new Error('download is not ZIP magic PK'); const entries=zipEntries(buffer); const required=['main.png','tab.png','01.png','02.png','03.png','04.png','05.png','06.png','07.png','08.png','metadata.json','qc_report.html']; const missing=required.filter(name=>!entries.includes(name)); if(missing.length) throw new Error(`ZIP missing entries: ${missing.join(', ')}; got ${entries.join(', ')}`); return entries; }
try {
  for (const p of ['/', '/templates', '/create', '/preview', '/export', '/works', '/me']) await expect(p,200);
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
  if(!contentType.includes('application/zip')) throw new Error(`download expected application/zip got ${contentType}`);
  const entries = requireZip(Buffer.from(await download.arrayBuffer()));
  console.log(`Export download ZIP verified: status=200 content-type=${contentType} entries=${entries.join(',')}`);
  console.log('All acceptance gates PASSED');
} finally { if(child){ child.kill('SIGKILL'); await delay(300); } }
