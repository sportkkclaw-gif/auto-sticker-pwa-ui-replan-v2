'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Work = {
  id: string;
  title?: string;
  template_id?: string;
  image_count?: number;
  sticker_count?: number;
  credit_cost?: number;
  status: string;
  qc_status?: string;
  output_kind?: string;
  created_at: string;
  download_url?: string | null;
};
type Wallet = { total: number; free_credits: number; bonus_credits: number; paid_credits: number };

export default function WorksPage() {
  const [works, setWorks] = useState<Work[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);

  async function refresh() {
    const [workRes, walletRes] = await Promise.all([fetch('/api/works', { cache: 'no-store' }), fetch('/api/credits/balance', { cache: 'no-store' })]);
    setWorks((await workRes.json()).works || []);
    setWallet(await walletRes.json());
  }

  useEffect(() => { refresh(); }, []);

  return (
    <main className="wide-page">
      <div className="page-header">我的貼圖作品</div>
      <section className="card desktop-card">
        <div className="credit-inline">
          <span>可用點數</span>
          <b>{wallet?.total ?? 0} 點</b>
          <small>免費 {wallet?.free_credits ?? 0} / 贈送 {wallet?.bonus_credits ?? 0} / 付費 {wallet?.paid_credits ?? 0}</small>
          <button className="small-btn" onClick={refresh}>重新整理</button>
        </div>
      </section>

      {works.length === 0 ? (
        <section className="card empty">
          <div>📦</div>
          <h2>還沒有作品</h2>
          <p className="muted">先上傳素材並輸入風格，產出第一包 LINE 靜態貼圖。</p>
          <Link className="btn-primary" href="/create">開始生成</Link>
        </section>
      ) : (
        <div className="works-grid">
          {works.map((work) => {
            const count = work.sticker_count ?? work.image_count ?? 8;
            const isLineStatic = work.output_kind === 'line_static_png';
            const canDownload = Boolean(work.download_url && (!isLineStatic || work.qc_status === 'passed'));
            return (
              <article key={work.id} className="card work-card">
                <div>
                  <h3>{work.title || work.id}</h3>
                  <p>{isLineStatic ? 'LINE 靜態貼圖' : work.template_id} · {count} 張 · 消耗 {work.credit_cost ?? count} 點</p>
                  <small>{new Date(work.created_at).toLocaleString('zh-TW')}</small>
                </div>
                <span className={`badge ${work.status === 'completed' ? 'completed' : 'failed'}`}>
                  {isLineStatic ? `QC ${work.qc_status === 'passed' ? '通過' : '未通過'}` : work.status}
                </span>
                <div className="button-row">
                  <Link className="btn-secondary" href={`/works/${work.id}`}>查看結果</Link>
                  {canDownload && <a className="btn-primary" href={work.download_url || '#'}>下載 ZIP</a>}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
