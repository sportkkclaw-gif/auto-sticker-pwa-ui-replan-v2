'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', label: '首頁', icon: '🏠' },
  { href: '/templates', label: '模板', icon: '🎨' },
  { href: '/works', label: '作品', icon: '📦' },
  { href: '/account', label: '帳戶', icon: '👤' },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={(pathname === item.href || (item.href === '/account' && pathname === '/me')) ? 'active' : ''}
        >
          <span className="nav-icon">{item.icon}</span>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
