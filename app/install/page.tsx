'use client';
import { useRouter } from 'next/navigation';

export default function InstallPage() {
  const router = useRouter();

  return (
    <main>
      <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, marginBottom: 8 }}>
        ← 返回
      </button>
      <div className="page-header">安裝 App</div>

      <div className="card" style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 64, marginBottom: 12 }}>📱</div>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>將 AUTO動態貼圖<br />安裝到主畫面</div>
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>
          享受 App 般的流暢體驗<br />離線也能開啟
        </div>
      </div>

      <div className="card">
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>📱 iOS（Safari）</div>
        {[
          '1. 使用 Safari 開啟本網站',
          '2. 點擊下方分享按鈕 □',
          '3. 向下滾動，點「加入主畫面」',
          '4. 點右上角「新增」完成',
        ].map((step, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, fontSize: 14 }}>
            <span style={{ fontWeight: 700, color: 'var(--pink)' }}>{i + 1}</span>
            <span>{step.replace('□', '')}</span>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>🤖 Android（Chrome）</div>
        {[
          '1. 使用 Chrome 開啟本網站',
          '2. 點擊頂部安裝提示橫幅',
          '3. 或點擊右上角 ⋮ 選單',
          '4. 選「新增至主畫面」',
        ].map((step, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, fontSize: 14 }}>
            <span style={{ fontWeight: 700, color: 'var(--green)' }}>{i + 1}</span>
            <span>{step}</span>
          </div>
        ))}
      </div>

      <button className="btn-primary" onClick={() => router.push('/me')} style={{ marginTop: 16 }}>
        返回「我的」
      </button>
    </main>
  );
}
