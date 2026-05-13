# TEST_REPORT.md — Commercial MVP Stage 1 UI Wallet Split Fix

updated_at: 2026-05-13T08:42:56+08:00
status: ready_for_resubmission
commercial_mvp_stage_1_status: pending_simon_qc_resubmission
qc_last_decision: REJECTED
responsibility: OP_DELIVERY_DEFECT
not_approved_notice: Commercial MVP Stage 1 is not approved until Simon re-review.

## Latest Simon required fixes addressed
1. Unified `/create` and `/billing` wallet source through API mock store.
2. Fresh demo insufficient path restored: reset wallet total is `2`, below the 8-credit minimum.
3. `/billing` complete immediately increases API paid credits visible to `/create`.
4. Work creation deducts API credits and `/account`, `/billing`, `/create`, `/works` render the same API wallet/ledger source.
5. Browser/main-flow acceptance added: insufficient → billing complete → create deduct → `/works/[id]` → ZIP download.
6. `TEST_RESULT.md` rewritten with dual status to avoid old APPROVED ambiguity.

## Controller commands
- `NEXT_TELEMETRY_DISABLED=1 node --run build`: PASS.
- `node --run test`: PASS, `SUMMARY unit=15 api=26 e2e=18`.
- `node --run acceptance:live`: PASS.

## Acceptance highlights
- Fresh initial wallet: `total=2`.
- Insufficient create: `/api/works` returns `402 INSUFFICIENT_CREDITS` before purchase.
- Billing complete: business package increases paid credits by 600.
- Create after purchase: work is created and wallet total drops by 8.
- Shared-state pages: `/account`, `/billing`, `/create`, `/works`, `/works/[id]` return 200 after mutation.
- ZIP: created work ZIP and demo ZIP both return `application/zip` with required Commercial entries.

## Stage 2 notice
Commercial ZIP images remain mock placeholders in Stage 1. This is explicitly documented as Stage 1 acceptable only; Stage 2 cannot proceed on placeholders.


## Final cloud verification — 2026-05-13T08:44:41+08:00
- cloud_url: https://auto-sticker-pwa-ui-replan-git-0aa19d-sportkk101-5719s-projects.vercel.app/
- Vercel commit status: success.
- `AUTO_STICKER_BASE_URL=https://auto-sticker-pwa-ui-replan-git-0aa19d-sportkk101-5719s-projects.vercel.app node --run acceptance:live`: PASS.
- Browser/API flow: `initial=2 afterPayment=602 afterCreate=594 afterConsume=586`.
- Created work detail: `/works/[id]` route checked in acceptance.
- Created work ZIP: `/api/works/[id]/download` returned `application/zip` and Commercial entries.
- Demo ZIP: `/api/works/demo/download` returned `application/zip` with `images/01.png`–`08.png`, `README.txt`, `line_sticker_info.json`.
- Legacy export ZIP remains secondary compatibility evidence only.
