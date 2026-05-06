import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { email } = body;

  if (!email) {
    return NextResponse.json(
      { error: { code: 'INVALID_EMAIL', message: '請提供 email', details: {} } },
      { status: 400 }
    );
  }

  // Mock login - return demo session
  const session = {
    userId: 'user_demo_001',
    token: 'mock_token_' + Date.now(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };

  return NextResponse.json({
    userId: session.userId,
    token: session.token,
    expiresAt: session.expiresAt,
    displayName: 'Demo User',
    role: 'creator',
  });
}
