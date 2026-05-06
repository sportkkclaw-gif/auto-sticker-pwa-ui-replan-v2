'use client';

const QC_RULES = [
  { id: 'r1', key: 'STATIC_FORMAT', label: '靜態 PNG 格式', severity: 'P0', staticLimit: 'PNG only' },
  { id: 'r2', key: 'TRANSPARENT_BG', label: '透明背景', severity: 'P0', staticLimit: 'RGBA' },
  { id: 'r3', key: 'DIMENSION_EVEN', label: '寬高為偶數', severity: 'P0', staticLimit: '370×430 max, even' },
  { id: 'r4', key: 'FILE_SIZE', label: '檔案大小限制', severity: 'P0', staticLimit: '≤300KB rec, ≤1MB max' },
  { id: 'r5', key: 'ZIP_NAMING', label: 'ZIP 命名正確', severity: 'P0', staticLimit: '01-40.png' },
  { id: 'r6', key: 'MAIN_TAB', label: '主圖與 Tab 圖區分', severity: 'P1', staticLimit: 'main.png + tab.png' },
  { id: 'r7', key: 'ANIMATED_FRAME_COUNT', label: '動態幀數', severity: 'P1', animatedLimit: '5-20 frames' },
  { id: 'r8', key: 'ANIMATED_PLAYBACK', label: '播放時間', severity: 'P1', animatedLimit: '≤4 sec total' },
  { id: 'r9', key: 'ANIMATED_LOOP', label: '循環次數', severity: 'P1', animatedLimit: '1-4 loops' },
  { id: 'r10', key: 'ANIMATED_FILE_SIZE', label: '動態檔案大小', severity: 'P0', animatedLimit: '≤1MB' },
  { id: 'r11', key: 'ANIMATED_FIRST_FRAME', label: '首幀有效性', severity: 'P1', animatedLimit: 'non-blank' },
  { id: 'r12', key: 'REVIEW_NOT_GUARANTEED', label: '審核不保證', severity: 'P2', staticLimit: 'warning only' },
];

export default function AdminQcRulesPage() {
  return (
    <main>
      <div style={{ padding: '16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 20, fontWeight: 800 }}>QC 規則管理</div>
        <span className="badge" style={{ background: 'var(--blue)', color: 'white' }}>Admin</span>
      </div>

      <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
        共 {QC_RULES.length} 條規則 · P0 失敗阻斷匯出
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {QC_RULES.map(rule => (
          <div key={rule.id} className="card" style={{ padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{rule.label}</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <span style={{
                  padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                  background: rule.severity === 'P0' ? 'rgba(239,68,68,0.15)' : rule.severity === 'P1' ? 'rgba(255,211,90,0.3)' : 'rgba(0,0,0,0.06)',
                  color: rule.severity === 'P0' ? 'var(--danger)' : rule.severity === 'P1' ? '#B88A00' : 'var(--muted)',
                }}>
                  {rule.severity}
                </span>
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'monospace' }}>
              key: {rule.key}
              {rule.staticLimit && ` · static: ${rule.staticLimit}`}
              {rule.animatedLimit && ` · animated: ${rule.animatedLimit}`}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
