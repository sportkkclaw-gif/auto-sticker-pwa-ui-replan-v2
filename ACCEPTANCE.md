# ACCEPTANCE.md — AUTO動態貼圖 PWA 驗收

updated_at: 2026-05-02T23:57:22+08:00

## 驗收腳本
1. PWA 首頁：手機寬度開 `/`，確認參考圖風格、三步驟、模板、上傳、prompt、preview、CTA、bottom nav。
2. 快速生成：選模板、上傳 seed photo、裁切/去背、生成 8 張、進 preview。
3. LINE 匯出：QC pass 後下載 LINE ZIP，檢查 manifest/main/tab/01..08/qc_report。
4. 錯誤路徑：未上傳 CTA disabled；格式錯誤/低品質/額度不足/QC fail 均有提示。
5. PWA：manifest、service worker、install prompt、offline shell。

## Reject 條件
見 PRODUCT_SPEC.md 第 19 章 Hard Fail。
