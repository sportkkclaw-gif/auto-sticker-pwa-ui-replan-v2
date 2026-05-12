# TEST_REPORT.md — Commercial MVP Stage 1 Simon REJECTED Fix

updated_at: 2026-05-12T23:30:06+08:00
status: ready_for_resubmission
commercial_mvp_stage_1_status: pending_simon_qc_resubmission
qc_last_decision: REJECTED

## Local controller commands
- `NEXT_TELEMETRY_DISABLED=1 node --run build`: PASS.
- `node --run test`: PASS.
  - summary: `unit=15 api=24 e2e=6`
  - includes mock payment create/complete idempotency, consume wallet deduction, insufficient credits, Commercial ZIP checks.
- `node --run acceptance:live`: PASS.
  - Commercial credits API verified: initial=32, afterPayment=632, afterConsume=624.
  - `/api/works/demo/download`: status 200, content-type `application/zip`, ZIP magic `PK`.
  - Commercial ZIP entries verified: `images/01.png` through `images/08.png`, `README.txt`, `line_sticker_info.json`.
  - Legacy `/api/exports/[id]/download` remains secondary compatibility check, not primary Commercial MVP evidence.

## Simon REJECTED defects addressed
- mock payment API did not increase paid_credits after payment creation
- consume API wrote ledger but did not deduct wallet credits
- truth pack mixed legacy UI APPROVED status with Commercial MVP Stage 1 not-submitted state
- acceptance:live did not fully validate Commercial MVP /api/works/[id]/download ZIP contract
- API commercial credit loop depended too much on UI localStorage rather than server-side API state

## Cloud verification
Pending after Vercel redeploy of this fix commit; final probe evidence will be appended after deployment.
