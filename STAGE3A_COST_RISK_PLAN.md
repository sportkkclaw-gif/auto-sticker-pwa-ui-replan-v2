# STAGE3A_COST_RISK_PLAN — AUTO 動態貼圖

status: planning_draft_only
final_status_wording: Stage 3A planning draft ready for owner review.

## Cost objective
Stage 3A should estimate and cap the cost of one 8-image real provider generation job before implementation. This plan does not enable live payment or formal billing.

## Recommended provider cost basis
Provider: fal.ai, pending owner approval.

Because model prices vary by selected fal.ai model, the implementation plan should store a configurable per_image_estimated_cost_usd and per_job_cost_cap_usd. The 8-image estimate should be calculated as:

estimated_job_cost_usd = per_image_estimated_cost_usd × 8 + retry_buffer

## Initial planning estimate
For planning only, use a conservative placeholder model:
- per_image_estimated_cost_usd: owner to confirm from selected fal.ai model pricing.
- image_count: 8.
- retry_buffer: 10% to 25% pilot reserve.
- cost_cap_usd_per_job: owner-defined hard cap.
- monthly_pilot_cap_usd: owner-defined hard cap.

Example formula:
- If per_image_estimated_cost_usd is 0.03, then 8 images cost 0.24 before retry buffer.
- With 20% buffer, estimated cap is 0.288 per job.

These are planning placeholders, not approved billing values.

## Refund credit rules
- completed 8/8 provider images: no automatic refund.
- timeout before usable output: full generation credit refund.
- provider failed: full generation credit refund unless caused by invalid user input after validation.
- partial output: proportional refund by missing provider-generated image count.
- fallback-filled partial: fallback images do not count as paid provider success; missing provider slots remain refundable unless owner decides otherwise.
- config_blocked due to missing provider key: no credit charge should be finalized.

## Timeout / failure risk controls
- Per-request timeout configurable.
- Provider retries capped to avoid runaway cost.
- Cost cap checked before provider call.
- If provider queue is degraded, Stage 2 mock_non_placeholder fallback remains available and clearly marked.
- Auth failure stops provider path; do not burn credits or silently claim fallback as AI.

## API key risk controls
- Key only in server-side secret storage.
- Never include key in logs, evidence, PR, docs, ZIP, browser bundle, or generated manifest.
- Redact Authorization and provider headers.
- Rotate key immediately if leak suspected.
- Use pilot-only provider key with limited budget if provider supports it.

## Provider output quality risk
- Provider may generate inconsistent character identity across 8 stickers.
- Provider may violate LINE sticker constraints.
- Provider may return unsafe or unusable images.
- Stage 3A should measure these issues but not claim commercial readiness.

## Stage 3A stop conditions
- Pilot budget exceeded.
- Provider auth/config invalid.
- Provider repeatedly times out.
- ZIP/hash evidence cannot prove output lineage.
- Simon cannot distinguish real provider output from fallback/mock evidence.
- Owner has not approved moving from planning to implementation.
