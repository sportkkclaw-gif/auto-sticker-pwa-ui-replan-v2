'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const WORKS = [
  { id: 'w1', title: 'Q版人像 - 我的第一組', status: 'completed', count: 8, createdAt: '2026-05-03' },
  { id: 'w2', title: '毛孩貼圖', status: 'in_progress', count: 8, createdAt: '2026-05-02' },
  { id: 'w3', title: '情緒表情包', status: 'draft', count: 4, createdAt: '2026-05-01' },
  { id: 'w4', title: '測試失敗 - 額度不足', status: 'failed', count: 8, createdAt: '2026-04-30' },
];

export default function WorksPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'all' | 'completed' | 'draft'>('all');

  const filtered = WORKS.filter(w => tab === 'all' || w.status === tab || (tab === 'draft' && w.status === 'draft'));

  return (
    <main>
      <div className="page-header">我的作品</div>

      <div className="chip-filter">
        {(['all', 'completed', 'draft'] as const).map(t => (
          <button key={t} className={`chip ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'all' ? '全部' : t === 'completed' ? '已完成' : '草稿'}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map(work => (
          <div
            key={work.id}
            className="card"
            style={{ cursor: 'pointer' }}
            onClick={() => router.push(`/works/${work.id}`)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{work.title}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                  {work.count} 張 · {work.createdAt}
                </div>
              </div>
              <span className={`badge ${work.status}`}>
                {work.status === 'completed' ? '已完成' : work.status === 'in_progress' ? '生成中' : work.status === 'failed' ? '失敗' : '草稿'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
          <div>還沒有作品，開始建立第一組貼圖吧！</div>
        </div>
      )}
    </main>
  );
}
