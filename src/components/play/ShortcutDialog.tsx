import { Keyboard, X } from 'lucide-react';

const PLAY_SHORTCUT_GROUPS = [
  {
    title: '播放控制',
    items: [
      { keys: ['空格'], description: '播放 / 暂停' },
      { keys: ['←', '→'], description: '快退 / 快进（快进/倒退时间）' },
      { keys: ['P'], description: '快捷快进' },
      { keys: ['↑', '↓'], description: '音量增加 / 减少' },
      { keys: ['F'], description: '切换全屏' },
    ],
  },
  {
    title: '剧集切换',
    items: [
      { keys: ['Alt', '←'], description: '上一集' },
      { keys: ['Alt', '→'], description: '下一集' },
    ],
  },
  {
    title: '倍速控制',
    items: [
      { keys: ['小键盘 +'], description: '提高一档倍速' },
      { keys: ['小键盘 -'], description: '降低一档倍速' },
      { keys: ['小键盘 /'], description: '恢复 1x' },
    ],
  },
];

interface ShortcutDialogProps {
  /** 是否显示快捷键说明弹窗（对应 page 的 showShortcutDialog） */
  show: boolean;
  /** 关闭弹窗（对应 page 的 setShowShortcutDialog(false)） */
  onClose: () => void;
}

export default function ShortcutDialog({ show, onClose }: ShortcutDialogProps) {
  if (!show) {
    return null;
  }

  return (
    <div
      className='fixed inset-0 z-modal flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm'
      onClick={onClose}
    >
      <div
        className='relative w-full max-w-lg overflow-hidden rounded-2xl border border-gray-200 bg-white text-gray-900 shadow-2xl shadow-black/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:shadow-black/40'
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role='dialog'
        aria-modal='true'
        aria-labelledby='shortcut-dialog-title'
      >
        <div className='absolute inset-x-0 top-0 h-24 bg-gradient-to-br from-green-500/15 via-cyan-500/10 to-transparent pointer-events-none' />
        <div className='relative flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-4 dark:border-gray-700'>
          <div className='flex items-center gap-3'>
            <div className='flex h-10 w-10 items-center justify-center rounded-xl border border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-300'>
              <Keyboard className='h-5 w-5' />
            </div>
            <div>
              <h2 id='shortcut-dialog-title' className='text-base font-semibold text-gray-950 dark:text-white'>
                播放快捷键
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className='rounded-lg p-2 text-gray-500 transition-colors duration-200 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 cursor-pointer dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
            aria-label='关闭快捷键说明'
          >
            <X className='h-5 w-5' />
          </button>
        </div>

        <div className='relative max-h-[70vh] overflow-y-auto px-5 py-4'>
          <div className='grid gap-3'>
            {PLAY_SHORTCUT_GROUPS.map((group) => (
              <section
                key={group.title}
                className='rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/60'
              >
                <h3 className='mb-3 text-sm font-medium text-gray-800 dark:text-gray-200'>
                  {group.title}
                </h3>
                <div className='space-y-2'>
                  {group.items.map((item) => (
                    <div
                      key={`${group.title}-${item.description}`}
                      className='flex items-center justify-between gap-4 rounded-lg px-2 py-1.5 transition-colors duration-200 hover:bg-white dark:hover:bg-gray-700/70'
                    >
                      <div className='flex flex-wrap items-center gap-1.5'>
                        {item.keys.map((key, index) => (
                          <span key={`${item.description}-${key}`} className='flex items-center gap-1.5'>
                            {index > 0 && (
                              <span className='text-xs text-gray-400 dark:text-gray-500'>+</span>
                            )}
                            <kbd className='min-w-7 rounded-md border border-gray-300 bg-white px-2 py-1 text-center text-xs font-semibold text-gray-800 shadow-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:shadow-inner dark:shadow-white/5'>
                              {key}
                            </kbd>
                          </span>
                        ))}
                      </div>
                      <span className='text-right text-xs text-gray-600 dark:text-gray-300'>
                        {item.description}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
