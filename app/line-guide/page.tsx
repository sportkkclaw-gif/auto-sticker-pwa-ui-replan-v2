export default function LineGuidePage() {
  return (
    <main className="wide-page">
      <div className="page-header">LINE 靜態貼圖規格</div>
      <section className="card desktop-card">
        <h2>本工具 v1 輸出</h2>
        <ul className="doc-list">
          <li>貼圖張數：8、16、24、32 或 40 張</li>
          <li>貼圖圖檔：PNG、透明背景、最大 370 x 320、單張不超過 1MB</li>
          <li>主圖：main.png，240 x 240</li>
          <li>聊天標籤圖：tab.png，96 x 74</li>
          <li>ZIP：包含 images/01.png 起的貼圖、line_sticker_info.json、generation_manifest.json、qc_report.html</li>
        </ul>
      </section>
      <section className="card desktop-card">
        <h2>審核提醒</h2>
        <p className="muted">本服務會檢查輸出檔案格式符合 LINE 靜態貼圖上傳規格，但不保證 LINE Creators Market 一定審核通過。請確認素材的人像權、著作權、商業使用權與平台內容政策。</p>
      </section>
    </main>
  );
}
