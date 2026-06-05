import Link from 'next/link';

const workId = 'work_stage3b_openai_20260524142621';

export default function Stage3BCreatePage() {
  return (
    <main className="wide-page">
      <section className="hero hero-commercial">
        <div className="pwa-badge">Stage 3B OpenAI Real Output</div>
        <h1>建立 8 張獨立 LINE 貼圖</h1>
        <p>本輪驗收聚焦 OpenAI Images API 真實輸出：create → generate 8 independent PNG stickers → review → zoom inspect → ZIP download。fallback image count = 0。</p>
        <div className="hero-actions">
          <Link className="btn-primary" href={`/stage3b-review/${workId}`}>Generate 8 stickers / 前往 Review</Link>
          <Link className="btn-secondary" href="/">回首頁</Link>
        </div>
      </section>
      <section className="card desktop-card">
        <h2>本輪固定設定</h2>
        <div className="flow-grid">
          <div className="flow-step"><b>1</b><span>Sticker count: 8 only</span></div>
          <div className="flow-step"><b>2</b><span>一張圖 = 一張貼圖成品</span></div>
          <div className="flow-step"><b>3</b><span>透明背景 / 安全邊距檢查</span></div>
          <div className="flow-step"><b>4</b><span>全部通過才可 ZIP download</span></div>
        </div>
      </section>
    </main>
  );
}
