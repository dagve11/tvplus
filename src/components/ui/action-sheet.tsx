'use client';

// 兼容垫片：旧 MobileActionSheet API → shadcn Sheet(side=bottom)，消费方迁移完成后删除

import { Radio } from 'lucide-react';
import Image from 'next/image';
import React from 'react';

import { cn } from '@/lib/cn';

import { Sheet, SheetContent, SheetHeader, SheetTitle } from './sheet';

export interface ActionItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: (e?: React.MouseEvent) => void | Promise<void>;
  color?: 'default' | 'danger' | 'primary';
  disabled?: boolean;
}

interface ActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  actions: ActionItem[];
  poster?: string;
  sources?: string[]; // 播放源信息
  isAggregate?: boolean; // 是否为聚合内容
  sourceName?: string; // 播放源名称
  directLinkUrl?: string; // 直链播放完整链接
  currentEpisode?: number; // 当前集数
  totalEpisodes?: number; // 总集数
  origin?: 'vod' | 'live';
  onPosterClick?: () => void; // 海报点击回调
  description?: string; // 标题下方描述文案
}

export function ActionSheet({
  isOpen,
  onClose,
  title,
  actions,
  poster,
  sources,
  isAggregate,
  sourceName,
  directLinkUrl,
  currentEpisode,
  totalEpisodes,
  origin = 'vod',
  onPosterClick,
  description = '选择操作',
}: ActionSheetProps) {
  // 操作区可滚动：有可用播放源最多显示 4 项，否则最多 6 项（与旧组件一致）
  const hasPlaySources = Boolean(isAggregate && sources && sources.length > 0);
  const actionsMaxHeight = `calc(3.5rem * ${hasPlaySources ? 4 : 6})`;

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        side='bottom'
        className='inset-x-0 bottom-0 mx-auto max-h-[85vh] w-full max-w-lg gap-0 overflow-y-auto rounded-t-2xl border-b-0 p-0 sm:mb-4 sm:rounded-2xl sm:border-b'
      >
        {/* 头部：海报 + 标题 + 来源徽标（右上角 X 由 SheetContent 内置关闭按钮提供） */}
        <SheetHeader className='flex-row items-center gap-3 space-y-0 border-b border-border p-4 pr-12 text-left'>
          {poster && (
            <button
              type='button'
              className='relative h-16 w-12 shrink-0 cursor-pointer overflow-hidden rounded-lg bg-muted transition-opacity hover:opacity-90'
              onClick={(e) => {
                e.stopPropagation();
                onPosterClick?.();
              }}
              aria-label='查看海报'
            >
              <Image
                src={poster}
                alt={title}
                fill
                className={
                  origin === 'live' ? 'object-contain' : 'object-cover'
                }
                loading='lazy'
              />
            </button>
          )}
          <div className='min-w-0 flex-1'>
            <div className='mb-1 flex min-w-0 items-center gap-2'>
              <SheetTitle className='min-w-0 flex-1 truncate text-lg'>
                {title}
              </SheetTitle>
              {sourceName && (
                <span className='shrink-0 rounded border border-border bg-muted px-2 py-1 text-xs text-muted-foreground'>
                  {origin === 'live' && (
                    <Radio size={12} className='mr-1.5 inline-block' />
                  )}
                  {sourceName}
                </span>
              )}
            </div>
            {directLinkUrl && (
              <p className='mb-2 break-all text-xs text-muted-foreground'>
                {directLinkUrl}
              </p>
            )}
            <p className='text-sm text-muted-foreground'>{description}</p>
          </div>
        </SheetHeader>

        {/* 操作列表：有源最多 4 项 / 无源最多 6 项，超出可滚动 */}
        <div className='px-4 py-2'>
          <div
            className='overflow-y-auto overscroll-contain'
            style={{ maxHeight: actionsMaxHeight }}
          >
            {actions.map((action, index) => (
              <div key={action.id}>
                <button
                  type='button'
                  onClick={() => {
                    action.onClick();
                    onClose();
                  }}
                  disabled={action.disabled}
                  className={cn(
                    'flex w-full items-center gap-4 px-2 py-4 transition-colors duration-150',
                    action.disabled
                      ? 'cursor-not-allowed opacity-50'
                      : 'hover:bg-accent/50 active:scale-[0.98]'
                  )}
                >
                  <span
                    className={cn(
                      'flex h-6 w-6 shrink-0 items-center justify-center',
                      action.disabled
                        ? 'text-muted-foreground'
                        : action.color === 'danger'
                        ? 'text-destructive'
                        : 'text-foreground'
                    )}
                  >
                    {action.icon}
                  </span>
                  <span
                    className={cn(
                      'flex-1 text-left text-base font-medium',
                      action.disabled
                        ? 'text-muted-foreground'
                        : action.color === 'danger'
                        ? 'text-destructive'
                        : 'text-foreground'
                    )}
                  >
                    {action.label}
                  </span>
                  {/* 播放进度：仅播放按钮且有播放记录时显示 */}
                  {action.id === 'play' && currentEpisode && totalEpisodes && (
                    <span className='text-sm font-medium text-muted-foreground'>
                      {currentEpisode}/{totalEpisodes}
                    </span>
                  )}
                </button>
                {index < actions.length - 1 && (
                  <div className='ml-10 border-b border-border' />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 播放源信息展示区域 */}
        {hasPlaySources && (
          <div className='border-t border-border px-4 py-3'>
            <div className='mb-3'>
              <h4 className='mb-1 text-sm font-medium text-foreground'>
                可用播放源
              </h4>
              <p className='text-xs text-muted-foreground'>
                共 {sources!.length} 个播放源
              </p>
            </div>
            <div className='max-h-32 overflow-y-auto'>
              <div className='grid grid-cols-2 gap-2'>
                {sources!.map((source, index) => (
                  <div
                    key={index}
                    className='flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2'
                  >
                    <div className='h-1 w-1 shrink-0 rounded-full bg-muted-foreground' />
                    <span className='truncate text-xs text-muted-foreground'>
                      {source}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
