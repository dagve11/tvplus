'use client';

// 兼容垫片：旧 Drawer API → shadcn Sheet，消费方迁移完成后删除

import { cn } from '@/lib/cn';

import { Sheet, SheetContent, SheetHeader, SheetTitle } from './sheet';

interface AppSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  position?: 'left' | 'right';
  width?: string;
}

export function AppSheet({
  isOpen,
  onClose,
  title,
  children,
  position = 'right',
  width = 'w-full md:w-96',
}: AppSheetProps) {
  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        side={position}
        // sm:max-w-none 抵消 SheetContent 自带的 sm:max-w-sm，
        // 保证旧 width 类（如 w-[400px]）不被默认 max-width 截断
        className={cn('flex flex-col gap-0 p-0 sm:max-w-none', width)}
      >
        {/* 右上角 X 由 SheetContent 内置关闭按钮提供；pr-12 给标题留出避让空间 */}
        <SheetHeader className='shrink-0 space-y-0 border-b border-border p-4 pr-12 text-left'>
          <SheetTitle className='text-xl font-semibold'>{title}</SheetTitle>
        </SheetHeader>
        <div className='flex-1 overflow-y-auto'>{children}</div>
      </SheetContent>
    </Sheet>
  );
}
