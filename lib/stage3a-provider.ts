import crypto from 'node:crypto';

export type Stage3AProviderAttemptStatus =
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'timeout'
  | 'partial'
  | 'fallback_used'
  | 'provider_not_implemented'
  | 'config_blocked'
  | 'budget_blocked';

export type Stage3AProviderInput = {
  work_id: string;
  generation_job_id: string;
  prompt: string;
  prompt_hash: string;
  input_hash: string;
  image_count: number;
  timeout_ms: number;
  model: string | null;
};

export type Stage3AProviderOutputImage = {
  provider_image_id: string;
  url?: string;
  bytes?: Buffer;
  sha256?: string;
};

export type Stage3AProviderAttempt = {
  provider: 'fal.ai';
  provider_job_id: string | null;
  request_id: string;
  provider_request_id: string | null;
  model: string | null;
  status: Stage3AProviderAttemptStatus;
  latency_ms: number;
  cost_estimate_usd: number;
  fallback_used: boolean;
  fallback_reason: string | null;
  refund_credits: number;
  redacted_metadata: Record<string, unknown>;
  outputs: Stage3AProviderOutputImage[];
};

export type Stage3AProviderEvidence = Omit<Stage3AProviderAttempt, 'outputs'> & {
  id: string;
  work_id: string;
  generation_job_id: string;
  prompt_hash: string;
  input_hash: string;
  output_hash: string | null;
  created_at: string;
  updated_at: string;
};

export function stage3aSha256(input: Buffer | string) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

export function redactProviderEvidence(raw: unknown): Record<string, unknown> {
  const redacted = JSON.parse(JSON.stringify(raw ?? {}));
  const visit = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(visit);
    if (value && typeof value === 'object') {
      const out: Record<string, unknown> = {};
      for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
        if (/authorization|api[_-]?key|secret|token|fal_key/i.test(key)) out[key] = '[REDACTED]';
        else out[key] = visit(nested);
      }
      return out;
    }
    if (typeof value === 'string' && /(Bearer\s+|fal[_-]?key|key_)/i.test(value)) return '[REDACTED]';
    return value;
  };
  return visit(redacted) as Record<string, unknown>;
}

export function getStage3AConfig(env = process.env) {
  const enabled = env.STAGE3A_ENABLE_PROVIDER === 'true';
  const provider = env.STAGE3A_PROVIDER || 'fal';
  const mode = env.STAGE3A_MODE || 'provider_pilot';
  const model = env.STAGE3A_MODEL || null;
  const hasKey = Boolean(env.FAL_KEY);
  const timeoutMs = Math.max(1000, Number(env.STAGE3A_TIMEOUT_MS || 30000));
  const maxJobs = Number(env.STAGE3A_MAX_JOBS || 10);
  const maxBudgetUsd = Number(env.STAGE3A_MAX_BUDGET_USD || 0);
  return { enabled, provider, mode, model, hasKey, timeoutMs, maxJobs, maxBudgetUsd };
}

export function isStage3AProviderPilotRequested(input: Record<string, unknown>, env = process.env) {
  return input.stage === 'stage3a_provider_pilot'
    || input.stage3a_provider_pilot === true
    || env.STAGE3A_MODE === 'provider_pilot';
}

export function createProviderGenerationAttempt(input: Stage3AProviderInput): Stage3AProviderAttempt {
  const config = getStage3AConfig();
  const requestId = `stage3a_req_${stage3aSha256(`${input.work_id}:${input.generation_job_id}:${Date.now()}`).slice(0, 16)}`;
  if (!config.enabled || !config.hasKey || !config.model) {
    return {
      provider: 'fal.ai',
      provider_job_id: null,
      request_id: requestId,
      provider_request_id: null,
      model: config.model,
      status: 'config_blocked',
      latency_ms: 0,
      cost_estimate_usd: 0,
      fallback_used: true,
      fallback_reason: 'config_blocked',
      refund_credits: input.image_count,
      redacted_metadata: { key_present: config.hasKey, enabled: config.enabled, model_present: Boolean(config.model) },
      outputs: [],
    };
  }
  if (config.maxBudgetUsd > 0 && config.maxBudgetUsd < 0.01) {
    return {
      provider: 'fal.ai',
      provider_job_id: null,
      request_id: requestId,
      provider_request_id: null,
      model: config.model,
      status: 'budget_blocked',
      latency_ms: 0,
      cost_estimate_usd: 0,
      fallback_used: true,
      fallback_reason: 'budget_blocked',
      refund_credits: input.image_count,
      redacted_metadata: { budget_blocked: true, max_budget_usd: config.maxBudgetUsd },
      outputs: [],
    };
  }
  return {
    provider: 'fal.ai',
    provider_job_id: null,
    request_id: requestId,
    provider_request_id: null,
    model: config.model,
    status: 'provider_not_implemented',
    latency_ms: 0,
    cost_estimate_usd: 0,
    fallback_used: true,
    fallback_reason: 'provider_not_implemented',
    refund_credits: input.image_count,
    redacted_metadata: {
      provider: 'fal.ai',
      mode: 'provider_pilot_scaffold',
      key_present: true,
      model_present: true,
      no_live_call: true,
      provider_bytes_received: false,
    },
    outputs: [],
  };
}

export async function pollProviderGenerationAttempt(providerJobId: string) {
  return { provider_job_id: providerJobId, status: 'running' as const };
}

export async function downloadProviderOutput(output: Stage3AProviderOutputImage) {
  if (output.bytes) return output.bytes;
  if (!output.url) return Buffer.alloc(0);
  const response = await fetch(output.url);
  return Buffer.from(await response.arrayBuffer());
}

export function normalizeProviderEvidence(attempt: Stage3AProviderAttempt, base: { work_id: string; generation_job_id: string; prompt_hash: string; input_hash: string; output_hash: string | null }): Stage3AProviderEvidence {
  const timestamp = new Date().toISOString();
  return {
    id: `pe_${stage3aSha256(`${base.work_id}:${base.generation_job_id}:${attempt.request_id}`).slice(0, 18)}`,
    work_id: base.work_id,
    generation_job_id: base.generation_job_id,
    provider: attempt.provider,
    provider_job_id: attempt.provider_job_id,
    request_id: attempt.request_id,
    provider_request_id: attempt.provider_request_id,
    model: attempt.model,
    status: attempt.status,
    prompt_hash: base.prompt_hash,
    input_hash: base.input_hash,
    output_hash: base.output_hash,
    latency_ms: attempt.latency_ms,
    cost_estimate_usd: attempt.cost_estimate_usd,
    fallback_used: attempt.fallback_used,
    fallback_reason: attempt.fallback_reason,
    refund_credits: attempt.refund_credits,
    redacted_metadata: redactProviderEvidence(attempt.redacted_metadata),
    created_at: timestamp,
    updated_at: timestamp,
  };
}
