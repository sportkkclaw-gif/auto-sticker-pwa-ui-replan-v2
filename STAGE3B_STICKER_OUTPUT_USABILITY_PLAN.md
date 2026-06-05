# STAGE3B_STICKER_OUTPUT_USABILITY_PLAN

## Purpose

Owner manual review found that Stage 3A proved the OpenAI provider technical chain, but the product output is not yet acceptable as a direct-to-user LINE sticker product. This plan defines the Stage 3B correction scope before Simon product QC.

## Current status correction

- Stage 3A provider technical success: **PASS**
- Stage 3A product usability: **NOT ACCEPTED YET**
- Stage 3B required before Simon product QC: **YES**
- Do not send Simon yet: **YES**
- Do not merge current PR as product accepted: **YES**
- Do not production deploy: **YES**
- Do not run new OpenAI generation for this planning step: **YES**

---

## 一、產品方向修正

### Required product direction

Replace the current product assumption:

> One large image contains multiple sticker cells.

with the Stage 3B product rule:

> **一張圖 = 一張貼圖成品。**

If the user chooses 8 / 16 / 24 stickers, the system must produce exactly 8 / 16 / 24 independent PNG files.

### Per-sticker PNG requirements

Each generated PNG must be directly usable as one LINE sticker asset:

- Transparent background.
- Main subject centered.
- Main subject complete.
- Subject does not touch image edges.
- No overlap with other sticker subjects.
- Safe margin on all sides.
- Dimensions conform to LINE sticker export requirements.
- Downloadable as an individual PNG and inside ZIP.
- No user-side background removal required.
- No user-side slicing required.
- No user-side post-production required.

### Output model

For a target count of `N` stickers:

- Create `N` provider generation tasks or `N` independent image outputs.
- Persist each sticker as a separate `generated_image` record.
- Assign each generated image a stable sticker index: `01.png`, `02.png`, ... `N.png`.
- ZIP must contain one file per sticker, not a sheet that requires slicing.
- Manifest must record each sticker independently.

---

## 二、兩段式流程設計

The Stage 3B user-facing flow must become a controlled generation + human review pipeline.

### Step 1：OpenAI 產生獨立貼圖圖檔

- User selects sticker count: 8 / 16 / 24.
- User provides prompt, uploaded image, or template selection.
- System sends generation requests that explicitly ask for one independent sticker per PNG.
- The prompt must forbid multi-panel sheets, multiple sticker cells in one output, contact with image boundaries, and non-transparent backgrounds.
- Each output is saved as one sticker candidate.
- System records provider metadata, dimensions, alpha-channel check, hash, and generation status per sticker.

### Step 2：使用者逐張放大檢查

- After generation, route user to sticker review page.
- The page shows all sticker candidates as cards.
- Each card can be opened in a large modal or inspection view.
- User can inspect against checkerboard, dark, and white backgrounds.
- The UI must make white subject on transparent/white background issues visible.

### Step 3：使用者確認每張通過 / 單張重生 / 刪除

Each sticker card has one of these states:

- `pending_review`
- `approved`
- `needs_regeneration`
- `deleted`
- `regenerating`
- `failed`

Allowed actions:

- Approve a single sticker.
- Request single-sticker regeneration.
- Delete a single sticker.
- Restore or replace a deleted sticker before export.

The system must not require regenerating the whole set when only one image fails.

### Step 4：全部通過後產生 LINE ZIP

- ZIP export is disabled until all required sticker slots are approved.
- Export validates every sticker again before packaging.
- ZIP contains one PNG file per sticker plus manifest/evidence files.
- If any image fails size, transparency, safety margin, or hash checks, export is blocked.

### Step 5：下載 ZIP

- User downloads ZIP from the work detail/export page.
- ZIP is the final user-facing deliverable.
- ZIP must not contain a large multi-cell sheet as the primary sticker output.

---

## 三、Review UI 必修

The Stage 3B sticker review page must support product-level visual inspection, not only evidence preview.

### Sticker grid

- Shows 8 / 16 / 24 independent sticker cards.
- Each card represents exactly one PNG file.
- Card displays sticker index, status, dimensions, and validation badges.

### Per-card inspection

Each sticker card must provide:

- Click-to-enlarge modal.
- Zoom controls or at least large native-resolution view.
- Checkerboard transparent background mode.
- Dark background mode.
- White background mode.
- Actual pixel dimensions.
- Alpha-channel / transparent background status.
- Safety margin status.
- LINE dimension compliance status.
- Hash or asset id for traceability.

### Required controls

