# PRODUCT_SPEC.md — AUTO動態貼圖 PWA UI 重規劃版

updated_at: 2026-05-02T23:57:22+08:00
task_id: 20260502_auto_sticker_pwa_ui_replan_v2
source_task_id: 20260428_line_animated_sticker_autogen
status: developer_ready_spec
owner: Sophie / 蘇策
handoff_target: Sebastian / 蘇執

## 0. 產品名稱

**AUTO動態貼圖** — 手機優先 PWA 的 AI LINE 貼圖生成工作室。

一句話：使用者上傳自己擁有授權的人像、角色或寵物照片，選模板、可微調提示詞，一鍵生成 LINE 可用的靜態 PNG 與 LINE 規格化 ZIP；動態貼圖能力保留為 LINE APNG 規格內的模板化專業動作，不承諾影片/AE 級動畫。

## 1. 本次重規劃背景

Jason 要求原 `AUTO動態貼圖 / LINE 動態貼圖` 開發案先由 PM 重新改成三張參考圖風格的手機 PWA UI，改完才能交 OP 開發。舊版不得再以 dashboard、工程導覽頁或 PromptForge 語意作為首頁。本規格以三張 UI 參考圖為權威 UI 方向：

1. `assets/ui_refs/01_cute_pastel_sticker_workshop.png`：粉彩可愛「我的貼圖工坊」、三步驟、模板 carousel、上傳照片、生成設定、4 張預覽、底部雙 CTA。
2. `assets/ui_refs/02_modern_ai_sticker_studio_pwa.png`：藍紫 AI 貼圖工作室、PWA badge、搜尋篩選、熱門模板、素材套用、提示詞模板、即時預覽、底部導覽。
3. `assets/ui_refs/03_mint_three_step_sticker_generator.png`：清新綠白三步驟、模板風格、可編輯提示詞、裁切/去背、示意預覽、下載 PNG / 匯出 LINE 規格包。

## 2. 目標使用者

- 想用自拍、寵物照、品牌吉祥物或自有角色快速做 LINE 貼圖的一般使用者。
- 小商家、創作者、KOL、社群經營者，需要快速產出可分享貼圖包。
- 已有角色 IP / mascot 的品牌方，需要將角色轉為聊天貼圖素材。
- 非目標：動畫師專業 AE 工具、影片生成平台、Prompt marketplace、企業級 LLMOps dashboard。

## 3. 核心痛點

- LINE 貼圖尺寸、透明背景、ZIP 命名、主圖/tab 圖、檔案大小與審核規範對一般人太複雜。
- 使用 AI 圖像工具可生成單張圖片，但很難一次產出一組一致風格、可下載、可匯出的貼圖包。
- 一般使用者不懂 prompt，不應被迫進入 PromptForge 類提示詞平台。
- 手機是主要使用場景，舊 dashboard 版不符合「拍照 → 套模板 → 分享/下載」行為。

## 4. 不可偏移的核心原則

1. **首頁即工作台**：`/` 必須直接能選模板、上傳照片、生成預覽；不得變成工程導覽或 dashboard 空頁。
2. **照片/素材優先**：核心輸入是使用者自有照片/角色；prompt 只是模板設定的一部分。
3. **手機 PWA 優先**：底部導航、安全區、觸控尺寸、可安裝、離線 shell 是 P0。
4. **LINE 規格可見化**：匯出時用使用者看得懂的 checklist 表達尺寸、透明背景、ZIP、主圖/tab 圖；不得只寫技術文字。
5. **高端動態的邊界**：只承諾 LINE APNG 規格內的模板化動作，不承諾影片級、AE 級或 LINE 必過審。
6. **Mock fallback 可驗收**：無外部 AI key 時仍能用 seed/mock 生成任務、預覽、下載、QC、ZIP 流程完整跑通。

## 5. 功能範圍

