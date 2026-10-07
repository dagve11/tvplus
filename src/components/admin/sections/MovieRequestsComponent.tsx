'use client';

import { useEffect, useState } from 'react';

import { AdminConfig } from '@/lib/admin.types';

import {
  adminButtonStyles,
  showError,
  showSuccess,
  useAdminAlert,
  useLoadingState,
} from '@/components/admin/shared';


export const MovieRequestsComponent = ({
  config,
  refreshConfig,
}: {
  config: AdminConfig | null;
  refreshConfig: () => Promise<void>;
}) => {
  const { alertElement } = useAdminAlert();
  const { isLoading, withLoading } = useLoadingState();
  const [requests, setRequests] = useState<any[]>([]);
  const [filter, setFilter] = useState<'pending' | 'fulfilled'>('pending');
  const [pendingCount, setPendingCount] = useState(0);
  const [fulfilledCount, setFulfilledCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // 求片功能设置
  const [enableMovieRequest, setEnableMovieRequest] = useState(
    config?.SiteConfig?.EnableMovieRequest ?? true
  );
  const [movieRequestCooldown, setMovieRequestCooldown] = useState(
    config?.SiteConfig?.MovieRequestCooldown ?? 3600
  );
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    loadRequests();
    loadCounts();
  }, [filter]);

  const loadCounts = async () => {
    try {
      const response = await fetch('/api/movie-requests');
      const data = await response.json();
      const allRequests = data.requests || [];
      setPendingCount(
        allRequests.filter((r: any) => r.status === 'pending').length
      );
      setFulfilledCount(
        allRequests.filter((r: any) => r.status === 'fulfilled').length
      );
    } catch (error) {
      console.error('加载求片数量失败:', error);
    }
  };

  const loadRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/movie-requests?status=${filter}&detail=true`
      );
      const data = await response.json();
      setRequests(data.requests || []);
    } catch (error) {
      console.error('加载求片列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFulfill = async (id: string) => {
    await withLoading(`fulfill_${id}`, async () => {
      try {
        const response = await fetch(`/api/movie-requests/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'fulfilled' }),
        });
        if (!response.ok) throw new Error('操作失败');
        showSuccess('已标记为已上架');
        await loadRequests();
      } catch (err) {
        showError(err instanceof Error ? err.message : '操作失败');
      }
    });
  };

  const handleDelete = async (id: string) => {
    await withLoading(`delete_${id}`, async () => {
      try {
        const response = await fetch(`/api/movie-requests/${id}`, {
          method: 'DELETE',
        });
        if (!response.ok) throw new Error('删除失败');
        showSuccess('删除成功');
        await loadRequests();
      } catch (err) {
        showError(err instanceof Error ? err.message : '删除失败');
      }
    });
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      if (!config) throw new Error('配置未加载');

      const updatedConfig = {
        ...config,
        SiteConfig: {
          ...config.SiteConfig,
          EnableMovieRequest: enableMovieRequest,
          MovieRequestCooldown: movieRequestCooldown,
        },
      };

      const response = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedConfig),
      });

      if (!response.ok) throw new Error('保存失败');

      showSuccess('求片设置已保存');
      await refreshConfig();
    } catch (err) {
      showError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className='space-y-4'>
      {/* 求片功能设置 */}
      <div className='p-4 bg-card  rounded-lg border border-border '>
        <h3 className='text-lg font-medium text-foreground  mb-4'>
          求片功能设置
        </h3>
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div>
              <label className='text-sm font-medium text-foreground '>
                启用求片功能
              </label>
              <p className='text-xs text-muted-foreground  mt-1'>
                关闭后用户将无法访问求片页面
              </p>
            </div>
            <label className='relative inline-flex items-center cursor-pointer'>
              <input
                type='checkbox'
                checked={enableMovieRequest}
                onChange={(e) => setEnableMovieRequest(e.target.checked)}
                className='sr-only peer'
              />
              <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-ring  rounded-full peer  peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-card after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all  peer-checked:bg-primary"></div>
            </label>
          </div>

          <div>
            <label className='block text-sm font-medium text-foreground  mb-2'>
              求片冷却时间（秒）
            </label>
            <p className='text-xs text-muted-foreground  mb-2'>
              用户两次求片之间的最小间隔时间，默认3600秒（1小时）
            </p>
            <input
              type='number'
              min='0'
              value={movieRequestCooldown}
              onChange={(e) =>
                setMovieRequestCooldown(parseInt(e.target.value) || 0)
              }
              className='w-full px-3 py-2 border border-border  rounded-lg bg-card  text-foreground '
            />
            <p className='text-xs text-muted-foreground  mt-1'>
              {movieRequestCooldown >= 3600
                ? `约 ${Math.floor(
                    movieRequestCooldown / 3600
                  )} 小时 ${Math.floor(
                    (movieRequestCooldown % 3600) / 60
                  )} 分钟`
                : movieRequestCooldown >= 60
                ? `约 ${Math.floor(movieRequestCooldown / 60)} 分钟`
                : `${movieRequestCooldown} 秒`}
            </p>
          </div>

          <button
            onClick={handleSaveSettings}
            disabled={savingSettings}
            className={adminButtonStyles.primary}
          >
            {savingSettings ? '保存中...' : '保存设置'}
          </button>
        </div>
      </div>

      {/* 求片列表 */}
      <div className='p-4 bg-card  rounded-lg border border-border '>
        <h3 className='text-lg font-medium text-foreground  mb-4'>求片列表</h3>
        <div className='flex gap-2 mb-4'>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'pending'
                ? 'bg-primary text-foreground'
                : 'bg-muted  text-foreground '
            }`}
          >
            待处理 ({pendingCount})
          </button>
          <button
            onClick={() => setFilter('fulfilled')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'fulfilled'
                ? 'bg-primary text-foreground'
                : 'bg-muted  text-foreground '
            }`}
          >
            已上架 ({fulfilledCount})
          </button>
        </div>

        {loading ? (
          <div className='flex justify-center py-8'>
            <div className='w-6 h-6 border-2 border-border border-t-transparent rounded-full animate-spin' />
          </div>
        ) : requests.length === 0 ? (
          <div className='text-center py-8 text-muted-foreground '>
            暂无求片
          </div>
        ) : (
          <div className='space-y-3'>
            {requests.map((req) => (
              <div key={req.id} className='p-4 bg-muted/50  rounded-lg'>
                <div className='flex gap-4'>
                  {req.poster && (
                    <img
                      src={req.poster}
                      alt={req.title}
                      className='w-16 h-24 object-cover rounded'
                    />
                  )}
                  <div className='flex-1'>
                    <h3 className='font-medium text-foreground '>
                      {req.title} {req.year && `(${req.year})`}
                    </h3>
                    <p className='text-sm text-foreground  mt-1'>
                      求片人数: {req.requestCount} 人
                    </p>
                    <p className='text-xs text-muted-foreground  mt-1'>
                      {new Date(req.createdAt).toLocaleString('zh-CN')}
                    </p>
                    {req.requestedBy && (
                      <p className='text-xs text-muted-foreground  mt-1'>
                        求片用户: {req.requestedBy.join(', ')}
                      </p>
                    )}
                  </div>
                  <div className='flex flex-col gap-2'>
                    {filter === 'pending' && (
                      <button
                        onClick={() => handleFulfill(req.id)}
                        disabled={isLoading(`fulfill_${req.id}`)}
                        className={adminButtonStyles.successSmall}
                      >
                        {isLoading(`fulfill_${req.id}`)
                          ? '处理中...'
                          : '标记已上架'}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(req.id)}
                      disabled={isLoading(`delete_${req.id}`)}
                      className={adminButtonStyles.dangerSmall}
                    >
                      {isLoading(`delete_${req.id}`) ? '删除中...' : '删除'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {alertElement}
    </div>
  );
};
