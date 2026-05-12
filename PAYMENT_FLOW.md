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