### P0 必做
- Mobile-first PWA app shell、manifest、service worker、install prompt。
- 首頁貼圖生成工作台：模板、上傳、設定、預覽、生成、下載入口。
- 模板庫與搜尋/篩選。
- 圖片上傳、裁切、去背 mock/真實 provider 抽象、圖片品質提示。
- AI/mock 生成任務：4 / 8 / 16 張靜態貼圖；動態模板 APNG mock metadata。
- 單張 PNG 下載、全部 ZIP、LINE 規格包匯出。
- 作品歷史、草稿、重新生成、刪除。
- 使用額度、方案、隱私設定。
- LINE QC gate：尺寸、透明、命名、檔案大小、APNG frame/playback/loop metadata。

### P1 可做但不得阻塞 P0 完成
- Web Share API 分享到 LINE / 社群。
- Push notification：生成完成提醒。
- HEIC 前端轉換。
- 模板收藏與推薦排序。

### 明確禁止
- 不做 Prompt marketplace。
- 不做複雜企業後台首頁。
- 不承諾 LINE 審核必過。
- 不做 text-to-video → APNG 主流程。
- 不把 PWA UI 規格退回舊 `/dashboard` 版。

## 6. 頁面結構（16+）

| # | Route | 名稱 | PWA/UI 要求 | QC 驗收重點 |
|---|---|---|---|---|
| 1 | `/` | 首頁/貼圖生成工作台 | Hero + PWA badge + 三步驟 + 熱門模板 + 素材套用 + 提示詞模板 + 即時預覽 + 生成 CTA + 底部導航 | 不得是 dashboard；手機 390px 可完整操作 |
| 2 | `/templates` | 模板庫 | 搜尋、篩選、分類 chips、熱門/最新/寵物/情侶/日常 | 模板可選中並帶回 create |
| 3 | `/templates/[id]` | 模板詳情 | 預覽、提示詞、支援張數、LINE/動態標籤 | 可套用模板 |
| 4 | `/create` | 建立貼圖 | Stepper：選模板 → 上傳照片 → 生成設定 | 必要條件未滿 CTA disabled |
| 5 | `/create/crop` | 裁切/去背 | 手機 modal/fullscreen，裁切、旋轉、去背預覽 | 上傳後可保存裁切結果 |
| 6 | `/preview` | 生成預覽 | 4/8/16 grid、單張放大、重新生成 | 示意/實際結果標示清楚 |
| 7 | `/preview/[stickerId]` | 單張編輯 | 改文字、白邊、重生單張、下載單張 | 單張狀態可保存 |
| 8 | `/export` | 匯出中心 | PNG、ZIP、LINE 規格包、QC checklist | QC fail 不允許最終 ZIP |
| 9 | `/works` | 作品列表 | 草稿/已完成/失敗 tabs、搜尋 | IndexedDB/mock seed 可顯示 |
|10 | `/works/[id]` | 作品詳情 | 貼圖包結果、重新生成、分享、刪除 | 可回到 preview/export |
|11 | `/me` | 我的 | 額度、方案、設定、PWA 安裝提示 | 底部導航可達 |
|12 | `/me/credits` | 額度 | 免費/付費點數、扣點/退款紀錄 | 生成前顯示消耗 |
|13 | `/settings` | 設定 | 隱私模式、語言、輸出偏好、清除本機資料 | 人像保存期限可設定 |
|14 | `/help/line-spec` | LINE 規格說明 | 靜態/動態貼圖規格、常見錯誤 | 文案不承諾必過審 |
|15 | `/install` | PWA 安裝教學 | iOS/Android 安裝步驟 | 可從 me 與 banner 進入 |
|16 | `/privacy` | 隱私/授權 | 照片用途、刪除、授權聲明 | 上傳前可連到此頁 |
|17 | `/admin/templates` | 模板管理（demo/admin） | 管理 seed templates、啟用停用 | demo role 才可見 |
|18 | `/admin/qc-rules` | QC 規則管理（demo/admin） | LINE 規格 rule seed | demo role 才可見 |

## 7. 使用流程

### 快速生成主流程
1. 使用者進入 `/`。
2. 在熱門模板 carousel 或 `/templates` 選模板。
3. 上傳照片；同意「我擁有此圖片/角色使用權」。
4. 裁切/去背，系統檢查格式、大小、清晰度、臉/主體。
5. 使用預設提示詞，可在 200 字內微調。
6. 選張數 4/8/16、是否自動去背、加文字、白邊、LINE 規格包。
7. 點「生成 8 張貼圖」。
8. 任務進入 queued/generating/post-processing/completed。
9. `/preview` 檢查結果，單張可重生/下載。
10. `/export` 執行 QC，通過後下載 PNG 或 LINE ZIP。

