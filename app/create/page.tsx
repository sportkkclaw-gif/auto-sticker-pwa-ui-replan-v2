'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TEMPLATES } from '@/lib/mvpClientStore';

type Wallet = { free_credits: number; bonus_credits: number; paid_credits: number; total: number };
type UploadedAsset = { id: string; file_name?: string; byte_size?: number; is_demo?: boolean; source_kind?: 'material' | 'sticker_sheet' };
type CreateResponse = {
  ok?: boolean;
  status?: number;
  work?: { id: string; status: string; qc_status: string; qc_failures?: string[] };
  wallet?: Wallet;
  message?: string;
  error?: string;
};

const COUNTS = [8, 16, 24, 32, 40] as const;
type GenerationMode = 'sheet_crop' | 'batch_sheet' | 'independent' | 'manual_sheet';
const SHEET_CROP_COST: Record<(typeof COUNTS)[number], number> = { 8: 6, 16: 9, 24: 12, 32: 15, 40: 18 };
const BATCH_SHEET_COST_PER_8 = 6;
const costFor = (count: (typeof COUNTS)[number], mode: GenerationMode) => mode === 'manual_sheet' ? 1 : mode === 'sheet_crop' ? SHEET_CROP_COST[count] : mode === 'batch_sheet' ? Math.ceil(count / 8) * BATCH_SHEET_COST_PER_8 : count;
const DEFAULT_PROMPT = 'Q版可愛角色，乾淨線條，明亮配色，適合日常聊天，透明背景，無文字';

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('READ_FILE_FAILED'));
    reader.readAsDataURL(file);
  });
}

