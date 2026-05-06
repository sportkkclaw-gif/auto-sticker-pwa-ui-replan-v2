'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const MOCK_TEMPLATES = [
  { id: 'tpl_001', name: 'Q版人像', tags: '可愛,人形', thumbnailUrl: '' },
  { id: 'tpl_002', name: '情緒表情包', tags: '表情,情緒', thumbnailUrl: '' },
  { id: 'tpl_003', name: '戀愛語錄', tags: '情侶,浪漫', thumbnailUrl: '' },
  { id: 'tpl_004', name: '毛孩貼圖', tags: '寵物,可愛', thumbnailUrl: '' },
];

export default function HomePage() {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [uploadedPhoto, setUploadedPhoto] = useState(false);
  const [generating, setGenerating] = useState(false);

  const canGenerate = selectedTemplate && uploadedPhoto;

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setGenerating(true);
    await new Promise(r => setTimeout(r, 2000));
    router.push('/preview');
  };

  return (
    <main>
      {/* Hero */}
      <section className="hero">
        <div className="pwa-badge">📱 PWA</div>
        <h1>AI 貼圖工作室</h1>
        <p>上傳照片 × 模板提示，一鍵生成專屬 LINE 貼圖</p>
      </section>

      {/* Step Guide */}
      <div className="step-guide">
        <div className="step"><span className="step-num">1</span>選模板</div>
        <span style={{ color: '#ccc' }}>→</span>
        <div className="step"><span className="step-num">2</span>上傳照片</div>
        <span style={{ color: '#ccc' }}>→</span>
        <div className="step"><span className="step-num">3</span>生成</div>
      </div>

      {/* Template Carousel */}
      <section className="card">
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: 'var(--muted)' }}>
          熱門模板
        </div>
        <div className="template-carousel">
          {MOCK_TEMPLATES.map((t) => (
            <div
              key={t.id}
              className={`template-card ${selectedTemplate === t.id ? 'selected' : ''}`}
              onClick={() => setSelectedTemplate(t.id)}
            >
              <div style={{
                width: '100%', aspectRatio: '1', background: 'var(--bg-cream)',
                borderRadius: 12, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 40,
              }}>
                🎨
              </div>
              <div className="name">{t.name}</div>
              <div className="tags">{t.tags}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Upload Card */}
      <section className="card">
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>上傳照片</div>
        <div
          className={`upload-card ${uploadedPhoto ? '' : ''}`}
          onClick={() => setUploadedPhoto(true)}
        >
          {uploadedPhoto ? (
            <>
              <div style={{ fontSize: 40 }}>✅</div>
              <div style={{ fontFamily: 'inherit', marginTop: 8, fontSize: 14, fontWeight: 600 }}>
                已上傳照片
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>點擊替換</div>
            </>
          ) : (
            <>
              <div className="upload-icon">📷</div>
              <div className="upload-hint">上傳 JPG/PNG，最大 10MB</div>
            </>
          )}
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 12, textAlign: 'center' }}>
          🔒 照片僅用於本次生成，不會公開；可在設定刪除。
        </div>
      </section>

      {/* Prompt Editor */}
      <section className="card">
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>提示詞</div>
        <div className="prompt-editor">
          <textarea
            placeholder="Q版可愛，圓潤線條，透明背景，LINE貼圖風格"
            maxLength={200}
            rows={3}
          />
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
            0 / 200 字
          </div>
        </div>
      </section>

      {/* Count Selection */}
      <section className="card">
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>生成張數</div>
        <div style={{ display: 'flex', gap: 12 }}>
          {([4, 8, 16] as const).map(n => (
            <button
              key={n}
              style={{
                flex: 1, padding: '12px', borderRadius: 'var(--radius-button)',
                border: '2px solid var(--pink)', background: 'white',
                color: 'var(--pink)', fontWeight: 700, fontSize: 15, cursor: 'pointer',
              }}
              onClick={() => {}}
            >
              {n} 張
            </button>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div style={{ padding: '8px 0 16px' }}>
        <button
          className="btn-primary"
          disabled={!canGenerate}
          onClick={handleGenerate}
        >
          {generating ? '生成中…' : '生成 8 張貼圖'}
        </button>
        {!canGenerate && (
          <div style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', marginTop: 8 }}>
            {!selectedTemplate ? '請先選擇模板' : '請先上傳照片'}
          </div>
        )}
      </div>

      {/* Compliance */}
      <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', padding: '0 16px 24px', lineHeight: 1.6 }}>
        ⚠️ AI 內容由使用者自負責任，請遵守 LINE 貼圖規範。本工具不保證 LINE 審核通過。
      </div>
    </main>
  );
}
