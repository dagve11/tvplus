'use client';

import { FileText, Inbox, Pause, Play, ScrollText, Trash2, X } from 'lucide-react';
import React, { useMemo, useState } from 'react';

import { M3U8DownloadTask, M3U8SegmentLogStatus } from '@/lib/m3u8-downloader';

import { useDownload } from '@/contexts/DownloadContext';

export function DownloadPanel() {
  const { tasks, showDownloadPanel, setShowDownloadPanel, startTask, pauseTask, cancelTask, retryFailedSegments, getProgress } = useDownload();
  const [logTaskId, setLogTaskId] = useState<string | null>(null);
  const [logFilter, setLogFilter] = useState<'all' | M3U8SegmentLogStatus>('all');

  const logTask = useMemo(
    () => tasks.find((task) => task.id === logTaskId) || null,
    [logTaskId, tasks]
  );

  const filteredLogs = useMemo(() => {
    if (!logTask) return [];
    const logs = logFilter === 'all'
      ? logTask.segmentLogs
      : logTask.segmentLogs.filter((log) => log.status === logFilter);
    return [...logs].reverse();
  }, [logFilter, logTask]);

  if (!showDownloadPanel) {
    return null;
  }

  const getStatusText = (status: M3U8DownloadTask['status']) => {
    switch (status) {
      case 'ready':
        return '等待中';
      case 'downloading':
        return '下载中';
      case 'pause':
        return '已暂停';
      case 'done':
        return '已完成';
      case 'error':
        return '错误';
      default:
        return '未知';
    }
  };

  const getStatusColor = (status: M3U8DownloadTask['status']) => {
    switch (status) {
      case 'downloading':
      case 'done':
        return 'text-foreground';
      case 'error':
        return 'text-destructive';
      case 'ready':
      case 'pause':
      default:
        return 'text-muted-foreground';
    }
  };

  const getDownloadModeText = (mode: M3U8DownloadTask['downloadMode']) => {
    switch (mode) {
      case 'filesystem':
        return 'File System';
      case 'indexeddb':
        return 'IndexedDB';
      case 'browser':
      default:
        return '浏览器';
    }
  };

  const getLogBadgeClass = (status: M3U8SegmentLogStatus) => {
    switch (status) {
      case 'downloading':
        return 'border-border bg-muted/50 text-muted-foreground';
      case 'success':
        return 'border-foreground/20 bg-muted/50 text-foreground';
      case 'retry':
        return 'border-border bg-muted/50 text-muted-foreground';
      case 'timeout':
      case 'error':
        return 'border-destructive/30 bg-destructive/10 text-destructive';
      case 'aborted':
        return 'border-border bg-muted/50 text-muted-foreground';
      default:
        return 'border-border bg-muted/50 text-muted-foreground';
    }
  };

  const getLogStatusText = (status: M3U8SegmentLogStatus) => {
    switch (status) {
      case 'queued':
        return '排队';
      case 'downloading':
        return '下载中';
      case 'success':
        return '成功';
      case 'retry':
        return '重试';
      case 'error':
        return '失败';
      case 'timeout':
        return '超时';
      case 'aborted':
        return '中止';
      default:
        return status;
    }
  };

  const formatTime = (timestamp: number) => new Date(timestamp).toLocaleTimeString();

  const logStats = logTask ? {
    total: logTask.segmentLogs.length,
    success: logTask.finishList.filter((item) => item.status === 'is-success').length,
    downloading: logTask.finishList.filter((item) => item.status === 'is-downloading').length,
    error: logTask.finishList.filter((item) => item.status === 'is-error').length,
  } : null;

  return (
    <div className='fixed inset-0 z-modal flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-6'>
      <div className='flex max-h-[86vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl'>
        {/* 标题栏 */}
        <div className='flex items-center justify-between border-b border-border bg-background/90 p-4'>
          <div>
            <h2 className='text-xl font-bold text-foreground'>下载任务列表</h2>
            <p className='mt-1 text-xs text-muted-foreground'>支持查看每个分片的下载、重试、超时和失败日志</p>
          </div>
          <button
            onClick={() => setShowDownloadPanel(false)}
            className='cursor-pointer rounded-lg p-2 text-muted-foreground transition-colors duration-200 hover:bg-accent hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring'
            aria-label='关闭下载任务列表'
          >
            <X className='h-6 w-6' />
          </button>
        </div>

        {/* 任务列表 */}
        <div className='flex-1 overflow-y-auto p-4 space-y-3'>
          {tasks.length === 0 ? (
            <div className='flex min-h-[320px] flex-col items-center justify-center text-muted-foreground'>
              <Inbox className='mb-4 h-16 w-16' />
              <p className='text-lg'>暂无下载任务</p>
            </div>
          ) : (
            tasks.map((task) => {
              const progress = getProgress(task.id);
              return (
                <div
                  key={task.id}
                  className='rounded-xl border border-border bg-muted/50 p-4 transition-colors duration-200'
                >
                  {/* 任务信息 */}
                  <div className='mb-3 flex items-start justify-between gap-4'>
                    <div className='min-w-0 flex-1'>
                      <h3 className='mb-1 truncate text-sm font-semibold text-foreground'>
                        {task.title}
                      </h3>
                      <p className='truncate text-sm text-muted-foreground'>{task.url}</p>
                    </div>
                    <div className='flex shrink-0 items-center gap-2'>
                      <span className={`text-xs font-medium ${getStatusColor(task.status)}`}>
                        {getStatusText(task.status)}
                      </span>
                      <span className='rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground'>
                        {task.type}
                      </span>
                      <span className='rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground'>
                        {getDownloadModeText(task.downloadMode)}
                      </span>
                    </div>
                  </div>

                  {/* 进度条 */}
                  <div className='mb-3'>
                    <div className='mb-1 flex items-center justify-between text-xs text-muted-foreground'>
                      <span>
                        {task.finishNum} / {task.rangeDownload.targetSegment} 片段
                      </span>
                      <span>{progress.toFixed(1)}%</span>
                    </div>
                    <div className='h-2 w-full overflow-hidden rounded-full bg-muted'>
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          task.status === 'downloading'
                            ? 'bg-primary motion-safe:animate-pulse'
                            : task.status === 'done'
                            ? 'bg-foreground'
                            : task.status === 'error'
                            ? 'bg-destructive'
                            : 'bg-muted-foreground/40'
                        }`}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* 错误信息 */}
                  {task.errorNum > 0 && (
                    <div className='mb-3 flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2'>
                      <div className='text-xs text-destructive' role='alert'>
                        {task.errorNum} 个片段下载失败
                      </div>
                      <button
                        onClick={() => retryFailedSegments(task.id)}
                        className='cursor-pointer text-xs text-foreground underline transition-colors hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-ring'
                      >
                        重试失败片段
                      </button>
                    </div>
                  )}

                  {/* 操作按钮 */}
                  <div className='flex flex-wrap items-center gap-2'>
                    <button
                      onClick={() => {
                        setLogTaskId(task.id);
                        setLogFilter('all');
                      }}
                      className='flex cursor-pointer items-center gap-1 rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors duration-200 hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring'
                    >
                      <ScrollText className='h-4 w-4' />
                      查看日志
                      {task.segmentLogs.length > 0 && (
                        <span className='rounded-full bg-muted px-1.5 py-0.5 text-micro text-foreground'>
                          {task.segmentLogs.length}
                        </span>
                      )}
                    </button>

                    {task.status === 'downloading' && (
                      <button
                        onClick={() => pauseTask(task.id)}
                        className='flex cursor-pointer items-center gap-1 rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground transition-colors duration-200 hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-ring'
                      >
                        <Pause className='h-4 w-4' />
                        暂停
                      </button>
                    )}

                    {(task.status === 'pause' || task.status === 'ready' || task.status === 'error') && (
                      <button
                        onClick={() => startTask(task.id)}
                        className='flex cursor-pointer items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors duration-200 hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring'
                      >
                        <Play className='h-4 w-4' />
                        {task.status === 'error' ? '重试' : '开始'}
                      </button>
                    )}

                    <button
                      onClick={() => cancelTask(task.id)}
                      className='flex cursor-pointer items-center gap-1 rounded-lg bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground transition-colors duration-200 hover:bg-destructive/90 focus:outline-none focus:ring-2 focus:ring-ring'
                    >
                      <Trash2 className='h-4 w-4' />
                      删除
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 底部统计 */}
        {tasks.length > 0 && (
          <div className='border-t border-border bg-muted/50 p-4'>
            <div className='grid grid-cols-2 gap-2 text-sm text-muted-foreground sm:grid-cols-4'>
              <span>总任务数: {tasks.length}</span>
              <span>下载中: {tasks.filter(t => t.status === 'downloading').length}</span>
              <span>已完成: {tasks.filter(t => t.status === 'done').length}</span>
              <span>已暂停: {tasks.filter(t => t.status === 'pause').length}</span>
            </div>
          </div>
        )}
      </div>

      {logTask && (
        <div className='fixed inset-0 z-popover flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm sm:p-6'>
          <div className='flex max-h-[82vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl'>
            <div className='border-b border-border bg-background/95 p-4'>
              <div className='flex items-start justify-between gap-4'>
                <div className='min-w-0'>
                  <h3 className='truncate text-lg font-bold text-foreground'>分片下载日志</h3>
                  <p className='mt-1 truncate text-sm text-muted-foreground'>{logTask.title}</p>
                </div>
                <button
                  onClick={() => setLogTaskId(null)}
                  className='cursor-pointer rounded-lg p-2 text-muted-foreground transition-colors duration-200 hover:bg-accent hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring'
                  aria-label='关闭分片下载日志'
                >
                  <X className='h-5 w-5' />
                </button>
              </div>

              {logStats && (
                <div className='mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4'>
                  <div className='rounded-xl border border-border bg-muted/50 p-3'>
                    <div className='text-xs text-muted-foreground'>日志数</div>
                    <div className='mt-1 text-lg font-semibold text-foreground'>{logStats.total}</div>
                  </div>
                  <div className='rounded-xl border border-foreground/20 bg-muted/50 p-3'>
                    <div className='text-xs text-foreground'>成功分片</div>
                    <div className='mt-1 text-lg font-semibold text-foreground'>{logStats.success}</div>
                  </div>
                  <div className='rounded-xl border border-border bg-muted/50 p-3'>
                    <div className='text-xs text-muted-foreground'>下载中</div>
                    <div className='mt-1 text-lg font-semibold text-foreground'>{logStats.downloading}</div>
                  </div>
                  <div className='rounded-xl border border-destructive/30 bg-destructive/10 p-3'>
                    <div className='text-xs text-destructive'>失败分片</div>
                    <div className='mt-1 text-lg font-semibold text-destructive'>{logStats.error}</div>
                  </div>
                </div>
              )}

              <div className='mt-4 flex flex-wrap gap-2'>
                {(['all', 'downloading', 'success', 'retry', 'timeout', 'error', 'aborted'] as Array<'all' | M3U8SegmentLogStatus>).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setLogFilter(filter)}
                    className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring ${
                      logFilter === filter
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background text-muted-foreground hover:bg-accent'
                    }`}
                  >
                    {filter === 'all' ? '全部' : getLogStatusText(filter)}
                  </button>
                ))}
              </div>
            </div>

            <div className='flex-1 overflow-y-auto p-4'>
              {filteredLogs.length === 0 ? (
                <div className='flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-border text-muted-foreground'>
                  <FileText className='mb-3 h-10 w-10' />
                  <p className='text-sm'>暂无匹配的分片日志</p>
                </div>
              ) : (
                <div className='space-y-2'>
                  {filteredLogs.map((log) => (
                    <div
                      key={log.id}
                      className='grid gap-3 rounded-xl border border-border bg-card p-3 text-sm md:grid-cols-[120px_110px_1fr_160px]'
                    >
                      <div className='font-mono text-xs text-muted-foreground'>
                        {formatTime(log.timestamp)}
                      </div>
                      <div>
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${getLogBadgeClass(log.status)}`}>
                          {getLogStatusText(log.status)}
                        </span>
                      </div>
                      <div className='min-w-0'>
                        <div className='truncate text-foreground'>{log.message}</div>
                        <div className='mt-1 truncate font-mono text-xs text-muted-foreground'>segment #{log.index + 1}</div>
                      </div>
                      <div className='flex flex-wrap items-center gap-2 text-xs text-muted-foreground md:justify-end'>
                        {typeof log.retryCount === 'number' && <span>重试 {log.retryCount}</span>}
                        {typeof log.durationMs === 'number' && <span>{log.durationMs}ms</span>}
                        {typeof log.httpStatus === 'number' && <span>HTTP {log.httpStatus}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
