'use client';
import { useRouter } from 'next/navigation';

export default function LineSpecPage() {
  const router = useRouter();

  const specs = [
    { category: '靜態貼圖', items: [
      { label: '檔案格式', value: 'PNG（透明背景）' },
      { label: '尺寸', value: '最大 370×430 px，寬高需為偶數' },
      { label: '檔案大小', value: '單張 ≤ 300 KB（建議 ≤ 1MB 內）' },
      { label: 'ZIP 包內容', value: 'main.png + tab.png + 01.png ~ 40.png + metadata.json' },
      { label: '主圖（Main）', value: '第一張為靜態宣傳圖，尺寸 370×370' },
      { label: 'Tab 圖', value: '第二張為列表用小圖，尺寸 72×72' },
    ]},
    { category: '動態貼圖（APNG）', items: [
      { label: '幀數', value: '5–20 幀' },
      { label: '播放時間', value: '1/2/3/4 秒' },
      { label: '循環次數', value: '1–4 次' },
      { label: '總播放時長', value: '≤ 4 秒' },
      { label: '檔案大小', value: '單張 ≤ 1MB' },
      { label: '首幀', value: '需為有意義靜態圖，不得為空白' },
      { label: '高風險效果', value: '❌ 火焰、煙霧、爆炸、大面積粒子、影片背景' },
    ]},
  ];

  return (
    <main>
      <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, marginBottom: 8 }}>
        ← 返回
      </button>
      <div className="page-header">LINE 規格說明</div>

      <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20, lineHeight: 1.6, padding: '12px 16px', background: 'rgba(255,211,90,0.2)', borderRadius: 12 }}>
        ⚠️ 本工具協助檢查規格，但 LINE 審核結果由 LINE 官方決定，本工具不保證審核必過。
      </div>

      {specs.map(spec => (
        <div key={spec.category} className="card" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: 'var(--blue)' }}>
            {spec.category === '靜態貼圖' ? '🖼️' : '🎞️'} {spec.category}
          </div>
          <div>
            {spec.items.map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(0,0,0,0.05)', fontSize: 13 }}>
                <span style={{ color: 'var(--muted)', flexShrink: 0 }}>{item.label}</span>
                <span style={{ fontWeight: 600, textAlign: 'right' }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="card">
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>📋 送出審核前檢查清單</div>
        <div style={{ fontSize: 13, lineHeight: 1.8, color: 'var(--muted)' }}>
          □ 所有圖片為透明背景 PNG<br />
          □ 寬高皆為偶數<br />
          □ 命名前 40 張為 01.png ~ 40.png<br />
          □ 了解 LINE 官方審核標準，內容符合社群規範
        </div>
      </div>
    </main>
  );
}
