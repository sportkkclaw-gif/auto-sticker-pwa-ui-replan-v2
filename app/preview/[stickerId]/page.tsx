'use client';
import { useParams, useRouter } from 'next/navigation';

export default function StickerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const index = parseInt(params.stickerId as string) || 0;
  const texts = ['開心', '難過', '生氣', '加油', '愛你', '哭哭', '好棒', '呃...'];

  return (
    <main>
      <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, marginBottom: 8 }}>
        ← 返回
      </button>
      <div className="page-header">編輯第 {index + 1} 張</div>

      <div className="card" style={{ textAlign: 'center' }}>
        <div style={{
          width: 200, height: 200, margin: 'auto',
          background: index % 2 === 0 ? '#FFE4E8' : '#E8F0FF',
          borderRadius: 24, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 80,
        }}>
          {['😊', '😢', '😤', '💪', '😍', '😭', '👏', '😳'][index]}
        </div>
        <div style={{ marginTop: 12, fontSize: 16, fontWeight: 700 }}>{texts[index]}</div>
      </div>

      <div className="card">
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>單張設定</div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 13, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>貼圖文字</label>
          <input
            type="text"
            defaultValue={texts[index]}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 12, fontSize: 14 }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <input type="checkbox" id="whiteStroke" defaultChecked />
          <label htmlFor="whiteStroke" style={{ fontSize: 14 }}>白邊描邊</label>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <button
          style={{ flex: 1, padding: 14, borderRadius: 'var(--radius-button)', border: '1px solid rgba(0,0,0,0.1)', background: 'white', cursor: 'pointer', fontWeight: 600 }}
          onClick={() => router.back()}
        >
          返回
        </button>
        <button
          className="btn-primary"
          onClick={() => router.push('/preview')}
          style={{ flex: 2 }}
        >
          儲存並返回
        </button>
      </div>
    </main>
  );
}
