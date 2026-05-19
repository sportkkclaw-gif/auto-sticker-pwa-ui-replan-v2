# STAGE3A_EVIDENCE_PLAN — AUTO 動態貼圖

status: planning_draft_only
final_status_wording: Stage 3A planning draft ready for owner review.

## Evidence objective
Stage 3A must let Simon verify that provider output is real provider output, not Stage 2 mock output, while preserving a clear mock_non_placeholder fallback trail.

## Required evidence per generation job
- work_id.
- generation_job_id.
- request_id.
- provider: fal_ai or mock_non_placeholder.
- provider_job_id.
- provider_request_id.
- model.
- prompt_hash.
- input_hash.
- output_hash.
- started_at / completed_at.
- status: completed / failed / timeout / partial / fallback_used / config_blocked.
- latency_ms.
- cost_estimate_usd.
- fallback_used.
- fallback_reason.
- refund_credits.
- image_count_requested: 8.
- image_count_provider_completed.
- image_count_fallback_filled.
- image_hashes ordered by sticker slot.
- evidence_hash.

## How Simon verifies provider output is not mock
Simon should receive a Stage 3A evidence bundle containing:
- provider field set to fal_ai for provider-generated images.
- provider_job_id and provider_request_id present.
- model value present and matching owner-approved provider/model.
- prompt_hash and input_hash present.
- output_hash matching the generated_images hashes and ZIP manifest.
- at least one provider-side timestamp/request identifier captured from the provider response.
- fallback_used=false for full provider success, or explicit per-image fallback markers for partial fallback.
- mock_non_placeholder output must show is_real_provider_output=false.

## Evidence files in ZIP
The Stage 3A ZIP should include:
- images/01.png through images/08.png, or owner-approved file format.
- generation_manifest.json with provider evidence fields.
- provider_evidence.json containing sanitized provider attempt metadata.
- README.txt explaining whether output is real provider output, fallback, or partial.

## Hash evidence chain
- prompt_hash = sha256(normalized prompt text).
- input_hash = sha256(ordered input asset hashes + generation settings).
- each generated image sha256 is stored in generated_images and generation_manifest.
- output_hash = sha256(ordered image sha256 list + provider/model/status fields).
- evidence_hash = sha256(provider_job_id + request_id + model + prompt_hash + input_hash + output_hash + status).

## API key leak prevention evidence
- No API key in ZIP.
- No API key in generation_manifest.
- No Authorization header in provider_evidence.json.
- Logs show only key_present=true/false or secret_ref, not secret values.
- Redaction scan must run before evidence bundle is accepted.

## Failure evidence requirements
- timeout: record timeout_ms, elapsed_ms, retry_count, refund_credits, fallback_reason if fallback used.
- failed: record normalized error_code, redacted provider_error_code, refund_credits.
- partial: record completed provider slots, fallback slots, missing slots, proportional refund.
- config_blocked: record missing secret/config without exposing key values.

## acceptance:stage3a evidence expectations
The future acceptance:stage3a check should verify:
- one real provider path with provider_job_id/request_id/model present.
- one forced timeout or simulated provider failure path with fallback and refund evidence.
- one partial output scenario if provider adapter supports partials.
- ZIP manifest hashes match actual files.
- no API key leakage in generated evidence files.