- Approve single sticker.
- Mark as needs regeneration.
- Regenerate single sticker.
- Delete single sticker.
- View provider metadata for that sticker.
- Export ZIP button disabled until all required stickers are approved.

### Review page acceptance behavior

- The owner must be able to detect white-on-white issues.
- The owner must be able to enlarge every image before approval.
- The UI must clearly show whether an image is transparent or just white-background.
- The UI must prevent accidental ZIP export when any sticker is unreviewed or failed.

---

## 四、去背與透明背景策略

### A. 直接要求 OpenAI 輸出 transparent background PNG

#### 技術可行性

- Feasible if the chosen OpenAI Images model/API supports transparent background output for the requested format.
- Requires strict prompt constraints and output validation.
- Must verify actual alpha channel in returned PNG bytes; prompt intent is not enough.

#### 成本

- Lowest pipeline complexity.
- No extra background-removal service cost.
- Possible extra regeneration cost if the model returns white or opaque backgrounds.

#### 失敗風險

- Model may ignore transparent background instruction.
- White subject on transparent or white background can be hard to inspect without UI background toggles.
- Some outputs may contain multiple subjects or implicit panels despite prompt constraints.

#### QC 驗收方式

- Validate PNG has alpha channel.
- Sample edge pixels and background transparency ratio.
- Review against checkerboard, dark, and white backgrounds.
- Confirm one sticker subject per file.
- Confirm no subject touches safe-margin boundary.

#### 是否適合 Stage 3B

- Suitable as the first implementation path only if paired with strict validation and per-image regeneration.
- Not sufficient by itself unless alpha and layout checks are enforced.

### B. OpenAI 生圖後，再走 remove background pipeline

#### 技術可行性

- Feasible with a deterministic post-processing step using background-removal model/service.
- Can accept OpenAI outputs with non-transparent backgrounds and normalize to transparent PNG.
- Requires integration of a reliable remove-background component and artifact provenance tracking.

#### 成本

- Higher than option A due to extra model/service call or compute.
- Additional latency per sticker.
- More storage and evidence artifacts: original provider image + processed transparent PNG.

#### 失敗風險

- Background removal may cut off hair, hands, props, text, or fine edges.
- White or low-contrast subjects may be removed incorrectly.
- Semi-transparent edges may create halos.
- Needs fallback/regeneration path when segmentation confidence is low.

#### QC 驗收方式

- Store and compare both original and processed PNG.
- Validate alpha channel in processed PNG.
- Compute bounding box and edge-margin checks after background removal.
- Human review against checkerboard/dark/white backgrounds.
- Mark low-confidence segmentation as `needs_regeneration`.

#### 是否適合 Stage 3B

- Suitable as the robust Stage 3B fallback or default if OpenAI transparent output is unreliable.
- Recommended if owner requires high confidence that users never do manual background removal.

### C. 先用純色背景生成，再做自動去背與透明化

#### 技術可行性

- Feasible by forcing a controlled high-contrast background during generation, then removing that background.
- Easier to segment than arbitrary backgrounds if the prompt enforces a uniform color not used by the subject.
- Requires prompt rules to avoid subject colors matching the background.

#### 成本

- Similar or slightly higher than B.
- May reduce regeneration cost if segmentation becomes more reliable.
- Still requires post-processing and validation.

#### 失敗風險

- Subject may contain the chosen background color, causing holes or accidental removal.
- Model may add shadows, gradients, or background artifacts that complicate removal.
- Generated image may look less natural before processing.

#### QC 驗收方式

- Validate original background color uniformity.
- Validate processed PNG alpha channel.
- Compare subject completeness before/after removal.
- Inspect for edge halos and missing parts.
- Mark failures as `needs_regeneration`.

#### 是否適合 Stage 3B

- Suitable as a controlled fallback strategy when direct transparent PNG is inconsistent.
- Best used with a fixed set of allowed background colors and automatic contrast checks.

### Recommended Stage 3B strategy

- Primary: A, direct transparent PNG, but only accepted after alpha/safety validation.
- Fallback: B, remove background pipeline when direct transparent output fails.
- Optional controlled mode: C, if B needs more reliable segmentation input.
- Regardless of strategy, user-facing output must always be independent transparent PNG files.

---

## 五、安全邊距 / 不重疊規則

### Safety region definition

Each sticker PNG must define:

- Full canvas: LINE-compatible PNG dimensions.
- Safe region: central area excluding fixed margin on all sides.
- Recommended initial Stage 3B margin: at least 10% of width and 10% of height on every side.

### Required rules

