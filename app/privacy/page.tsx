'use client';
import { useRouter } from 'next/navigation';

export default function PrivacyPage() {
  const router = useRouter();

  return (
    <main>
      <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, marginBottom: 8 }}>
        ← 返回
      </button>
      <div className="page-header">隱私與授權</div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>📸 照片使用說明</div>
        <div style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--muted)' }}>
          <p style={{ marginBottom: 12 }}>
            您上傳的照片僅用於<br />
            <strong style={{ color: 'var(--text)' }}>「本次 AI 貼圖生成」</strong>。
          </p>
          <ul style={{ paddingLeft: 16 }}>
            <li>照片不會公開分享或上架</li>
            <li>照片不會用於訓練 AI 模型</li>
            <li>可在「設定」中隨時刪除</li>
            <li>超過保存期限自動清除</li>
          </ul>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>⚖️ 授權聲明</div>
        <div style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--muted)' }}>
          <p style={{ marginBottom: 12 }}>
            使用本工具生成貼圖時，請確保您擁有該照片的完整使用權利。
          </p>
          <p>
            請勿上傳或使用您無權使用的角色、品牌、商標或人物圖片。
            生成的貼圖僅供個人使用，如需商業用途請自行負責。
          </p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>🗑️ 刪除資料</div>
        <div style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--muted)' }}>
          <p>您可隨時在「設定」頁面：</p>
          <ul style={{ paddingLeft: 16, marginTop: 8 }}>
            <li>清除本機所有資料</li>
            <li>設定照片自動刪除期限</li>
            <li>刪除特定上傳照片</li>
          </ul>
        </div>
      </div>

      <div style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.6 }}>
        如有隱私問題，請聯繫 support@autosticker.example.com<br />
        最后更新：2026-05-02
      </div>
    </main>
  );
}
