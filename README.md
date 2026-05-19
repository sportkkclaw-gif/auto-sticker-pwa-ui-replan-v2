# AUTO動態貼圖（LINE Animated Sticker Autogen）

## Current status — Stage 2 bounded MVP
- Commercial MVP Stage 1: **APPROVED**.
- Commercial MVP Stage 2: **APPROVED — bounded `mock_non_placeholder` scope**.
- Current lane: `05_驗收通過/sebastian`.
- Current status: `stage2_bounded_approval_closed`.
- Next action: `awaiting_owner_decision_for_next_phase`.

## Explicit non-claims
This repository currently does **not** claim:
- Live AI provider approval.
- Live payment approval.
- Formal DB approval.
- Commercial launch readiness.
- Stage 3 started.

## Product summary
AUTO動態貼圖 is a mobile-first PWA for creating LINE-sticker-style image packs. The current approved scope is a bounded commercial MVP that proves the flow from template/work creation to non-placeholder generated output, ZIP export, manifest evidence, and credit ledger behavior.

## What is approved
### Stage 1 approved scope
- Demo/login state.
- Credit wallet and mock purchase flow.
- Template selection.
- Work creation.
- Credit deduction.
- Work list/detail.
- ZIP download for LINE-style package.

### Stage 2 bounded approved scope
- `mock_non_placeholder` output mode.
- Actual created work flow.
- `generation_job` records.
- `generated_images` records.
- Non-placeholder ZIP images.
- `generation_manifest.json`.
- API image SHA-256 equals ZIP entry SHA-256 equals manifest SHA-256.
- Credit reserve to commit.
- Reserve to refund once.
- Retry with `attempt_no + 1`.
- No double-charge.
- No double-refund.
- Cloud acceptance can rerun the Stage 2 flow.

## What is not approved yet
- No live third-party AI provider.
- No live payment capture.
- No formal DB / Supabase / Prisma production migration.
- No production commercial launch.
- No Google Play / app-store release.
- No Stage 3 development.

## Main routes
- `/` — landing page.
- `/create` — commercial creation flow.
- `/templates` and `/templates/[id]` — template library/detail.
- `/works` and `/works/[id]` — work list/detail.
- `/billing` — mock credit packages.
- `/account` — account/credits.
- `/install` — PWA install guide.
- `/line-guide` — LINE packaging guide.
- `/privacy` and `/terms` — legal pages.

## Key API routes
- `GET /api/credits/balance`
- `POST /api/billing/mock-payment`
- `POST /api/billing/mock-payment/[id]/complete`
- `POST /api/stage2/reset`
- `GET /api/build-info`
- `POST /api/works`
- `GET /api/works/[id]`
- `GET /api/generation/jobs/[id]`
- `GET /api/works/[id]/generated-images`
- `GET /api/works/[id]/download`

## Commands
```bash
node --run build
node --run test
node --run acceptance:live
node --run acceptance:stage2
PORT=3000 node --run start
```

## Current evidence files
- `TEST_RESULT.md`
- `TASK_META.json`
- `STAGE2_CLOSEOUT_SUMMARY.md`
- `_simon_review_records/2026-05-18T211655+0800_STAGE2_APPROVED_BOUNDED.md`
- `PR_BODY_STAGE2_TRUTH_SYNC.md`

## Guardrails
- Do not merge PR #1 unless owner explicitly approves.
- Do not production deploy from this PR.
- Do not claim live AI, live payment, formal DB, or commercial launch readiness.
- Do not start Stage 3 without new owner instruction.

## Next action
Awaiting owner decision for next phase. Recommended next phase is a separately scoped Stage 3A real AI provider pilot, not live payment or commercial launch.

## Legacy notes
The original PWA demo supported templates, upload/crop mock, mock generation, LINE QC gate, ZIP export, and PWA shell. Those capabilities remain part of the historical approved foundation, but current project status is tracked through the Stage 1 and Stage 2 bounded approval sections above.
