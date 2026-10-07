'use client';

import { AlertCircle, Cloud, Link2, Sparkles, Star } from 'lucide-react';

import { isNetdiskSource } from '@/lib/netdisk/source';
import type { SearchResult } from '@/lib/types';

import FavoriteIcon from '@/components/play/FavoriteIcon';
import ProxyImage from '@/components/ProxyImage';

interface RatingValue {
  value: number;
  count: number;
  star_count: number;
}

interface SourceVideoInfo {
  quality: string;
  loadSpeed: string;
  pingTime: number;
  bitrate: string;
}

interface NetdiskTMDBMeta {
  desc?: string;
  poster?: string;
  year?: string;
  tmdbId?: number;
}

export interface MediaInfoSectionProps {
  tmdbBackdrop: string | null;
  videoTitle: string;
  videoCover: string;
  videoDoubanId: number;
  doubanAka: string[];
  doubanRating: RatingValue | null;
  doubanYear: string;
  videoYear: string;
  netdiskTMDBMeta: NetdiskTMDBMeta | null;
  doubanCardSubtitle: string;
  correctedDesc: string;
  currentSourceVideoInfo: SourceVideoInfo | null;
  detail: SearchResult | null;
  favorited: boolean;
  onToggleFavorite: () => void;
  netdiskSearchEnabled: boolean;
  aiEnabled: boolean;
  onOpenPansou: () => void;
  onOpenAiChat: () => void;
  onOpenDetail: () => void;
  onOpenCorrect: () => void;
  onFetchCurrentSourceVideoInfo: () => void;
}

