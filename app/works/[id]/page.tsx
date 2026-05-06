'use client';
import { useParams, useRouter } from 'next/navigation';

const WORK_DETAIL: Record<string, { id: string; title: string; status: string; count: number; template: string }> = {
  w1: { id: 'w1', title: 'Q版人像 - 我的第一組', status: 'completed', count: 8, template: 'Q版人像' },
  w2: { id: 'w2', title: '毛孩貼圖', status: 'in_progress', count: 8, template: '毛孩貼圖' },
  w3: { id: 'w3', title: '情緒表情包', status: 'draft', count: 4, template: '情緒表情包' },
  w4: { id: 'w4', title: '測試失敗 - 額度不足', status: 'failed', count: 8, template: 'Q版人像' },
};

export default function WorkDetailPage() {
  const params = useParams();
  const router = useRouter();
  const work = WORK_DETAIL[params.id as string] || WORK_DETAIL['w1'];

  return (
    <main>
      <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, marginBottom: 8 }}>
        ← 返回
      </button>
      <div className="page-header">{work.title}</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
        {Array.from({ length: work.count }, (_, i) => (
          <div key={i} style={{
            aspectRatio: '1', background: i % 2 === 0 ? '#FFE4E8' : '#E8F0FF',
            borderRadius: 8, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 24,
          }}>
            {['😊', '😢', '😤', '💪', '😍', '😭', '👏', '😳'][i]}
          </div>
        ))}
      </div>

      <div className="card">
        <div className="settings-item">
          <span>模板</span><span className="value">{work.template}</span>
        </div>
        <div className="settings-item">
          <span>張數</span><span className="value">{work.count} 張</span>
        </div>
        <div className="settings-item">
          <span>狀態</span>
          <span className={`badge ${work.status === 'completed' ? 'completed' : work.status === 'failed' ? 'failed' : 'draft'}`}>
            {work.status}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
        {work.status === 'completed' && (
          <button className="btn-primary" onClick={() => router.push('/export')}>
            匯出 / 下載
          </button>
        )}
        {work.status !== 'completed' && work.status !== 'failed' && (
          <button className="btn-primary" onClick={() => router.push('/preview')}>
            繼續生成
          </button>
        )}
        <button
          style={{ padding: 14, borderRadius: 'var(--radius-button)', border: '1px solid rgba(0,0,0,0.1)', background: 'white', cursor: 'pointer', fontWeight: 600 }}
          onClick={async () => { await new Promise(r => setTimeout(r, 500)); router.push('/works'); }}
        >
          刪除作品
        </button>
      </div>
    </main>
  );
}
