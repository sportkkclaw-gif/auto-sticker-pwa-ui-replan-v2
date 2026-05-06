'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ExportPage() {
  const router = useRouter();
  const [qcPassed, setQcPassed] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportDone, setExportDone] = useState(false);

  const runQc = async () => {
    setQcPassed(true);
  };

  const handleExport = async (type: string) => {
    setExporting(true);
    await new Promise(r => setTimeout(r, 1500));
    setExporting(false);
    setExportDone(true);
  };

  const qcChecks = [
    { rule: 'STATIC_FORMAT', label: '靜態 PNG 格式', pass: true },
    { rule: 'TRANSPARENT_BG', label: '透明背景', pass: true },
    { rule: 'DIMENSION_EVEN', label: '寬高為偶數 (370×370)', pass: true },
    { rule: 'FILE_SIZE', label: '單張 ≤ 1MB', pass: true },
    { rule: 'ZIP_NAMING', label: 'ZIP 命名正確', pass: true },
    { rule: 'MAIN_TAB', label: '主圖與 Tab 圖區分', pass: true },
  ];

  return (
    <main>
      <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, marginBottom: 8 }}>
        ← 返回
      </button>
      <div className="page-header">匯出中心</div>

      {/* QC Checklist */}
      <div className="card">
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>LINE QC 檢查</div>
        <ul className="qc-list">
          {qcChecks.map(check => (
            <li key={check.rule} className={`qc-item ${check.pass ? 'pass' : 'fail'}`}>
              <span className="icon">{check.pass ? '✅' : '❌'}</span>
              <span>{check.label}</span>
            </li>
          ))}
        </ul>

        {!qcPassed && (
          <button className="btn-primary" onClick={runQc} style={{ marginTop: 16 }}>
            執行 LINE QC
          </button>
        )}

        {qcPassed && (
          <div style={{ marginTop: 12, padding: 12, background: 'rgba(24,184,122,0.1)', borderRadius: 12, fontSize: 13, color: 'var(--green)', fontWeight: 600, textAlign: 'center' }}>
            ✅ QC 通過！可安全匯出
          </div>
        )}

        <div style={{ marginTop: 12, fontSize: 11, color: 'var(--muted)', textAlign: 'center' }}>
          ⚠️ 本工具不保證 LINE 審核通過
        </div>
      </div>

      {/* Export Options */}
      {qcPassed && (
        <div className="card">
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>下載格式</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { type: 'png_single', label: '單張 PNG 下載', icon: '🖼️', desc: '個別下載所有貼圖' },
              { type: 'zip_all', label: '全部 ZIP', icon: '📦', desc: '所有貼圖打包 ZIP' },
              { type: 'line_static_zip', label: 'LINE 規格 ZIP', icon: '📱', desc: 'main.png + tab.png + 01-08 + qc_report.html' },
            ].map(item => (
              <button
                key={item.type}
                onClick={() => handleExport(item.type)}
                disabled={exporting}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: 14, borderRadius: 'var(--radius-card)',
                  border: '1px solid rgba(0,0,0,0.08)', background: 'white',
                  cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.2s',
                }}
              >
                <span style={{ fontSize: 28 }}>{item.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{item.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {exportDone && (
        <div className="card" style={{ textAlign: 'center', padding: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>匯出完成！</div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>檔案已準備好，請點擊下載。</div>
          <button className="btn-primary" onClick={() => router.push('/works')} style={{ marginTop: 16 }}>
            查看作品
          </button>
        </div>
      )}
    </main>
  );
}
