'use client';

import { ThemeToggle } from '@/components/ThemeToggle';

import { AuthVersionDisplay } from './auth-version-display';

/**
 * (auth) 路由组的极简外壳：全视口居中 + 右上角主题切换 + 底部版本号。
 * 页面自身只负责卡片内容；背景图等装饰层由页面以 absolute inset-0
 * 注入本外壳（外壳为相对定位容器）。
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className='relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background px-4 py-12'>
      <div className='absolute right-4 top-4 z-20'>
        <ThemeToggle />
      </div>
      {children}
      <AuthVersionDisplay />
    </div>
  );
}
