# TEST_REPORT — AUTO 動態貼圖商業 MVP 第一階段

updated_at: 2026-05-12T21:46:16+08:00

## Controller canonical results

- `NEXT_TELEMETRY_DISABLED=1 node --run build` — PASS
- `node --run test` — PASS，unit=15 / api=17 / e2e=6
- `node --run acceptance:live` — PASS，legacy create→QC→export ZIP gate 維持通過
- Production route probe — PASS：`/`, `/create`, `/templates`, `/templates/tpl_001`, `/works`, `/account`, `/billing`, `/install`, `/line-guide`, `/privacy`, `/terms`, `/api/credits/balance`, `/api/billing/mock-payment`
- Commercial ZIP probe — PASS：`/api/works/demo_work/download` 回 `application/zip`，magic bytes `PK`，entries: `images/01.png`～`images/08.png`, `README.txt`, `line_sticker_info.json`
- Browser screenshot probe — PASS：390x844 mobile screenshots generated for home/create/billing/account/templates；billing screenshot verified as real credits page, not error page.

## 商業 MVP 覆蓋

- 初始點數：free_credits=2, bonus_credits=0, paid_credits=0
- 點數不足：8/16/24 張建立前阻擋，導到 `/billing`
- Mock purchase：建立 mock payment → 測試付款完成 → 增加 paid_credits → 交易紀錄
- 建立作品：上傳檢查 JPG/PNG/WebP + 10MB，選模板，確認點數，扣點，生成 work，mock completed
- 作品：列表、詳情、重新生成、刪除、ZIP 下載
- 法務/PWA：`/install`, `/privacy`, `/terms`, `/line-guide`, service worker, manifest


## Cloud deployment
- URL: https://auto-sticker-pwa-ui-replan-git-0aa19d-sportkk101-5719s-projects.vercel.app
- Git branch: acceptance (latest pushed commit)
- Vercel status: success via GitHub Vercel check at 2026-05-12T21:53:57+08:00
- Cloud route probe PASS: /, /create, /templates, /templates/tpl_001, /works, /account, /billing, /install, /line-guide, /privacy, /terms, /api/credits/balance, /api/works/demo/download.
