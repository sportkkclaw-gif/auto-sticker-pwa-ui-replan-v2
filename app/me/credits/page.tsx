'use client';
import { useRouter } from 'next/navigation';

export default function CreditsPage() {
  const router = useRouter();

  const ledger = [
    { type: 'grant', amount: 5, reason: '新用戶註冊獎勵', date: '2026-05-03' },
    { type: 'debit', amount: -1, reason: '生成 8 張 Q版人像', date: '2026-05-03' },
    { type: 'debit', amount: -2, reason: '生成 16 張毛孩貼圖', date: '2026-05-02' },
    { type: 'grant', amount: 10, reason: '購買點數包', date: '2026-05-01' },
  ];

  return (
    <main>
      <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, marginBottom: 8 }}>
        ← 返回
      </button>
      <div className="page-header">額度管理</div>

      <div className="credit-display" style={{ marginBottom: 16 }}>
        <div className="amount">12</div>
        <div className="label">目前可用點數</div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <button style={{ flex: 1, padding: 14, borderRadius: 'var(--radius-button)', background: 'var(--pink)', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
          購買點數
        </button>
        <button style={{ flex: 1, padding: 14, borderRadius: 'var(--radius-button)', background: 'white', border: '1px solid rgba(0,0,0,0.1)', fontWeight: 600, cursor: 'pointer' }}>
          取得免費點數
        </button>
      </div>

      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>點數記錄</div>
      <div className="card" style={{ padding: 0 }}>
        {ledger.map((item, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: i < ledger.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{item.reason}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{item.date}</div>
            </div>
            <div style={{ fontWeight: 700, color: item.amount > 0 ? 'var(--green)' : 'var(--text)' }}>
              {item.amount > 0 ? '+' : ''}{item.amount}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
