# STAGE3A_OWNER_LOCKED_IMPLEMENTATION_BRIEF — AUTO 動態貼圖

status: owner_locked_brief_ready_for_review
final_status_wording: Stage 3A owner-locked implementation brief ready for owner review.
repo: sportkkclaw-gif/auto-sticker-pwa-ui-replan-v2
branch: acceptance

## Current baseline

- Stage 1: APPROVED
- Stage 2: APPROVED - bounded mock_non_placeholder scope
- Stage 3A development: NOT STARTED
- Live AI: NOT APPROVED
- Live Payment: NOT APPROVED
- Formal DB: NOT APPROVED
- Commercial Launch Ready: NO
- Production deploy: NO
- PR merge: NO

## Purpose

This brief locks the proposed Stage 3A implementation direction for owner review. It does not authorize implementation by itself.

Stage 3A is a real AI provider pilot designed to validate whether provider output can be connected to the existing Stage 2 architecture: work, generation_job, generated_images, ZIP, generation_manifest, hash evidence, and credit reserve / commit / refund / retry semantics.

## Owner decisions draft

### Provider candidate

provider_candidate: fal.ai
owner_decision_status: pending_owner_lock

fal.ai is recommended for the pilot because:

- It is suitable for API-based image generation pilots.
- It can support provider job/request evidence.
- It is appropriate for validating real output before production launch.
- It can be wrapped behind a provider adapter while preserving mock_non_placeholder fallback.
- It allows pilot cost control through job caps and timeout rules.

### Backup provider candidates

- OpenAI Image API
- Replicate
- Stability AI
- Owner internal provider

No provider is owner-locked until the owner explicitly approves it.

## Budget decision draft

Recommended planning caps:

- max_pilot_jobs: 10
- max_images_per_job: 8
- max_total_images: 80
- max_budget_usd: owner to decide
- hard_stop_on_budget_exceeded: true

No provider call may run until the owner sets a budget cap.

## Secret and API key policy

Provider keys must be supplied only through environment variables or platform secret management.

Planned env vars:

- FAL_KEY
- STAGE3A_PROVIDER=fal
- STAGE3A_MODE=provider_pilot
- STAGE3A_ENABLE_PROVIDER=false
- STAGE3A_MAX_BUDGET_USD
- STAGE3A_MAX_JOBS
- STAGE3A_TIMEOUT_MS

Default must be disabled. Without explicit owner enablement, no provider call may run.

Secrets must not appear in:

- repository files
- markdown documentation
- evidence artifacts
- ZIP files
- generation_manifest.json
- browser bundle
- logs

Logs may record only key_present=true/false or secret_ref, not secret values.

## Runtime decision draft

Allowed runtimes for future implementation:

- local owner-run
- Vercel preview only if owner explicitly approves

Production deployment is out of scope.

## Data and storage decision draft

Stage 3A must not introduce a formal production database.

Allowed:

- repository-backed mock/file store
- generated_images records
- generation_jobs records
- provider_evidence records
- generation_manifest evidence
- provider metadata with secrets redacted
- output image hashes
- provider output URL hashes
- downloaded output byte hashes

Not allowed:

- Supabase production migration
- Prisma production migration
- PostgreSQL production migration
- live production storage migration

## Payment decision draft

Stage 3A must not enable live payment.

Allowed:

- mock/sandbox credits
- reserve / commit / refund / retry semantics

Not allowed:

- live card charge
- subscription
- Google Play Billing
- live checkout

## Fallback decision draft

mock_non_placeholder must remain available as fallback.

Rules:

- Provider success: is_real_provider_output=true.
- Fallback: is_real_provider_output=false.
- Partial fallback: each image must mark source=provider or source=fallback.
- Fallback must never be represented as real AI output.
- fallback_used must be written to provider_evidence and generation_manifest.

## Future Stage 3A minimum implementation scope

A future implementation round may only include:

1. Provider adapter interface.
2. fal.ai adapter implementation, only when owner-enabled env is true.
3. provider_evidence record.
4. Provider attempt status: queued, running, completed, failed, timeout, partial, fallback_used, config_blocked.
5. provider_job_id, request_id, model, prompt_hash, input_hash, output_hash.
6. Output image download and hash.
7. ZIP / generation_manifest provider evidence fields.
8. acceptance:stage3a.
9. Secret redaction scan.
10. Cost cap, timeout, and refund rules.

## Out of scope

- formal DB
- live payment
- production deploy
- admin dashboard
- subscriptions
- marketplace
- Google Play Billing
- full auth redesign
- major UI redesign

## Acceptance gates for future implementation

### Provider success gate

- provider=fal.ai or owner-approved replacement.
- provider_job_id exists.
- request_id exists.
- model exists.
- prompt_hash exists.
- input_hash exists.
- 8 images generated or owner-approved partial policy used.
- output_hash exists.
- generated_images records exist.
- ZIP entries exist.
- API hash equals ZIP hash equals manifest hash.

### Fallback gate

- Provider failure or timeout can enter fallback.
- fallback_used=true.
- fallback image is_real_provider_output=false.
- fallback is not represented as provider output.
- refund or partial refund is correct.

### Secret safety gate

- No FAL_KEY in repo.
- No FAL_KEY in logs.
- No FAL_KEY in evidence.
- No FAL_KEY in ZIP.
- No FAL_KEY in browser bundle.

### Cost gate

- job cost estimate exists.
- total pilot cost estimate exists.
- budget cap enforced.
- hard stop works.

### Credit gate

- reserve works.
- commit works.
- refund works.
- no double-charge.
- no double-refund.

## Required evidence artifacts for future implementation

- stage3a-owner-decisions.json
- stage3a-provider-attempt.json
- stage3a-provider-evidence.json
- stage3a-generated-images.json
- stage3a-generation-manifest.json
- stage3a-zip-inspection.json
- stage3a-hash-comparison.json
- stage3a-cost-report.json
- stage3a-secret-scan.json
- stage3a-qc-summary.md

Each artifact must include:

- timestamp
- repo / branch / commit
- work_id
- generation_job_id
- provider
- provider_job_id or fallback reason
- prompt_hash
- input_hash
- output_hash
- no secrets

## Forbidden claims

Do not claim:

- Stage 3A development started
- Stage 3A owner approval completed
- Live AI owner approval completed
- Live payment approved
- Formal DB approved
- Commercial launch readiness
- Production deployment allowed
- PR merged

## Final status

Stage 3A owner-locked implementation brief ready for owner review.
