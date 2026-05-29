export type CreditKind = 'free' | 'bonus' | 'paid';
export type TransactionType = 'grant_free' | 'purchase' | 'consume' | 'refund' | 'bonus' | 'adjustment';
export type WorkStatus = 'draft' | 'generating' | 'completed' | 'failed';

export type Wallet = { free_credits: number; bonus_credits: number; paid_credits: number; updated_at: string };
export type CreditTransaction = {
  id: string; created_at: string; type: TransactionType; direction: 'increase' | 'decrease';
  credits: number; description: string; work_id?: string; payment_id?: string;
  breakdown?: Partial<Record<CreditKind, number>>;
};
export type Template = {
  id: string; name: string; category: string; description: string; recommended_count: 8 | 16 | 24 | 32 | 40;
  credit_cost: number; supports_line: boolean; supports_animated: boolean; emoji: string;
  preview_image: string; preview_image_gpt_image_2: string; use_case: string; preview_lines: string[]; prompt: string; tags: string[]; risk_note: string;
};
export type Work = {
  id: string; name: string; template_id: string; template_name: string; count: 8 | 16 | 24;
  status: WorkStatus; credit_cost: number; created_at: string; updated_at: string;
  failure_reason?: string; image_labels: string[];
};
export type Payment = { id: string; package_name: string; price: string; credits: number; status: 'created' | 'paid'; created_at: string; paid_at?: string };