export default function CreatePage() {
  const router = useRouter();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [templateId, setTemplateId] = useState('');
  const [asset, setAsset] = useState<UploadedAsset | null>(null);
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [count, setCount] = useState<(typeof COUNTS)[number]>(8);
  const [generationMode, setGenerationMode] = useState<GenerationMode>('batch_sheet');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [rightsAccepted, setRightsAccepted] = useState(false);

  const canUpload = rightsAccepted && !loading;
  const selectedTemplate = useMemo(() => TEMPLATES.find((template) => template.id === templateId) || null, [templateId]);
  const estimatedCost = costFor(count, generationMode);
  const canGenerate = useMemo(
    () => Boolean(rightsAccepted && asset && prompt.trim().length >= 4 && wallet && wallet.total >= estimatedCost && !loading),
    [rightsAccepted, asset, prompt, wallet, estimatedCost, loading],
  );

  async function refreshWallet() {
    const res = await fetch('/api/credits/balance', { cache: 'no-store' });
    const data = await res.json();
    setWallet(data);
    return data as Wallet;
  }

  useEffect(() => {
    refreshWallet().catch(() => setError('讀取點數失敗，請重新整理。'));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('manualSheet') === '1') setGenerationMode('manual_sheet');
    const id = params.get('template');
    const template = TEMPLATES.find((item) => item.id === id);
    if (!template) return;
    setTemplateId(template.id);
    setPrompt(template.prompt);
    setCount(template.recommended_count);
    setMessage(`已套用「${template.name}」模板。`);
  }, []);

  async function uploadDemo() {
    if (!rightsAccepted) {
      setError('請先確認素材授權、肖像權與 AI 處理告知事項。');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch('/api/assets/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outputKind: 'line_static_png', demo: true, mimeType: 'image/png', fileSize: 2048, consent: true, fileName: 'demo-source.png' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || 'Demo 素材建立失敗。');
      setAsset(data.asset);
      setMessage('已載入 demo 素材，可以直接測試生成。');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demo 素材建立失敗。');
    } finally {
      setLoading(false);
    }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!rightsAccepted) {
      setError('請先確認素材授權、肖像權與 AI 處理告知事項。');
      e.target.value = '';
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');
    try {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('請上傳 JPG、PNG 或 WebP。');
      if (generationMode === 'manual_sheet' && file.type !== 'image/png') throw new Error('訂閱測試模式目前請上傳 PNG 貼圖表。');
      if (file.size > 10 * 1024 * 1024) throw new Error('單張素材最大 10MB。');
      const dataUrl = await readFileAsDataUrl(file);
      const res = await fetch('/api/assets/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outputKind: 'line_static_png', dataUrl, mimeType: file.type, fileSize: file.size, fileName: file.name, consent: true, sourceKind: generationMode === 'manual_sheet' ? 'sticker_sheet' : 'material' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || '素材上傳失敗。');
      setAsset(data.asset);
      setMessage(`已上傳 ${file.name}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '素材上傳失敗。');
    } finally {
      setLoading(false);
    }
  }

  async function generate() {
    if (!rightsAccepted) {
      setError('請先確認素材授權、肖像權與 AI 處理告知事項。');
      return;
    }
    if (!asset) return;
    setLoading(true);
    setError('');
    setMessage('正在生成並檢查 LINE 靜態貼圖規格...');
    try {
      const res = await fetch('/api/works', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outputKind: 'line_static_png',
          sourceAssetId: asset.id,
          stylePrompt: prompt,
          stickerCount: count,
          generationMode,
          title: `${count} 張 LINE 靜態貼圖`,
        }),
      });
      const data = await res.json() as CreateResponse;
      await refreshWallet();
      if (!res.ok || !data.work) throw new Error(data.message || data.work?.qc_failures?.join('；') || data.error || '生成失敗。');
      router.push(`/works/${data.work.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失敗。');
      setMessage('');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="wide-page">
      <section className="hero hero-commercial">
        <div className="pwa-badge">{selectedTemplate ? selectedTemplate.category : 'LINE 靜態貼圖 v1'}</div>
        <h1>{selectedTemplate ? `套用：${selectedTemplate.name}` : '上傳素材，輸入風格，一鍵產出 LINE ZIP'}</h1>
        <p>{selectedTemplate ? selectedTemplate.description : '系統預設用一張貼圖表切格，降低生成成本，再自動去背、裁切、輸出 main.png、tab.png、manifest 與 QC report。'}</p>
      </section>

      {selectedTemplate && (
        <section className="card desktop-card selected-template-summary">
          <div>
            <h2>已套用模板</h2>
            <p>{selectedTemplate.use_case}</p>
          </div>
          <div className="phrase-row">
            {selectedTemplate.preview_lines.slice(0, 6).map((line) => <b key={line}>{line}</b>)}
          </div>
          <div className="template-chip-row">
            {selectedTemplate.tags.map((tag) => <span key={tag}>{tag}</span>)}
          </div>
          <p className="risk-note">{selectedTemplate.risk_note}</p>
          <Link className="btn-secondary" href="/templates">更換模板</Link>
        </section>
      )}

      <section className="card desktop-card">
        <div className="credit-inline">
          <span>目前可用點數</span>
          <b data-testid="wallet-total">{wallet ? wallet.total : '--'} 點</b>
          <small>免費 {wallet?.free_credits ?? 0} / 贈送 {wallet?.bonus_credits ?? 0} / 付費 {wallet?.paid_credits ?? 0}</small>
          <button className="small-btn" onClick={refreshWallet}>重新整理</button>
        </div>
      </section>

      <section className="card desktop-card">
        <h2>1. 權利與資料處理確認</h2>
        <div className="consent-panel">
          <label className="consent-check">
            <input
              type="checkbox"
              checked={rightsAccepted}
              onChange={(e) => setRightsAccepted(e.target.checked)}
            />
            <span>
              我確認上傳素材、人物肖像、角色、商標與文字均由我合法持有或已取得授權；我也理解素材與 prompt 會為了生成貼圖、去背、裁切、
              QC 檢查與 ZIP 匯出而交由本服務及必要第三方供應商處理。
            </span>
          </label>
          <p className="muted">
            送出前請先閱讀 <Link href="/privacy">隱私與授權</Link>、<Link href="/terms">服務條款</Link>。
            本工具會檢查 LINE 靜態貼圖檔案格式，但不保證 LINE Creators Market 一定審核通過。
          </p>
        </div>
      </section>

      <section className="card desktop-card">
        <h2>2. 上傳基本素材</h2>
        <p className="muted">{generationMode === 'manual_sheet' ? '請上傳用訂閱方式生成的 PNG 貼圖表。系統會照你選的張數切成固定格數，再跑去背與 LINE QC。' : '支援 JPG、PNG、WebP，單張最大 10MB。使用真人或角色素材前，請確認你擁有合法使用權。'}</p>
        <label className="upload-card input-upload">
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onFile} disabled={!canUpload} />
          <span className="upload-icon">📷</span>
          <b>{asset ? `${asset.file_name || asset.id}` : generationMode === 'manual_sheet' ? '選擇貼圖表 PNG' : '選擇素材圖片'}</b>
          <small>{asset ? '素材已就緒' : rightsAccepted ? generationMode === 'manual_sheet' ? '不會呼叫 API，只做裁切檢查' : '或先用 demo 素材測試' : '請先完成權利確認'}</small>
        </label>
        <button className="btn-secondary" disabled={!canUpload || generationMode === 'manual_sheet'} onClick={uploadDemo}>使用 demo 素材</button>
      </section>

      <section className="card desktop-card">
        <h2>3. 輸入想要的風格</h2>
        {selectedTemplate && <p className="muted">已依「{selectedTemplate.name}」填入預設 prompt，你仍可依素材微調。</p>}
        <div className="prompt-editor">
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} maxLength={500} />
        </div>
        <p className="muted">{prompt.length}/500，建議寫清楚角色感、線條、配色、用途與是否需要文字。</p>
      </section>

      <section className="card desktop-card">
        <h2>4. 選擇生成方式與張數</h2>
        <div className="generation-mode-grid">
          <button className={`mode-card ${generationMode === 'sheet_crop' ? 'active' : ''}`} onClick={() => setGenerationMode('sheet_crop')}>
            <b>省成本模式</b>
            <span>1 張貼圖表生成後自動切格，適合測試與主力商品。</span>
            <small>預估 1 次 AI 生成</small>
          </button>
          <button className={`mode-card ${generationMode === 'batch_sheet' ? 'active' : ''}`} onClick={() => setGenerationMode('batch_sheet')}>
            <b>正式上架：每 8 張一 sheet</b>
            <span>40 張會分成 5 張貼圖表，每張只放 8 格，保留較多原始像素再裁切。</span>
            <small>預估 {Math.ceil(count / 8)} 次 AI 生成</small>
          </button>
          <button className={`mode-card ${generationMode === 'independent' ? 'active' : ''}`} onClick={() => setGenerationMode('independent')}>
            <b>高品質模式</b>
            <span>每張獨立生成，構圖更穩，但成本較高。</span>
            <small>預估 {count} 次 AI 生成</small>
          </button>
          <button className={`mode-card ${generationMode === 'manual_sheet' ? 'active' : ''}`} onClick={() => setGenerationMode('manual_sheet')}>
            <b>訂閱測試模式</b>
            <span>上傳已生成的 8/16/24/32/40 格貼圖表，只裁切、去背與 QC。</span>
            <small>不呼叫 API</small>
          </button>
        </div>
        {generationMode === 'manual_sheet' && (
          <div className="notice danger">
            嚴格驗收規格：貼圖表每格主體需完整置中，四邊至少保留約 18% 空白；頭髮、手腳、道具、外框不可碰到格線或畫布邊緣；每格主體大小需一致，去背後不可有碎片、白邊、內部被挖空。任一項不合格會禁止下載 ZIP。
          </div>
        )}
        <div className="count-row line-count-row">
          {COUNTS.map((n) => (
            <button key={n} className={`count-btn ${count === n ? 'active' : ''}`} onClick={() => setCount(n)}>
              {n} 張<br /><small>{costFor(n, generationMode)} 點</small>
            </button>
          ))}
        </div>
        <div className="notice ok">目前模式預估扣 {estimatedCost} 點；生成或 QC 失敗不扣點。</div>
        {wallet && wallet.total < estimatedCost && <div className="notice danger">點數不足：目前 {wallet.total} 點，需要 {estimatedCost} 點。</div>}
        <div className="button-row">
          {wallet && wallet.total < estimatedCost ? (
            <button className="btn-primary" onClick={() => router.push('/billing?return=/create')}>前往購買點數</button>
          ) : (
            <button className="btn-primary" disabled={!canGenerate} onClick={generate}>{loading ? '處理中...' : '生成 LINE 上架 ZIP'}</button>
          )}
        </div>
      </section>

      {(message || error) && <div className={`notice ${error ? 'danger' : 'ok'}`}>{error || message}</div>}
    </main>
  );
}
