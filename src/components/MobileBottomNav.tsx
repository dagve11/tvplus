'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { cn } from '@/lib/cn';

import { BOTTOM_NAV_H } from '@/components/layout/shell';
import { type NavItem, buildMobileNavItems } from '@/components/nav/nav-items';

import { useWatchRoomContextSafe } from './WatchRoomProvider';

interface MobileBottomNavProps {
  /**
   * 主动指定当前激活的路径。当未提供时，自动使用 usePathname() 获取的路径。
   */
  activePath?: string;
}

const MobileBottomNav = ({ activePath }: MobileBottomNavProps) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const watchRoomContext = useWatchRoomContextSafe();

  // 直接使用当前路由状态，确保立即响应路由变化
  const queryString = searchParams.toString();
  const currentActive =
    activePath ?? (queryString ? `${pathname}?${queryString}` : pathname);

  // 导航项：单一事实来源（src/components/nav/nav-items.ts）
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  useEffect(() => {
    setNavItems(
      buildMobileNavItems({
        runtimeConfig: window.RUNTIME_CONFIG,
        watchRoomEnabled: Boolean(watchRoomContext?.isEnabled),
        pathname,
      })
    );
  }, [watchRoomContext?.isEnabled, pathname]);

  if (pathname === '/watch-room/screen') {
    return null;
  }

  const isActive = (item: NavItem) => {
    const typeMatch = item.href.match(/type=([^&]+)/)?.[1];

    // 解码URL以进行正确的比较
    const decodedActive = decodeURIComponent(currentActive);
    const decodedItemHref = decodeURIComponent(item.href);

    return (
      decodedActive === decodedItemHref ||
      (decodedActive.startsWith('/douban') &&
        Boolean(typeMatch) &&
        decodedActive.includes(`type=${typeMatch}`))
    );
  };

  return (
    <nav
      className='md:hidden fixed left-0 right-0 z-nav border-t border-border/50 bg-background/90 backdrop-blur-xl overflow-hidden'
      style={{
        /* 紧贴视口底部，同时在内部留出安全区高度 */
        bottom: 0,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <ul className='flex items-center overflow-x-auto scrollbar-hide'>
        {navItems.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          // min-w-[20vw] 保证项数多时横向滚动（旧行为），flex-1 保证项数少时
          // 铺满整行（此前固定 20vw 会让右侧留空）。
          return (
            <li key={item.key} className='min-w-[20vw] flex-1'>
              <Link
                href={item.href}
                prefetch={false}
                className={`flex ${BOTTOM_NAV_H} w-full flex-col items-center justify-center gap-1 text-xs`}
              >
                <Icon
                  className={cn(
                    'h-6 w-6',
                    active ? 'text-foreground' : 'text-muted-foreground'
                  )}
                />
                <span
                  className={cn(
                    active ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default MobileBottomNav;
