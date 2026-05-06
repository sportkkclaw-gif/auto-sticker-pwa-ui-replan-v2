'use client';

const ADMIN_TEMPLATES = [
  { id: 'tpl_001', name: 'Q版人像', status: 'active', isPremium: false, category: 'Q版人像' },
  { id: 'tpl_002', name: '情緒表情包', status: 'active', isPremium: false, category: '情緒表情包' },
  { id: 'tpl_003', name: '戀愛語錄', status: 'active', isPremium: false, category: '戀愛語錄' },
  { id: 'tpl_004', name: '毛孩貼圖', status: 'active', isPremium: false, category: '毛孩貼圖' },
  { id: 'tpl_005', name: '上班日常', status: 'disabled', isPremium: true, category: '上班日常' },
  { id: 'tpl_006', name: '節慶祝福', status: 'active', isPremium: true, category: '節慶' },
  { id: 'tpl_007', name: '品牌吉祥物', status: 'disabled', isPremium: true, category: '品牌吉祥物' },
  { id: 'tpl_008', name: '動態反應', status: 'active', isPremium: false, category: '動態反應' },
];

export default function AdminTemplatesPage() {
  return (
    <main>
      <div style={{ padding: '16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 20, fontWeight: 800 }}>模板管理</div>
        <span className="badge" style={{ background: 'var(--blue)', color: 'white' }}>Admin</span>
      </div>

      <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
        共 {ADMIN_TEMPLATES.length} 個模板
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {ADMIN_TEMPLATES.map(t => (
          <div key={t.id} className="card" style={{ padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{t.name}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                {t.category} · {t.isPremium ? '🔒 Premium' : '免費'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span className={`badge ${t.status === 'active' ? 'completed' : 'draft'}`}>
                {t.status === 'active' ? '啟用' : '停用'}
              </span>
              <button style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.1)', background: 'white', cursor: 'pointer', fontSize: 12 }}>
                編輯
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
