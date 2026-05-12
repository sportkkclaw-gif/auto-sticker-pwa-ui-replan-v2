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
  id: string; name: string; category: string; description: string; recommended_count: 8 | 16 | 24;
  credit_cost: number; supports_line: boolean; supports_animated: boolean; emoji: string;
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
  { id:'tpl_001', name:'Q版人像', category:'Q版人像', description:'可愛、人形、適合個人貼圖', recommended_count:8, credit_cost:8, supports_line:true, supports_animated:false, emoji:'🧑‍🎨' },
  { id:'tpl_002', name:'情緒表情包', category:'情緒表情包', description:'開心、哭哭、生氣、加油等常用情緒', recommended_count:8, credit_cost:8, supports_line:true, supports_animated:true, emoji:'😆' },
  { id:'tpl_003', name:'戀愛語錄', category:'戀愛語錄', description:'情侶聊天、告白、撒嬌語錄', recommended_count:16, credit_cost:16, supports_line:true, supports_animated:false, emoji:'💌' },
  { id:'tpl_004', name:'毛孩貼圖', category:'毛孩貼圖', description:'貓狗寵物照片轉可愛貼圖', recommended_count:8, credit_cost:8, supports_line:true, supports_animated:true, emoji:'🐾' },
  { id:'tpl_005', name:'節日祝福', category:'節日祝福', description:'生日、新年、節慶問候素材包', recommended_count:24, credit_cost:24, supports_line:true, supports_animated:false, emoji:'🎉' },
  { id:'tpl_006', name:'職場迷因', category:'職場迷因', description:'上班族回覆、會議、加班迷因', recommended_count:8, credit_cost:8, supports_line:true, supports_animated:false, emoji:'💼' },
];
export const CATEGORIES = ['全部','Q版人像','情緒表情包','戀愛語錄','毛孩貼圖','節日祝福','職場迷因'];
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
