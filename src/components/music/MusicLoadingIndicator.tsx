import { cn } from '@/lib/cn';

import { MUSIC_MUTED } from './tokens';

/**
 * 三点音符的等待动画。
 *
 * 音符走主题色（var(--theme-primary)），换主题跟着变——等待动画是"正在为你
 * 干活"的信号，和选中态同一通道。字号走全模块的 --music-px，宽屏上跟着一起长。
 */
export default function MusicLoadingIndicator({
  text,
  size = 'md',
  className = '',
}: {
  text?: string;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const textSize =
    size === 'sm' ? 'text-[calc(11*var(--music-px))]' : 'text-[calc(13*var(--music-px))]';

  return (
    <div className={cn('flex items-center justify-center gap-3', MUSIC_MUTED, className)}>
      <div className='flex items-end gap-1.5'>
        {[0, 1, 2].map((index) => (
          <svg
            key={index}
            className={cn(
              iconSize,
              'text-music-theme'
            )}
            fill='currentColor'
            viewBox='0 0 24 24'
            style={{ animation: `music-note-bounce 0.9s ease-in-out ${index * 0.14}s infinite` }}
          >
            <path d='M12 3v11.55A3.98 3.98 0 0010 14c-2.21 0-4 1.34-4 3s1.79 3 4 3 4-1.34 4-3V8h4V3h-6z' />
          </svg>
        ))}
      </div>
      {text ? <span className={cn(textSize, 'font-medium tracking-wide')}>{text}</span> : null}
    </div>
  );
}
