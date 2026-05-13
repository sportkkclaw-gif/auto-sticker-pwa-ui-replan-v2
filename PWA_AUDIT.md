# PWA_AUDIT.md — Commercial MVP Stage 1 Fix Context

updated_at: 2026-05-12T23:30:06+08:00
status: pending_simon_qc_resubmission

## PWA status
The Simon REJECTED patch did not change the PWA installation scope. Existing PWA assets remain present:
- `public/manifest.webmanifest`
- `public/sw.js`
- `/install`
- `/offline`

## Relevant correction from this patch
This patch focuses on Commercial MVP API correctness and truth-pack status. It also documents that Commercial MVP Stage 1 is still a mock flow and is not Simon APPROVED yet.

## Limitations
- Mock commercial flow only.
- No real payment provider.
- No real AI generation API.
- No durable DB/Supabase yet.


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
