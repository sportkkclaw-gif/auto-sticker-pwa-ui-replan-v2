# STAGE3A_FAL_OWNER_RUNBOOK.md

## Purpose

This runbook is for an **owner-enabled fal.ai provider success pilot** for AUTO Stage 3A. It prepares the exact environment, limits, commands, evidence, failure handling, and prohibitions needed for a controlled provider run.

This document is **instructions only**. It does not execute fal.ai, does not deploy production, does not merge PR #2, and does not approve Stage 3A.

## Current Scope Boundary

- PR #2 safety fix head: `94501078b19664061c79fbd734179810ee7c17ce`
- Current scaffold gate: PASS
- fal.ai real provider success: NOT RUN
- Stage 3A approval: NO
- Production deploy: NO
- PR merge: NO

## 1. Required Owner Environment

Owner must provide the following environment values only in a secure runtime/secret manager. Do not commit these values and do not paste secret values into chat, PR comments, logs, ZIP files, manifests, screenshots, or evidence reports.

Required env:

```bash
FAL_KEY=<owner-provided fal.ai key>
STAGE3A_ENABLE_PROVIDER=true
STAGE3A_PROVIDER=fal
STAGE3A_MODE=provider_pilot
STAGE3A_MODEL=<owner-selected fal.ai model id>
STAGE3A_MAX_BUDGET_USD=<owner-approved max USD for this one pilot run>
STAGE3A_MAX_JOBS=1
STAGE3A_TIMEOUT_MS=<owner-approved timeout in milliseconds>
```

Recommended optional safety env:

```bash
STAGE3A_MAX_IMAGES=8
STAGE3A_HARD_STOP_ON_BUDGET_EXCEEDED=true
STAGE3A_PROVIDER_SUCCESS_REQUIRED=true
STAGE3A_SECRET_SCAN_REQUIRED=true
STAGE3A_REFUND_GUARD_REQUIRED=true
```

## 2. Recommended Owner Pilot Limits

Use the smallest possible real-provider pilot:

- `max_jobs=1`
- `max_images=8`
- `hard_stop_on_budget_exceeded=true`
- no production deploy
- no PR merge
- no live payment
- no formal launch claim
- no automatic retry that can create an extra provider charge without explicit idempotency evidence
- no evidence acceptance unless generated image bytes are actually returned by fal.ai and hashed

Pilot success must prove real provider lineage, not just config enablement. A provider-enabled request without actual provider bytes must remain blocked/skipped and must not mark fallback/mock output as real provider output.

## 3. Execution Commands

> Do not run these until owner has explicitly enabled the fal.ai pilot runtime and confirmed the budget cap.

### 3.1 Local owner-enabled provider pilot run

```bash
export FAL_KEY='<owner-secret-value>'
export STAGE3A_ENABLE_PROVIDER=true
export STAGE3A_PROVIDER=fal
export STAGE3A_MODE=provider_pilot
export STAGE3A_MODEL='<owner-selected-model>'
export STAGE3A_MAX_BUDGET_USD='<owner-approved-budget>'
export STAGE3A_MAX_JOBS=1
export STAGE3A_MAX_IMAGES=8
export STAGE3A_TIMEOUT_MS='<owner-approved-timeout-ms>'
export STAGE3A_HARD_STOP_ON_BUDGET_EXCEEDED=true

npm run build
npm run test
npm run acceptance:stage2
npm run acceptance:stage3a
```

Expected local result for real provider success path:

- build exits 0
- test exits 0
- acceptance:stage2 exits 0
- acceptance:stage3a exits 0
- provider success path is backed by fal.ai output bytes and hashes
- generated images from fal.ai use `source=provider`
- generated images from fal.ai use `is_real_provider_output=true`
- any fallback/mock image remains `source=fallback` and `is_real_provider_output=false`

### 3.2 Optional preview run

Only run preview against an owner-approved preview environment. This is still not production deploy.

```bash
export FAL_KEY='<owner-secret-value>'
export STAGE3A_ENABLE_PROVIDER=true
export STAGE3A_PROVIDER=fal
export STAGE3A_MODE=provider_pilot
export STAGE3A_MODEL='<owner-selected-model>'
export STAGE3A_MAX_BUDGET_USD='<owner-approved-budget>'
export STAGE3A_MAX_JOBS=1
export STAGE3A_MAX_IMAGES=8
export STAGE3A_TIMEOUT_MS='<owner-approved-timeout-ms>'
export STAGE3A_HARD_STOP_ON_BUDGET_EXCEEDED=true
export BASE_URL='<owner-approved-preview-url>'

npm run acceptance:stage3a
```

Preview run requirements:

- preview URL must not be production
- no live payment
- no PR merge
- no production deploy
- evidence must redact secret values
- any failure must stop the pilot and preserve evidence

### 3.3 acceptance:stage3a provider success path

Run after local or preview provider pilot has the required owner env.

```bash
npm run acceptance:stage3a
```

Acceptance must distinguish these paths:

- `provider_success`: only when fal.ai returned real provider output bytes and those bytes were persisted/hashes recorded
- `provider_not_implemented`: provider enabled but implementation has no real provider bytes path
- `config_blocked`: missing/invalid owner config
- `budget_blocked`: cap prevents provider call
- `provider_failed`: fal.ai request failed
- `timeout`: fal.ai request did not complete within `STAGE3A_TIMEOUT_MS`
- `partial_output`: some provider outputs exist but the full 8-image set is incomplete

## 4. Required Evidence After Successful Provider Run

A successful owner-enabled provider run must produce evidence proving real provider lineage.

Required evidence fields:

