'use client';

import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/cn';

import {
  BOTTOM_NAV_H,
  CONTENT_BOTTOM,
  CONTENT_TOP,
  PAGE_READ,
} from '@/components/layout/shell';
import {
  LIBRARY_FOCUS,
  LIBRARY_ICON_BUTTON_GHOST,
  LIBRARY_MUTED,
  LIBRARY_PAGE,
  LIBRARY_SERIF,
  LIBRARY_TEXT,
  SPINE_TAB_ACTIVE,
  SPINE_TAB_IDLE,
} from '@/components/media/library';
import { ThemeToggle } from '@/components/ThemeToggle';
import { UserMenu } from '@/components/UserMenu';

export interface MediaShellTab {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

/**
 * 漫画与小说共用的页面外壳（顶栏 + 二级 tab + 移动端底栏）。
 *
 * 两套功能仍然各有自己的外壳实例与作用域，这里只是把重复的 200 余行收敛成一份。
 * 外壳走「书库」语言：实心顶栏（不再用玻璃模糊）+ 单色前景强调。阅读页与
 * 书库页共用同一套外壳，区别只剩两处——阅读页把二级 tab 换成阅读器动作按钮，
 * 内容区用各功能自己的 reader.mainClassName。
 */
export default function MediaShell({
  children,
  siteName,
  title,
  subtitle,
  backHref,
  tabs,
  reader,
}: {
  children: React.ReactNode;
  siteName: string;
  title: string;
  subtitle?: string;
  backHref?: string;
  tabs: MediaShellTab[];
  reader?: {
    actions: React.ReactNode;
    /** 阅读页内容区的完整样式，由各功能保持原值，避免阅读页布局回归 */
    mainClassName: string;
  };
}) {
  const pathname = usePathname();
  const isReader = Boolean(reader);
  const isActive = (href: string) => pathname === href;

  return (
    <div className={cn('min-h-screen', LIBRARY_PAGE, LIBRARY_TEXT)}>
      <header
        className='fixed inset-x-0 top-0 z-40 border-b border-border bg-background/95 backdrop-blur-none'
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className={cn('flex h-14 items-center gap-3 sm:h-16', PAGE_READ)}>
          <div className='flex min-w-0 flex-1 items-center gap-2'>
            {backHref ? (
              <Link
                href={backHref}
                aria-label='返回'
                className={cn(LIBRARY_ICON_BUTTON_GHOST, LIBRARY_FOCUS)}
              >
                <ChevronLeft className='h-5 w-5' />
              </Link>
            ) : (
              <Link
                href='/'
                className={cn(
                  'flex h-10 shrink-0 items-center rounded-md px-3 text-sm font-semibold transition-colors duration-200',
                  LIBRARY_SERIF,
                  'text-foreground hover:bg-accent',
                  LIBRARY_FOCUS
                )}
              >
                {siteName}
              </Link>
            )}
            <div className='min-w-0'>
              <div
                className={cn(
                  'truncate text-sm font-semibold sm:text-base',
                  LIBRARY_SERIF
                )}
                title={title}
              >
                {title}
              </div>
              {subtitle && (
                <div className={cn('truncate text-xs', LIBRARY_MUTED)}>
                  {subtitle}
                </div>
              )}
            </div>
          </div>

          {isReader ? (
            <div className='ml-auto flex shrink-0 items-center gap-1'>
              {reader?.actions}
            </div>
          ) : (
            <>
              <nav className='ml-auto hidden items-center gap-1 lg:flex'>
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const active = isActive(tab.href);
                  return (
                    <Link
                      key={tab.href}
                      href={tab.href}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm transition-colors duration-200',
                        LIBRARY_FOCUS,
                        active ? SPINE_TAB_ACTIVE : SPINE_TAB_IDLE
                      )}
                    >
                      <Icon className='h-4 w-4' />
                      {tab.label}
                    </Link>
                  );
                })}
              </nav>
              <div className='ml-auto hidden shrink-0 items-center gap-2 md:flex lg:ml-0'>
                <ThemeToggle />
                <UserMenu />
              </div>
            </>
          )}
        </div>
      </header>

      {/* 阅读页分支保持改造前的原值：两个 READER_MAIN_CLASS 自带 padding，
          且 books 的 max-w-6xl 依赖 cn() 覆盖外壳的 max-w-7xl。给它加 PAGE_READ
          的横向 padding 会让 /manga/read（px-0）与 /books/read 的布局回归。 */}
      <main
        className={cn(
          'mx-auto w-full max-w-7xl',
          reader
            ? reader.mainClassName
            : `${PAGE_READ} ${CONTENT_TOP} ${CONTENT_BOTTOM}`
        )}
      >
        {children}
      </main>

      {!isReader && (
        <nav
          className='fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-none lg:hidden'
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className='mx-auto grid max-w-3xl grid-cols-4'>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = isActive(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex ${BOTTOM_NAV_H} flex-col items-center justify-center gap-1 py-2 text-xs transition-colors duration-200 hover:bg-accent/60`}
                >
                  <Icon
                    className={cn(
                      'h-5 w-5',
                      active
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                    )}
                  />
                  <span
                    className={
                      active
                        ? 'font-medium text-foreground'
                        : 'text-muted-foreground'
                    }
                  >
                    {tab.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
