import type { DanmakuAnime } from '@/lib/danmaku/types';

interface DanmakuSourceSelectorProps {
  /** 是否显示选择器（对应 page 的 showDanmakuSourceSelector） */
  show: boolean;
  /** 匹配到的弹幕源列表（对应 page 的 danmakuMatches） */
  danmakuMatches: DanmakuAnime[];
  /** 选中某个弹幕源（对应 page 的 handleDanmakuSourceSelect） */
  onSelect: (anime: DanmakuAnime, index: number) => void;
  /** 取消选择（对应关闭选择器并清空匹配列表） */
  onCancel: () => void;
}

export default function DanmakuSourceSelector({
  show,
  danmakuMatches,
  onSelect,
  onCancel,
}: DanmakuSourceSelectorProps) {
  if (!show || danmakuMatches.length === 0) {
    return null;
  }

  return (
    <div className='fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm'>
      <div className='relative w-full max-w-2xl max-h-[80vh] mx-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden'>
        {/* 标题栏 */}
        <div className='sticky top-0 z-10 bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4'>
          <h3 className='text-xl font-bold text-white flex items-center gap-2'>
            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z' />
            </svg>
            选择弹幕源
          </h3>
          <p className='text-sm text-white/90 mt-1'>
            找到 {danmakuMatches.length} 个匹配的弹幕源，请选择一个
          </p>
        </div>

        {/* 列表区域 */}
        <div className='overflow-y-auto max-h-[60vh] p-4'>
          <div className='space-y-4'>
            {danmakuMatches.map((anime, index) => (
              <button
                key={anime.animeId}
                onClick={() => onSelect(anime, index)}
                className='w-full flex flex-col p-5 bg-gray-50 dark:bg-gray-700/50
                         hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all
                         duration-200 text-left group border-2 border-transparent
                         hover:border-green-500 hover:shadow-lg'
              >
                {/* 顶部：序号和标题 */}
                <div className='flex items-start gap-3 mb-3'>
                  {/* 序号 */}
                  <div className='flex-shrink-0 w-8 h-8 rounded-full bg-green-500 text-white
                                flex items-center justify-center font-bold text-sm
                                group-hover:bg-green-600 transition-colors duration-200'>
                    {index + 1}
                  </div>

                  {/* 标题 */}
                  <h4 className='flex-1 text-lg font-bold text-gray-900 dark:text-white
                               group-hover:text-green-600 dark:group-hover:text-green-400
                               transition-colors duration-200 leading-tight'>
                    {anime.animeTitle}
                  </h4>

                  {/* 选择图标 */}
                  <div className='flex-shrink-0'>
                    <svg className='w-6 h-6 text-gray-400 group-hover:text-green-500
                                  transition-colors duration-200'
                      fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2}
                        d='M9 5l7 7-7 7' />
                    </svg>
                  </div>
                </div>

                {/* 主体内容 */}
                <div className='flex gap-4'>
                  {/* 封面 */}
                  {anime.imageUrl && (
                    <div className='flex-shrink-0 w-20 h-28 rounded-lg overflow-hidden shadow-md
                                  group-hover:shadow-xl transition-shadow duration-200'>
                      <img
                        src={anime.imageUrl}
                        alt={anime.animeTitle}
                        className='w-full h-full object-cover'
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  {/* 详细信息 */}
                  <div className='flex-1 space-y-2'>
                    {/* 基本信息标签 */}
                    <div className='flex flex-wrap gap-2'>
                      {anime.typeDescription && (
                        <span className='inline-flex items-center px-2.5 py-1 rounded-md
                                       bg-blue-100 dark:bg-blue-900/30 text-blue-700
                                       dark:text-blue-300 text-sm font-medium'>
                          📺 {anime.typeDescription}
                        </span>
                      )}
                      {anime.episodeCount && (
                        <span className='inline-flex items-center px-2.5 py-1 rounded-md
                                       bg-purple-100 dark:bg-purple-900/30 text-purple-700
                                       dark:text-purple-300 text-sm font-medium'>
                          🎬 {anime.episodeCount} 集
                        </span>
                      )}
                      {anime.startDate && (
                        <span className='inline-flex items-center px-2.5 py-1 rounded-md
                                       bg-gray-100 dark:bg-gray-600 text-gray-700
                                       dark:text-gray-300 text-sm font-medium'>
                          📅 {anime.startDate}
                        </span>
                      )}
                    </div>

                    {/* 动漫ID */}
                    <div className='text-xs text-gray-500 dark:text-gray-400'>
                      弹幕库 ID: {anime.animeId}
                    </div>

                    {/* 提示信息 */}
                    <div className='text-sm text-gray-600 dark:text-gray-300 pt-1
                                  opacity-0 group-hover:opacity-100 transition-opacity duration-200'>
                      点击选择此弹幕源
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 底部操作栏 */}
        <div className='sticky bottom-0 z-10 bg-white dark:bg-gray-800 border-t
                      border-gray-200 dark:border-gray-700 px-6 py-4'>
          <button
            onClick={onCancel}
            className='w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-700
                     hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700
                     dark:text-gray-300 rounded-lg font-medium transition-colors
                     duration-200'
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
}
