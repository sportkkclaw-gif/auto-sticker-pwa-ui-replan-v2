'use client';
import { useRouter } from 'next/navigation';

export default function MePage() {
  const router = useRouter();

  return (
    <main>
      <div className="page-header">我的</div>

      <div className="credit-display">
        <div style={{ fontSize: 14, opacity: 0.8 }}>可用額度</div>
        <div className="amount">12</div>
        <div className="label">點數</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 16 }}>
        <div className="card" style={{ textAlign: 'center', padding: 16 }}>
          <div style={{ fontSize: 28, marginBottom: 4 }}>🆓</div>
          <div style={{ fontWeight: 700, fontSize: 20 }}>2</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>免費點數</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: 16 }}>
          <div style={{ fontSize: 28, marginBottom: 4 }}>💎</div>
          <div style={{ fontWeight: 700, fontSize: 20 }}>10</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>付費點數</div>
        </div>
      </div>

      <div className="settings-list">
        <div className="settings-item" onClick={() => router.push('/me/credits')}>
          <span>💰 額度管理</span>
          <span className="value">→</span>
        </div>
        <div className="settings-item" onClick={() => router.push('/settings')}>
          <span>⚙️ 設定</span>
          <span className="value">→</span>
        </div>
        <div className="settings-item" onClick={() => router.push('/help/line-spec')}>
          <span>📋 LINE 規格說明</span>
          <span className="value">→</span>
        </div>
        <div className="settings-item" onClick={() => router.push('/install')}>
          <span>📱 安裝 App</span>
          <span className="value">→</span>
        </div>
        <div className="settings-item" onClick={() => router.push('/privacy')}>
          <span>🔒 隱私與授權</span>
          <span className="value">→</span>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>📱</div>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>安裝 AUTO動態貼圖</div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>
          作為 App 在手機主畫面使用
        </div>
        <button
          className="btn-primary"
          onClick={() => router.push('/install')}
        >
          取得安裝教學
        </button>
      </div>
    </main>
  );
}
