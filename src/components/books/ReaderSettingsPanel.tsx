'use client';

import { Moon, Sun } from 'lucide-react';
import { createPortal } from 'react-dom';

import { cn } from '@/lib/cn';

import {
  LIBRARY_BUTTON,
  READER_SEGMENT,
  READER_SEGMENT_ACTIVE,
  READER_SEGMENT_IDLE,
  READER_SHEET,
  READER_SLIDER,
} from '@/components/media/library';

export type ReaderTheme = 'light' | 'sepia' | 'dark';
export type ReaderMode = 'paginated' | 'scrolled';

export interface ReaderSettings {
  fontSize: number;
  lineHeight: number;
  theme: ReaderTheme;
  mode: ReaderMode;
}

const THEME_OPTIONS: ReaderTheme[] = ['light', 'sepia', 'dark'];

const THEME_LABELS: Record<ReaderTheme, string> = {
  light: '浅色',
  sepia: '护眼',
  dark: '深色',
};

/**
 * 阅读设置浮层（EPUB 阅读器与 Legado 章节阅读器共用）。
 *
 * 两种阅读器的设置项完全一致：模式二选一、主题三选一、字号/行距两个滑块。
 * 差异都收进 props：EPUB 换模式前要先持久化进度（所以 onModeChange 独立出来），
 * 主题按钮多一对 Sun/Moon 图标，「完成」上方多一块缓存说明。
 * 保留原来的 portal + 居中弹层结构，位置与交互不变。
 */
export default function ReaderSettingsPanel({
  open,
  onOpenChange,
  settings,
  onModeChange,
  onSettingsPatch,
  description,
  paginatedDesc = '左右点击翻页',
  showThemeIcons = false,
  footerNote,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: ReaderSettings;
  /** 翻页/滚动切换。EPUB 阅读器要在切换前补一次进度持久化，所以不走通用 patch。 */
  onModeChange: (mode: ReaderMode) => void;
  /** 主题 / 字号 / 行距的统一入口。 */
  onSettingsPatch: (patch: Partial<ReaderSettings>) => void;
  /** 标题下的说明行，两种阅读器文案不同。 */
  description: string;
  /** 翻页模式按钮的副标题（Legado 源是「左右点击翻页/章节」）。 */
  paginatedDesc?: string;
  /** 主题按钮是否带 Sun/Moon 图标（EPUB 阅读器带，Legado 章节阅读器纯文字）。 */
  showThemeIcons?: boolean;
  /** 「完成」上方的附加说明（EPUB 的缓存状态提示）。 */
  footerNote?: React.ReactNode;
}) {
  if (!open || typeof document === 'undefined') return null;

  const modeOptions: { key: ReaderMode; label: string; desc: string }[] = [
    { key: 'paginated', label: '翻页模式', desc: paginatedDesc },
    { key: 'scrolled', label: '滚动模式', desc: '上下连续滚动' },
  ];

  return createPortal(
    <div
      className='fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4'
      onClick={() => onOpenChange(false)}
    >
      <div
        className={cn(READER_SHEET, 'w-full max-w-sm p-5')}
        onClick={(event) => event.stopPropagation()}
      >
        <div className='mb-4'>
          <div className='text-base font-semibold text-foreground'>
            阅读设置
          </div>
          <div className='mt-1 text-xs text-muted-foreground'>
            {description}
          </div>
        </div>
        <div className='space-y-6 p-1 text-sm'>
          <div>
            <div className='mb-2 font-medium'>阅读模式</div>
            <div className='grid grid-cols-2 gap-2'>
              {modeOptions.map((mode) => (
                <button
                  key={mode.key}
                  type='button'
                  onClick={() => onModeChange(mode.key)}
                  className={cn(
                    READER_SEGMENT,
                    'px-3 py-3 text-left',
                    settings.mode === mode.key
                      ? READER_SEGMENT_ACTIVE
                      : READER_SEGMENT_IDLE
                  )}
                >
                  <div className='font-medium'>{mode.label}</div>
                  <div className='mt-1 text-xs opacity-70'>{mode.desc}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className='mb-2 font-medium'>主题</div>
            <div className='grid grid-cols-3 gap-2'>
              {THEME_OPTIONS.map((theme) => (
                <button
                  key={theme}
                  type='button'
                  onClick={() => onSettingsPatch({ theme })}
                  className={cn(
                    READER_SEGMENT,
                    settings.theme === theme
                      ? READER_SEGMENT_ACTIVE
                      : READER_SEGMENT_IDLE
                  )}
                >
                  {showThemeIcons ? (
                    <div className='mb-1 flex justify-center'>
                      {theme === 'dark' ? (
                        <Moon className='h-4 w-4' />
                      ) : (
                        <Sun className='h-4 w-4' />
                      )}
                    </div>
                  ) : null}
                  {THEME_LABELS[theme]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className='mb-2 flex items-center justify-between font-medium'>
              字号 <span>{settings.fontSize}%</span>
            </div>
            <input
              type='range'
              min='85'
              max='140'
              step='5'
              value={settings.fontSize}
              onChange={(e) =>
                onSettingsPatch({ fontSize: Number(e.target.value) })
              }
              className={READER_SLIDER}
            />
          </div>
          <div>
            <div className='mb-2 flex items-center justify-between font-medium'>
              行距 <span>{settings.lineHeight.toFixed(1)}</span>
            </div>
            <input
              type='range'
              min='1.4'
              max='2.2'
              step='0.1'
              value={settings.lineHeight}
              onChange={(e) =>
                onSettingsPatch({ lineHeight: Number(e.target.value) })
              }
              className={READER_SLIDER}
            />
          </div>
          {footerNote}
          <div className='flex justify-end'>
            <button
              type='button'
              className={cn(LIBRARY_BUTTON, 'px-4 py-2')}
              onClick={() => onOpenChange(false)}
            >
              完成
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