### LINE 匯出流程
- 選作品 → Export → 產生 main.png、tab.png、01.png...、metadata.json、qc_report.html → ZIP → 下載。
- 若是動態 APNG：檢查 5–20 frames、播放 1/2/3/4 秒、loop 1–4 且總播放 ≤4 秒、單張 ≤1MB。

## 8. UI/UX 要求

- 風格：粉彩可愛 + 藍紫 AI 感 + 清新綠白成功感；整體圓角、卡片、插圖、清楚 CTA。
- Layout：手機 360/375/390/414/430px 優先；桌面 max-width 480–640px 置中，可旁邊留品牌背景。
- 底部導航：首頁、模板、作品、我的；必須避開 safe-area。
- CTA：主 CTA 文案需含產出數量，例如「生成 8 張貼圖」；未上傳/未選模板/額度不足 disabled。
- 上傳隱私提示固定可見：「照片僅用於本次生成，不會公開；可在設定刪除。」
- 狀態：empty、loading、generating、failed、completed、offline、disabled 必須全部有 UI。
- 預覽：生成前必須標「示意」；生成後標「實際生成」。
- PWA：manifest、192/512/maskable icons、standalone、portrait、install banner、offline fallback。

## 9. 資料欄位 / TypeScript 資料模型（18+ 表）

```ts
export type UserRole = 'guest'|'creator'|'paid_creator'|'admin'|'reviewer';
export type JobStatus = 'draft'|'validating'|'queued'|'uploading'|'generating'|'post_processing'|'completed'|'failed'|'cancelled';
export type StickerKind = 'static_png'|'animated_apng';

export interface User { id:string; email:string; displayName:string; role:UserRole; avatarUrl?:string; createdAt:string; }
export interface Session { id:string; userId:string; tokenHash:string; expiresAt:string; createdAt:string; }
export interface CreditWallet { id:string; userId:string; freeCredits:number; paidCredits:number; updatedAt:string; }
export interface CreditLedger { id:string; userId:string; type:'grant'|'debit'|'refund'|'purchase'; amount:number; reason:string; jobId?:string; createdAt:string; }
export interface TemplateCategory { id:string; slug:string; name:string; sortOrder:number; }
export interface StickerTemplate { id:string; categoryId:string; name:string; description:string; thumbnailUrl:string; prompt:string; tags:string[]; defaultCount:4|8|16; supportsAnimated:boolean; isPremium:boolean; status:'active'|'disabled'; }
export interface PromptPreset { id:string; templateId:string; label:string; prompt:string; maxChars:number; tags:string[]; }
export interface SourceAsset { id:string; userId:string; kind:'portrait'|'pet'|'character'|'brand_mascot'; fileUrl:string; width:number; height:number; mimeType:string; fileSize:number; consent:boolean; qualityScore:number; createdAt:string; deletedAt?:string; }
export interface CropState { id:string; assetId:string; x:number; y:number; width:number; height:number; rotate:number; bgRemoved:boolean; maskUrl?:string; }
export interface StickerProject { id:string; userId:string; title:string; templateId:string; sourceAssetId:string; status:'draft'|'in_progress'|'completed'|'exported'; count:4|8|16; createdAt:string; updatedAt:string; }
export interface GenerateSettings { id:string; projectId:string; removeBackground:boolean; addText:boolean; whiteStroke:boolean; styleStrength:number; language:'zh-TW'|'ja'|'en'; outputKind:StickerKind; }
export interface GenerationJob { id:string; projectId:string; userId:string; templateId:string; prompt:string; status:JobStatus; progress:number; errorCode?:string; errorMessage?:string; provider:'mock'|'openai'|'fal'|'custom'; createdAt:string; completedAt?:string; }
export interface StickerResult { id:string; jobId:string; projectId:string; index:number; text:string; imageUrl:string; width:number; height:number; fileSize:number; kind:StickerKind; status:'pending'|'success'|'failed'; }
export interface MotionTemplate { id:string; name:string; action:'blink'|'nod'|'shake'|'bounce'|'wave'|'heart'|'sweat'; frameCount:number; playbackSec:1|2|3|4; loopCount:1|2|3|4; riskLevel:'low'|'medium'|'high'; }
export interface LineQcRule { id:string; key:string; label:string; severity:'P0'|'P1'|'P2'; staticLimit?:unknown; animatedLimit?:unknown; }
export interface QcReport { id:string; projectId:string; jobId:string; passed:boolean; failures:QcFailure[]; createdAt:string; }
export interface QcFailure { ruleKey:string; severity:'P0'|'P1'|'P2'; message:string; targetFile?:string; }
export interface ExportPackage { id:string; projectId:string; type:'png_single'|'zip_all'|'line_static_zip'|'line_animated_zip'; status:'pending'|'ready'|'failed'; fileUrl?:string; manifestUrl?:string; qcReportId:string; createdAt:string; }
export interface PwaInstallEvent { id:string; userId?:string; platform:'ios'|'android'|'desktop'; event:'prompt_shown'|'installed'|'dismissed'; createdAt:string; }
export interface AuditLog { id:string; actorId?:string; action:string; entityType:string; entityId:string; payload:Record<string,unknown>; createdAt:string; }
```

