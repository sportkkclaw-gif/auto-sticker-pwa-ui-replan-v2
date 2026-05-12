export type CreditWallet = {
  userId: string;
  free_credits: number;
  bonus_credits: number;
  paid_credits: number;
  updated_at: string;
};

export type CreditTransaction = {
  id: string;
  type: 'grant_free' | 'purchase' | 'consume' | 'refund' | 'bonus' | 'adjustment';
  direction: 'increase' | 'decrease';
  credits: number;
  description: string;
  payment_id?: string;
  work_id?: string;
  balance_after: CreditWallet & { total: number };
  created_at: string;
};

export type MockPayment = {
  id: string;
  status: 'created' | 'completed' | 'paid';
  packageId: string;
  name: string;
  amount: number;
  currency: 'TWD';
  credits: number;
  created_at: string;
  completed_at?: string;
};

export type MockWork = {
  id: string;
  title: string;
  template_id: string;
  image_count: number;
  credit_cost: number;
  status: 'completed';
  download_url: string;
  created_at: string;
};

type Store = {
  wallet: CreditWallet;
  transactions: CreditTransaction[];
  payments: Record<string, MockPayment>;
  works: Record<string, MockWork>;
};

export const CREDIT_PACKAGES: Record<string, { name: string; amount: number; currency: 'TWD'; credits: number }> = {
  starter: { name: '體驗包', amount: 99, currency: 'TWD', credits: 30 },
  standard: { name: '標準包', amount: 199, currency: 'TWD', credits: 80 },
  creator: { name: '創作者包', amount: 499, currency: 'TWD', credits: 250 },
  business: { name: '商用包', amount: 999, currency: 'TWD', credits: 600 },
};

const g = globalThis as typeof globalThis & { __AUTO_STICKER_MOCK_STORE__?: Store };
const now = () => new Date().toISOString();
const nextId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

function total(w: CreditWallet) {
  return w.free_credits + w.bonus_credits + w.paid_credits;
}

function walletWithTotal(w: CreditWallet) {
  return { ...w, total: total(w) };
}

function createInitialStore(): Store {
  const wallet: CreditWallet = {
    userId: 'user_demo_001',
    free_credits: 2,
    bonus_credits: 0,
    paid_credits: 30,
    updated_at: now(),
  };
  return {
    wallet,
    transactions: [
      {
        id: 'tx_seed_free',
        type: 'grant_free',
        direction: 'increase',
        credits: 2,
        description: '新使用者免費點數',
        balance_after: walletWithTotal(wallet),
        created_at: now(),
      },
      {
        id: 'tx_seed_paid',
        type: 'purchase',
        direction: 'increase',
        credits: 30,
        description: 'Commercial MVP Stage 1 seed paid credits',
        balance_after: walletWithTotal(wallet),
        created_at: now(),
      },
    ],
    payments: {},
    works: {},
  };
}

export function getMockStore(): Store {
  if (!g.__AUTO_STICKER_MOCK_STORE__) g.__AUTO_STICKER_MOCK_STORE__ = createInitialStore();
  return g.__AUTO_STICKER_MOCK_STORE__;
}

export function getWallet() {
  return walletWithTotal(getMockStore().wallet);
}

export function getTransactions() {
  return getMockStore().transactions;
}

function pushTransaction(tx: Omit<CreditTransaction, 'id' | 'created_at' | 'balance_after'>) {
  const store = getMockStore();
  const transaction: CreditTransaction = {
    id: nextId('txn'),
    created_at: now(),
    balance_after: walletWithTotal(store.wallet),
    ...tx,
  };
  store.transactions.unshift(transaction);
  return transaction;
}

export function createPayment(packageId: string) {
  const pack = CREDIT_PACKAGES[packageId] || CREDIT_PACKAGES.standard;
  const payment: MockPayment = {
    id: nextId('pay'),
    status: 'created',
    packageId: CREDIT_PACKAGES[packageId] ? packageId : 'standard',
    name: pack.name,
    amount: pack.amount,
    currency: pack.currency,
    credits: pack.credits,
    created_at: now(),
  };
  getMockStore().payments[payment.id] = payment;
  return payment;
}

export function completePayment(paymentId: string) {
  const store = getMockStore();
  const payment = store.payments[paymentId];
  if (!payment) return { ok: false as const, status: 404, error: 'PAYMENT_NOT_FOUND', message: '找不到 mock payment。' };
  if (payment.status === 'completed' || payment.status === 'paid') {
    return { ok: true as const, payment, wallet: walletWithTotal(store.wallet), transaction: store.transactions.find((tx) => tx.payment_id === payment.id) || null, idempotent: true };
  }
  payment.status = 'completed';
  payment.completed_at = now();
  store.wallet.paid_credits += payment.credits;
  store.wallet.updated_at = now();
  const transaction = pushTransaction({
    type: 'purchase',
    direction: 'increase',
    credits: payment.credits,
    description: `購買${payment.name}`,
    payment_id: payment.id,
  });
  return { ok: true as const, payment, wallet: walletWithTotal(store.wallet), transaction, idempotent: false };
}

export function consumeCredits(rawAmount: number, description = '點數扣除', workId?: string) {
  const store = getMockStore();
  const amount = Math.abs(Number(rawAmount || 0));
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false as const, status: 400, error: 'INVALID_AMOUNT', message: 'amount 必須是非零數字。' };
  }
  const available = total(store.wallet);
  if (available < amount) {
    return {
      ok: false as const,
      status: 402,
      error: 'INSUFFICIENT_CREDITS',
      message: '點數不足，請先購買額度後再建立作品。',
      required: amount,
      available,
      wallet: walletWithTotal(store.wallet),
    };
  }
  let remaining = amount;
  const take = (field: 'free_credits' | 'bonus_credits' | 'paid_credits') => {
    const value = Math.min(store.wallet[field], remaining);
    store.wallet[field] -= value;
    remaining -= value;
  };
  take('free_credits');
  take('bonus_credits');
  take('paid_credits');
  store.wallet.updated_at = now();
  const transaction = pushTransaction({
    type: 'consume',
    direction: 'decrease',
    credits: amount,
    description,
    work_id: workId,
  });
  return { ok: true as const, wallet: walletWithTotal(store.wallet), transaction };
}

export function createWork(input: { templateId?: string; title?: string; imageCount?: number }) {
  const imageCount = Number(input.imageCount || 8);
  const creditCost = imageCount;
  const workId = nextId('work');
  const consumed = consumeCredits(creditCost, `建立作品扣除 ${creditCost} 點`, workId);
  if (!consumed.ok) return consumed;
  const work: MockWork = {
    id: workId,
    title: input.title || 'Q版人像測試',
    template_id: input.templateId || 'tpl_001',
    image_count: imageCount,
    credit_cost: creditCost,
    status: 'completed',
    download_url: `/api/works/${workId}/download`,
    created_at: now(),
  };
  getMockStore().works[work.id] = work;
  return { ok: true as const, work, wallet: consumed.wallet, transaction: consumed.transaction };
}
