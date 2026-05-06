# OP_HANDOFF.md — 給 Sebastian 的開發交接

updated_at: 2026-05-02T23:57:22+08:00
from: Sophie / 蘇策
to: Sebastian / 蘇執
event: plan.ready

## 任務

將 `AUTO動態貼圖` 依本 package 重構為手機優先 PWA。不得沿用舊 dashboard 首頁作為驗收入口。

## 權威文件

1. `PRODUCT_SPEC.md` — 產品/資料/API/Phase/QC 總規格。
2. `UI_PWA_SPEC.md` — 三張參考圖吸收後的 UI/PWA 規格。
3. `PAGE_FLOW.md` — 頁面與使用流程。
4. `assets/ui_refs/*.png` — UI 參考圖，需隨開發包保留。

## OP 必做

- `/` 首頁改為貼圖生成工作台。
- 建立 `/templates`, `/create`, `/preview`, `/export`, `/works`, `/me` 等完整 PWA 流程。
- Mock AI 模式可完整 create → preview → QC → ZIP。
- LINE static/dynamic 規格 gate 必須 deterministic。
- README、tests、seed、D 槽 final-review package 必須齊全。

## OP 禁止

- 不得只交 UI mock。
- 不得只做單頁。
- 不得讓 prompt 編輯壓過照片/模板/LINE 匯出主流程。
- 不得宣稱 LINE 必過審。
- 不得把下一階段留作「之後再補」。

## build.ready 條件

Sebastian 只有在 build/test/API/E2E/PWA/LINE export/D槽包證據齊全後，才可送 Simon。Sophie 未驗收，也未宣稱 OP 已完成。
