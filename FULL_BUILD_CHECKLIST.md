# FULL_BUILD_CHECKLIST.md — AUTO動態貼圖 PWA 重規劃完整建置清單

updated_at: 2026-05-13T20:52:04+08:00

## P0
- [x] 首頁 `/` 是手機 PWA 貼圖生成工作台，不是 dashboard。
- [x] 底部導航、safe-area、manifest、service worker、install prompt 完成。
- [x] 18 routes 全部存在且可操作。
- [x] 19 API 全部有 mock/成功/錯誤回應。
- [x] 18+ 資料模型與 seed data 完成。
- [x] 上傳/裁切/去背/模板/prompt/生成/預覽/作品/匯出閉環完成。
- [x] LINE QC fail 禁止 export；pass 可下載 ZIP。
- [x] Mock AI 無 API key 可完整驗收。
- [x] Unit ≥12、API ≥12、E2E ≥5、build pass。
- [x] README 與 D 槽 final-review package 齊全。

## Hard Fail
- [x] 無 LINE 必過審承諾。
- [x] 無影片級動畫承諾。
- [x] 無 PromptForge/marketplace 主語意。
- [x] 無 C:\WORK 或 /mnt/c/WORK 依賴。

## Completion Summary
- P0 total: 10
- P0 done: 10
- P0 remaining: 0
- Hard Fail total: 4
- Hard Fail cleared: 4
## Returned must-fix / D public gate
- [ ] Exact D package public gate clean-exits: `node --run build`, `node --run test`, and `node --run acceptance:live`.

## Returned Gate Summary
- Returned must-fix total: 1
- Returned must-fix done: 0
- Returned must-fix remaining: 1
