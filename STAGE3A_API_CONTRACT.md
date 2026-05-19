# STAGE3A_API_CONTRACT — AUTO 動態貼圖

status: planning_draft_only
final_status_wording: Stage 3A planning draft ready for owner review.

## Contract goal
Define the future Stage 3A provider adapter contract without implementing it in this round. The contract must map one real provider attempt into existing Stage 2 work / generation_job / generated_images / ZIP / generation_manifest / hash evidence structures.

## Proposed provider adapter input
- work_id: existing work identifier.
- generation_job_id: existing generation job identifier.
- provider: fal_ai.
- model: owner-approved fal.ai model identifier.
- prompt: final prompt text used for provider call.
- prompt_hash: sha256 of normalized prompt.
- input_assets: source image / reference asset list.
- input_hash: sha256 over ordered input asset hashes and key generation settings.
- output_count_requested: 8.
- output_format: png or webp, owner-approved.
- line_sticker_constraints: dimensions, transparent background requirement if applicable, max file size target, animation/static constraints if applicable.
- timeout_ms: owner-approved pilot timeout.
- cost_cap_usd: owner-approved per-job cap.

## Proposed provider adapter output
- provider_job_id: provider-side job identifier when available.
- request_id: internal request id for this provider attempt.
- provider_request_id: provider API request id or queue id when available.
- model: exact model string used.
- status: completed / failed / timeout / partial / fallback_used / config_blocked.
- started_at / completed_at.
- latency_ms.
- output_images: list of generated image records.
- output_hash: sha256 over ordered generated image hashes.
- cost_estimate_usd.
- error_code: normalized internal error code.
- provider_error_code: redacted provider error code when available.
- retry_count.
- fallback_used: boolean.
- refund_credits: number.

## generated_images record fields
Each image record should include:
- image_index: 1 to 8.
- source: provider / fallback.
- provider_image_id or provider_asset_url_hash.
- storage_key.
- mime_type.
- width / height.
- bytes.
- sha256.
- is_real_provider_output: boolean.
- fallback_reason: nullable.

## Timeout / failed / partial output handling
- completed: 8 valid provider images; no refund.
- timeout: provider attempt timed out; record timeout evidence; use fallback only if owner permits; refund full job credits.
- failed: provider returned failure; record redacted provider error; refund full job credits unless failure is user-input validation.
- partial: store successful provider images, mark missing slots, refund credits for missing slots; if fallback fills missing slots, those entries must show source=fallback and is_real_provider_output=false.
- config_blocked: missing/invalid key or provider config; no provider call should be charged; do not claim provider output.

## Refund credits contract
- Full provider failure or timeout: refund 100% of generation credits charged for the job.
- Partial output: refund per missing provider image or owner-approved proportional amount.
- Duplicate provider callbacks: idempotent; do not double-refund.
- Completed provider output: no automatic refund unless Simon/QC marks the output unusable under owner-approved criteria.

## ZIP / generation_manifest.json provider evidence additions
Add provider evidence fields to generation_manifest.json:
- stage: stage3a_provider_pilot.
- provider: fal_ai or mock_non_placeholder.
- provider_job_id.
- request_id.
- provider_request_id.
- model.
- prompt_hash.
- input_hash.
- output_hash.
- is_real_provider_output.
- fallback_used.
- fallback_reason.
- status.
- latency_ms.
- cost_estimate_usd.
- refund_credits.
- image_hashes: ordered list of 8 image sha256 values.
- evidence_hash: sha256 over key manifest evidence fields.

## Non-goals
This document does not authorize code changes, API route changes, UI changes, formal DB migration, production deployment, PR merge, live payment, or Stage 3A implementation.