- Main subject must not exceed the safe region.
- Subject bounding box must leave the configured margin on all four edges.
- Subject must be complete: no cropped head, hands, props, text, or outline.
- One PNG must not contain multiple sticker cells or a grid.
- One PNG must not contain multiple disconnected sticker compositions unless the user explicitly requested a single multi-character sticker and it remains one coherent subject.
- No overlap between multiple sticker subjects because there must be only one final sticker composition per PNG.

### Detection and status

For every generated image, compute or record:

- `has_alpha_channel`
- `transparent_background_detected`
- `subject_bbox`
- `safe_margin_percent_top`
- `safe_margin_percent_right`
- `safe_margin_percent_bottom`
- `safe_margin_percent_left`
- `line_dimensions_ok`
- `potential_multi_panel_detected`
- `potential_crop_detected`
- `review_status`

If validation cannot confidently pass, set:

- `review_status = needs_regeneration`
- `export_blocked_reason = validation_failed_or_uncertain`

### Export blocker

ZIP export must be blocked if any sticker is:

- missing,
- opaque-background,
- unsafe-margin,
- wrong dimension,
- suspected multi-panel,
- suspected cropped,
- unreviewed,
- marked `needs_regeneration`,
- marked `failed`.

---

## 六、APP 實際操作要求

Owner must operate the full app, not only a static review artifact.

### Required test access

Stage 3B owner review must provide:

- Publicly reachable test APP URL.
- Fixed local fallback port and launch command.
- Test account or demo mode.
- Mobile and desktop access.
- No production deployment requirement.
- No live payment requirement.
- No formal DB requirement.

### Required app pages / flows

Owner must be able to access and operate:

1. **Create page**
   - Choose sticker count: 8 / 16 / 24.
   - Choose upload / template / prompt flow.
   - Start generation.

2. **Upload / template / generate flow**
   - Upload source image or choose template.
   - Enter or confirm prompt.
   - Trigger generation in demo/provider-enabled environment.
   - See generation progress.

3. **Work detail page**
   - View work id and generation job id.
   - View generation status.
   - Open sticker review page.
   - Open ZIP download page after approval.

4. **Sticker review page**
   - Inspect 8 / 16 / 24 independent PNG cards.
   - Enlarge each sticker.
   - Toggle checkerboard/dark/white backgrounds.
   - Approve, regenerate, or delete each sticker.

5. **ZIP download page**
   - Export only after all required stickers pass.
   - Download ZIP.
   - View manifest and provider evidence.

### Demo mode requirement

If provider-enabled public preview is not allowed, provide demo mode that:

- Uses pre-generated Stage 3B-compliant independent PNG assets.
- Preserves the real app create/review/download flow.
- Clearly labels demo assets vs live provider output.
- Does not claim demo assets as new provider output.

---

## 七、Stage 3B 驗收標準

Stage 3B can pass owner review only when all of the following are true:

- Owner can open a test APP URL from mobile and desktop.
- Owner can create a sticker task from the APP.
- Owner can use create page, upload/template/generate flow, work detail page, sticker review page, and ZIP download page.
- OpenAI/provider path produces one independent PNG per sticker slot.
- For 8 / 16 / 24 selections, system produces 8 / 16 / 24 independent PNG files.
- Each sticker can be enlarged for manual inspection.
- Transparency can be checked with checkerboard, dark, and white backgrounds.
- Output is not a single image containing 9 cells or a multi-panel sheet.
- Each image has no overlap, no edge contact, no cropped subject, and no unsafe margin.
- ZIP contains one PNG per sticker.
- ZIP does not require user slicing.
- ZIP does not require user background removal.
- Manifest records per-image dimensions, hash, transparency status, alpha status, safe-margin status, review status, and provider metadata.
- Provider evidence records per-image provider request/provenance when available.
- Export is blocked until all required sticker cards are approved.
- Owner can download ZIP and inspect manifest/provider evidence from the APP.

---

## 八、目前 Stage 3A 狀態修正

- Stage 3A provider technical success: **PASS**
- Stage 3A product usability: **NOT ACCEPTED YET**
- Stage 3B required before Simon product QC: **YES**
- Do not send Simon yet: **YES**
- Do not claim Stage 3A product accepted: **YES**
- Do not merge PR as product accepted: **YES**
- Do not production deploy: **YES**

## Stage 3B implementation boundary

This document is a planning artifact only. It does not implement the new generation pipeline, UI, API, ZIP exporter, validation engine, or provider calls. No new OpenAI generation should be run as part of this plan creation.
