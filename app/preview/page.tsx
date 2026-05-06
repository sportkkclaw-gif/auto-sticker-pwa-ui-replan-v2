'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PreviewPage() {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [done] = useState(true);

  const results = Array.from({ length: 8 }, (_, i) => ({ id: `s_${i}`, text: ['開心', '難過', '生氣', '加油', '愛你', '哭哭', '好棒', '呃...'][i] }));

  return (
    <main>
      <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, marginBottom: 8 }}>
        ← 返回
      </button>
      <div className="page-header">生成預覽</div>

      {done ? (
        <>
          <div style={{ fontSize: 13, color: 'var(--green)', fontWeight: 600, marginBottom: 12 }}>
            ✅ 生成完成！
          </div>
          <div className="preview-grid">
            {results.map((r, i) => (
              <div key={r.id} style={{ position: 'relative' }}>
                <div style={{
                  aspectRatio: '1', background: i % 2 === 0 ? '#FFE4E8' : '#E8F0FF',
                  borderRadius: 8, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 24,
                }}>
                  {['😊', '😢', '😤', '💪', '😍', '😭', '👏', '😳'][i]}
                </div>
                <div style={{ fontSize: 10, textAlign: 'center', marginTop: 2, color: 'var(--muted)' }}>{r.text}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button className="btn-primary" onClick={() => router.push('/export')}>
              匯出 / 下載
            </button>
            <button
              style={{ padding: 14, borderRadius: 'var(--radius-button)', border: '1px solid rgba(0,0,0,0.1)', background: 'white', cursor: 'pointer', fontWeight: 600 }}
              onClick={async () => {
                setGenerating(true);
                await new Promise(r => setTimeout(r, 2000));
                setGenerating(false);
              }}
            >
              重新生成
            </button>
          </div>
        </>
      ) : (
        <>
          <div style={{ fontSize: 13, color: 'var(--blue)', fontWeight: 600, marginBottom: 12 }}>
            生成中…
          </div>
          <div className="preview-grid">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="skeleton" style={{ aspectRatio: '1' }} />
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 20, color: 'var(--muted)', fontSize: 14 }}>
            預計 20 秒完成…
          </div>
        </>
      )}
    </main>
  );
}
