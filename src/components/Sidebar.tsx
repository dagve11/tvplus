'use client';

import { Menu } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';

import { cn } from '@/lib/cn';

import { SIDEBAR_W } from '@/components/layout/shell';
import {
  type NavItem,
  buildDesktopNavItems,
  DESKTOP_PRIMARY_NAV_KEYS,
} from '@/components/nav/nav-items';

import { useSite } from './SiteProvider';
import { useWatchRoomContextSafe } from './WatchRoomProvider';

interface SidebarContextType {
  isCollapsed: boolean;
}

const SidebarContext = createContext<SidebarContextType>({
  isCollapsed: false,
});

export const useSidebar = () => useContext(SidebarContext);

// 可替换为你自己的 logo 图片
const Logo = () => {
  const { siteName } = useSite();
  return (
    <Link
      href='/'
      className='flex items-center justify-center h-16 select-none hover:opacity-80 transition-opacity duration-200'
    >
      <span className='text-2xl font-bold text-foreground tracking-tight'>
        {siteName}
      </span>
    </Link>
  );
};

interface SidebarProps {
  onToggle?: (collapsed: boolean) => void;
  activePath?: string;
}

// 折叠状态通过全局变量缓存，避免组件重新挂载时出现初始值闪烁
declare global {
  interface Window {
    __sidebarCollapsed?: boolean;
  }
}

function NavLink({
  item,
  isActive,
  isCollapsed,
  onNavigate,
}: {
  item: NavItem;
  isActive: boolean;
  isCollapsed: boolean;
  onNavigate?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      prefetch={false}
      onClick={onNavigate}
      data-active={isActive}
      className={cn(
        // text-sm 是补上的：此前这一项没有任何字号类，继承 body 的 16px，
        // 与移动底栏的 12px 差 4px，同一套导航在两个断点跳档。
        'group flex items-center gap-3 justify-start rounded-lg px-2 py-2 pl-4 min-h-[40px] text-sm font-medium transition-colors duration-200',
        'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
        'data-[active=true]:bg-accent data-[active=true]:text-foreground'
      )}
    >
      <div className='w-4 h-4 flex items-center justify-center'>
        <Icon className='h-4 w-4' />
      </div>
      {!isCollapsed && (
        <span className='whitespace-nowrap transition-opacity duration-200 opacity-100'>
          {item.label}
        </span>
      )}
    </Link>
  );
}

