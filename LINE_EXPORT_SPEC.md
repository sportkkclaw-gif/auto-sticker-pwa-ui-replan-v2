# LINE_EXPORT_SPEC — AUTO 動態貼圖 ZIP 匯出

updated_at: 2026-05-12T21:46:16+08:00

## Endpoint
`GET /api/works/[id]/download`

## ZIP entries
```txt
images/
  01.png
  02.png
  03.png
  04.png
  05.png
  06.png
  07.png
  08.png
README.txt
line_sticker_info.json
```

## README.txt disclaimer
包含：
1. 本工具不保證 LINE 一定審核通過。
2. 使用者需確認圖片人物、肖像權、著作權與商業使用權。
3. 若圖片包含真人，請取得當事人同意。

## Validation
Commercial ZIP probe confirmed `Content-Type: application/zip`, magic bytes `PK`, and required entries present.


## Cloud deployment
- URL: https://auto-sticker-pwa-ui-replan-git-0aa19d-sportkk101-5719s-projects.vercel.app
- Git branch: acceptance (latest pushed commit)
- Vercel status: success via GitHub Vercel check at 2026-05-12T21:53:57+08:00
- Cloud route probe PASS: /, /create, /templates, /templates/tpl_001, /works, /account, /billing, /install, /line-guide, /privacy, /terms, /api/credits/balance, /api/works/demo/download.
