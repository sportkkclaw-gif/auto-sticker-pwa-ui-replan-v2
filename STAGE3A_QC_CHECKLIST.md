# STAGE3A_QC_CHECKLIST — AUTO 動態貼圖

status: planning_draft_only
final_status_wording: Stage 3A planning draft ready for owner review.

## Scope gate
- [ ] Owner approved Stage 3A implementation start.
- [ ] Provider selected: fal.ai or owner-approved replacement.
- [ ] Stage 2 mock_non_placeholder fallback preserved.
- [ ] No production deploy.
- [ ] No PR merge.
- [ ] No live payment.
- [ ] No formal DB migration.
- [ ] No commercial launch readiness claim.

## Provider evidence gate
- [ ] provider_job_id captured when provider returns one.
- [ ] request_id captured for every generation attempt.
- [ ] provider_request_id captured when available.
- [ ] model captured exactly.
- [ ] prompt_hash captured.
- [ ] input_hash captured.
- [ ] output_hash captured.
- [ ] latency_ms captured.
- [ ] cost_estimate_usd captured.
- [ ] fallback_used and fallback_reason captured.

## Simon non-mock verification gate
- [ ] At least one Stage 3A provider run shows provider=fal_ai.
- [ ] Provider run includes provider_job_id or provider_request_id.
- [ ] Provider run includes model, prompt_hash, input_hash, output_hash.
- [ ] ZIP generation_manifest image hashes match actual files.
- [ ] mock_non_placeholder output is clearly marked is_real_provider_output=false.
- [ ] Evidence bundle contains no API key or Authorization header.

## Timeout / failed / partial gate
- [ ] Timeout path records timeout evidence.
- [ ] Provider failed path records redacted provider_error_code.
- [ ] Partial output path records completed provider slots and missing/fallback slots.
- [ ] Refund credits are calculated for timeout and failed jobs.
- [ ] Partial refund is calculated for missing provider images.
- [ ] Duplicate callbacks or retries do not double-charge or double-refund.

## ZIP / generation_manifest gate
- [ ] ZIP contains 8 image slots or an owner-approved partial-output representation.
- [ ] generation_manifest.json includes provider evidence fields.
- [ ] provider_evidence.json is sanitized.
- [ ] README.txt states real provider / fallback / partial status.
- [ ] image_hashes in manifest match ZIP image files.
- [ ] evidence_hash can be recomputed from manifest fields.

## acceptance:stage3a planned checks
- [ ] Provider success fixture or live pilot run validates real provider evidence fields.
- [ ] Forced timeout/failure validates fallback and refund fields.
- [ ] ZIP/hash verification validates generated image integrity.
- [ ] Secret scan validates no API key leakage.
- [ ] Cost estimate check validates 8-image calculation and cap behavior.
- [ ] Final report keeps status as: Stage 3A planning draft ready for owner review.

## Forbidden claims scan
Before owner review, docs must not make any positive claim that:
- Live AI is enabled.
- Live Payment is enabled.
- Formal DB is approved for production use.
- Commercial launch is ready.
- Production deployment is allowed.
- PR merge has happened.
- Stage 3A development has started.
