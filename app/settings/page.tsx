'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  const [privacyMode, setPrivacyMode] = useState(true);
  const [autoDelete, setAutoDelete] = useState('30days');
  const [language, setLanguage] = useState('zh-TW');

  return (
    <main>
      <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, marginBottom: 8 }}>
        ← 返回
      </button>
      <div className="page-header">設定</div>

      <div className="card" style={{ padding: 0, marginBottom: 16 }}>
        <div className="settings-item">
          <span>🌐 語言</span>
          <select
            value={language}
            onChange={e => setLanguage(e.target.value)}
            style={{ border: 'none', background: 'transparent', fontSize: 14, color: 'var(--muted)', cursor: 'pointer' }}
          >
            <option value="zh-TW">繁體中文</option>
            <option value="ja">日本語</option>
            <option value="en">English</option>
          </select>
        </div>
        <div className="settings-item">
          <span>🔒 隱私模式</span>
          <button
            onClick={() => setPrivacyMode(v => !v)}
            style={{
              width: 48, height: 28, borderRadius: 14, border: 'none',
              background: privacyMode ? 'var(--pink)' : 'rgba(0,0,0,0.1)',
              cursor: 'pointer', position: 'relative',
            }}
          >
            <span style={{ position: 'absolute', top: 4, left: privacyMode ? 24 : 4, width: 20, height: 20, borderRadius: '50%', background: 'white', transition: 'left 0.2s' }} />
          </button>
        </div>
        <div className="settings-item">
          <span>🗑️ 照片自動刪除</span>
          <select
            value={autoDelete}
            onChange={e => setAutoDelete(e.target.value)}
            style={{ border: 'none', background: 'transparent', fontSize: 14, color: 'var(--muted)', cursor: 'pointer' }}
          >
            <option value="7days">7 天後</option>
            <option value="30days">30 天後</option>
            <option value="90days">90 天後</option>
            <option value="never">永不刪除</option>
          </select>
        </div>
      </div>

      <div className="card" style={{ padding: 0, marginBottom: 16 }}>
        <div className="settings-item" style={{ cursor: 'pointer' }}>
          <span>📖 輸出格式偏好</span>
          <span className="value">LINE ZIP →</span>
        </div>
      </div>

      <button
        style={{ width: '100%', padding: 14, borderRadius: 'var(--radius-button)', border: '1px solid var(--danger)', background: 'white', color: 'var(--danger)', fontWeight: 600, cursor: 'pointer' }}
        onClick={() => {
          if (confirm('確定要清除本機所有資料嗎？')) {
            alert('已清除');
          }
        }}
      >
        清除本機資料
      </button>

      <div style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: 'var(--muted)' }}>
        AUTO動態貼圖 v1.0.0<br />
        僅支援 LINE 貼圖格式規範
      </div>
    </main>
  );
}
