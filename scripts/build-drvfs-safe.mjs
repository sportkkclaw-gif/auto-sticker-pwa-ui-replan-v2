import { spawnSync } from 'node:child_process';
import { existsSync, rmSync, symlinkSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const cwd = process.cwd();
const isDPackage = cwd.startsWith('/mnt/d/WORK/成品區/待最終審核/');
const run = (cmd, args, opts = {}) => {
  const res = spawnSync(cmd, args, { stdio: 'inherit', shell: false, ...opts });
  if (res.status !== 0) process.exit(res.status || 1);
};

if (!isDPackage || process.env.FORCE_NEXT_BUILD === '1') {
  run('node', ['node_modules/next/dist/bin/next', 'build']);
} else {
  const task = cwd.split('/').filter(Boolean).pop();
  const canonical = process.env.CANONICAL_SOURCE_PATH || '/home/sport/WORK/AGENTS/02_開發中/sebastian/20260502_auto_sticker_pwa_ui_replan_v2_stage2_owner_approved';
  const linuxNodeModules = existsSync(`${canonical}/node_modules/next/dist/bin/next`) ? `${canonical}/node_modules` : `${cwd}/node_modules`;
  const mirror = `/tmp/${task}-d-build-mirror`;
  console.log(`[D build wrapper] exact D cwd: ${cwd}`);
  console.log(`[D build wrapper] using Linux node_modules: ${linuxNodeModules}`);
  console.log(`[D build wrapper] temp mirror: ${mirror}`);
  rmSync(mirror, { recursive: true, force: true });
  mkdirSync(mirror, { recursive: true });
  run('rsync', ['-a', '--delete', '--exclude', 'node_modules', '--exclude', '.next/cache', `${cwd}/`, `${mirror}/`]);
  try { rmSync(`${mirror}/node_modules`, { recursive: true, force: true }); } catch {}
  symlinkSync(linuxNodeModules, `${mirror}/node_modules`, 'dir');
  run('node', ['node_modules/next/dist/bin/next', 'build'], { cwd: mirror, env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' } });
  run('rsync', ['-a', '--delete', `${mirror}/.next/`, `${cwd}/.next/`]);
  console.log(`[D build wrapper] copied built .next back to exact D package`);
}
