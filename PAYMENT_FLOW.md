# PAYMENT_FLOW.md — Commercial MVP Stage 1 Mock Payment Contract

updated_at: 2026-05-12T23:30:06+08:00
status: pending_simon_qc_resubmission

## Scope
This is a Simon REJECTED OP_DELIVERY_DEFECT patch. It is not Stage 2 and not real payment integration.

## Credit packages
- `starter`: 體驗包, NT$99, 30 credits
- `standard`: 標準包, NT$199, 80 credits
- `creator`: 創作者包, NT$499, 250 credits
- `business`: 商用包, NT$999, 600 credits

## Two-step mock payment API
### 1. Create payment
`POST /api/billing/mock-payment`

Request:
```json
{"packageId":"business"}
```

Response includes:
```json
{"payment":{"status":"created","packageId":"business","name":"商用包","amount":999,"currency":"TWD","credits":600}}
```

Create does not add credits.

### 2. Complete payment
`POST /api/billing/mock-payment/[id]/complete`

Complete behavior:
- finds payment;
- if not completed, changes status to `completed`;
- increases `paid_credits` by package credits;
- writes `purchase` transaction;
- returns updated wallet;
- idempotent: repeated complete on same payment does not add credits again.

## Consume API
`POST /api/credits/balance`

Request:
```json
{"type":"consume","amount":-8,"description":"deduct probe"}
```

Behavior:
- normalizes amount to positive deduction;
- checks wallet total;
- deducts `free_credits → bonus_credits → paid_credits`;
- writes `consume` transaction with `balance_after` equal to actual wallet;
- insufficient credits returns `INSUFFICIENT_CREDITS` and does not write success ledger.

## Store limitation
The API uses `globalThis.__AUTO_STICKER_MOCK_STORE__` server-side in-memory mock store. This is acceptable only for Commercial MVP Stage 1 validation/demo. Formal operation requires Supabase/PostgreSQL or another durable DB.


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


## Latest rejected UI wallet split fix — 2026-05-13T08:42:56+08:00
- Fixed `/create` localStorage/API split by moving create flow to `/api/credits/balance` and `/api/works`.
- `/account`, `/billing`, `/create`, `/works`, `/works/[id]` now render or mutate the same API mock store.
- Added `/api/demo/reset` for deterministic fresh demo verification; reset wallet total is 2 (< 8).
- Added `/api/works/[id]` so browser/main flow can open newly created work detail from API state.
- `node --run test`: PASS, `SUMMARY unit=15 api=26 e2e=18`.
- `node --run acceptance:live`: PASS, `initial=2 afterPayment=602 afterCreate=594 afterConsume=586`.
- `TEST_RESULT.md` now uses dual-status header; legacy APPROVED is historical only.
- Stage 1 placeholder ZIP images remain disclosed; Stage 2 is not allowed on placeholders.


## Final cloud verification — 2026-05-13T08:44:41+08:00
- cloud_url: https://auto-sticker-pwa-ui-replan-git-0aa19d-sportkk101-5719s-projects.vercel.app/
- Vercel commit status: success.
- `AUTO_STICKER_BASE_URL=https://auto-sticker-pwa-ui-replan-git-0aa19d-sportkk101-5719s-projects.vercel.app node --run acceptance:live`: PASS.
- Browser/API flow: `initial=2 afterPayment=602 afterCreate=594 afterConsume=586`.
- Created work detail: `/works/[id]` route checked in acceptance.
- Created work ZIP: `/api/works/[id]/download` returned `application/zip` and Commercial entries.
- Demo ZIP: `/api/works/demo/download` returned `application/zip` with `images/01.png`–`08.png`, `README.txt`, `line_sticker_info.json`.
- Legacy export ZIP remains secondary compatibility evidence only.


## D package stale rejection fixed — 2026-05-13T21:14:40+08:00
- Refreshed exact D package from source, excluding node_modules first, then repaired D node_modules by syncing source node_modules so required bins/files exist.
- Added public D-safe build/start wrappers: `scripts/build-drvfs-safe.mjs`, `scripts/start-drvfs-safe.mjs`.
- Exact D required files all present, including `lib/mock-store.ts`, billing mock-payment routes, works routes/download, updated `acceptance-live.mjs`, and dual-status `TEST_RESULT.md`.
- Exact D public gates PASS:
  - `NEXT_TELEMETRY_DISABLED=1 node --run build`: PASS.
  - `node --run test`: PASS, `SUMMARY unit=15 api=26 e2e=18`.
  - `node --run acceptance:live`: PASS, `initial=2 afterPayment=602 afterCreate=594 afterConsume=586`.
- Commercial MVP Stage 1 remains not approved; Stage 2 remains disallowed.
- No build.ready/delivery_id claimed this round.
