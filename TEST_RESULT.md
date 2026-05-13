# TEST_RESULT.md — Dual Status / Commercial MVP Stage 1 Resubmission Evidence

updated_at: 2026-05-13T08:42:56+08:00

## Current status summary
- legacy_ui_stage.status: approved
- legacy_ui_stage.verdict: APPROVED (historical Simon QC result from 2026-05-06 only)
- commercial_mvp_stage_1.status: pending_simon_qc_resubmission
- commercial_mvp_stage_1.qc_last_decision: REJECTED
- commercial_mvp_stage_1.resubmission_state: ready_for_simon_qc_resubmission_after_OP_fix
- not_approved_notice: Commercial MVP Stage 1 is NOT approved and Commercial MVP Stage 2 is NOT allowed until Simon re-reviews and approves Stage 1.

## Why this file no longer starts with APPROVED
The previous `# TEST_RESULT.md — APPROVED` header referred only to the legacy UI demo stage. Simon rejected the later Commercial MVP Stage 1 because the UI wallet flow was split and insufficient→purchase→create was not browser-verifiable. This file now uses a dual-status header to prevent legacy approval from being reused for Commercial MVP.

## Latest OP fix for Simon REJECTED items
- `/create`, `/billing`, `/account`, `/works`, and `/works/[id]` now use the API mock store instead of split localStorage/API wallet state.
- Fresh demo reset starts with `total=2`, below the minimum 8-credit work cost, so insufficient credit is directly verifiable.
- `/billing` create→complete increases API `paid_credits`; returning to `/create` can use those credits to create work.
- Creating work through `/api/works` deducts 8 credits and records ledger `balance_after`; account/billing/create/works render the same API wallet source.
- Browser/main-flow acceptance now covers insufficient → billing complete → create work/deduct → works detail → ZIP download.
- Stage 1 ZIP still contains mock placeholder PNGs; this is documented as Stage 1 acceptable only. Stage 2 must use formal AI-generated results.

## Controller verification — local canonical repo
- `NEXT_TELEMETRY_DISABLED=1 node --run build`: PASS.
- `node --run test`: PASS, `SUMMARY unit=15 api=26 e2e=18`.
- `node --run acceptance:live`: PASS.
  - `Commercial browser/API flow verified: initial=2 afterPayment=602 afterCreate=594 afterConsume=586`.
  - Created work `/works/[id]` opened and `/api/works/[id]/download` ZIP validated.
  - Demo ZIP `/api/works/demo/download` remains validated: `images/01.png`–`images/08.png`, `README.txt`, `line_sticker_info.json`.
  - Legacy export ZIP remains secondary compatibility only.

## Historical legacy UI approval retained, not promoted
- Historical review: Simon QC APPROVED at 2026-05-06T00:37:44+08:00.
- Historical scope: legacy UI/demo stage only.
- Not valid for Commercial MVP Stage 1 or Stage 2.

## SUPAGENT-first evidence
- Implementation SUPAGENT MiniMax-M2.7 was launched first and timed out after 600s.
- Audit SUPAGENT MiniMax-M2.7 was launched and hit stale cwd FileNotFoundError pointing at the old `01_選題池` path.
- Controller fallback completed the canonical repo fixes and verification, with this limitation recorded for traceability.


## Final cloud verification — 2026-05-13T08:44:41+08:00
- cloud_url: https://auto-sticker-pwa-ui-replan-git-0aa19d-sportkk101-5719s-projects.vercel.app/
- Vercel commit status: success.
- `AUTO_STICKER_BASE_URL=https://auto-sticker-pwa-ui-replan-git-0aa19d-sportkk101-5719s-projects.vercel.app node --run acceptance:live`: PASS.
- Browser/API flow: `initial=2 afterPayment=602 afterCreate=594 afterConsume=586`.
- Created work detail: `/works/[id]` route checked in acceptance.
- Created work ZIP: `/api/works/[id]/download` returned `application/zip` and Commercial entries.
- Demo ZIP: `/api/works/demo/download` returned `application/zip` with `images/01.png`–`08.png`, `README.txt`, `line_sticker_info.json`.
- Legacy export ZIP remains secondary compatibility evidence only.
