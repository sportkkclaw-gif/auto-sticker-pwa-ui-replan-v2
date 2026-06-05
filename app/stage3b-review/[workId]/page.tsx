'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type Sticker = {
  index: number;
  zip_path: string;
  url_path: string;
  width: number;
  height: number;
  byte_size: number;
  sha256: string;
  transparent_background_status: string;
  alpha_channel: boolean;
  transparent_pixel_ratio: number;
  safe_margin_status: string;
  safe_margin_ratio: Record<string, number>;
  subject_bbox: Record<string, number>;
  needs_regeneration: boolean;
  review_status: string;
  source: string;
  is_real_provider_output: boolean;
  grid_collage_detected: boolean;
};

type Manifest = {
  work_id: string;
  generated_images_count: number;
  independent_png_count: number;
  grid_collage_output: boolean;
  zip_path: string;
  generated_images: Sticker[];
  all_review_pass: boolean;
  export_enabled: boolean;
  notes: string;
};

function statusClass(value: string) {
  return value === 'pass' ? 'ok' : value === 'failed' ? 'bad' : 'warn';
}

export default function Stage3BReviewPage() {
  const params = useParams<{ workId: string }>();
  const workId = String(params.workId || 'work_stage3b_demo_8');
  const manifestUrl = `/stage3b-review/${workId}/generation_manifest.json`;
  const providerUrl = `/stage3b-review/${workId}/provider_evidence.json`;
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [active, setActive] = useState<Sticker | null>(null);
  const [background, setBackground] = useState<'checker' | 'dark' | 'white'>('checker');
  const [rejected, setRejected] = useState<Record<number, boolean>>({});

  useEffect(() => {
    setManifest(null);
    fetch(manifestUrl).then((res) => res.json()).then(setManifest);
  }, [manifestUrl]);

  const allPass = useMemo(() => {
    if (!manifest) return false;
    return manifest.generated_images.every((img) => img.review_status === 'pass' && !img.needs_regeneration && !rejected[img.index]);
  }, [manifest, rejected]);

  if (!manifest) return <main className="stage3b-page"><p>Loading Stage 3B review...</p></main>;

  return (
    <main className="stage3b-page">
      <style jsx global>{`
        .stage3b-page{max-width:1200px;margin:0 auto;padding:28px;color:#e5eefc;background:#0f172a;min-height:100vh;font-family:system-ui,-apple-system,Segoe UI,sans-serif}.stage3b-hero{background:linear-gradient(135deg,#1e293b,#312e81);border:1px solid #475569;border-radius:24px;padding:24px;margin-bottom:18px}.stage3b-hero h1{margin:0 0 8px;font-size:34px}.stage3b-actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:16px}.stage3b-button{border:0;border-radius:999px;padding:12px 18px;font-weight:800;text-decoration:none;display:inline-flex;align-items:center;justify-content:center}.primary{background:#38bdf8;color:#082f49}.secondary{background:#334155;color:#e2e8f0}.disabled{background:#475569;color:#94a3b8;cursor:not-allowed}.summary-grid,.sticker-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:16px}.summary-card,.sticker-card{background:#172033;border:1px solid #334155;border-radius:20px;padding:16px}.sticker-card img{width:100%;height:240px;object-fit:contain;border-radius:14px;border:1px solid #475569;cursor:zoom-in}.checker{background-color:#fff;background-image:linear-gradient(45deg,#cbd5e1 25%,transparent 25%),linear-gradient(-45deg,#cbd5e1 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#cbd5e1 75%),linear-gradient(-45deg,transparent 75%,#cbd5e1 75%);background-size:24px 24px;background-position:0 0,0 12px,12px -12px,-12px 0}.dark{background:#020617}.white{background:#fff}.badge{display:inline-flex;border-radius:999px;padding:4px 9px;font-size:12px;font-weight:800;margin:3px 4px 3px 0}.ok{background:#064e3b;color:#a7f3d0}.bad{background:#7f1d1d;color:#fecaca}.warn{background:#78350f;color:#fde68a}.meta{font-size:12px;color:#cbd5e1;line-height:1.55;word-break:break-all}.card-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.tiny{border:1px solid #475569;background:#1e293b;color:#e2e8f0;border-radius:10px;padding:8px 10px}.modal-backdrop{position:fixed;inset:0;background:rgba(2,6,23,.86);display:flex;align-items:center;justify-content:center;padding:24px;z-index:50}.modal{width:min(1000px,96vw);max-height:94vh;overflow:auto;background:#111827;border:1px solid #64748b;border-radius:24px;padding:20px}.modal-image{width:100%;min-height:520px;display:flex;align-items:center;justify-content:center;border-radius:18px;border:1px solid #475569}.modal-image img{max-width:92%;max-height:72vh;object-fit:contain}.switcher{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}.switcher button{border:1px solid #64748b;background:#1e293b;color:#e2e8f0;border-radius:10px;padding:9px 12px}.switcher button.active{background:#38bdf8;color:#082f49}.sha{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px}.notice{border:1px solid #0ea5e9;background:#0c4a6e;color:#e0f2fe;border-radius:16px;padding:12px;margin:14px 0}`}</style>
      <section className="stage3b-hero">
        <p className="badge ok">Stage 3B small implementation</p>
        <h1>8 independent PNG sticker review</h1>
        <p>Work ID: <span className="sha">{manifest.work_id}</span></p>
        <p>{manifest.notes}</p>
        <div className="stage3b-actions">
          <Link className="stage3b-button secondary" href="/stage3b-create">Create page</Link>
          {allPass ? <a className="stage3b-button primary" href={manifest.zip_path}>Download ZIP</a> : <button className="stage3b-button disabled" disabled>ZIP blocked until all pass</button>}
          <a className="stage3b-button secondary" href={manifestUrl}>generation_manifest</a>
          <a className="stage3b-button secondary" href={providerUrl}>provider_evidence</a>
        </div>
      </section>

      <section className="summary-grid">
        <div className="summary-card"><b>Generated images</b><p>{manifest.generated_images_count}</p></div>
        <div className="summary-card"><b>Independent PNG count</b><p>{manifest.independent_png_count}</p></div>
        <div className="summary-card"><b>Grid / collage output</b><p>{String(manifest.grid_collage_output)}</p></div>
        <div className="summary-card"><b>Export status</b><p>{allPass ? 'enabled' : 'blocked'}</p></div>
      </section>

      <div className="notice">透明背景檢查：每張圖用 alpha channel / transparent pixel ratio 驗證；白色背景不會被當作透明。安全邊距：非透明像素 bounding box 四邊皆需 ≥ 8%。</div>

      <section className="sticker-grid">
        {manifest.generated_images.map((img) => (
          <article className="sticker-card" key={img.index}>
            <img className="checker" src={img.url_path} alt={`sticker ${img.index}`} onClick={() => setActive(img)} />
            <h2>#{String(img.index).padStart(2, '0')}</h2>
            <span className={`badge ${statusClass(img.transparent_background_status)}`}>transparent: {img.transparent_background_status}</span>
            <span className={`badge ${statusClass(img.safe_margin_status)}`}>safe margin: {img.safe_margin_status}</span>
            <span className={`badge ${img.needs_regeneration || rejected[img.index] ? 'bad' : 'ok'}`}>{img.needs_regeneration || rejected[img.index] ? 'needs regeneration' : 'pass'}</span>
            <div className="meta">
              <div>{img.width} × {img.height}px · {Math.round(img.byte_size / 1024)} KB</div>
              <div>source={img.source} · is_real_provider_output={String(img.is_real_provider_output)}</div>
              <div>alpha={String(img.alpha_channel)} · transparent ratio={img.transparent_pixel_ratio}</div>
              <div className="sha">sha256={img.sha256}</div>
            </div>
            <div className="card-actions">
              <button className="tiny" onClick={() => setActive(img)}>Zoom inspect</button>
              <button className="tiny" onClick={() => setRejected((r) => ({ ...r, [img.index]: !r[img.index] }))}>{rejected[img.index] ? 'Undo reject' : 'Reject sticker'}</button>
            </div>
          </article>
        ))}
      </section>

      {active && (
        <div className="modal-backdrop" onClick={() => setActive(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Zoom inspect #{String(active.index).padStart(2, '0')}</h2>
            <div className="switcher">
              {(['checker','dark','white'] as const).map((bg) => <button key={bg} className={background === bg ? 'active' : ''} onClick={() => setBackground(bg)}>{bg} background</button>)}
              <button onClick={() => setActive(null)}>Close</button>
            </div>
            <div className={`modal-image ${background}`}><img src={active.url_path} alt={`zoom sticker ${active.index}`} /></div>
            <div className="meta">
              <p>dimensions: {active.width} × {active.height}px · file size: {active.byte_size} bytes</p>
              <p>transparent background status: {active.transparent_background_status}; alpha channel: {String(active.alpha_channel)}</p>
              <p>safe margin status: {active.safe_margin_status}; margins: {JSON.stringify(active.safe_margin_ratio)}</p>
              <p>source={active.source}; is_real_provider_output={String(active.is_real_provider_output)}</p>
              <p className="sha">sha256={active.sha256}</p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
