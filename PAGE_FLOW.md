# PAGE_FLOW.md — AUTO動態貼圖 PWA 頁面流程

updated_at: 2026-05-02T23:57:22+08:00

## Flow A：首頁快速生成

`/` → 選熱門模板 → 上傳/替換照片 → 裁切/去背 → 編輯提示詞（可略） → 生成 8 張 → `/preview` → `/export`。

Gate：未選模板、未上傳照片、未同意圖片權利、prompt 超過 200、額度不足時，生成 CTA 不可啟用。

## Flow B：模板探索

`/templates` → 搜尋/篩選 → `/templates/[id]` → 套用模板 → `/create`。

## Flow C：作品再編輯

`/works` → `/works/[id]` → 單張重生或整組重生 → `/preview` → `/export`。

## Flow D：LINE 匯出

`/export` → 選 PNG/ZIP/LINE static ZIP/LINE animated ZIP → 執行 QC → 若 P0 fail 顯示修正項 → pass 後建立 package → 下載。

## Flow E：PWA 安裝與離線

Hero 或 `/me` 顯示 install prompt → `/install` 教學 → 安裝後 standalone 開啟 → 離線時可瀏覽 app shell/模板/作品草稿，生成與下載 API 顯示需連線。

## Route Acceptance Matrix

| Route | 必有狀態 | 下一步 |
|---|---|---|
| `/` | empty/uploaded/generating/completed/offline | generate 或 templates |
| `/templates` | loading/empty/results/filter applied | template detail/create |
| `/create` | stepper 1/2/3、validation errors | preview |
| `/preview` | sample vs actual、single fail | export / regenerate |
| `/export` | qc pending/pass/fail/exporting/ready | download |
| `/works` | empty/list/search | detail |
| `/me` | credits/install/privacy | settings/credits/install |
