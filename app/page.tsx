import Link from 'next/link';
import { TEMPLATES } from '@/lib/mvpClientStore';

export default function HomePage() {
  const hot = TEMPLATES.slice(0, 4);
  return (
    <main className="wide-page">
      <section className="hero hero-commercial">
        <div className="pwa-badge">LINE 靜態貼圖 v1</div>
        <h1>把素材變成可上傳 LINE 的貼圖 ZIP</h1>
        <p>上傳照片或角色素材，輸入想要的風格，系統自動產生透明 PNG、main.png、tab.png 與 QC report。格式通過才開放下載。</p>
        <div className="hero-actions">
          <Link className="btn-primary" href="/create">開始生成</Link>
          <Link className="btn-secondary" href="/line-guide">查看 LINE 規格</Link>
        </div>
      </section>

      <section className="card desktop-card">
        <h2>三步完成</h2>
        <div className="flow-grid">
          {['上傳基本素材', '輸入貼圖風格', '自動生成與 QC', '下載 LINE ZIP'].map((step, index) => (
            <div className="flow-step" key={step}><b>{index + 1}</b><span>{step}</span></div>
          ))}
        </div>
      </section>

      <section className="card desktop-card">
        <div className="section-title-row"><h2>風格靈感</h2><Link href="/templates">全部模板 →</Link></div>
        <div className="template-grid">
          {hot.map((template) => (
            <Link key={template.id} href={`/create?template=${template.id}`} className="template-card commercial">
              <div className="template-visual">{template.emoji}</div>
              <div className="name">{template.name}</div>
              <div className="desc">{template.description}</div>
              <div className="tags">{template.recommended_count} 張 · 消耗 {template.credit_cost} 點</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="cta-row">
        <Link href="/billing" className="mini-card">點數管理</Link>
        <Link href="/works" className="mini-card">我的作品</Link>
        <Link href="/line-guide" className="mini-card">LINE 規格</Link>
      </section>
    </main>
  );
}
