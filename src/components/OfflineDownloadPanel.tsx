'use client';

import { Film, Inbox, RefreshCw, Trash2, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface OfflineDownloadTask {
  id: string;
  source: string;
  videoId: string;
  episodeIndex: number;
  title: string;
  m3u8Url: string;
  status: 'pending' | 'downloading' | 'completed' | 'error' | 'paused';
  progress: number;
  totalSegments: number;
  downloadedSegments: number;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
  downloadDir: string;
  metadata?: {
    videoTitle?: string;
    cover?: string;
    description?: string;
    year?: string;
    rating?: number;
    totalEpisodes?: number;
  };
}

interface OfflineDownloadPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OfflineDownloadPanel({ isOpen, onClose }: OfflineDownloadPanelProps) {
  const [tasks, setTasks] = useState<OfflineDownloadTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState<'tasks' | 'library'>('tasks'); // 视图模式：任务列表或视频库

  // 确保只在客户端渲染
  useEffect(() => {
    setMounted(true);
  }, []);

  // 获取任务列表
  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/offline-download');
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
      }
    } catch (error) {
      console.error('获取离线下载任务列表失败:', error);
    }
  };

  // 删除任务
  const handleDeleteTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/offline-download?taskId=${taskId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // 从列表中移除
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
      } else {
        const data = await response.json();
        alert(`删除失败: ${data.error}`);
      }
    } catch (error) {
      console.error('删除任务失败:', error);
      alert('删除任务失败');
    }
  };

  // 重试任务
  const handleRetryTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/offline-download?taskId=${taskId}&action=retry`, {
        method: 'PUT',
      });

      if (response.ok) {
        const data = await response.json();
        // 更新任务状态（保留进度，只重试失败的片段）
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  status: 'pending',
                  errorMessage: undefined,
                  updatedAt: new Date().toISOString(),
                }
              : t
          )
        );
        // 立即刷新以获取最新状态
        fetchTasks();
      } else {
        const data = await response.json();
        alert(`重试失败: ${data.error}`);
      }
    } catch (error) {
      console.error('重试任务失败:', error);
      alert('重试任务失败');
    }
  };

  // 定期刷新任务列表
  useEffect(() => {
    if (isOpen) {
      fetchTasks();
      const interval = setInterval(fetchTasks, 3000); // 每3秒刷新一次
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen || !mounted) {
    return null;
  }

  const getStatusText = (status: OfflineDownloadTask['status']) => {
    switch (status) {
      case 'pending':
        return '等待中';
      case 'downloading':
        return '下载中';
      case 'paused':
        return '已暂停';
      case 'completed':
        return '已完成';
      case 'error':
        return '错误';
      default:
        return '未知';
    }
  };

  const getStatusColor = (status: OfflineDownloadTask['status']) => {
    switch (status) {
      case 'pending':
        return 'text-muted-foreground';
      case 'downloading':
        return 'text-primary';
      case 'paused':
        return 'text-muted-foreground';
      case 'completed':
        return 'text-foreground';
      case 'error':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  // 获取视频库中的视频（按videoId分组，包含已完成和有进度的任务）
  const getLibraryVideos = () => {
    // 筛选已完成或有下载进度的任务
    const libraryTasks = tasks.filter((t) => t.status === 'completed' || t.progress > 0);
    const videoMap = new Map<string, { video: OfflineDownloadTask; episodes: OfflineDownloadTask[] }>();

    libraryTasks.forEach((task) => {
      const key = `${task.source}_${task.videoId}`;
      if (!videoMap.has(key)) {
        videoMap.set(key, { video: task, episodes: [] });
      }
      videoMap.get(key)!.episodes.push(task);
    });

    // 按集数排序
    videoMap.forEach((value) => {
      value.episodes.sort((a, b) => a.episodeIndex - b.episodeIndex);
    });

    return Array.from(videoMap.values());
  };

  const libraryVideos = getLibraryVideos();

  const panelContent = (
    <div className='fixed inset-0 z-modal flex items-center justify-center bg-black/50 backdrop-blur-sm p-4'>
      <div className='bg-card rounded-lg shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col'>
        {/* 标题栏 */}
        <div className='flex items-center justify-between p-4 border-b border-border'>
          <h2 className='text-xl font-bold text-foreground'>
            {viewMode === 'tasks' ? '离线下载任务列表' : '视频库'}
          </h2>
          <div className='flex items-center gap-3'>
            {/* 视图切换按钮 */}
            <div className='flex gap-2'>
              <button
                onClick={() => setViewMode('tasks')}
                className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                  viewMode === 'tasks'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-accent'
                }`}
              >
                任务列表
              </button>
              <button
                onClick={() => setViewMode('library')}
                className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                  viewMode === 'library'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-accent'
                }`}
              >
                视频库 ({libraryVideos.length})
              </button>
            </div>
            {/* 关闭按钮 */}
            <button
              onClick={onClose}
              className='text-muted-foreground hover:text-foreground transition-colors'
            >
              <X className='w-6 h-6' />
            </button>
          </div>
        </div>

        {/* 内容区域 */}
        <div className='flex-1 overflow-y-auto p-4 space-y-3'>
          {loading ? (
            <div className='flex items-center justify-center h-full'>
              <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary'></div>
            </div>
          ) : viewMode === 'library' ? (
            // 视频库视图
            libraryVideos.length === 0 ? (
              <div className='flex flex-col items-center justify-center h-full text-muted-foreground'>
                <Film className='w-16 h-16 mb-4' />
                <p className='text-lg'>暂无已完成的视频</p>
              </div>
            ) : (
              libraryVideos.map(({ video, episodes }) => (
                <div
                  key={`${video.source}_${video.videoId}`}
                  className='bg-muted rounded-lg p-4 border border-border'
                >
                  <div className='flex gap-4'>
                    {/* 封面图 */}
                    {video.metadata?.cover && (
                      <div className='flex-shrink-0'>
                        <img
                          src={video.metadata.cover}
                          alt={video.metadata.videoTitle || video.title}
                          className='w-32 h-48 object-cover rounded'
                        />
                      </div>
                    )}
                    {/* 视频信息 */}
                    <div className='flex-1 min-w-0'>
                      <h3 className='text-lg font-bold text-foreground mb-2'>
                        {video.metadata?.videoTitle || video.title}
                      </h3>
                      {video.metadata?.year && (
                        <p className='text-sm text-muted-foreground mb-1'>年份: {video.metadata.year}</p>
                      )}
                      {video.metadata?.rating && (
                        <p className='text-sm text-muted-foreground mb-1'>
                          评分: {video.metadata.rating.toFixed(1)}
                        </p>
                      )}
                      {video.metadata?.description && (
                        <p className='text-sm text-muted-foreground mb-3 line-clamp-2'>
                          {video.metadata.description}
                        </p>
                      )}
                      <div className='flex items-center gap-2 mb-3'>
                        <span className='text-sm text-muted-foreground'>
                          已下载 {episodes.length} 集
                        </span>
                        {video.metadata?.totalEpisodes && (
                          <span className='text-sm text-muted-foreground'>
                            / 共 {video.metadata.totalEpisodes} 集
                          </span>
                        )}
                      </div>
                      {/* 集数列表 */}
                      <div className='flex flex-wrap gap-2 mb-3'>
                        {episodes.map((ep) => (
                          <div
                            key={ep.id}
                            className='flex items-center gap-1 px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded group'
                          >
                            <span>第{ep.episodeIndex + 1}集</span>
                            <button
                              onClick={() => {
                                if (confirm(`确定要删除第${ep.episodeIndex + 1}集吗？`)) {
                                  handleDeleteTask(ep.id);
                                }
                              }}
                              className='ml-1 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive/80'
                              title='删除此集'
                            >
                              <X className='w-3 h-3' />
                            </button>
                          </div>
                        ))}
                      </div>
                      {/* 删除全部按钮 */}
                      <button
                        onClick={() => {
                          if (confirm(`确定要删除《${video.metadata?.videoTitle || video.title}》的所有已下载集数吗？`)) {
                            episodes.forEach((ep) => handleDeleteTask(ep.id));
                          }
                        }}
                        className='flex items-center gap-1 px-3 py-1.5 bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs font-medium rounded transition-colors'
                      >
                        <Trash2 className='w-4 h-4' />
                        删除全部集数
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )
          ) : tasks.length === 0 ? (
            // 任务列表为空
            <div className='flex flex-col items-center justify-center h-full text-muted-foreground'>
              <Inbox className='w-16 h-16 mb-4' />
              <p className='text-lg'>暂无离线下载任务</p>
            </div>
          ) : (
            // 任务列表视图
            tasks.map((task) => (
              <div
                key={task.id}
                className='bg-muted rounded-lg p-4 border border-border'
              >
                {/* 任务信息 */}
                <div className='flex items-start justify-between mb-3'>
                  <div className='flex-1 min-w-0'>
                    <h3 className='text-sm font-medium text-foreground truncate mb-1'>
                      {task.title}
                    </h3>
                    <p className='text-xs text-muted-foreground'>
                      来源: {task.source} | 视频ID: {task.videoId} | 第{task.episodeIndex + 1}集
                    </p>
                  </div>
                  <div className='flex items-center gap-2 ml-4'>
                    <span className={`text-xs font-medium ${getStatusColor(task.status)}`}>
                      {getStatusText(task.status)}
                    </span>
                  </div>
                </div>

                {/* 进度条 */}
                {task.totalSegments > 0 && (
                  <div className='mb-3'>
                    <div className='flex items-center justify-between text-xs text-muted-foreground mb-1'>
                      <span>
                        {task.downloadedSegments} / {task.totalSegments} 片段
                      </span>
                      <span>{task.progress.toFixed(1)}%</span>
                    </div>
                    <div className='w-full bg-muted rounded-full h-2 overflow-hidden'>
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          task.status === 'downloading'
                            ? 'bg-primary animate-pulse'
                            : task.status === 'completed'
                            ? 'bg-foreground'
                            : task.status === 'error'
                            ? 'bg-destructive'
                            : 'bg-muted-foreground'
                        }`}
                        style={{ width: `${task.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* 错误信息 */}
                {task.errorMessage && (
                  <div className='mb-3'>
                    <div className='text-xs text-destructive'>{task.errorMessage}</div>
                  </div>
                )}

                {/* 时间信息 */}
                <div className='flex items-center justify-between text-xs text-muted-foreground mb-3'>
                  <span>创建: {new Date(task.createdAt).toLocaleString('zh-CN')}</span>
                  <span>更新: {new Date(task.updatedAt).toLocaleString('zh-CN')}</span>
                </div>

                {/* 操作按钮 */}
                <div className='flex items-center gap-2'>
                  {/* 重试按钮 - 只在错误或暂停状态显示 */}
                  {(task.status === 'error' || task.status === 'paused') && (
                    <button
                      onClick={() => handleRetryTask(task.id)}
                      className='flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium rounded transition-colors'
                    >
                      <RefreshCw className='w-4 h-4' />
                      重试
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className='flex items-center gap-1 px-3 py-1.5 bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs font-medium rounded transition-colors'
                  >
                    <Trash2 className='w-4 h-4' />
                    删除
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(panelContent, document.body);
}
