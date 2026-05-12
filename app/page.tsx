import Link from 'next/link';
import { TEMPLATES } from '@/lib/mvpClientStore';
export default function HomePage(){
 const hot=TEMPLATES.slice(0,4);
 return <main className="wide-page">
  <section className="hero hero-commercial">
   <div className="pwa-badge">📱 商業 MVP</div>
   <h1>把照片變成專屬 LINE 貼圖</h1>
   <p>上傳照片、選擇模板，自動生成可下載的貼圖素材包。先打通登入、點數、建立作品、扣點、ZIP 下載與購買入口。</p>
   <div className="hero-actions"><Link className="btn-primary" href="/create">立即開始製作</Link><Link className="btn-secondary" href="/templates">查看熱門模板</Link></div>
  </section>
  <section className="card desktop-card"><h2>商業主流程</h2><div className="flow-grid">{['登入/使用者狀態','查看點數','選模板上傳照片','扣點建立作品','作品列表與詳情','ZIP下載','額度不足阻擋','購買 mock 點數'].map((x,i)=><div className="flow-step" key={x}><b>{i+1}</b><span>{x}</span></div>)}</div></section>
  <section className="card desktop-card"><div className="section-title-row"><h2>熱門模板</h2><Link href="/templates">全部模板 →</Link></div><div className="template-grid">{hot.map(t=><Link key={t.id} href={`/templates/${t.id}`} className="template-card commercial"><div className="template-visual">{t.emoji}</div><div className="name">{t.name}</div><div className="desc">{t.description}</div><div className="tags">{t.recommended_count} 張 · 消耗 {t.credit_cost} 點</div></Link>)}</div></section>
  <section className="cta-row"><Link href="/billing" className="mini-card">💳 額度管理</Link><Link href="/install" className="mini-card">📲 安裝 App</Link><Link href="/line-guide" className="mini-card">📋 LINE 規格</Link></section>
 </main>;
}
