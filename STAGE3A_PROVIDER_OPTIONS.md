# STAGE3A_PROVIDER_OPTIONS — AUTO 動態貼圖

status: planning_draft_only
final_status_wording: Stage 3A planning draft ready for owner review.

## Recommendation: one provider only
Recommended Stage 3A pilot provider: **fal.ai**.

## Why fal.ai is recommended for Stage 3A
- Supports modern image generation / image-to-image style workflows through API-oriented models suitable for a pilot.
- Provides asynchronous request patterns that can be mapped to request_id / provider_job_id evidence.
- Easier to isolate behind a provider adapter without changing Stage 2 product semantics.
- Cost can be capped per pilot run and estimated per 8-image batch.
- Outputs can be recorded as URLs or downloaded artifacts, then hashed into generated_images and ZIP evidence.
- Practical pilot fit: enough real provider evidence for Simon without forcing production deployment, formal DB, or live payment.

## Not selected for Stage 3A pilot
- OpenAI image generation: strong general provider, but Stage 3A needs lightweight pilot queue/evidence handling and cost containment first.
- Replicate: viable fallback option later, but model/version variability can complicate first-pass Simon evidence.
- Stability AI: viable image provider, but this plan recommends only one provider to reduce integration and QC surface.
- Local/self-hosted diffusion: not selected because Stage 3A should validate external provider request evidence, request IDs, cost, and timeout handling.

## mock_non_placeholder fallback preservation
Stage 2 mock_non_placeholder remains available as fallback. It must be explicitly marked in evidence as:
- provider: mock_non_placeholder
- is_real_provider_output: false
- fallback_reason: timeout / provider_failed / partial_output / cost_cap / provider_disabled

Fallback output must never be represented as live AI output.

## API key safety requirements
- Provider API key must be injected only through environment secret management.
- No key in repo, markdown docs, screenshots, logs, ZIP, generation_manifest, or client bundle.
- Server-only access; never expose provider key to browser.
- Logs must store only key_present boolean or secret_ref name, never secret value.
- Redaction rule: any Authorization header, token, or provider key must be masked before logging.

## Provider timeout / failed / partial policy
- Timeout: mark provider_attempt.status=timeout, no real-output claim, use fallback if owner permits.
- Failed: mark provider_attempt.status=failed with normalized provider_error_code and redacted message.
- Partial output: accept valid images, hash them, mark missing slots, refund missing slots, and optionally fill missing slots with fallback clearly marked.
- Auth failure: do not fallback silently; mark config_blocked and require owner/operator fix.

## Owner decision points
- Confirm fal.ai as the single Stage 3A provider.
- Confirm model family to pilot.
- Confirm monthly pilot cap and per-run cap.
- Confirm whether partial output should be delivered with fallback-filled missing images or rejected/refunded as a full failure.
