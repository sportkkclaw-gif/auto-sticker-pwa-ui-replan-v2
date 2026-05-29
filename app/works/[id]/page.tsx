'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

type LineImage = {
  index: number;
  zip_path: string;
  url_path: string;
  width: number;
  height: number;
  byte_size: number;
  transparent_pixel_ratio: number;
  safe_margin_ratio?: { left: number; right: number; top: number; bottom: number } | null;
  visual_metrics?: {
    subject_ratio: { width: number; height: number; long_side: number; area: number } | null;
    margin_ratio: { left: number; right: number; top: number; bottom: number } | null;
    main_component_ratio: number;
    fragment_component_count: number;
    fragment_pixel_ratio: number;
    interior_hole_ratio: number;
  };
  qc_passed: boolean;
  qc_failures: string[];
};

type Work = {
  id: string;
  title?: string;
  template_id?: string;
  image_count?: number;
  sticker_count?: number;
  credit_cost?: number;
  status: string;
  qc_status?: string;
  qc_failures?: string[];
  qc_warnings?: string[];
  output_kind?: string;
  generation_strategy?: 'sheet_crop' | 'batch_sheet' | 'independent' | 'manual_sheet' | 'manual_batch_sheet';
  provider_request_count?: number;
  style_prompt?: string;
  created_at: string;
  download_url?: string | null;
  images?: LineImage[];
  main_image?: LineImage | null;
  tab_image?: LineImage | null;
};

const legacyLabels = ['你好', 'OK', '謝謝', '收到', '加油', '晚安', '太棒了', '辛苦了'];

function pct(value?: number | null) {
  return typeof value === 'number' ? `${Math.round(value * 100)}%` : '-';
}

function minMargin(image: LineImage) {
  const margin = image.safe_margin_ratio || image.visual_metrics?.margin_ratio;
  if (!margin) return null;
  return Math.min(margin.left, margin.right, margin.top, margin.bottom);
}

function strategyLabel(strategy?: Work['generation_strategy']) {
  if (strategy === 'manual_sheet') return '訂閱測試：上傳貼圖表裁切';
  if (strategy === 'manual_batch_sheet') return '訂閱實測：5 張 sheet 各裁 8 張';
  if (strategy === 'batch_sheet') return '正式上架：每 8 張一 sheet';
  if (strategy === 'sheet_crop') return '低成本草稿：單張貼圖表裁切';
  return '高品質：逐張生成';
}

