'use client';

import type { SearchResult } from '@/lib/types';

type SeriesStatus = 'completed' | 'ongoing' | 'unknown';
type PlaybackSourceBadge = 'local' | 'offline' | null;

export interface VideoHeaderProps {
  tmdbBackdrop: string | null;
  videoTitle: string;
  shouldShowEpisodeLabel: boolean;
  episodeLabel: string;
  detail: SearchResult | null;
  totalEpisodes: number;
  playbackSourceBadge: PlaybackSourceBadge;
}

/** 通过 vod_remarks / vod_total 推断连载状态（与 page 原实现一致） */
function getSeriesStatus(detail: SearchResult | null): SeriesStatus {
  if (!detail) return 'unknown';

  // 方法1：通过 vod_remarks 判断
  if (detail.vod_remarks) {
    const remarks = detail.vod_remarks.toLowerCase();
    const completedKeywords = ['全', '完结', '大结局', 'end', '完'];
    const ongoingKeywords = ['更新至', '连载', '第', '更新到'];

    if (ongoingKeywords.some((keyword) => remarks.includes(keyword))) {
      return 'ongoing';
    }
    if (completedKeywords.some((keyword) => remarks.includes(keyword))) {
      return 'completed';
    }
  }

  // 方法2：通过 vod_total 和实际集数对比判断
  if (detail.vod_total && detail.vod_total > 0 && detail.episodes && detail.episodes.length > 0) {
    if (detail.episodes.length >= detail.vod_total) {
      return 'completed';
    }
    return 'ongoing';
  }

  return 'unknown';
}

export default function VideoHeader({
  tmdbBackdrop,
  videoTitle,
  shouldShowEpisodeLabel,
  episodeLabel,
  detail,
  totalEpisodes,
  playbackSourceBadge,
}: VideoHeaderProps) {
  return (
    <div className='py-1'>
      <h1
        className={`text-xl font-semibold flex items-center gap-2 flex-wrap ${
          tmdbBackdrop ? 'text-white' : 'text-foreground'
        }`}
      >
        <span>
          {videoTitle || '影片标题'}
          {shouldShowEpisodeLabel && (
            <span className={tmdbBackdrop ? 'text-white opacity-80' : 'text-muted-foreground'}>
              {` > ${episodeLabel}`}
            </span>
          )}
        </span>
        {/* 完结状态标识 */}
        {detail &&
          totalEpisodes > 1 &&
          (() => {
            const status = getSeriesStatus(detail);
            if (status === 'unknown') return null;

            return (
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  status === 'completed'
                    ? 'bg-muted text-muted-foreground'
                    : 'bg-accent text-accent-foreground'
                }`}
              >
                {status === 'completed' ? '已完结' : '连载中'}
              </span>
            );
          })()}
        {playbackSourceBadge && (
          <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary text-primary-foreground'>
            {playbackSourceBadge === 'local' ? '本地播放' : '离线播放'}
          </span>
        )}
      </h1>
    </div>
  );
}
