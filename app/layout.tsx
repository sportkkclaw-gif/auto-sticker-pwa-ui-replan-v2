import type { Metadata, Viewport } from 'next';
import './globals.css';
import BottomNav from './components/BottomNav';

export const metadata: Metadata = {
  title: 'AUTO動態貼圖 - AI LINE 貼圖生成工作室',
  description: '上傳照片 × 模板提示，一鍵生成專屬 LINE 貼圖',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'AI貼圖' },
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#FF6B8A',
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