const Sidebar = ({ onToggle, activePath = '/' }: SidebarProps) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const watchRoomContext = useWatchRoomContextSafe();

  // 若同一次 SPA 会话中已经读取过折叠状态，则直接复用，避免闪烁
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (
      typeof window !== 'undefined' &&
      typeof window.__sidebarCollapsed === 'boolean'
    ) {
      return window.__sidebarCollapsed;
    }
    return false; // 默认展开
  });

  // 首次挂载时读取 localStorage，以便刷新后仍保持上次的折叠状态
  useLayoutEffect(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    if (saved !== null) {
      const val = JSON.parse(saved);
      setIsCollapsed(val);
      window.__sidebarCollapsed = val;
    }
  }, []);

  // 当折叠状态变化时，同步到 <html> data 属性，供首屏 CSS 使用
  useLayoutEffect(() => {
    if (typeof document !== 'undefined') {
      if (isCollapsed) {
        document.documentElement.dataset.sidebarCollapsed = 'true';
      } else {
        delete document.documentElement.dataset.sidebarCollapsed;
      }
    }
  }, [isCollapsed]);

  const [active, setActive] = useState(activePath);

  useEffect(() => {
    // 立即根据当前路径更新状态，不等待页面加载
    const queryString = searchParams.toString();
    setActive(queryString ? `${pathname}?${queryString}` : pathname);
  }, [pathname, searchParams]);

  const handleToggle = useCallback(() => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
    if (typeof window !== 'undefined') {
      window.__sidebarCollapsed = newState;
    }
    onToggle?.(newState);
  }, [isCollapsed, onToggle]);

  const contextValue = useMemo(() => ({ isCollapsed }), [isCollapsed]);

  // 导航项：单一事实来源（src/components/nav/nav-items.ts）
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  useEffect(() => {
    setNavItems(
      buildDesktopNavItems({
        runtimeConfig: window.RUNTIME_CONFIG,
        watchRoomEnabled: Boolean(watchRoomContext?.isEnabled),
        pathname,
      })
    );
  }, [watchRoomContext?.isEnabled, pathname]);

  const primaryItems = navItems.filter((item) =>
    (DESKTOP_PRIMARY_NAV_KEYS as readonly string[]).includes(item.key)
  );
  const menuItems = navItems.filter(
    (item) =>
      !(DESKTOP_PRIMARY_NAV_KEYS as readonly string[]).includes(item.key)
  );

  const isItemActive = useCallback(
    (item: NavItem): boolean => {
      const decodedActive = decodeURIComponent(active);
      const decodedItemHref = decodeURIComponent(item.href);
      const typeMatch = item.href.match(/type=([^&]+)/)?.[1];
      const activePathname = decodedActive.split('?')[0];
      const itemPathname = decodedItemHref.split('?')[0];

      return (
        decodedActive === decodedItemHref ||
        (decodedActive.startsWith('/douban') &&
          Boolean(typeMatch) &&
          decodedActive.includes(`type=${typeMatch}`)) ||
        // 对于没有 type 参数的路径，只比较路径名
        (!typeMatch && activePathname === itemPathname) ||
        // 额外激活路径（如「搜索」覆盖 /search 与 /under）
        Boolean(item.activePaths?.some((p) => activePathname === p))
      );
    },
    [active]
  );

  if (pathname === '/watch-room/screen') {
    return null;
  }

  return (
    <SidebarContext.Provider value={contextValue}>
      {/* 在移动端隐藏侧边栏 */}
      <div className='hidden md:flex'>
        <aside
          data-sidebar
          className={cn(
            // 宽度读 --sidebar-w（globals.css 里由 data-sidebar-collapsed 切换），
            // 加载遮罩的 left 偏移读同一个变量，避免两处字面量各改各的。
            'fixed top-0 left-0 z-nav h-screen border-r border-border/50 bg-background/40 shadow-lg backdrop-blur-xl transition-all duration-300 dark:bg-card/60',
            SIDEBAR_W
          )}
        >
          <div className='flex h-full flex-col'>
            {/* 顶部 Logo 区域 */}
            <div className='relative h-16'>
              <div
                className={cn(
                  'absolute inset-0 flex items-center justify-center transition-opacity duration-200',
                  isCollapsed ? 'opacity-0' : 'opacity-100'
                )}
              >
                <div className='w-[calc(100%-4rem)] flex justify-center'>
                  {!isCollapsed && <Logo />}
                </div>
              </div>
              <button
                onClick={handleToggle}
                className={cn(
                  'absolute top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-200 hover:bg-muted/50 hover:text-foreground',
                  isCollapsed ? 'left-1/2 -translate-x-1/2' : 'right-2'
                )}
              >
                <Menu className='h-4 w-4' />
              </button>
            </div>

            {/* 首页和搜索导航 */}
            <nav className='px-2 mt-4 space-y-1'>
              {primaryItems.map((item) => (
                <NavLink
                  key={item.key}
                  item={item}
                  isActive={isItemActive(item)}
                  isCollapsed={isCollapsed}
                  onNavigate={(e) => {
                    // 确保点击事件立即生效，不被其他状态更新阻塞
                    e.currentTarget.blur();
                  }}
                />
              ))}
            </nav>

            {/* 菜单项 */}
            <div className='flex-1 overflow-y-auto px-2 pt-4'>
              <div className='space-y-1'>
                {menuItems.map((item) => (
                  <NavLink
                    key={item.key}
                    item={item}
                    isActive={isItemActive(item)}
                    isCollapsed={isCollapsed}
                  />
                ))}
              </div>
            </div>
          </div>
        </aside>
        <div
          className={cn(
            'sidebar-offset transition-all duration-300',
            SIDEBAR_W
          )}
        ></div>
      </div>
    </SidebarContext.Provider>
  );
};

export default Sidebar;
