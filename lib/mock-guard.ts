import { NextResponse } from 'next/server';

export function mockRoutesEnabled() {
  return process.env.AUTO_STICKER_ENABLE_MOCK_ROUTES === '1' || process.env.NODE_ENV !== 'production';
}

export function mockRouteBlockedResponse(feature: string) {
  return NextResponse.json(
    {
      error: {
        code: 'MOCK_ROUTE_DISABLED',
        message: `${feature} is disabled in production. Configure a real provider or explicitly enable mock routes for a non-production test track.`,
        details: {
          env: 'AUTO_STICKER_ENABLE_MOCK_ROUTES',
        },
      },
    },
    { status: 403 }
  );
}
