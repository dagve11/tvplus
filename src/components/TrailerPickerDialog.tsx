'use client';

import { ExternalLink, Film, Loader2, PlayCircle, Youtube, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import type { TMDBVideoItem } from '@/lib/tmdb.client';

interface TrailerPickerDialogProps {
  isOpen: boolean;
  title: string;
  videos: TMDBVideoItem[];
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onRetry?: () => void;
  onSelect: (video: TMDBVideoItem) => void;
}

export default function TrailerPickerDialog({
  isOpen,
  title,
  videos,
  loading = false,
  error = null,
  onClose,
  onRetry,
  onSelect,
}: TrailerPickerDialogProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const sortedVideos = useMemo(() => {
    return [...videos].sort((a, b) => {
      const aOfficial = a.official ? 1 : 0;
      const bOfficial = b.official ? 1 : 0;
      if (aOfficial !== bOfficial) return bOfficial - aOfficial;
      const aTrailer = a.type === 'Trailer' ? 1 : 0;
      const bTrailer = b.type === 'Trailer' ? 1 : 0;
      if (aTrailer !== bTrailer) return bTrailer - aTrailer;
      return (b.published_at || '').localeCompare(a.published_at || '');
    });
  }, [videos]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className='fixed inset-0 z-modal flex items-end sm:items-center justify-center'>
      <div className='absolute inset-0 bg-black/60 backdrop-blur-sm' onClick={onClose} />
      <div className='relative w-full sm:max-w-2xl max-h-[85vh] overflow-hidden rounded-t-2xl sm:rounded-2xl bg-card shadow-2xl border border-border'>
        <div className='flex items-start justify-between gap-4 border-b border-border px-4 sm:px-6 py-4'>
          <div className='min-w-0'>
            <div className='flex items-center gap-2 text-muted-foreground text-sm mb-1'>
              <Film size={16} />
              选择预告片
            </div>
            <h3 className='text-lg font-semibold text-foreground truncate'>
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className='rounded-full p-2 text-muted-foreground hover:bg-accent transition-colors'
            aria-label='关闭'
          >
            <X size={20} />
          </button>
        </div>

        <div className='max-h-[calc(85vh-72px)] overflow-y-auto p-4 sm:p-6'>
          {loading ? (
            <div className='space-y-3'>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className='flex items-center gap-4 rounded-xl border border-border bg-muted px-4 py-4 animate-pulse'
                >
                  <div className='h-11 w-11 rounded-full bg-muted' />
                  <div className='flex-1 space-y-2'>
                    <div className='h-4 w-2/3 rounded bg-muted' />
                    <div className='h-3 w-1/3 rounded bg-muted' />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className='rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive'>
              <div className='mb-3 font-medium'>{error}</div>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className='inline-flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-destructive-foreground transition-colors hover:bg-destructive/90'
                >
                  <Loader2 size={16} className='animate-spin' />
                  重试
                </button>
              )}
            </div>
          ) : sortedVideos.length === 0 ? (
            <div className='flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted px-6 py-12 text-center'>
              <Youtube className='mb-3 h-12 w-12 text-muted-foreground' />
              <h4 className='text-base font-medium text-foreground'>
                未找到预告片
              </h4>
              <p className='mt-2 text-sm text-muted-foreground'>
                该影片在 TMDB 中没有可用的 YouTube 视频。
              </p>
            </div>
          ) : (
            <div className='space-y-3'>
              {sortedVideos.map((video) => (
                <button
                  key={video.id}
                  onClick={() => onSelect(video)}
                  className='group w-full rounded-xl border border-border bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-foreground/40 hover:shadow-lg hover:shadow-foreground/5'
                >
                  <div className='flex items-start gap-4'>
                    <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted text-foreground'>
                      <PlayCircle size={22} />
                    </div>
                    <div className='min-w-0 flex-1'>
                      <div className='flex flex-wrap items-center gap-2'>
                        <h4 className='truncate text-sm font-semibold text-foreground'>
                          {video.name}
                        </h4>
                        {video.official && (
                          <span className='rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground'>
                            官方
                          </span>
                        )}
                        {video.type && (
                          <span className='rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground'>
                            {video.type}
                          </span>
                        )}
                      </div>
                      <p className='mt-1 text-xs text-muted-foreground'>
                        {video.site} · {video.published_at || '发布时间未知'}
                      </p>
                    </div>
                    <ExternalLink size={16} className='mt-1 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground' />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
