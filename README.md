# AUTO動態貼圖 PWA

手機優先的 AI LINE 貼圖生成工作室。支援模板、照片上傳、裁切/去背 mock、mock AI 生成、LINE QC gate、ZIP 匯出與 PWA shell。

## 執行

```bash
node --run build
node --run test
node --run acceptance:live
PORT=3000 node --run start
```

## 驗收帳號

Mock/demo 模式不需外部 AI key。`POST /api/auth/login` 可用任意 email 取得 demo session。

## 本輪驗證（2026-05-05T20:09:55+08:00）

- Source：`node --run build` PASS。
- Source：`node --run test` PASS，SUMMARY `unit=15 api=17 e2e=6`。
- Source：`node --run acceptance:live` PASS，create→upload→crop→generate→QC fail blocked→QC pass→ZIP。
- D package：`node --run build` PASS。
- D package：`node --run test` PASS，SUMMARY `unit=15 api=17 e2e=6`。
- D package：`node --run acceptance:live` PASS。

## 注意

- 不保證 LINE 審核通過。
- 不承諾影片級或 AE 級動畫。
- D package 位於 `/mnt/d/WORK/成品區/待最終審核/sebastian/20260502_auto_sticker_pwa_ui_replan_v2`。


## 商業 MVP 第一階段（2026-05-12T21:46:16+08:00）

本版新增可收費主流程：登入狀態、點數錢包、模板、上傳、建立作品、扣點、作品列表/詳情、ZIP 下載、額度不足阻擋與 mock 購買入口。

### 主要路由
- `/create`：4 步驟建立流程
- `/templates`、`/templates/[id]`：6 個商業模板與詳情
- `/works`、`/works/[id]`：作品列表與詳情
- `/billing`：額度管理與 mock 點數包
- `/account`：登入狀態與 Email
- `/install`、`/line-guide`、`/privacy`、`/terms`：PWA、LINE 規格與法務頁

### 驗證
見 `TEST_REPORT.md`、`PWA_AUDIT.md`、`PAYMENT_FLOW.md`、`LINE_EXPORT_SPEC.md`。