export default function MediaInfoSection({
  tmdbBackdrop,
  videoTitle,
  videoCover,
  videoDoubanId,
  doubanAka,
  doubanRating,
  doubanYear,
  videoYear,
  netdiskTMDBMeta,
  doubanCardSubtitle,
  correctedDesc,
  currentSourceVideoInfo,
  detail,
  favorited,
  onToggleFavorite,
  netdiskSearchEnabled,
  aiEnabled,
  onOpenPansou,
  onOpenAiChat,
  onOpenDetail,
  onOpenCorrect,
  onFetchCurrentSourceVideoInfo,
}: MediaInfoSectionProps) {
  return (
    <div className='grid grid-cols-1 md:grid-cols-5 lg:grid-cols-6 gap-4'>
      {/* 文字区 */}
      <div className='md:col-span-4 lg:col-span-5'>
        <div className='p-6 flex flex-col min-h-0'>
          {/* 标题 */}
          <h1
            className={`text-3xl font-bold mb-2 tracking-wide flex items-center flex-shrink-0 text-center md:text-left w-full flex-wrap gap-2 ${
              tmdbBackdrop ? 'text-white' : 'text-foreground'
            }`}
          >
            <span className={doubanAka.length > 0 ? 'relative group cursor-help' : ''}>
              {videoTitle || '影片标题'}
              {/* aka 悬浮提示 */}
              {doubanAka.length > 0 && (
                <div className='absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-popover text-popover-foreground text-sm rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-out whitespace-nowrap z-popover pointer-events-none'>
                  <div className='font-semibold text-xs text-muted-foreground mb-1'>
                    又名：
                  </div>
                  {doubanAka.map((name, index) => (
                    <div key={index} className='text-sm'>
                      {name}
                    </div>
                  ))}
                  <div className='absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-popover'></div>
                </div>
              )}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
              className='flex-shrink-0 hover:opacity-80 transition-opacity'
            >
              <FavoriteIcon filled={favorited} />
            </button>
            {/* 网盘搜索按钮 */}
            {netdiskSearchEnabled && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenPansou();
                }}
                className='flex-shrink-0 hover:opacity-80 transition-opacity'
                title='搜索网盘资源'
              >
                <Cloud className='h-6 w-6 text-muted-foreground' />
              </button>
            )}
            {/* AI问片按钮 */}
            {aiEnabled && detail && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenAiChat();
                }}
                className='flex-shrink-0 hover:opacity-80 transition-opacity'
                title='AI问片'
              >
                <Sparkles className='h-6 w-6 text-muted-foreground' />
              </button>
            )}
            {/* 详情按钮 */}
            {detail && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDetail();
                }}
                className='flex-shrink-0 hover:opacity-80 transition-opacity px-2 py-1 text-base font-medium text-muted-foreground'
                title='详情'
              >
                详
              </button>
            )}
            {/* 纠错按钮 - 仅小雅源显示 */}
            {detail && detail.source === 'xiaoya' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenCorrect();
                }}
                className='flex-shrink-0 hover:opacity-80 transition-opacity'
                title='纠错'
              >
                <AlertCircle className='h-6 w-6 text-muted-foreground' />
              </button>
            )}
            {/* 豆瓣评分显示 */}
            {doubanRating && doubanRating.value > 0 && (
              <div className='flex items-center gap-2 text-base font-normal'>
                {/* 星级显示 */}
                <div className='flex items-center gap-1'>
                  {[1, 2, 3, 4, 5].map((star) => {
                    const starValue = doubanRating.value / 2; // 转换为5星制
                    const isFullStar = star <= Math.floor(starValue);
                    const isHalfStar =
                      !isFullStar && star <= Math.ceil(starValue) && starValue % 1 >= 0.25;

                    return (
                      <div key={star} className='relative w-5 h-5'>
                        {isFullStar ? (
                          // 全星
                          <Star className='w-5 h-5 fill-current text-foreground' />
                        ) : isHalfStar ? (
                          // 半星
                          <>
                            <Star className='absolute w-5 h-5 text-muted-foreground' />
                            <Star
                              className='absolute w-5 h-5 fill-current text-foreground'
                              style={{ clipPath: 'inset(0 50% 0 0)' }}
                            />
                          </>
                        ) : (
                          // 空星
                          <Star className='w-5 h-5 text-muted-foreground' />
                        )}
                      </div>
                    );
                  })}
                </div>
                {/* 评分数值 */}
                <span
                  className={`font-semibold ${
                    tmdbBackdrop ? 'text-white' : 'text-muted-foreground'
                  }`}
                >
                  {doubanRating.value.toFixed(1)}
                </span>
                {/* 评分人数 */}
                <span
                  className={`text-sm ${
                    tmdbBackdrop ? 'text-white/80' : 'text-muted-foreground'
                  }`}
                >
                  ({doubanRating.count.toLocaleString()}人评价)
                </span>
              </div>
            )}
          </h1>

          {/* 关键信息行 */}
          <div
            className={`flex flex-wrap items-center gap-3 text-base mb-4 opacity-80 flex-shrink-0 ${
              tmdbBackdrop ? 'text-white' : ''
            }`}
          >
            {detail?.class && (
              <span className='text-foreground font-semibold'>{detail.class}</span>
            )}
            {/* 优先使用 doubanYear，如果没有则使用 detail.year 或 videoYear */}
            {(doubanYear || netdiskTMDBMeta?.year || detail?.year || videoYear) && (
              <span>{doubanYear || netdiskTMDBMeta?.year || detail?.year || videoYear}</span>
            )}
            {detail?.source_name && (
              <span
                className='relative group cursor-pointer border border-border px-2 py-[1px] rounded'
                onClick={onFetchCurrentSourceVideoInfo}
              >
                {detail.source_name}
                {/* 视频信息悬浮提示 */}
                {currentSourceVideoInfo && (
                  <div className='absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-popover text-popover-foreground text-sm rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-out whitespace-nowrap z-popover pointer-events-none'>
                    <div className='text-sm'>
                      <div>分辨率: {currentSourceVideoInfo.quality}</div>
                      <div>码率: {currentSourceVideoInfo.bitrate}</div>
                    </div>
                    <div className='absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-popover'></div>
                  </div>
                )}
              </span>
            )}
            {detail?.type_name && <span>{detail.type_name}</span>}
          </div>
          {/* 剧情简介 */}
          {(doubanCardSubtitle || netdiskTMDBMeta?.desc || correctedDesc || detail?.desc) && (
            <div
              className={`mt-0 text-base leading-relaxed opacity-90 overflow-y-auto pr-2 flex-1 min-h-0 scrollbar-hide ${
                tmdbBackdrop ? 'text-white' : ''
              }`}
              style={{ whiteSpace: 'pre-line' }}
            >
              {/* card_subtitle 在前，desc 在后 */}
              {doubanCardSubtitle && (
                <div className='mb-3 pb-3 border-b border-border'>{doubanCardSubtitle}</div>
              )}
              {netdiskTMDBMeta?.desc || correctedDesc || detail?.desc}
            </div>
          )}
        </div>
      </div>

      {/* 封面展示 */}
      <div className='hidden md:block md:col-span-1 md:order-first'>
        <div className='pl-0 py-4 pr-6 max-w-sm mx-auto'>
          <div className='relative bg-muted aspect-[2/3] flex items-center justify-center rounded-xl overflow-hidden'>
            {videoCover ? (
              <>
                <ProxyImage
                  originalSrc={videoCover}
                  alt={videoTitle}
                  className='w-full h-full object-cover'
                />

                {/* 豆瓣链接按钮 */}
                {videoDoubanId !== 0 && (
                  <a
                    href={`https://movie.douban.com/subject/${videoDoubanId.toString()}`}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='absolute top-3 left-3'
                  >
                    <div className='bg-primary text-primary-foreground text-xs font-bold w-8 h-8 rounded-full flex items-center justify-center shadow-md hover:bg-primary/90 hover:scale-[1.1] transition-all duration-300 ease-out'>
                      <Link2 className='w-4 h-4' />
                    </div>
                  </a>
                )}
              </>
            ) : isNetdiskSource(detail?.source) ? (
              <div className='flex flex-col items-center justify-center text-muted-foreground'>
                <Cloud className='w-16 h-16 opacity-80' />
              </div>
            ) : (
              <span className='text-muted-foreground'>封面图片</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
