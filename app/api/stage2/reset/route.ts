import { NextResponse } from 'next/server';
import { resetStage2Store } from '@/lib/stage2';
import { getBuildInfo } from '@/lib/build-info';

export async function POST(){
  const snapshot = resetStage2Store();
  return NextResponse.json({
    ok: true,
    mode: 'stage2_reset',
    wallet: snapshot.wallet,
    store: {
      works: Object.keys(snapshot.works || {}).length,
      generation_jobs: Object.keys(snapshot.generation_jobs || {}).length,
      generated_images: Object.keys(snapshot.generated_images || {}).length,
      transactions: Math.max(0, (snapshot.transactions || []).filter((tx:any)=>tx.id !== 'stage2_tx_seed_free').length),
    },
    build_id: getBuildInfo().build_id,
    commit_sha: getBuildInfo().commit_sha,
    deployment_id: getBuildInfo().deployment_id,
    timestamp: new Date().toISOString(),
  });
}

export async function GET(){ return POST(); }