## 10. API 規格（18+，含 JSON 範例）

所有 API 回應錯誤格式：`{"error":{"code":"STRING","message":"STRING","details":{}}}`。

| # | Method | Endpoint | 用途 |
|---|---|---|---|
|1|POST|`/api/auth/login`|demo login|
|2|GET|`/api/templates`|模板列表/search/filter|
|3|GET|`/api/templates/:id`|模板詳情|
|4|POST|`/api/assets/upload`|上傳照片|
|5|POST|`/api/assets/:id/crop`|裁切/旋轉|
|6|POST|`/api/assets/:id/remove-bg`|去背 mock/provider|
|7|POST|`/api/projects`|建立作品草稿|
|8|GET|`/api/projects`|作品列表|
|9|GET|`/api/projects/:id`|作品詳情|
|10|PATCH|`/api/projects/:id/settings`|更新生成設定|
|11|POST|`/api/generation/jobs`|建立生成任務|
|12|GET|`/api/generation/jobs/:id`|查任務狀態|
|13|POST|`/api/stickers/:id/regenerate`|重生單張|
|14|POST|`/api/projects/:id/qc`|LINE QC|
|15|POST|`/api/projects/:id/export`|建立匯出|
|16|GET|`/api/exports/:id/download`|下載|
|17|GET|`/api/credits/balance`|額度|
|18|POST|`/api/pwa/install-event`|PWA 事件|
|19|GET|`/api/health`|健康檢查|

範例：建立生成任務
```json
POST /api/generation/jobs
{
  "projectId":"proj_demo_001",
  "templateId":"tpl_kawaii_avatar",
  "sourceAssetId":"asset_user_photo_001",
  "count":8,
  "prompt":"Q版可愛，圓潤線條，透明背景，LINE貼圖風格",
  "settings":{"removeBackground":true,"addText":true,"whiteStroke":true,"outputKind":"static_png"}
}
```
回應：
```json
{"jobId":"job_001","status":"queued","progress":0,"estimatedSeconds":20,"creditCost":1}
```

範例：LINE QC
```json
POST /api/projects/proj_demo_001/qc
{"exportType":"line_static_zip","strict":true}
```
回應：
```json
{"passed":true,"reportId":"qc_001","failures":[],"warnings":[{"ruleKey":"REVIEW_NOT_GUARANTEED","message":"本工具不保證LINE審核通過"}]}
```

## 11. Mock Service / Fallback 規格

- `MOCK_AI=true` 時，不呼叫外部 AI，使用 `seed/sticker-results/*.png` 與 deterministic prompt hash 產出固定 4/8/16 張結果。
- 去背 API 回傳 seed mask 或透明 PNG。
- 動態 APNG mock 回傳 metadata 與可預覽 GIF/APNG placeholder，但仍檢查 frame/playback/loop/fileSize。
- Mock 不得只顯示空卡；必須可完成 create → preview → qc → export 全流程。

