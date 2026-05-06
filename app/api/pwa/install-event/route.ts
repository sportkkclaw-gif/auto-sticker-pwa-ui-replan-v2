import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { platform, event } = body;

  const pwaEvent = {
    id: 'pwa_event_' + Date.now(),
    userId: 'user_demo_001',
    platform: platform || 'desktop',
    event: event || 'prompt_shown',
    createdAt: new Date().toISOString(),
  };

  return NextResponse.json({ pwaEvent });
}
