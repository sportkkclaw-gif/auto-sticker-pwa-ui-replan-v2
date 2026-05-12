'use client';
import { useEffect, useState } from 'react';

type Wallet = { free_credits: number; bonus_credits: number; paid_credits: number; total: number };
type Payment = { id: string; status: 'created' | 'completed' | 'paid'; packageId: string; name: string; amount: number; currency: string; credits: number; created_at: string; completed_at?: string };
type Tx = { id: string; type: string; direction: 'increase' | 'decrease'; credits: number; description: string; payment_id?: string; balance_after?: Wallet; created_at: string };

const PACKAGES = [
  { id: 'starter', name: '體驗包', amount: 'NT$99', credits: 30 },
  { id: 'standard', name: '標準包', amount: 'NT$199', credits: 80, recommended: true },
  { id: 'creator', name: '創作者包', amount: 'NT$499', credits: 250 },
  { id: 'business', name: '商用包', amount: 'NT$999', credits: 600 },
];

export default function BillingPage() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function refresh() {
    const res = await fetch('/api/credits/balance', { cache: 'no-store' });
    const data = await res.json();
    setWallet(data);
    setTransactions(data.transactions || []);
  }

  useEffect(() => { refresh(); }, []);

  async function createPayment(packageId: string) {
    setLoading(true);
    setMessage('正在建立 mock payment...');
    try {
      const res = await fetch('/api/billing/mock-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'mock payment 建立失敗');
      setPayments((list) => [data.payment, ...list]);
      setMessage(`付款建立成功：${data.payment.name}，請按「測試付款完成」完成兩段式 mock payment。`);
      await refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'mock payment 建立失敗');
    } finally {
      setLoading(false);
    }
  }

  async function completePayment(paymentId: string) {
    setLoading(true);
    setMessage('正在呼叫 complete API...');
    try {
      const res = await fetch(`/api/billing/mock-payment/${paymentId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || '付款完成失敗');
      setPayments((list) => list.map((p) => (p.id === paymentId ? data.payment : p)));
      setWallet(data.wallet);
      setMessage(`付款完成，paid_credits 已增加 ${data.payment.credits} 點；重複完成同一 payment 不會重複加點。`);
      await refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '付款完成失敗');
    } finally {
      setLoading(false);
    }
  }

  return <main className="wide-page">
    <div className="page-header">額度管理 / 購買點數</div>
    <section className="card credit-display commercial">
      <div>目前可用額度</div>
      <div className="amount">{wallet?.total ?? 0}</div>
      <div className="credit-split"><span>免費 {wallet?.free_credits ?? 0}</span><span>贈送 {wallet?.bonus_credits ?? 0}</span><span>付費 {wallet?.paid_credits ?? 0}</span></div>
      <small>API wallet：/api/credits/balance（Commercial MVP Stage 1 mock store）</small>
    </section>
    {message && <div className="notice ok">{message}</div>}
    <section className="card desktop-card"><h2>購買點數包（two-step mock payment）</h2><div className="price-grid">
      {PACKAGES.map((p) => <div key={p.id} className={`price-card ${p.recommended ? 'recommended' : ''}`}><div>{p.recommended && <b className="recommend-badge">推薦</b>}<h3>{p.name}</h3><p>{p.amount}</p><strong>{p.credits} 點</strong></div><button className="btn-primary" disabled={loading} onClick={() => createPayment(p.id)}>建立 mock payment</button></div>)}
    </div></section>
    <section className="card desktop-card"><h2>付款紀錄</h2>{payments.length === 0 ? <p className="muted">尚無本頁建立的付款紀錄</p> : payments.map((p) => <div className="settings-item" key={p.id}><span>{p.name} · NT${p.amount} · {p.credits}點<br/><small>{p.id} · {p.status}</small></span>{p.status === 'created' ? <button className="small-btn" disabled={loading} onClick={() => completePayment(p.id)}>測試付款完成</button> : <b>已完成</b>}</div>)}</section>
    <section className="card desktop-card"><h2>API 交易紀錄</h2>{transactions.map((tx) => <div className="settings-item" key={tx.id}><span>{new Date(tx.created_at).toLocaleString('zh-TW')}<br/><small>{tx.type} · {tx.description}</small></span><b className={tx.direction === 'increase' ? 'green' : 'red'}>{tx.direction === 'increase' ? '+' : '-'}{tx.credits}</b></div>)}</section>
  </main>;
}
