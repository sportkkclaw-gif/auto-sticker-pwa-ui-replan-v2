'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const CATEGORIES = ['全部', 'Q版人像', '情緒表情包', '戀愛語錄', '毛孩貼圖', '上班日常', '節慶', '品牌吉祥物'];
const ALL_TEMPLATES = [
  { id: 'tpl_001', name: 'Q版人像', category: 'Q版人像', tags: ['可愛', '人形'], isPremium: false },
  { id: 'tpl_002', name: '情緒表情包', category: '情緒表情包', tags: ['表情', '情緒'], isPremium: false },
  { id: 'tpl_003', name: '戀愛語錄', category: '戀愛語錄', tags: ['情侶', '浪漫'], isPremium: false },
  { id: 'tpl_004', name: '毛孩貼圖', category: '毛孩貼圖', tags: ['寵物', '可愛'], isPremium: false },
  { id: 'tpl_005', name: '上班日常', category: '上班日常', tags: ['辦公', '職場'], isPremium: true },
  { id: 'tpl_006', name: '節慶祝福', category: '節慶', tags: ['節日', '祝福'], isPremium: true },
  { id: 'tpl_007', name: '品牌吉祥物', category: '品牌吉祥物', tags: ['品牌', 'IP'], isPremium: true },
  { id: 'tpl_008', name: '動態反應', category: '動態反應', tags: ['反應', 'GIF'], isPremium: false },
];

export default function TemplatesPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('全部');
  const [search, setSearch] = useState('');

  const filtered = ALL_TEMPLATES.filter(t =>
    (activeCategory === '全部' || t.category === activeCategory) &&
    t.name.includes(search)
  );

  return (
    <main>
      <div className="page-header">模板庫</div>

      <div className="search-bar">
        <input
          type="search"
          placeholder="搜尋模板..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="chip-filter">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`chip ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        {filtered.map(t => (
          <div
            key={t.id}
            className="template-card"
            onClick={() => router.push(`/templates/${t.id}`)}
            style={{ flex: 'none', cursor: 'pointer' }}
          >
            <div style={{
              width: '100%', aspectRatio: '1', background: 'var(--bg-cream)',
              borderRadius: 12, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 40,
            }}>
              🎨
            </div>
            <div className="name">{t.name}</div>
            <div className="tags">{t.tags.join(', ')}</div>
            {t.isPremium && (
              <span style={{ fontSize: 10, color: 'var(--yellow)', fontWeight: 700, marginTop: 4, display: 'block' }}>
                🔒 Premium
              </span>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
