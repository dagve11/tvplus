'use client';

import { Search } from 'lucide-react';
import Link from 'next/link';

import { MOBILE_HEADER_H } from '@/components/layout/shell';

import { BackButton } from './BackButton';
import { useSite } from './SiteProvider';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';

interface MobileHeaderProps {
  showBackButton?: boolean;
}

const MobileHeader = ({ showBackButton = false }: MobileHeaderProps) => {
  const { siteName } = useSite();
  return (
    <header
      className='md:hidden fixed top-0 left-0 right-0 z-header w-full border-b border-border/50 bg-background/70 shadow-sm backdrop-blur-xl'
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div
        className={`relative ${MOBILE_HEADER_H} flex items-center justify-between px-4`}
      >
        {/* 左侧：搜索按钮、返回按钮和设置按钮 */}
        <div className='flex items-center gap-2'>
          <Link
            href='/search'
            className='w-10 h-10 p-2 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors'
          >
            <Search className='w-full h-full' />
          </Link>
          {showBackButton && <BackButton />}
        </div>

        {/* 右侧按钮 */}
        <div className='flex items-center gap-2'>
          <ThemeToggle />
          <UserMenu />
        </div>

        {/* 中间：Logo（相对内容行居中，避免被 safe-area 顶偏） */}
        <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'>
          <Link
            href='/'
            prefetch={false}
            className='text-2xl font-bold text-foreground tracking-tight hover:opacity-80 transition-opacity'
          >
            {siteName}
          </Link>
        </div>
      </div>
    </header>
  );
};

export default MobileHeader;
