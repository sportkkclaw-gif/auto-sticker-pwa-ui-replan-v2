# NEXT_STEP.md — Commercial MVP Stage 1 pending Simon QC resubmission

updated_at: 2026-05-12T23:30:06+08:00
status: ready_for_resubmission
commercial_mvp_stage_1_status: pending_simon_qc_resubmission
qc_last_decision: REJECTED
next_action: resubmit to Simon QC after cloud redeploy/probe evidence is attached
not_approved_notice: Do not mark approved unless Simon re-reviews and approves this Commercial MVP Stage 1 fix.

## Completed in this OP_DELIVERY_DEFECT patch
- Added shared server-side mock store in lib/mock-store.ts using globalThis.__AUTO_STICKER_MOCK_STORE__ with single wallet/payments/transactions/works state.
- POST /api/billing/mock-payment now only creates a created payment with packageId/name/amount/currency/credits/created_at.
- Added POST /api/billing/mock-payment/[id]/complete; it completes once, increases paid_credits, writes purchase transaction, returns updated wallet, and is idempotent.
- POST /api/credits/balance type=consume now normalizes positive/negative amount, checks sufficient balance, deducts free→bonus→paid, writes transaction with balance_after, and persists wallet for subsequent GET.
- Added POST /api/works minimal mock create endpoint backed by the same store and credit deduction.
- Updated /billing UI to call mock-payment create + complete APIs instead of only localStorage mutation.
- Updated node --run test and acceptance:live to validate Commercial MVP credit API flow plus /api/works/demo/download ZIP entries, README.txt, and line_sticker_info.json.
- Rewrote truth pack/docs so legacy UI approval is separated from Commercial MVP Stage 1 REJECTED→pending_simon_qc_resubmission.

## Required Simon re-check focus
1. `GET /api/credits/balance` initial wallet.
2. `POST /api/billing/mock-payment` creates business payment only.
3. `POST /api/billing/mock-payment/[id]/complete` increases `paid_credits` by 600 and is idempotent.
4. `POST /api/credits/balance` `type=consume amount=-8` deducts total by 8 and persists.
5. `/api/works/demo/download` ZIP has required Commercial entries and legal README content.
6. Truth pack separates legacy UI approval from Commercial MVP Stage 1 rejected/resubmission status.

## Known limitations
- Mock commercial flow only; no real payment provider.
- Mock AI generation only; no real AI provider.
- Server-side in-memory mock store only; no formal DB/Supabase.


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
