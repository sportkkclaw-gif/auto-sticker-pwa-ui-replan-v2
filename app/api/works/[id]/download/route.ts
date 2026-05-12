import { NextRequest } from 'next/server';
import { createStoredZip } from '@/lib/zip';
const transparentPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/luzH7wAAAABJRU5ErkJggg==','base64');
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id:string }>}){
 const { id } = await params;
 const readme = `AUTO 動態貼圖匯出包\n\n此 ZIP 由 AUTO 動態貼圖產生。\n請依照 LINE Creators Market 最新規格進行上傳與審核。\n\n注意：\n1. 本工具不保證 LINE 一定審核通過。\n2. 使用者需確認圖片人物、肖像權、著作權與商業使用權。\n3. 若圖片包含真人，請取得當事人同意。\n`;
 const info = { work_id:id, app:'AUTO 動態貼圖', line_package:'static_sticker_mvp', images:Array.from({length:8},(_,i)=>`images/${String(i+1).padStart(2,'0')}.png`), disclaimer:'本服務不保證 LINE Creators Market 一定審核通過。' };
 const files = [
  ...Array.from({length:8},(_,i)=>({ name:`images/${String(i+1).padStart(2,'0')}.png`, data:transparentPng })),
  { name:'README.txt', data:readme },
  { name:'line_sticker_info.json', data:JSON.stringify(info,null,2) },
 ];
 const zip=createStoredZip(files);
 return new Response(new Uint8Array(zip), { status:200, headers:{ 'Content-Type':'application/zip', 'Content-Disposition':`attachment; filename="${id}-line-stickers.zip"`, 'Content-Length':String(zip.length), 'Cache-Control':'no-store' }});
}
