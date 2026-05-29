import Link from 'next/link';
import { TEMPLATES } from '@/lib/mvpClientStore';

export default async function TemplateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const template = TEMPLATES.find((item) => item.id === id) || TEMPLATES[0];

  return (
    <main className="wide-page">
      <Link className="back-link" href="/templates">← 返回模板</Link>
      <section className="card detail-hero user-template-detail">
        <div className="template-detail-preview compare">
          <div>
            <img src={template.preview_image} alt={`${template.name} gpt-image-1 預覽`} />
            <span>gpt-image-1</span>
          </div>
          <div>
            <img src={template.preview_image_gpt_image_2} alt={`${template.name} gpt-image-2 預覽`} />
            <span>gpt-image-2</span>
          </div>
        </div>
        <div>
          <span className="pwa-badge">{template.category}</span>
          <h1>{template.name}</h1>
          <p>{template.description}</p>
          <div className="phrase-row large">
            {template.preview_lines.map((line) => <b key={line}>{line}</b>)}
          </div>
          <div className="spec-list">
            <div>建議張數 <b>{template.recommended_count} 張</b></div>
            <div>消耗點數 <b>{template.credit_cost} 點</b></div>
            <div>輸出格式 <b>LINE 靜態 PNG</b></div>
            <div>背景 <b>透明</b></div>
          </div>
          <Link className="btn-primary" href={`/create?template=${template.id}`}>用這個模板開始</Link>
        </div>
      </section>

      <section className="card desktop-card">
        <h2>這包適合用在</h2>
        <p className="muted">{template.use_case}</p>
      </section>

      <section className="card desktop-card">
        <h2>會自動帶入的風格</h2>
        <p className="prompt-preview">{template.prompt}</p>
      </section>

      <section className="card desktop-card">
        <h2>上架前提醒</h2>
        <p className="risk-note large">{template.risk_note}</p>
      </section>
    </main>
  );
}
