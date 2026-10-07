'use client';

import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ReportDialog = ({ open, onOpenChange }: ReportDialogProps) => {
  if (!open) return null;
  return createPortal(
    <>
      {/* 背景遮罩 */}
      <div
        className='fixed inset-0 bg-black/50 backdrop-blur-sm z-modal'
        onClick={() => onOpenChange(false)}
        onTouchMove={(e) => {
          e.preventDefault();
        }}
        onWheel={(e) => {
          e.preventDefault();
        }}
        style={{
          touchAction: 'none',
        }}
      />

      {/* 举报信息面板 */}
      <div className='fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-card rounded-xl shadow-xl z-popover overflow-hidden'>
        <div
          className='h-full max-h-[70vh] flex flex-col'
          data-panel-content
          onTouchMove={(e) => {
            e.stopPropagation();
          }}
          style={{
            touchAction: 'auto',
          }}
        >
          {/* 标题栏 */}
          <div className='flex items-center justify-between p-6 border-b border-border'>
            <h3 className='text-xl font-bold text-foreground'>
              耻辱柱
            </h3>
            <button
              onClick={() => onOpenChange(false)}
              className='w-8 h-8 p-1 rounded-full flex items-center justify-center text-muted-foreground hover:bg-accent transition-colors'
              aria-label='Close'
            >
              <X className='w-full h-full' />
            </button>
          </div>

          {/* 内容区域 */}
          <div className='flex-1 overflow-y-auto p-6'>
            <div className='bg-destructive/10 border border-destructive/30 rounded-lg p-4'>
              <p className='text-foreground leading-relaxed'>
                抄袭狗
                <span className='font-bold text-destructive'>
                  SzeMeng76
                </span>
                毫无廉耻，盯着本项目的commit区，疯狂抄袭。警告亦全当看不见，实为开源界耻辱。
              </p>
              <p className='text-foreground leading-relaxed mt-3'>
                超分，观影室，豆瓣反爬，精确搜索等等等等，直接抄袭，最不要脸的就是，刚更新一版，几小时后直接抄走。
              </p>
              <p className='text-foreground leading-relaxed mt-3'>
                <span className='font-semibold text-destructive'>
                  2026-02-25：
                </span>
                抄袭emby功能
              </p>
            </div>
          </div>

          {/* 底部按钮 */}
          <div className='p-6 border-t border-border'>
            <button
              onClick={() => onOpenChange(false)}
              className='w-full px-4 py-2.5 bg-secondary text-secondary-foreground hover:bg-secondary/80 font-medium rounded-lg transition-colors'
            >
              我知道了
            </button>
          </div>
        </div>
      </div>
    </>
, document.body
  );
};