## 12. Seed Data 規格

至少建立：
- 8 個 template categories：Q版人像、情緒表情包、戀愛語錄、毛孩貼圖、上班日常、節慶、品牌吉祥物、動態反應。
- 24 個 sticker templates，其中免費 12、premium 12。
- 6 個 prompt presets。
- 6 個 demo source assets（人像/寵物/角色）。
- 4 個 demo projects：draft、generating、completed、qc_failed。
- 32 張 mock sticker results。
- 12 條 LINE QC rules。
- 2 個 demo users + 1 admin。

## 13. PWA 技術限制

- Next.js 15 + TypeScript；可用 Prisma/SQLite mock 或同等本地 DB。
- 必須支援 HTTPS production；local dev 可 HTTP。
- 前端不得暴露 provider API key。
- Service Worker 不永久快取原始人像；IndexedDB 僅在使用者同意/草稿模式保存。
- 手機首屏 LCP 需控制：模板圖 lazy load、預覽 skeleton、圖片壓縮。

## 14. LINE 規格限制

靜態貼圖：透明 PNG、主圖與 tab 圖、命名/排序、ZIP 產出。實作需在 `/help/line-spec` 顯示目前內建規則來源與「仍需使用者自行送 LINE 審核」。

動態貼圖：APNG、5–20 frames、播放 1/2/3/4 秒、loop 1–4、總播放 ≤4 秒、單張 ≤1MB、寬高偶數、第一幀可用。高風險效果（火焰、煙霧、爆炸、大面積粒子、影片背景）不得作為模板預設。

## 15. Analytics 埋點

- `pwa_install_prompt_shown`, `pwa_installed`, `template_selected`, `photo_uploaded`, `crop_saved`, `prompt_edited`, `generate_clicked`, `generation_completed`, `generation_failed`, `qc_failed`, `export_downloaded`, `work_deleted`。

## 16. 錯誤處理

- `PHOTO_TOO_LARGE`、`UNSUPPORTED_FORMAT`、`FACE_NOT_FOUND`、`LOW_QUALITY_IMAGE`、`PROMPT_TOO_LONG`、`INSUFFICIENT_CREDITS`、`GENERATION_TIMEOUT`、`QC_P0_FAILED`、`OFFLINE_MODE`、`EXPORT_FAILED`。
- 每個錯誤都必須有手機 toast + inline explanation + 下一步 CTA。

## 17. 測試要求

Unit ≥ 12：template filter、prompt length、credit cost、LINE qc static、LINE qc animated、zip naming、safe-area class、upload validation、mock provider、job state reducer、privacy retention、analytics payload。

API ≥ 12：templates、upload、crop、remove-bg、create project、update settings、create job、poll job、regenerate、qc、export、download、credits、health。

E2E ≥ 5：
1. 首頁快速生成 8 張 → QC → LINE ZIP。
2. 模板搜尋/篩選 → 套用 → 回 create。
3. 上傳錯誤照片 → 顯示錯誤 → 替換成功。
4. 離線開啟 app shell + 查看作品草稿。
5. 額度不足 → 購買/補點 mock → 生成成功。

## 18. Phase 拆分、完成定義與 QC 驗收標準

| Phase | 內容 | 完成定義 | QC 驗收標準 |
|---|---|---|---|
|1|PWA App Shell + UI theme|manifest/sw/icons/safe-area/bottom nav 完成|手機 390px 首頁像 App，不是 dashboard|
|2|模板庫與首頁工作台|`/`, `/templates`, `/templates/[id]` 可操作|可搜尋、選模板、帶 prompt|
|3|上傳/裁切/去背|upload/crop/remove-bg mock API 完成|格式/大小/錯誤狀態完整|
|4|生成任務與預覽|job state、mock results、preview grid|可生成 4/8/16 張且有 loading/fail/success|
|5|單張編輯與作品|works、detail、regenerate/delete|作品歷史可管理|
|6|LINE QC + export|QC rules、ZIP manifest/download|P0 fail 禁止 export，pass 可下載|
|7|額度/隱私/PWA install|credits/settings/privacy/install|扣點/隱私/PWA 事件可驗收|
|8|測試/README/Windows 包|tests/build/README/seed/D槽包|所有 gate 通過才可 build.ready|

