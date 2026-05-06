# UI_PWA_SPEC.md — AUTO動態貼圖手機 PWA UI 規格

updated_at: 2026-05-02T23:57:22+08:00

## 1. UI 方向總結

本 UI 必須融合三張參考圖：
- 粉彩可愛：貼圖工坊、糖果色、可愛插圖、底部固定雙 CTA。
- 藍紫 AI：AI 貼圖工作室、PWA badge、搜尋篩選、熱門模板、提示詞模板、底部 Tab。
- 清新綠白：3-step stepper、可編輯 prompt、裁切/去背、下載 PNG / LINE 規格包。

## 2. Design Tokens

```ts
export const theme = {
  colors: {
    bgCream:'#FFF7E8', bgMint:'#F4FFF9', card:'#FFFFFF', text:'#23313A', muted:'#7A8793',
    pink:'#FF6B8A', blue:'#567CFF', purple:'#7B61FF', green:'#18B87A', yellow:'#FFD35A', danger:'#EF4444'
  },
  radius: { card:'24px', button:'18px', pill:'999px' },
  shadow: { soft:'0 10px 30px rgba(34,49,58,.10)' },
  maxMobileWidth:'480px', touchTarget:'44px'
}
```

## 3. App Shell

- `body` 背景：淡奶油到淡綠漸層。
- `.app-shell`：`max-width:480px; min-height:100dvh; margin:auto; padding-bottom:calc(76px + env(safe-area-inset-bottom));`。
- Safe area：top/bottom 都必須使用 `env(safe-area-inset-*)`。
- Bottom Nav：固定，4 tabs：首頁、模板、作品、我的。
- Desktop：保持手機容器置中，不改成大型 dashboard。

## 4. 首頁 `/` 元件順序

1. Hero：標題「AI 貼圖工作室」或「我的貼圖工坊」，PWA badge，副標「上傳照片 × 模板提示，一鍵生成專屬 LINE 貼圖」。
2. 搜尋/篩選列：搜尋模板 placeholder「可愛、日常、情侶、毛孩」。
3. Step Guide：選模板 → 上傳照片 → 生成貼圖。
4. 熱門模板 carousel：Q版人像、情緒表情包、戀愛語錄、毛孩貼圖。
5. 素材套用卡：上傳/替換照片、品質提示、隱私提示。
6. 提示詞模板卡：可編輯、200 字上限、tags：角色一致、白底透明、貼圖風格。
7. 即時預覽：4 張示意/生成後結果；「查看更多」。
8. 主 CTA：`生成 8 張貼圖`；未滿條件 disabled。
9. 合規提示：AI 內容僅供使用者負責，請遵守 LINE 規範。

## 5. 主要元件狀態

### TemplateCard
- default：白底淡灰線。
- selected：主色 border + check badge。
- loading：skeleton。
- premium：鎖頭/點數 badge。

### UploadCard
- empty：虛線框 + upload icon + 格式說明。
- dragOver：藍/綠背景。
- uploaded：縮圖 + check + 替換照片 + 裁切/去背。
- error：紅色 inline message。
- privacy：照片僅用於生成，不公開。

### PromptEditor
- 預設折疊摘要，點「編輯提示詞」展開。
- 200 字上限；超過 disabled generate。
- `恢復預設`、tag chips。

### PreviewGrid
- empty：示意空狀態。
- sample：標「示意」。
- generating：4/8/16 skeleton + progress。
- completed：實際結果、單張下載/重生。
- failed：單張重試。

### CTA
- primary：漸層大按鈕，文案含張數。
- disabled reasons：請先選模板 / 請先上傳照片 / 額度不足 / prompt 過長。
- loading：生成中，顯示 progress。

## 6. PWA 必備

- `manifest.webmanifest`：`display: standalone`, `orientation: portrait`, `theme_color` 依主題。
- Icons：192, 512, maskable。
- Service worker：cache app shell、icons、模板 seed；API network-first。
- Offline：可開首頁 shell、模板快取、作品草稿；生成 API 顯示離線排隊或不可用提示。
- Install prompt：`/me` 與 Hero 可顯示；iOS 顯示 Safari 教學。

## 7. Accessibility

- 所有 icon button 有 aria-label。
- 模板選取不可只靠顏色，需 check icon + `aria-pressed`。
- 圖片預覽 alt 要含模板/貼圖文字。
- 錯誤必須 inline 文字化。
- 色彩對比 AA。
