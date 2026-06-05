'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CATEGORIES, TEMPLATES } from '@/lib/mvpClientStore';

type PreviewMode = 'compare' | 'gpt-image-1' | 'gpt-image-2';

export default function TemplatesPage() {
  const [cat, setCat] = useState('全部');
  const [q, setQ] = useState('');
  const [previewMode, setPreviewMode] = useState<PreviewMode>('compare');
  const keyword = q.trim();
  const list = TEMPLATES.filter((template) => {
    const categoryMatch = cat === '全部' || template.category === cat || template.tags.includes(cat);
    const text = [template.name, template.description, template.use_case, template.preview_lines.join(' '), template.tags.join(' ')].join(' ');
    return categoryMatch && (!keyword || text.includes(keyword));
  });

  return (
    <main className="wide-page">
      <section className="template-picker-hero">
        <div>
          <span className="pwa-badge">熱門模板</span>
          <h1>看圖選風格</h1>
          <p>每個方向都放入真實生成範例。選定後會自動帶入風格 prompt、常用台詞與建議張數。</p>
        </div>
        <Link className="btn-primary template-blank-action" href="/create">從空白開始</Link>
      </section>

      <section className="template-toolbar">
        <div className="search-bar">
          <input placeholder="搜尋：早安、寵物、上班、戀愛..." value={q} onChange={(event) => setQ(event.target.value)} />
        </div>
        <div className="preview-mode-toggle" aria-label="選擇範例圖模式">
          {[
            ['compare', '對比'],
            ['gpt-image-1', 'gpt-image-1'],
            ['gpt-image-2', 'gpt-image-2'],
          ].map(([value, label]) => (
            <button
              key={value}
              className={previewMode === value ? 'active' : ''}
              onClick={() => setPreviewMode(value as PreviewMode)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <div className="chip-filter">
        {CATEGORIES.map((category) => (
          <button key={category} className={`chip ${cat === category ? 'active' : ''}`} onClick={() => setCat(category)}>{category}</button>
        ))}
      </div>

      <div className="template-grid user-template-grid">
        {list.map((template) => (
          <Link key={template.id} href={`/create?template=${template.id}`} className="user-template-card">
            <div className={`user-template-visual ${previewMode === 'compare' ? 'is-compare' : ''}`}>
              {previewMode === 'compare' ? (
                <div className="template-compare-preview">
                  <div>
                    <img src={template.preview_image} alt={`${template.name} gpt-image-1 預覽`} />
                    <small>gpt-image-1</small>
                  </div>
                  <div>
                    <img src={template.preview_image_gpt_image_2} alt={`${template.name} gpt-image-2 預覽`} />
                    <small>gpt-image-2</small>
                  </div>
                </div>
              ) : (
                <img
                  src={previewMode === 'gpt-image-2' ? template.preview_image_gpt_image_2 : template.preview_image}
                  alt={`${template.name} ${previewMode} 預覽`}
                />
              )}
              <span>{template.category}</span>
            </div>
            <div className="user-template-copy">
              <h2>{template.name}</h2>
              <p>{template.description}</p>
            </div>
            <div className="phrase-row">
              {template.preview_lines.slice(0, 4).map((line) => <b key={line}>{line}</b>)}
            </div>
            <div className="template-chip-row">
              {template.tags.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}
            </div>
            <div className="template-card-footer">
              <span>{template.recommended_count} 張 · {template.credit_cost} 點</span>
              <b>套用</b>
            </div>
          </Link>
        ))}
      </div>

      {list.length === 0 && (
        <section className="card empty">
          <h2>找不到符合的模板</h2>
          <p className="muted">換個關鍵字，或先看全部模板。</p>
        </section>
      )}
    </main>
  );
}