const K = { wallet:'auto_mvp_wallet', tx:'auto_mvp_transactions', works:'auto_mvp_works', payments:'auto_mvp_payments', user:'auto_mvp_user' };
const now = () => new Date().toISOString();
const id = (p:string) => `${p}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
const isBrowser = () => typeof window !== 'undefined' && !!window.localStorage;
function read<T>(key:string, fallback:T):T { if(!isBrowser()) return fallback; try { const v=localStorage.getItem(key); return v ? JSON.parse(v) as T : fallback; } catch { return fallback; } }
function write<T>(key:string, value:T):T { if(isBrowser()) localStorage.setItem(key, JSON.stringify(value)); return value; }

export const TEMPLATES: Template[] = [
  {
    id:'tpl_001',
    name:'日常大字包',
    category:'日常',
    description:'讓角色幫你說早安、收到、OK、謝謝，字要大、遠看也清楚。',
    recommended_count:24,
    credit_cost:24,
    supports_line:true,
    supports_animated:false,
    emoji:'💬',
    preview_image:'/template-previews/daily-big-text-generated.png',
    preview_image_gpt_image_2:'/template-previews/daily-big-text-gpt-image-2.png',
    use_case:'適合家人群、工作群、朋友群，每天都會用到。',
    preview_lines:['早安','收到','OK','謝謝','辛苦了','生日快樂'],
    prompt:'LINE 靜態貼圖，實用日常大字回覆，角色可愛清楚，白底以外透明背景，包含早安、收到、OK、謝謝、辛苦了、生日快樂等高頻聊天語，粗體中文字清晰可讀，不模仿任何知名 IP。',
    tags:['每天可用','大字清楚','長輩友善'],
    risk_note:'避免使用品牌、明星、球隊、知名角色或與既有貼圖過度相似的文案與造型。',
  },
  {
    id:'tpl_002',
    name:'寵物變貼圖',
    category:'寵物',
    description:'把寵物或小動物做成可愛角色，表情簡單、聊天很好用。',
    recommended_count:16,
    credit_cost:16,
    supports_line:true,
    supports_animated:false,
    emoji:'🐾',
    preview_image:'/template-previews/pet-character-generated.png',
    preview_image_gpt_image_2:'/template-previews/pet-character-gpt-image-2.png',
    use_case:'適合貓狗寵物、原創小動物、可愛吉祥物。',
    preview_lines:['開心','撒嬌','收到','謝謝','加油','晚安'],
    prompt:'LINE 靜態貼圖，可愛動物或寵物擬人角色，圓潤療癒，表情清楚，透明背景，適合日常聊天，包含開心、撒嬌、收到、謝謝、加油、晚安，不模仿現有知名角色。',
    tags:['寵物照片','療癒可愛','低風險'],
    risk_note:'不要仿作白爛貓、咖波、好想兔、LOVE RABBIT、三麗鷗或其他已知 IP。',
  },
  {
    id:'tpl_003',
    name:'上班快速回覆',
    category:'職場',
    description:'開會、收到、處理中、下班，一包解決工作聊天常用回覆。',
    recommended_count:16,
    credit_cost:16,
    supports_line:true,
    supports_animated:false,
    emoji:'💼',
    preview_image:'/template-previews/work-reply-generated.png',
    preview_image_gpt_image_2:'/template-previews/work-reply-gpt-image-2.png',
    use_case:'適合工作群、專案群、同事聊天，重點是快又清楚。',
    preview_lines:['開會中','收到','處理中','辛苦了','下班','已讀'],
    prompt:'LINE 靜態貼圖，工作上班族實用標籤包，乾淨手寫感中文字，透明背景，包含開會中、收到、處理中、辛苦了、想回家、下班、加油、已讀，表情微厭世但不攻擊他人。',
    tags:['工作群','效率回覆','文字清楚'],
    risk_note:'避免公司 Logo、真實同事肖像、職場霸凌、辱罵或歧視內容。',
  },
  {
    id:'tpl_004',
    name:'大臉反應包',
    category:'情緒',
    description:'臉放大、表情誇張，一秒回覆傻眼、爆笑、崩潰、震驚。',
    recommended_count:16,
    credit_cost:16,
    supports_line:true,
    supports_animated:false,
    emoji:'😳',
    preview_image:'/template-previews/big-face-reaction-generated.png',
    preview_image_gpt_image_2:'/template-previews/big-face-reaction-gpt-image-2.png',
    use_case:'適合朋友聊天、社群回覆、需要強烈情緒的對話。',
    preview_lines:['傻眼','爆笑','崩潰','震驚','無言','讚'],
    prompt:'LINE 靜態貼圖，大臉情緒反應包，角色臉部放大，誇張五官，透明背景，包含傻眼、爆笑、崩潰、震驚、害羞、無言、問號、讚，畫面清楚有社群反應感。',
    tags:['反應快速','表情強烈','朋友群'],
    risk_note:'真人臉部必須取得肖像授權；避免醜化特定真人或攻擊族群。',
  },
  {
    id:'tpl_005',
    name:'台味口頭禪',
    category:'台味',
    description:'賀啦、拍謝、母湯、是在哈囉，做出台灣聊天室語氣。',
    recommended_count:24,
    credit_cost:24,
    supports_line:true,
    supports_animated:false,
    emoji:'🧋',
    preview_image:'/template-previews/taiwan-slang-generated.png',
    preview_image_gpt_image_2:'/template-previews/taiwan-slang-gpt-image-2.png',
    use_case:'適合朋友群、家族群、台灣在地語感的日常聊天。',
    preview_lines:['賀啦','拍謝','甘蝦','母湯','早安啦','讚啦'],
    prompt:'LINE 靜態貼圖，台味日常口頭禪，溫暖有趣但不粗俗，透明背景，包含賀啦、拍謝、甘蝦、母湯、是在哈囉、早安啦、來去吃飯、讚啦，角色原創可愛，有台灣街頭生活感。',
    tags:['台灣語感','家族群','口頭禪'],
    risk_note:'台語與俗語要避免歧視、粗口、政治攻擊或冒用地方品牌。',
  },
  {
    id:'tpl_006',
    name:'戀愛撒嬌包',
    category:'戀愛',
    description:'想你、抱抱、愛你、哼，用可愛語氣傳給喜歡的人。',
    recommended_count:16,
    credit_cost:16,
    supports_line:true,
    supports_animated:false,
    emoji:'💌',
    preview_image:'/template-previews/love-cute-generated.png',
    preview_image_gpt_image_2:'/template-previews/love-cute-gpt-image-2.png',
    use_case:'適合情侶、曖昧聊天、親密朋友互動。',
    preview_lines:['想你','抱抱','愛你','哼','晚安','原諒你'],
    prompt:'LINE 靜態貼圖，戀愛撒嬌互動，可愛但不仿作知名兔子角色，透明背景，包含想你、抱抱、愛你、你不理我、一起吃飯、晚安、哼、原諒你，語氣俏皮溫柔。',
    tags:['情侶互動','撒嬌語氣','可愛'],
    risk_note:'避免情緒勒索過重、跟蹤騷擾、性暗示或模仿既有戀愛兔 IP。',
  },
  {
    id:'tpl_007',
    name:'眼淚情緒包',
    category:'情緒',
    description:'爆哭、笑到哭、委屈、感動，把哭哭情緒做得可愛又好傳。',
    recommended_count:16,
    credit_cost:16,
    supports_line:true,
    supports_animated:false,
    emoji:'😭',
    preview_image:'/template-previews/cry-emotion-generated.png',
    preview_image_gpt_image_2:'/template-previews/cry-emotion-gpt-image-2.png',
    use_case:'適合朋友安慰、壓力釋放、笑到不行、被感動的聊天情境。',
    preview_lines:['爆哭','笑到哭','委屈','感動','救命','我沒事'],
    prompt:'LINE 靜態貼圖，眼淚情緒包，大眼角色，透明背景，包含爆哭、笑到哭、委屈、感動、壓力大、救命、太好了、我沒事，淚水誇張但可愛療癒。',
    tags:['哭哭可愛','情緒強烈','反應包'],
    risk_note:'避免自傷鼓勵、霸凌、羞辱或讓使用者誤解為危機求助內容。',
  },
  {
    id:'tpl_008',
    name:'水潤療癒風',
    category:'療癒視覺',
    description:'果凍感、水滴感、閃亮眼睛，做一包輕柔療癒貼圖。',
    recommended_count:8,
    credit_cost:8,
    supports_line:true,
    supports_animated:false,
    emoji:'💧',
    preview_image:'/template-previews/jelly-healing-generated.png',
    preview_image_gpt_image_2:'/template-previews/jelly-healing-gpt-image-2.png',
    use_case:'適合可愛小角色、療癒品牌感、低文字貼圖。',
    preview_lines:['開心','謝謝','OK','抱抱','晚安','加油'],
    prompt:'LINE 靜態貼圖，水潤果凍療癒風，Q 彈透明感，閃亮眼睛，乾淨輪廓，透明背景，角色像果凍或水滴但保持原創，包含開心、謝謝、OK、抱抱、晚安、加油。',
    tags:['療癒感','低文字','視覺可愛'],
    risk_note:'透明果凍質感仍須保留 PNG 背景透明，不要生成灰白格或實心底色。',
  },
];
export const CATEGORIES = ['全部','日常','寵物','職場','情緒','台味','戀愛','療癒視覺'];
export const PACKAGES = [
  { id:'starter', name:'體驗包', price:'NT$99', credits:30 },
  { id:'standard', name:'標準包', price:'NT$199', credits:80, recommended:true },
  { id:'creator', name:'創作者包', price:'NT$499', credits:250 },
  { id:'business', name:'商用包', price:'NT$999', credits:600 },
];
export const defaultUser = { id:'user_demo_001', email:'demo@auto-sticker.local', displayName:'Demo Creator' };

export function ensureMvpState() {
  if (!isBrowser()) return;
  if (!localStorage.getItem(K.user)) write(K.user, defaultUser);
  if (!localStorage.getItem(K.wallet)) write(K.wallet, { free_credits:2, bonus_credits:0, paid_credits:30, updated_at: now() } satisfies Wallet);
  if (!localStorage.getItem(K.tx)) write(K.tx, [{ id:id('tx'), created_at:now(), type:'grant_free', direction:'increase', credits:2, description:'新使用者免費點數' }] satisfies CreditTransaction[]);
  if (!localStorage.getItem(K.works)) write(K.works, [] as Work[]);
  if (!localStorage.getItem(K.payments)) write(K.payments, [] as Payment[]);
}
export function resetMvpState(){ if(!isBrowser()) return; Object.values(K).forEach(k=>localStorage.removeItem(k)); ensureMvpState(); }
export function getWallet(): Wallet { ensureMvpState(); return read(K.wallet, { free_credits:2, bonus_credits:0, paid_credits:30, updated_at: now() }); }
export function totalCredits(w=getWallet()){ return w.free_credits + w.bonus_credits + w.paid_credits; }
export function getTransactions(): CreditTransaction[]{ ensureMvpState(); return read(K.tx, []); }
function addTx(tx: Omit<CreditTransaction,'id'|'created_at'>){ const list=[{ id:id('tx'), created_at:now(), ...tx }, ...getTransactions()]; write(K.tx,list); return list[0]; }
export function canAfford(cost:number){ return totalCredits() >= cost; }
export function deductCredits(cost:number, work_id:string){
  const w=getWallet(); let remain=cost; const breakdown: Partial<Record<CreditKind,number>>={};
  const take=(kind:CreditKind, field:keyof Wallet)=>{ const n=Math.min(Number(w[field]), remain); if(n>0){ (w[field] as number)-=n; breakdown[kind]=n; remain-=n; } };
  take('free','free_credits'); take('bonus','bonus_credits'); take('paid','paid_credits');
  if(remain>0) return { ok:false as const, wallet:w, shortage:remain };
  w.updated_at=now(); write(K.wallet,w);
  addTx({ type:'consume', direction:'decrease', credits:cost, description:`建立作品扣除 ${cost} 點`, work_id, breakdown });
  return { ok:true as const, wallet:w, breakdown };
}
export function refundCredits(cost:number, work_id:string, reason='生成失敗退點'){
  const w=getWallet(); w.paid_credits += cost; w.updated_at=now(); write(K.wallet,w);
  addTx({ type:'refund', direction:'increase', credits:cost, description:reason, work_id, breakdown:{ paid:cost } });
}
export function createMockPayment(packId:string){
  const pack=PACKAGES.find(p=>p.id===packId) || PACKAGES[1]; const pay:Payment={ id:id('pay'), package_name:pack.name, price:pack.price, credits:pack.credits, status:'created', created_at:now() };
  const list=[pay, ...getPayments()]; write(K.payments,list); return pay;
}
export function completePayment(paymentId:string){
  const payments=getPayments(); const p=payments.find(x=>x.id===paymentId); if(!p) return null; if(p.status!=='paid'){
    p.status='paid'; p.paid_at=now(); const w=getWallet(); w.paid_credits += p.credits; w.updated_at=now(); write(K.wallet,w);
    addTx({ type:'purchase', direction:'increase', credits:p.credits, description:`${p.package_name} 付款完成`, payment_id:p.id, breakdown:{ paid:p.credits } });
  }
  write(K.payments,payments); return p;
}
export function getPayments():Payment[]{ ensureMvpState(); return read(K.payments, []); }
export function getWorks():Work[]{ ensureMvpState(); return read(K.works, []); }
export function getWork(workId:string){ return getWorks().find(w=>w.id===workId); }
export function createWork(input:{templateId:string; count:8|16|24; title?:string}){
  ensureMvpState(); const tpl=TEMPLATES.find(t=>t.id===input.templateId) || TEMPLATES[0]; const cost=input.count;
  if(!canAfford(cost)) return { ok:false as const, error:'點數不足，請先購買額度後再建立作品。', shortage: cost-totalCredits(), cost };
  const work:Work={ id:id('work'), name:input.title || `${tpl.name} ${input.count}張`, template_id:tpl.id, template_name:tpl.name, count:input.count, status:'generating', credit_cost:cost, created_at:now(), updated_at:now(), image_labels:Array.from({length:input.count},(_,i)=>['開心','OK','加油','收到','愛你','哭哭','謝謝','晚安','早安','讚啦','抱抱','等等','怒','驚訝','生日快樂','下班'][i%16]) };
  const d=deductCredits(cost, work.id); if(!d.ok) return { ok:false as const, error:'點數不足，請先購買額度後再建立作品。', shortage:d.shortage, cost };
  write(K.works,[work, ...getWorks()]); return { ok:true as const, work };
}
export function markWorkCompleted(workId:string){ const list=getWorks(); const w=list.find(x=>x.id===workId); if(w){ w.status='completed'; w.updated_at=now(); write(K.works,list); } return w; }
export function failWork(workId:string, reason='mock 生成失敗'){ const list=getWorks(); const w=list.find(x=>x.id===workId); if(w){ w.status='failed'; w.failure_reason=reason; w.updated_at=now(); write(K.works,list); refundCredits(w.credit_cost,w.id); } return w; }
export function deleteWork(workId:string){ write(K.works, getWorks().filter(w=>w.id!==workId)); }
