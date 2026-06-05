# RC.md — returned_for_fix / D public gate blocked

updated_at: 2026-05-13T20:52:04+08:00
status: returned_for_fix
next_event: null
remaining_p0_count: 1
ready_for_build_ready: false

## Current decision
Not ready for build.ready; delivery_id not generated.

## Evidence
- SUPAGENT verification failed with stale cwd FileNotFoundError: /home/sport/WORK/AGENTS/01_選題池/sebastian/20260502_auto_sticker_pwa_ui_replan_v2
- Controller fallback used exact D path: `/mnt/d/WORK/成品區/待最終審核/sebastian/20260502_auto_sticker_pwa_ui_replan_v2`.
- D required files/bins exist, but `NEXT_TELEMETRY_DISABLED=1 node --run build` did not clean-exit: killed after >270s/no output; 30s subprocess retry TIMEOUT.

## Next action
Fresh session must repair/validate exact D dependencies or build runtime, then rerun exact D build → test → acceptance with clean exit 0.


## D package stale rejection fixed — 2026-05-13T21:14:40+08:00
- Refreshed exact D package from source, excluding node_modules first, then repaired D node_modules by syncing source node_modules so required bins/files exist.
- Added public D-safe build/start wrappers: `scripts/build-drvfs-safe.mjs`, `scripts/start-drvfs-safe.mjs`.
- Exact D required files all present, including `lib/mock-store.ts`, billing mock-payment routes, works routes/download, updated `acceptance-live.mjs`, and dual-status `TEST_RESULT.md`.
- Exact D public gates PASS:
  - `NEXT_TELEMETRY_DISABLED=1 node --run build`: PASS.
  - `node --run test`: PASS, `SUMMARY unit=15 api=26 e2e=18`.
  - `node --run acceptance:live`: PASS, `initial=2 afterPayment=602 afterCreate=594 afterConsume=586`.
- Commercial MVP Stage 1 remains not approved; Stage 2 remains disallowed.
- No build.ready/delivery_id claimed this round.
