'use client';
import { useParams, useRouter } from 'next/navigation';

const TEMPLATES: Record<string, { id: string; name: string; description: string; tags: string[]; defaultCount: 4 | 8 | 16; supportsAnimated: boolean }> = {
  tpl_001: { id: 'tpl_001', name: 'Q版人像', description: '可愛Q版風格，圓潤線條，透明背景，適合LINE貼圖', tags: ['可愛', '人形', '透明背景'], defaultCount: 8, supportsAnimated: true },
  tpl_002: { id: 'tpl_002', name: '情緒表情包', description: '各式情緒表情，開心/難過/生氣/驚訝', tags: ['表情', '情緒'], defaultCount: 8, supportsAnimated: true },
  tpl_003: { id: 'tpl_003', name: '戀愛語錄', description: '浪漫語錄與愛心元素，情侶必備', tags: ['情侶', '浪漫'], defaultCount: 8, supportsAnimated: false },
  tpl_004: { id: 'tpl_004', name: '毛孩貼圖', description: '寵物專用，貓狗可愛風格', tags: ['寵物', '可愛'], defaultCount: 8, supportsAnimated: true },
  tpl_005: { id: 'tpl_005', name: '上班日常', description: '上班族日常抱怨與心聲', tags: ['辦公', '職場'], defaultCount: 8, supportsAnimated: false },
  tpl_006: { id: 'tpl_006', name: '節慶祝福', description: '聖誕/新年/情人節節慶貼圖', tags: ['節日', '祝福'], defaultCount: 8, supportsAnimated: false },
  tpl_007: { id: 'tpl_007', name: '品牌吉祥物', description: '品牌IP角色專用', tags: ['品牌', 'IP'], defaultCount: 8, supportsAnimated: true },
  tpl_008: { id: 'tpl_008', name: '動態反應', description: '常用反應GIF動畫，LINE必備', tags: ['反應', 'GIF'], defaultCount: 4, supportsAnimated: true },
};

export default function TemplateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tpl = TEMPLATES[params.id as string] || TEMPLATES['tpl_001'];

  return (
    <main>
      <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, marginBottom: 8 }}>
        ← 返回
      </button>

      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{
          width: 160, height: 160, margin: 'auto', background: 'var(--bg-cream)',
          borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 80, marginBottom: 16,
        }}>
          🎨
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>{tpl.name}</h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 8 }}>{tpl.description}</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12 }}>
          {tpl.tags.map(tag => (
            <span key={tag} className="chip">{tag}</span>
          ))}
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
          預設 {tpl.defaultCount} 張 {tpl.supportsAnimated ? '· 支援動態' : ''}
        </div>
      </div>

      <button
        className="btn-primary"
        onClick={() => router.push('/create')}
      >
        套用此模板
      </button>
    </main>
  );
}
