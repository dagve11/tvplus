'use client';

import {
  Film,
  Heart,
  Home,
  MonitorPlay,
  Radio,
  Search,
  Sparkles,
  Tv,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode, useEffect } from 'react';

import TVVirtualRemote from './TVVirtualRemote';

const navItems = [
  { label: '搜索', href: '/tv/search', icon: Search },
  { label: '主页', href: '/tv', icon: Home },
  { label: '电影', href: '/tv/movie', icon: Film },
  { label: '剧集', href: '/tv/series', icon: Tv },
  { label: '动漫', href: '/tv/anime', icon: Sparkles },
  { label: '综艺', href: '/tv/variety', icon: MonitorPlay },
  { label: '直播', href: '/tv/live', icon: Radio },
  { label: '私人影库', href: '/tv/private', icon: Heart },
  { label: '我的', href: '/tv/me', icon: User },
];

export default function TVLayout({
  children,
  showNav = true,
}: {
  children: ReactNode;
  showNav?: boolean;
}) {
  const pathname = usePathname();

  useEffect(() => {
    if (!showNav || pathname !== '/tv') return;

    window.requestAnimationFrame(() => {
      const active = document.activeElement;
      if (active instanceof HTMLElement && active !== document.body) return;

      document
        .querySelector<HTMLElement>('[data-tv-home-nav="true"]')
        ?.focus({ preventScroll: true });
    });
  }, [pathname, showNav]);

  return (
    <main className='min-h-screen overflow-x-hidden bg-background text-foreground'>
      <div className='pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_0%,hsl(var(--foreground)/0.06),transparent_34%)]' />
      {showNav && (
        <header className='fixed left-6 right-6 top-5 z-header rounded-[28px] border border-border bg-card/80 px-5 py-3 shadow-2xl shadow-black/60 backdrop-blur-xl'>
          <nav className='flex items-center justify-center gap-3 overflow-x-auto overscroll-x-contain px-4 py-3 [scrollbar-width:none]'>
            {navItems.map((item) => {
              const active =
                item.href === '/tv'
                  ? pathname === '/tv'
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  data-tv-home-nav={item.href === '/tv' ? 'true' : undefined}
                  className={`group flex shrink-0 cursor-pointer items-center gap-2 rounded-2xl px-5 py-3 text-xl font-semibold outline-none transition duration-200 tv-focusable ${
                    active
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-black/40'
                      : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground focus:bg-accent'
                  }`}
                >
                  <Icon className='h-6 w-6' />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </header>
      )}
      <div className={`relative z-10 px-8 pb-16 ${showNav ? 'pt-32' : 'pt-16'}`}>{children}</div>
      <TVVirtualRemote />
    </main>
  );
}