## 19. QC 驗收標準

Hard Fail：
- `/` 若仍是 dashboard、工程入口或空導覽，直接 REJECT。
- 沒有三張參考圖要求的手機 PWA 風格與底部導航，REJECT。
- 沒有 create → preview → export 閉環，REJECT。
- Mock AI 無法完成 QC/ZIP，REJECT。
- 承諾 LINE 必過審或影片級動畫，REJECT。
- Windows final-review package 缺失，REJECT。

通過條件：build/test pass、18 routes 可訪問、19 API 可驗證、seed data 可示範、PWA manifest/sw 可檢查、README 含完整操作腳本、D 槽成品包可由 Simon 實測。

## 20. README 必須包含

- 安裝、環境變數、mock AI 模式、seed、dev/build/test。
- Demo 帳號。
- 手機 PWA 驗收方式。
- 5 條 E2E 操作腳本。
- LINE 規格限制與不保證審核通過聲明。
- Windows final-review package 路徑要求：`/mnt/d/WORK/成品區/待最終審核/sebastian/20260428_line_animated_sticker_autogen` 或本 replan 對應路徑。

## 21. 驗收操作腳本

1. **PWA 首頁**：開 `/` → 檢查 PWA badge、三步驟、熱門模板、素材套用、提示詞、預覽、底部導航。
2. **快速生成**：選 Q版人像 → 上傳 demo photo → 裁切/去背 → 生成 8 張 → 預覽成功。
3. **LINE 匯出**：進 `/export` → 執行 QC → 下載 LINE ZIP → 檢查 manifest/main/tab/01..08/qc_report。
4. **錯誤路徑**：上傳超大/錯格式 → 錯誤提示；未上傳照片 CTA disabled；QC fail 禁止 ZIP。
5. **PWA/離線**：檢查 manifest、service worker、install prompt；離線可開 shell/作品草稿。

## 22. 給 OP / Sebastian 的最終指令

請不要延續舊 dashboard 首頁。以本 replan package 的 `PRODUCT_SPEC.md`、`UI_PWA_SPEC.md`、`PAGE_FLOW.md`、`OP_HANDOFF.md` 為 UI/PWA 權威，將既有 AUTO動態貼圖產品重構為手機優先 PWA。施工可分 Phase，但成品必須一次性完整交付；不得只做首頁 mock 或空頁。完成後需 build/test/API/E2E/D槽 package 證據齊全，才能送 Simon。

## 23. 商業化與延展

- 免費：每日 1 次生成 4 張，有浮水印或低解析。
- 付費點數：8/16 張、LINE ZIP、高解析、去浮水印。
- 訂閱：模板庫、商用授權、品牌角色保存、批次生成。
- 不在本版做 marketplace；模板由內建/admin seed 管理。

## 24. 風險

- 人像/肖像/IP 授權：上傳前必須同意權利聲明。
- LINE 規格變動：規則需集中在 QC rules，可更新。
- AI 生成不穩：mock fallback 與重生單張降低風險。
- PWA iOS 限制：需提供安裝教學，不依賴不可用 API。

## 25. 最終結論

本案可以交 OP 開發，但重點不是再做一個後台，而是把 AUTO動態貼圖改為「手機 App 感、PWA 可安裝、照片套模板、一鍵 LINE 規格匯出」的完整產品。UI 必須直接吸收三張參考圖的元件與體驗，同時保留 LINE 規格 QC/export 的硬能力。

## 26. 自檢收斂

- [x] 產品名稱、使用者、痛點、功能範圍已定義。
- [x] 頁面 ≥16、API ≥14、資料模型 ≥18。
- [x] PWA/UI/LINE/QC/Mock/Seed/Test/Phase 已定義。
- [x] 每個 Phase 有完成定義與 QC 驗收標準。
- [x] 禁止事項與 Hard Fail 已寫明。
- [x] 可交 Sebastian 執行；未宣稱 OP/QC 已完成。
