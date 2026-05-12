# PAYMENT_FLOW — Mock 點數購買流程

updated_at: 2026-05-12T21:46:16+08:00

## 本階段策略
不串真金流，先完成可驗收商業閉環。

## Flow
1. 新使用者 localStorage 初始化：free_credits=2, bonus_credits=0, paid_credits=0。
2. `/create` 選 8/16/24 張時以 1 張 = 1 點計算。
3. 若點數不足，顯示「點數不足，請先購買額度後再建立作品。」並導向 `/billing`。
4. `/billing` 建立 mock payment。
5. 測試按鈕「付款完成」後增加 paid_credits，寫入 transactions。
6. 點數足夠後建立作品，扣點順序：免費點數 → 贈送點數 → 付費點數。
7. consume / purchase / grant_free / refund 等交易在交易紀錄顯示。

## Packages
- 體驗包 NT$99 / 30 點
- 標準包 NT$199 / 80 點 / 推薦
- 創作者包 NT$499 / 250 點
- 商用包 NT$999 / 600 點


## Cloud deployment
- URL: https://auto-sticker-pwa-ui-replan-git-0aa19d-sportkk101-5719s-projects.vercel.app
- Git branch: acceptance (latest pushed commit)
- Vercel status: success via GitHub Vercel check at 2026-05-12T21:53:57+08:00
- Cloud route probe PASS: /, /create, /templates, /templates/tpl_001, /works, /account, /billing, /install, /line-guide, /privacy, /terms, /api/credits/balance, /api/works/demo/download.
