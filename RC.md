# RC.md — Commercial MVP Stage 1 Simon REJECTED Fix

updated_at: 2026-05-12T23:30:06+08:00
status: ready_for_resubmission
commercial_mvp_stage_1_status: pending_simon_qc_resubmission
qc_last_decision: REJECTED
responsibility: OP_DELIVERY_DEFECT
not_approved_notice: Commercial MVP Stage 1 is NOT approved; ready for Simon QC resubmission only.

## Simon REJECTED reasons fixed
- mock payment API did not increase paid_credits after payment creation
- consume API wrote ledger but did not deduct wallet credits
- truth pack mixed legacy UI APPROVED status with Commercial MVP Stage 1 not-submitted state
- acceptance:live did not fully validate Commercial MVP /api/works/[id]/download ZIP contract
- API commercial credit loop depended too much on UI localStorage rather than server-side API state

## Fix summary
- Added shared server-side mock store in lib/mock-store.ts using globalThis.__AUTO_STICKER_MOCK_STORE__ with single wallet/payments/transactions/works state.
- POST /api/billing/mock-payment now only creates a created payment with packageId/name/amount/currency/credits/created_at.
- Added POST /api/billing/mock-payment/[id]/complete; it completes once, increases paid_credits, writes purchase transaction, returns updated wallet, and is idempotent.
- POST /api/credits/balance type=consume now normalizes positive/negative amount, checks sufficient balance, deducts free→bonus→paid, writes transaction with balance_after, and persists wallet for subsequent GET.
- Added POST /api/works minimal mock create endpoint backed by the same store and credit deduction.
- Updated /billing UI to call mock-payment create + complete APIs instead of only localStorage mutation.
- Updated node --run test and acceptance:live to validate Commercial MVP credit API flow plus /api/works/demo/download ZIP entries, README.txt, and line_sticker_info.json.
- Rewrote truth pack/docs so legacy UI approval is separated from Commercial MVP Stage 1 REJECTED→pending_simon_qc_resubmission.

## API contract now implemented
- `POST /api/billing/mock-payment` creates a payment only.
- `POST /api/billing/mock-payment/[id]/complete` completes payment, increases `paid_credits`, writes `purchase` transaction, returns wallet, and is idempotent.
- `POST /api/credits/balance` with `type=consume` deducts wallet in order `free_credits → bonus_credits → paid_credits` and writes transaction `balance_after` equal to actual wallet.
- Insufficient credits returns `INSUFFICIENT_CREDITS` and does not write a success consume ledger.
- `/api/works/demo/download` returns Commercial MVP ZIP with `images/01.png`–`images/08.png`, `README.txt`, `line_sticker_info.json`.

## Controller evidence
- `NEXT_TELEMETRY_DISABLED=1 node --run build`: PASS.
- `node --run test`: PASS, `SUMMARY unit=15 api=24 e2e=6`.
- `node --run acceptance:live`: PASS, Commercial credits API and `/api/works/demo/download` ZIP verified.

## Limitations
- Currently mock commercial flow.
- Not formal payment processing.
- Not formal AI generation API.
- Not formal DB/Supabase; uses `globalThis.__AUTO_STICKER_MOCK_STORE__` server-side in-memory mock store for Stage 1 validation/demo.

## SUPAGENT-first note
MiniMax-M2.7 implementation/audit attempts were made first. Child contexts had stale cwd/path issues (`01_選題池`) or timeout, so controller completed absolute-path fallback and recorded child outputs as advisory only.


## Cloud verification attached — 2026-05-12T23:34:46+08:00
- cloud_url: https://auto-sticker-pwa-ui-replan-git-0aa19d-sportkk101-5719s-projects.vercel.app/
- Vercel status: success.
- `AUTO_STICKER_BASE_URL=https://auto-sticker-pwa-ui-replan-git-0aa19d-sportkk101-5719s-projects.vercel.app node --run acceptance:live`: PASS.
- API probe before payment total: 624.
- Mock payment create: status `created`, package `business`, credits `600`.
- Mock payment complete: status `completed`, wallet total `1224`.
- Balance after payment persisted: total `1224`.
- Consume -8: wallet total `1216`, transaction balance_after total `1216`.
- Balance after consume persisted: total `1216`.
- Commercial ZIP: status `200`, content-type `application/zip`, magic `PK`.
- Commercial ZIP entries: images/01.png, images/02.png, images/03.png, images/04.png, images/05.png, images/06.png, images/07.png, images/08.png, README.txt, line_sticker_info.json.
- Page route table: 14/14 checked routes returned HTTP 200.
