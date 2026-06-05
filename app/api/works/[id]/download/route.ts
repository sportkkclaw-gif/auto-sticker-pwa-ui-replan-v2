import { NextRequest } from 'next/server';
import { createStoredZip } from '@/lib/zip';
import { buildGenerationManifest, getBuffer, getStage2WorkDetail } from '@/lib/stage2';
import { getWork } from '@/lib/mock-store';
import { getLineStaticWork, readLineStaticFile } from '@/lib/line-static';

const legacyPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAgAAAAIACAIAAADdvUsCAAAAF0lEQVR42u3BAQ0AAADCoPdPbQ43oAAAAAAAAAAA4G8B7AABH9sYVgAAAABJRU5ErkJggg==','base64');

function legacyZip(id:string){
 const readme = `AUTO 動態貼圖匯出包\n\n此 ZIP 由 AUTO 動態貼圖產生。\n請依照 LINE Creators Market 最新規格進行上傳與審核。\n\n注意：\n1. 本工具不保證 LINE 一定審核通過。\n2. 使用者需確認圖片人物、肖像權、著作權與商業使用權。\n3. 若圖片包含真人，請取得當事人同意。\n`;
 const info = { work_id:id, app:'AUTO 動態貼圖', line_package:'static_sticker_mvp', images:Array.from({length:8},(_,i)=>`images/${String(i+1).padStart(2,'0')}.png`), disclaimer:'本服務不保證 LINE Creators Market 一定審核通過。' };
 return createStoredZip([...info.images.map((name)=>({name,data:legacyPng})), {name:'README.txt',data:readme}, {name:'line_sticker_info.json',data:JSON.stringify(info,null,2)}]);
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id:string }>}) {
 const { id } = await params;
 const lineStaticWork = getLineStaticWork(id);
 if (lineStaticWork) {
   if (lineStaticWork.qc_status !== 'passed' || !lineStaticWork.download_url) {
     return Response.json({ error:'QC_NOT_PASSED', message:'LINE 靜態貼圖 QC 未通過，禁止下載 ZIP。', failures:lineStaticWork.qc_failures }, { status:409 });
   }
   const zip = readLineStaticFile(id, 'line-static-stickers.zip');
   if (!zip) return Response.json({ error:'ZIP_NOT_FOUND', message:'找不到匯出 ZIP。' }, { status:404 });
   return new Response(new Uint8Array(zip), { status:200, headers:{ 'Content-Type':'application/zip', 'Content-Disposition':`attachment; filename="${id}-line-static-stickers.zip"`, 'Content-Length':String(zip.length), 'Cache-Control':'no-store' }});
 }
 const detail = getStage2WorkDetail(id);
 if (!detail) {
   if (id !== 'demo' && !getWork(id)) return Response.json({ error:'WORK_NOT_FOUND', message:'作品不存在。' }, { status:404 });
   const zip=legacyZip(id);
   return new Response(new Uint8Array(zip), { status:200, headers:{ 'Content-Type':'application/zip', 'Content-Disposition':`attachment; filename="${id}-line-stickers.zip"`, 'Content-Length':String(zip.length), 'Cache-Control':'no-store' }});
 }
 if (detail.work.status !== 'completed') return Response.json({ error:'WORK_NOT_READY', message:'作品尚未完成生成。' }, { status:409 });
 const manifest = buildGenerationManifest(id)!;
 const readme = `AUTO 動態貼圖 Stage 2 匯出包\n\nProvider: mock_non_placeholder\nWork: ${id}\nJob: ${detail.generation_job.id}\n\n此 ZIP 由 AUTO 動態貼圖 Stage 2 產生。請依照 LINE Creators Market 最新規格進行上傳與審核。\n\n注意：本工具不保證 LINE Creators Market 一定審核通過；使用者需確認圖片人物、肖像權、著作權與商業使用權。\n`;
 const info = { work_id:id, generation_job_id: detail.generation_job.id, app:'AUTO 動態貼圖', line_package:'static_sticker_stage2_mock_non_placeholder', images:manifest.generated_images.map((i)=>i.zip_path), disclaimer:'本服務不保證 LINE Creators Market 一定審核通過。' };
 const files = [...detail.generated_images.map((image)=>({ name:image.zip_path, data:getBuffer(image.storage_key) || Buffer.from('missing') })), { name:'README.txt', data:readme }, { name:'line_sticker_info.json', data:JSON.stringify(info,null,2) }, { name:'generation_manifest.json', data:JSON.stringify(manifest,null,2) }];
 const zip=createStoredZip(files);
 return new Response(new Uint8Array(zip), { status:200, headers:{ 'Content-Type':'application/zip', 'Content-Disposition':`attachment; filename="${id}-stage2-line-stickers.zip"`, 'Content-Length':String(zip.length), 'Cache-Control':'no-store' }});
}
