import type { Metadata, Viewport } from 'next';
import './globals.css';
import BottomNav from './components/BottomNav';

export const metadata: Metadata = {
  title: 'AUTO 貼圖 - AI LINE 靜態貼圖製作',
  description: '用自己的圖片與範本建立可審查的 LINE 靜態貼圖 ZIP 素材。',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'AUTO 貼圖' },
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#06C755',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW">
      <head>
        <link rel="icon" href="/icons/icon-192.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
              }
            `,
          }}
        />
      </head>
      <body>
        <div className="app-shell">
          {children}
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
