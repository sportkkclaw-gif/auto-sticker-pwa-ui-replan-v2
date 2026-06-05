import Link from 'next/link';

export default function ExportPage() {
  return (
    <main className="wide-page">
      <div className="page-header">匯出中心</div>
      <section className="card desktop-card">
        <h2>正式匯出已整合到作品結果頁</h2>
        <p className="muted">每個 LINE 靜態貼圖作品完成後，系統會自動執行 QC。只有 PNG、透明背景、尺寸、檔案大小、張數、main.png、tab.png 與 ZIP 結構全部通過時，作品頁才會顯示下載按鈕。</p>
        <div className="button-row">
          <Link className="btn-primary" href="/create">建立新貼圖</Link>
          <Link className="btn-secondary" href="/works">查看作品</Link>
        </div>
      </section>
      <section className="card desktop-card">
        <h2>QC 閘門</h2>
        <ul className="qc-list">
          {[
            '貼圖 PNG 最大 370 x 320',
            'main.png 必須是 240 x 240',
            'tab.png 必須是 96 x 74',
            '每張圖需要透明 alpha channel',
            '單張 PNG 不超過 1MB，ZIP 不超過 60MB',
            '檔名與張數符合 LINE 靜態貼圖規格',
          ].map((item) => (
            <li className="qc-item pass" key={item}><span className="icon">✓</span><span>{item}</span></li>
          ))}
        </ul>
      </section>
    </main>
  );
}
