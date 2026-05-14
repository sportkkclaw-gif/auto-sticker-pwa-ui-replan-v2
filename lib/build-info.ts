import fs from 'fs';
import path from 'path';

function readBuildId(){
  try { return fs.readFileSync(path.join(process.cwd(), '.next', 'BUILD_ID'), 'utf8').trim(); } catch {}
  return process.env.NEXT_PUBLIC_BUILD_ID || 'auto-sticker-pwa-qc-20260505';
}

export function getBuildInfo(){
  const commit = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GIT_COMMIT_SHA || process.env.NEXT_PUBLIC_COMMIT_SHA || 'local-stage2-uncommitted';
  const deployment = process.env.VERCEL_DEPLOYMENT_ID || process.env.VERCEL_URL || process.env.NEXT_PUBLIC_DEPLOYMENT_ID || 'local';
  return {
    commit_sha: commit,
    build_id: readBuildId(),
    deployment_id: deployment,
    vercel_env: process.env.VERCEL_ENV || 'local',
    stage: 'stage2',
    source_lane: '02_開發中',
    timestamp: new Date().toISOString(),
  };
}