export default function WorkDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [work, setWork] = useState<Work | null>(null);
  const [missing, setMissing] = useState(false);
  const [downloadMessage, setDownloadMessage] = useState('');

  useEffect(() => {
    if (!id) return;
    setDownloadMessage('');
    setMissing(false);
    fetch(`/api/works/${id}`, { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) {
          setMissing(true);
          return;
        }
        setWork((await res.json()).work);
      })
      .catch(() => setMissing(true));
  }, [id]);

  if (missing) {
    return (
      <main className="wide-page">
        <section className="card empty">
          <h2>作品不存在</h2>
          <Link className="btn-primary" href="/works">返回作品列表</Link>
        </section>
      </main>
    );
  }

  if (!work) {
    return (
      <main className="wide-page">
        <section className="card empty">
          <h2>讀取作品中...</h2>
        </section>
      </main>
    );
  }

  const isLineStatic = work.output_kind === 'line_static_png';
  const count = work.sticker_count ?? work.image_count ?? 8;
  const canDownload = Boolean(work.download_url && (!isLineStatic || work.qc_status === 'passed'));
  const downloadHref = work.download_url || '#';
  const downloadFilename = isLineStatic ? `${work.id}-line-static-stickers.zip` : `${work.id}.zip`;
  const handleDownloadClick = () => {
    if (!canDownload) return;
    setDownloadMessage('下載已送出。若側邊瀏覽器沒有跳出提示，請查看瀏覽器下載紀錄，或用「另開下載連結」再存檔。');
  };

  return (
    <main className="wide-page">
      <button className="back-link button-reset" onClick={() => router.back()}>← 返回</button>
      <section className="card detail-hero">
        <div>
          <h1>{work.title || work.id}</h1>
          <p>{isLineStatic ? 'LINE 靜態貼圖 v1' : work.template_id} · {count} 張 · {new Date(work.created_at).toLocaleString('zh-TW')}</p>
          <span className={`badge ${work.status === 'completed' ? 'completed' : 'failed'}`}>
            {isLineStatic ? `QC ${work.qc_status === 'passed' ? '通過' : '未通過'}` : work.status}
          </span>
        </div>
      </section>

      {isLineStatic ? (
        <>
          <section className="card desktop-card">
            <h2>LINE 上架檢查</h2>
            <ul className="qc-list">
              <li className={`qc-item ${work.qc_status === 'passed' ? 'pass' : 'fail'}`}>
                <span className="icon">{work.qc_status === 'passed' ? '✓' : '!'}</span>
                <span>PNG、透明背景、尺寸、檔名、張數、main.png、tab.png、ZIP 大小全部檢查。</span>
              </li>
              {(work.qc_failures || []).map((failure) => (
                <li className="qc-item fail" key={failure}><span className="icon">!</span><span>{failure}</span></li>
              ))}
              {(work.qc_warnings || []).map((warning) => (
                <li className="qc-item pass" key={warning}><span className="icon">i</span><span>{warning}</span></li>
              ))}
            </ul>
            <div className="button-row">
              {canDownload ? (
                <>
                  <a className="btn-primary" href={downloadHref} download={downloadFilename} onClick={handleDownloadClick}>下載可上傳 ZIP</a>
                  <a className="btn-secondary" href={downloadHref} target="_blank" rel="noopener noreferrer" onClick={handleDownloadClick}>另開下載連結</a>
                </>
              ) : (
                <button className="btn-primary" disabled>QC 未通過，禁止下載</button>
              )}
              <Link className="btn-secondary" href="/create">再做一包</Link>
            </div>
            {downloadMessage && <p className="notice ok" role="status" aria-live="polite">{downloadMessage}</p>}
          </section>

          <section className="card desktop-card">
            <h2>生成結果</h2>
            <div className="preview-grid line-preview-grid">
              {(work.images || []).map((image) => (
                <div className="line-sticker-tile" key={image.zip_path}>
                  <img src={image.url_path} alt={`貼圖 ${image.index}`} />
                  <small>{image.zip_path}<br />{image.width} x {image.height} · {Math.round(image.byte_size / 1024)} KB · alpha {Math.round(image.transparent_pixel_ratio * 100)}%</small>
                  <span className={`badge ${image.qc_passed ? 'completed' : 'failed'}`}>{image.qc_passed ? 'PASS' : 'FAIL'}</span>
                  <small>margin {pct(minMargin(image))} · subject {pct(image.visual_metrics?.subject_ratio?.long_side)} · fragments {pct(image.visual_metrics?.fragment_pixel_ratio)}</small>
                  {!image.qc_passed && image.qc_failures?.length > 0 && (
                    <ul className="tile-failures">
                      {image.qc_failures.slice(0, 3).map((failure) => <li key={failure}>{failure}</li>)}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="card desktop-card">
            <h2>生成設定</h2>
            <div className="settings-item"><span>風格 prompt</span><b>{work.style_prompt}</b></div>
            <div className="settings-item"><span>生成方式</span><b>{work.generation_strategy === 'manual_sheet' ? '訂閱測試：上傳貼圖表裁切' : work.generation_strategy === 'sheet_crop' ? '省成本：貼圖表切格' : '高品質：逐張生成'}</b></div>
            <div className="settings-item"><span>AI 生成次數</span><b>{work.provider_request_count ?? '-'}</b></div>
            <div className="settings-item"><span>貼圖張數</span><b>{count}</b></div>
            <div className="settings-item"><span>點數</span><b>{work.credit_cost ?? count}</b></div>
          </section>
        </>
      ) : (
        <>
          <section className="card desktop-card">
            <h2>作品預覽</h2>
            <div className="preview-grid big">
              {Array.from({ length: count }, (_, i) => (
                <div className="sticker-preview" key={i}>
                  <span>貼圖</span>
                  <small>{String(i + 1).padStart(2, '0')} {legacyLabels[i % legacyLabels.length]}</small>
                </div>
              ))}
            </div>
          </section>
          <section className="card desktop-card">
            <div className="button-row">
              {work.download_url && <a className="btn-primary" href={work.download_url} download={downloadFilename} onClick={handleDownloadClick}>下載 ZIP</a>}
              <Link className="btn-secondary" href="/works">返回作品列表</Link>
            </div>
            {downloadMessage && <p className="notice ok" role="status" aria-live="polite">{downloadMessage}</p>}
          </section>
        </>
      )}
    </main>
  );
}
