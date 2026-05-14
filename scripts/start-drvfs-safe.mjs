import { spawn, spawnSync } from 'node:child_process';
import { existsSync, rmSync, symlinkSync, mkdirSync } from 'node:fs';

const cwd = process.cwd();
const isDPackage = cwd.startsWith('/mnt/d/WORK/成品區/待最終審核/');
const args = process.argv.slice(2);

if (!isDPackage || process.env.FORCE_NEXT_START === '1') {
  const child = spawn('node', ['node_modules/next/dist/bin/next', 'start', ...args], { cwd, stdio: 'inherit', env: process.env });
  child.on('exit', (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
} else {
  const task = cwd.split('/').filter(Boolean).pop();
  const canonical = process.env.CANONICAL_SOURCE_PATH || '/home/sport/WORK/AGENTS/02_開發中/sebastian/20260502_auto_sticker_pwa_ui_replan_v2_stage2_owner_approved';
  const linuxNodeModules = existsSync(`${canonical}/node_modules/next/dist/bin/next`) ? `${canonical}/node_modules` : `${cwd}/node_modules`;
  const mirror = `/tmp/${task}-d-start-mirror`;
  console.log(`[D start wrapper] exact D cwd: ${cwd}`);
  console.log(`[D start wrapper] using Linux node_modules: ${linuxNodeModules}`);
  rmSync(mirror, { recursive: true, force: true });
  mkdirSync(mirror, { recursive: true });
  const rs = spawnSync('rsync', ['-a', '--delete', '--exclude', 'node_modules', '--exclude', '.next/cache', `${cwd}/`, `${mirror}/`], { stdio: 'inherit' });
  if (rs.status !== 0) process.exit(rs.status || 1);
  try { rmSync(`${mirror}/node_modules`, { recursive: true, force: true }); } catch {}
  symlinkSync(linuxNodeModules, `${mirror}/node_modules`, 'dir');
  const child = spawn('node', ['node_modules/next/dist/bin/next', 'start', ...args], { cwd: mirror, stdio: 'inherit', env: process.env });
  const stop = (sig) => { try { child.kill(sig); } catch {} };
  process.on('SIGTERM', () => stop('SIGTERM'));
  process.on('SIGINT', () => stop('SIGINT'));
  child.on('exit', (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
}
