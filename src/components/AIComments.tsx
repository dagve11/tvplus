'use client';

import { Monitor, RefreshCw, Star, ThumbsUp, Zap } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';

interface AIComment {
  id: string;
  userName: string;
  userAvatar: string;
  rating: number | null;
  content: string;
  time: string;
  votes: number;
  isAiGenerated: true;
}

interface AICommentsProps {
  movieName: string;
  movieInfo?: string;
}

export default function AIComments({ movieName, movieInfo }: AICommentsProps) {
  const [comments, setComments] = useState<AIComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasStartedLoading, setHasStartedLoading] = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      console.log('正在生成AI评论...');
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        name: movieName,
        count: '10',
        _t: Date.now().toString(), // 添加时间戳防止缓存
      });

      if (movieInfo) {
        params.append('info', movieInfo);
      }

      const response = await fetch(`/api/ai-comments?${params.toString()}`, {
        cache: 'no-store', // 禁用缓存
      });

      // 服务端流式返回一个 JSON（生成期间发送空白心跳避免网关超时），
      // JSON 前导空白会被忽略，这里照常解析即可。
      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || '生成AI评论失败');
      }

      console.log('AI评论生成成功:', data.comments?.length ?? 0);
      setComments(data.comments || []);
    } catch (err) {
      console.error('生成AI评论失败:', err);
      setError(err instanceof Error ? err.message : '生成AI评论失败');
    } finally {
      setLoading(false);
    }
  }, [movieName, movieInfo]);

  useEffect(() => {
    // 重置状态当 movieName 变化时
    setHasStartedLoading(false);
    setComments([]);
    setLoading(false);
    setError(null);
  }, [movieName]);

  const startLoading = () => {
    console.log('开始生成AI评论');
    setHasStartedLoading(true);
    fetchComments();
  };

  const regenerate = () => {
    console.log('重新生成AI评论');
    fetchComments();
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

  // 初始状态：显示生成按钮
  if (!hasStartedLoading) {
    return (
      <div className='flex flex-col items-center justify-center py-12'>
        <div className='text-muted-foreground mb-4'>
          <Monitor className='w-16 h-16 mx-auto mb-4 opacity-50' strokeWidth={1.5} />
          <p className='text-center'>点击生成AI评论</p>
          <p className='text-xs text-center mt-2 text-muted-foreground'>
            基于影片信息和网络资料生成
          </p>
        </div>
        <button
          onClick={startLoading}
          className='px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2'
        >
          <Zap className='w-4 h-4' />
          生成AI评论
        </button>
      </div>
    );
  }

  if (loading && comments.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-12'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3'></div>
        <span className='text-muted-foreground'>AI正在生成评论...</span>
        <span className='text-xs text-muted-foreground mt-2'>
          这可能需要几秒钟
        </span>
      </div>
    );
  }

  if (error && comments.length === 0) {
    return (
      <div className='text-center py-12'>
        <div className='text-destructive mb-2'>❌</div>
        <p className='text-muted-foreground mb-1'>{error}</p>
        <p className='text-xs text-muted-foreground mb-4'>
          请检查管理面板的AI配置是否正确
        </p>
        <button
          onClick={startLoading}
          className='px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors'
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {/* 头部统计和操作 */}
      <div className='flex items-center justify-between'>
        <div className='text-sm text-muted-foreground'>
          已生成 {comments.length} 条AI评论
        </div>
        <button
          onClick={regenerate}
          disabled={loading}
          className='text-sm px-3 py-1 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1'
        >
          <RefreshCw className='w-4 h-4' />
          {loading ? '生成中...' : '重新生成'}
        </button>
      </div>

      {/* 评论列表 */}
      <div className='space-y-4'>
        {comments.map((comment) => (
          <div
            key={comment.id}
            className='bg-muted/50 rounded-lg p-4 hover:bg-muted transition-colors border border-border'
          >
            {/* 用户信息 */}
            <div className='flex items-start gap-3 mb-3'>
              {/* 头像 */}
              <div className='flex-shrink-0'>
                <img
                  src={comment.userAvatar}
                  alt={comment.userName}
                  className='w-10 h-10 rounded-full'
                />
              </div>

              {/* 用户名和评分 */}
              <div className='flex-1 min-w-0'>
                <div className='flex items-center gap-2 flex-wrap'>
                  <span className='font-medium text-foreground'>
                    {comment.userName}
                  </span>
                  {renderStars(comment.rating)}
                  {/* AI标识 */}
                  <Badge variant='secondary' className='gap-1 rounded-full'>
                    <Zap className='w-3 h-3' />
                    AI生成
                  </Badge>
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

      {/* 提示信息 */}
      <div className='text-center text-xs text-muted-foreground py-2 border-t border-border'>
        以上评论由AI基于影片信息和网络资料生成，仅供参考
      </div>
    </div>
  );
}
