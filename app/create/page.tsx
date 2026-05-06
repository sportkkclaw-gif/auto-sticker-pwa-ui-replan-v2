'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const STEPS = ['選模板', '上傳照片', '生成設定'];

export default function CreatePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [templateSelected, setTemplateSelected] = useState('');
  const [photoUploaded, setPhotoUploaded] = useState(false);
  const [count] = useState<4 | 8 | 16>(8);
  const [removeBg, setRemoveBg] = useState(true);
  const [addText, setAddText] = useState(false);
  const [whiteStroke, setWhiteStroke] = useState(true);

  const canNext0 = !!templateSelected;
  const canNext1 = photoUploaded;

  return (
    <main>
      <div className="page-header">建立貼圖</div>

      {/* Stepper */}
      <div className="step-guide" style={{ justifyContent: 'flex-start', gap: 16, marginBottom: 24 }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700,
              background: i <= step ? 'var(--pink)' : 'rgba(0,0,0,0.08)',
              color: i <= step ? 'white' : 'var(--muted)',
            }}>
              {i + 1}
            </div>
            <span style={{ fontSize: 13, color: i <= step ? 'var(--text)' : 'var(--muted)', fontWeight: i === step ? 700 : 400 }}>
              {s}
            </span>
          </div>
        ))}
      </div>

      {/* Step 0: Template */}
      {step === 0 && (
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>選擇模板</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {[
              { id: 'tpl_001', name: 'Q版人像' },
              { id: 'tpl_002', name: '情緒表情包' },
              { id: 'tpl_003', name: '戀愛語錄' },
              { id: 'tpl_004', name: '毛孩貼圖' },
            ].map(t => (
              <div
                key={t.id}
                className={`template-card ${templateSelected === t.id ? 'selected' : ''}`}
                onClick={() => setTemplateSelected(t.id)}
                style={{ flex: 'none', cursor: 'pointer' }}
              >
                <div style={{ width: '100%', aspectRatio: '1', background: 'var(--bg-cream)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>🎨</div>
                <div className="name">{t.name}</div>
              </div>
            ))}
          </div>
          <button
            className="btn-primary"
            disabled={!canNext0}
            onClick={() => setStep(1)}
            style={{ marginTop: 20 }}
          >
            下一步：上傳照片
          </button>
        </div>
      )}

      {/* Step 1: Upload */}
      {step === 1 && (
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>上傳照片</div>
          <div className="upload-card" onClick={() => setPhotoUploaded(true)}>
            {photoUploaded ? (
              <>
                <div style={{ fontSize: 40 }}>✅</div>
                <div style={{ marginTop: 8, fontWeight: 600 }}>已上傳</div>
              </>
            ) : (
              <>
                <div className="upload-icon">📷</div>
                <div className="upload-hint">點擊上傳 JPG/PNG，最大 10MB</div>
              </>
            )}
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            <button
              style={{ flex: 1, padding: 14, borderRadius: 'var(--radius-button)', border: '1px solid rgba(0,0,0,0.1)', background: 'white', cursor: 'pointer' }}
              onClick={() => setStep(0)}
            >
              返回
            </button>
            <button
              className="btn-primary"
              disabled={!canNext1}
              onClick={() => setStep(2)}
              style={{ flex: 2 }}
            >
              下一步：生成設定
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Settings */}
      {step === 2 && (
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>生成設定</div>

          <div className="card">
            <div style={{ marginBottom: 12 }}>生成張數：{count} 張</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {([4, 8, 16] as const).map(n => (
                <button
                  key={n}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 'var(--radius-button)',
                    border: n === count ? '2px solid var(--pink)' : '1px solid rgba(0,0,0,0.1)',
                    background: n === count ? 'rgba(255,107,138,0.08)' : 'white',
                    color: n === count ? 'var(--pink)' : 'var(--text)',
                    fontWeight: 700, cursor: 'pointer',
                  }}
                  onClick={() => {}}
                >
                  {n}張
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>進階選項</div>
            {[
              { label: '自動去背', checked: removeBg, toggle: () => setRemoveBg(v => !v) },
              { label: '加入文字', checked: addText, toggle: () => setAddText(v => !v) },
              { label: '白邊描邊', checked: whiteStroke, toggle: () => setWhiteStroke(v => !v) },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                <span>{item.label}</span>
                <button
                  onClick={item.toggle}
                  style={{
                    width: 48, height: 28, borderRadius: 14, border: 'none',
                    background: item.checked ? 'var(--pink)' : 'rgba(0,0,0,0.1)',
                    cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
                  }}
                >
                  <span style={{
                    position: 'absolute', top: 4, left: item.checked ? 24 : 4,
                    width: 20, height: 20, borderRadius: '50%', background: 'white',
                    transition: 'left 0.2s',
                  }} />
                </button>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            <button
              style={{ flex: 1, padding: 14, borderRadius: 'var(--radius-button)', border: '1px solid rgba(0,0,0,0.1)', background: 'white', cursor: 'pointer' }}
              onClick={() => setStep(1)}
            >
              返回
            </button>
            <button
              className="btn-primary"
              onClick={async () => {
                await new Promise(r => setTimeout(r, 1500));
                router.push('/preview');
              }}
              style={{ flex: 2 }}
            >
              生成 {count} 張貼圖
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
