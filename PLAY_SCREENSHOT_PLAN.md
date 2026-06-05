# Google Play Screenshot And Feature Graphic Plan

Last updated: 2026-06-05

## Status

Not complete. The production web app is live, but screenshot automation is not available in this workspace because Playwright is not installed.

## Required Output Folder

- `play-assets/feature-graphic.png`
- `play-assets/phone-screenshots/01-home.png`
- `play-assets/phone-screenshots/02-create.png`
- `play-assets/phone-screenshots/03-templates.png`
- `play-assets/phone-screenshots/04-works.png`

## Target Screens

1. Home: `https://sticker.su-sui.com/`
2. Create flow: `https://sticker.su-sui.com/create`
3. Templates: `https://sticker.su-sui.com/templates`
4. Works: `https://sticker.su-sui.com/works`

## Suggested Phone Screenshot Size

- 1080 x 1920 PNG.
- Portrait.
- Avoid browser chrome; capture the app viewport only.
- Use Traditional Chinese UI as currently deployed.

## Feature Graphic Requirement

- 1024 x 500 PNG.
- Must not imply affiliation with LINE, Google, or OpenAI.
- Suggested text: `AUTO 動態貼圖`
- Suggested supporting copy: `把素材變成可上傳 LINE 的貼圖 ZIP`
- Use app UI/sticker preview visuals rather than abstract decoration.

## Verification

Run:

```bash
node scripts/play-assets-doctor.mjs
```

The doctor only checks file presence and count. Final visual quality still requires manual review before Play submission.