- `provider_job_id`
- `provider_request_id`
- `request_id`
- `model`
- `prompt_hash`
- `input_hash`
- `output_hash`
- `generated_images`
- per-image `sha256`
- per-image `source=provider` only for real fal.ai bytes
- per-image `is_real_provider_output=true` only for real fal.ai bytes
- latency/timing information
- cost estimate or actual reported cost where available
- budget cap decision
- fallback status
- refund/no-refund decision

Required evidence files/artifacts:

- `stage3a_evidence/stage3a-provider-evidence.json`
- `stage3a_evidence/stage3a-generation-manifest.json`
- `stage3a_evidence/stage3a-generated-images.json`
- `stage3a_evidence/stage3a-hash-comparison.json`
- `stage3a_evidence/stage3a-zip-inspection.json`
- `stage3a_evidence/stage3a-secret-scan.json`
- `stage3a_evidence/stage3a-cost-report.json`
- final ZIP inspection showing manifest/image hash parity

Evidence acceptance rules:

- `provider_evidence.json` must include provider/request IDs and model.
- `generation_manifest.json` must include prompt/input/output hashes and image provenance.
- `generated_images` must list all images and their real/fallback status.
- `zip_inspection` must prove the ZIP includes the expected manifest/evidence/images and that hashes match.
- `secret_scan` must prove `FAL_KEY` is not present in repo/evidence/ZIP/log artifacts.
- `cost_report` must show budget cap, max jobs, max images, cost estimate/actual, and final charge/refund status.

## 5. Failure Handling

### 5.1 timeout

If fal.ai does not complete within `STAGE3A_TIMEOUT_MS`:

- mark provider attempt as `timeout`
- stop the pilot
- preserve request metadata and timing evidence
- do not mark provider success
- do not mark fallback/mock output as real provider output
- if fallback assets are generated, mark `fallback_used=true` and `is_real_provider_output=false`
- evaluate refund according to idempotent refund rules

### 5.2 provider_failed

If fal.ai returns an error or the provider call fails:

- mark provider attempt as `provider_failed`
- preserve sanitized provider error category, status, and request ID if available
- do not expose `FAL_KEY`
- do not retry automatically unless owner confirms retry budget and idempotency key
- do not mark provider success
- fallback output must remain non-real-provider output

### 5.3 partial_output

If fewer than 8 valid provider images are returned:

- mark provider attempt as `partial_output`
- persist valid provider images with real provider hashes
- mark missing/replaced images as fallback only
- set fallback flags per image
- compute proportional refund or no-charge decision for missing images
- acceptance must not treat partial fallback set as full real provider success

### 5.4 budget_blocked

If the requested run exceeds `STAGE3A_MAX_BUDGET_USD` or `STAGE3A_MAX_JOBS=1`:

- mark attempt as `budget_blocked`
- make no provider call
- generate no provider charge
- fallback output, if produced, must be `is_real_provider_output=false`
- record cap values in `cost_report`

### 5.5 config_blocked

If required env is missing/invalid:

- mark attempt as `config_blocked`
- make no provider call
- do not fail scaffold fallback acceptance unless provider success was explicitly required for the run
- fallback output must remain non-real-provider output
- record missing config keys by name only, never by secret value

### 5.6 refund

Refund evidence must include:

- refund reason: `timeout`, `provider_failed`, `partial_output`, `budget_blocked`, or `config_blocked`
- refund amount or proportional decision
- idempotency key or refund reference
- whether a provider charge was made
- whether a credit refund was applied

### 5.7 no double-charge

Every provider request must have an idempotency key or equivalent request identifier. Re-running acceptance must not create a second charge for the same logical pilot request unless owner explicitly starts a new pilot run.

Rules:

- no automatic retry without owner approval
- no retry without idempotency evidence
- no duplicate provider job for one logical pilot run
- cost report must identify whether the run was charged once, not charged, or blocked before provider call

### 5.8 no double-refund

Refund processing must be idempotent:

- one failed/partial logical provider run can receive at most one refund decision
- re-running evidence generation must not apply a second refund
- refund records must include stable reference IDs
- cost report must show final refund state

## 6. Prohibited Actions

Strictly forbidden during this owner-enabled fal.ai pilot preparation/run:

- Do not commit `FAL_KEY`.
- Do not paste or print `FAL_KEY`.
- Do not include `FAL_KEY` in logs, screenshots, evidence JSON, ZIP files, manifests, README, Discord, PR comments, or commit messages.
- Do not production deploy.
- Do not merge PR #2.
- Do not enable live payment.
- Do not claim live AI is approved.
- Do not claim Stage 3A is approved.
- Do not claim fal.ai real provider success unless real provider output bytes were downloaded, persisted, and hashed.
- Do not mark mock/fallback output as `is_real_provider_output=true`.
- Do not send Simon/QC until owner explicitly authorizes the next review step.

## 7. Owner Review Checklist Before Running

Owner should confirm:

- [ ] `FAL_KEY` is available only as a secure runtime secret.
- [ ] `STAGE3A_ENABLE_PROVIDER=true` is set only for the pilot runtime.
- [ ] `STAGE3A_PROVIDER=fal`.
- [ ] `STAGE3A_MODE=provider_pilot`.
- [ ] `STAGE3A_MODEL` is selected.
- [ ] `STAGE3A_MAX_BUDGET_USD` is approved.
- [ ] `STAGE3A_MAX_JOBS=1`.
- [ ] `STAGE3A_MAX_IMAGES=8`.
- [ ] `STAGE3A_TIMEOUT_MS` is approved.
- [ ] no production deploy.
- [ ] no PR merge.
- [ ] no live payment.
- [ ] evidence file destinations are known.
- [ ] secret scan is mandatory.
- [ ] refund/no-double-charge/no-double-refund checks are mandatory.

## 8. Final Status

Stage 3A fal.ai owner runbook ready for owner review.
