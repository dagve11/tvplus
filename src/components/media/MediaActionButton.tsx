import { cn } from '@/lib/cn';

import { LIBRARY_FOCUS } from './library';

/**
 * 卡片下方的普通操作按钮（非开关型），与 ShelfToggleButton 同一套视觉。
 *
 * 与 ShelfToggleButton 的区别只在语义：这个不输出 aria-pressed。
 */
export default function MediaActionButton({
  tone = 'default',
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: 'default' | 'danger';
}) {
  return (
    <button
      type='button'
      className={cn(
        'w-full rounded-md border px-3 py-2 text-xs font-medium transition-colors duration-200',
        LIBRARY_FOCUS,
        tone === 'danger'
          ? 'border-border text-muted-foreground hover:border-destructive hover:text-destructive'
          : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
