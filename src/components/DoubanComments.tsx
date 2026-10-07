'use client';

import { Eye, MessageCircle, Star, ThumbsUp } from 'lucide-react';
import { useCallback,useEffect, useState } from 'react';

import { useEnableComments } from '@/hooks/useEnableComments';

interface DoubanComment {
  id: string;
  userName: string;
  userAvatar: string;
  userUrl: string;
  rating: number | null;
  content: string;
  time: string;
  votes: number;
}

interface DoubanCommentsProps {
  doubanId: number;
}

// 获取运行时配置的类型
interface RuntimeConfig {
  EnableComments: boolean;
}

export default function DoubanComments({ doubanId }: DoubanCommentsProps) {
  const [comments, setComments] = useState<DoubanComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [hasStartedLoading, setHasStartedLoading] = useState(false);
  const limit = 20;

  const enableComments = useEnableComments();

  const fetchComments = useCallback(async (startIndex: number) => {
    try {
      console.log('正在获取评论，起始位置:', startIndex);
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/douban-comments?id=${doubanId}&start=${startIndex}&limit=${limit}`
      );

      if (!response.ok) {
        throw new Error('获取评论失败');
      }

      const data = await response.json();
      console.log('获取到评论数据:', {
        newComments: data.comments.length,
        total: data.total,
        hasMore: data.hasMore,
        start: data.start,
      });

      if (startIndex === 0) {
        setComments(data.comments);
      } else {
        setComments((prev) => {
          console.log('追加评论，之前:', prev.length, '新增:', data.comments.length);
          return [...prev, ...data.comments];
        });
      }

      setTotal(data.total);
      setHasMore(data.hasMore);
      console.log('更新后状态 - hasMore:', data.hasMore, 'total:', data.total);
    } catch (err) {
      console.error('获取评论失败:', err);
      setError(err instanceof Error ? err.message : '获取评论失败');
    } finally {
      setLoading(false);
    }
  }, [doubanId]);

  useEffect(() => {
    // 重置状态当 doubanId 变化时
    setHasStartedLoading(false);
    setComments([]);
    setLoading(false);
    setError(null);
    setTotal(0);
    setHasMore(false);
  }, [doubanId]); // 只在 doubanId 变化时重新获取

  const startLoading = () => {
    console.log('开始加载评论');
    setHasStartedLoading(true);
    fetchComments(0);
  };

  const loadMore = () => {
    console.log('点击加载更多，当前状态:', {
      loading,
      hasMore,
      commentsLength: comments.length,
    });
    if (!loading && hasMore) {
      // 使用当前已加载的评论数量作为下一页的起始位置
      fetchComments(comments.length);
    }
  };

  // 星级渲染
  const renderStars = (rating: number | null) => {
    if (rating === null) return null;

    return (
      <div className='flex items-center gap-0.5'>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={
              star <= rating
                ? 'w-4 h-4 fill-foreground text-foreground'
                : 'w-4 h-4 fill-muted text-muted'
            }
          />
        ))}
      </div>
    );
  };

  // 如果评论功能被禁用，不显示任何内容
  if (!enableComments) {
    return null;
  }

  // 初始状态：显示查看评论按钮
  if (!hasStartedLoading) {
    return (
      <div className='flex flex-col items-center justify-center py-12'>
        <div className='text-muted-foreground mb-4'>
          <MessageCircle className='w-16 h-16 mx-auto mb-4 opacity-50' strokeWidth={1.5} />
          <p className='text-center'>点击查看豆瓣评论</p>
        </div>
        <button
          onClick={startLoading}
          className='px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2'
        >
          <Eye className='w-4 h-4' />
          查看评论
        </button>
      </div>
    );
  }

  if (loading && comments.length === 0) {
    return (
      <div className='flex items-center justify-center py-12'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
        <span className='ml-3 text-muted-foreground'>
          加载评论中...
        </span>
      </div>
    );
  }

  if (error && comments.length === 0) {
    return (
      <div className='text-center py-12'>
        <div className='text-destructive mb-2'>❌</div>
        <p className='text-muted-foreground'>{error}</p>
        <button
          onClick={startLoading}
          className='mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors'
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {/* 头部统计 */}
      {total > 0 && (
        <div className='text-sm text-muted-foreground'>
          {total > comments.length ? `共 ${total} 条短评` : `已加载 ${comments.length} 条短评`}
        </div>
      )}

      {/* 评论列表 */}
      <div className='space-y-4'>
        {comments.map((comment) => (
          <div
            key={comment.id}
            className='bg-muted/50 rounded-lg p-4 hover:bg-muted transition-colors'
          >
            {/* 用户信息 */}
            <div className='flex items-start gap-3 mb-3'>
              {/* 头像 */}
              <a
                href={comment.userUrl}
                target='_blank'
                rel='noopener noreferrer'
                className='flex-shrink-0'
              >
                <img
                  src={comment.userAvatar}
                  alt={comment.userName}
                  className='w-10 h-10 rounded-full'
                  onError={(e) => {
                    e.currentTarget.src =
                      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ccc"%3E%3Cpath d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/%3E%3C/svg%3E';
                  }}
                />
              </a>

              {/* 用户名和评分 */}
              <div className='flex-1 min-w-0'>
                <div className='flex items-center gap-2 flex-wrap'>
                  <a
                    href={comment.userUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='font-medium text-foreground hover:text-foreground/70'
                  >
                    {comment.userName}
                  </a>
                  {renderStars(comment.rating)}
                </div>

                {/* 时间 */}
                <div className='text-xs text-muted-foreground mt-1'>
                  {comment.time}
                </div>
              </div>

              {/* 有用数 */}
              {comment.votes > 0 && (
                <div className='flex items-center gap-1 text-xs text-muted-foreground'>
                  <ThumbsUp className='w-4 h-4' />
                  <span>{comment.votes}</span>
                </div>
              )}
            </div>

            {/* 评论内容 */}
            <div className='text-foreground/80 leading-relaxed whitespace-pre-wrap'>
              {comment.content}
            </div>
          </div>
        ))}
      </div>

      {/* 加载更多按钮 */}
      {hasMore && (
        <div className='flex justify-center pt-4'>
          <button
            onClick={loadMore}
            disabled={loading}
            className='px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
          >
            {loading ? '加载中...' : '加载更多'}
          </button>
        </div>
      )}

      {/* 没有更多了 */}
      {!hasMore && comments.length > 0 && (
        <div className='text-center text-sm text-muted-foreground py-4'>
          没有更多评论了
        </div>
      )}
    </div>
  );
}
