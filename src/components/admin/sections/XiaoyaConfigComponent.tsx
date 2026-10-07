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


export const XiaoyaConfigComponent = ({
  config,
  refreshConfig,
}: {
  config: AdminConfig | null;
  refreshConfig: () => Promise<void>;
}) => {
  const { alertElement } = useAdminAlert();
  const { isLoading, withLoading } = useLoadingState();
  const [enabled, setEnabled] = useState(false);
  const [serverURL, setServerURL] = useState('');
  const [token, setToken] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [disableVideoPreview, setDisableVideoPreview] = useState(false);

  useEffect(() => {
    if (config?.XiaoyaConfig) {
      setEnabled(config.XiaoyaConfig.Enabled || false);
      setServerURL(config.XiaoyaConfig.ServerURL || '');
      setToken(config.XiaoyaConfig.Token || '');
      setUsername(config.XiaoyaConfig.Username || '');
      setPassword(config.XiaoyaConfig.Password || '');
      setDisableVideoPreview(config.XiaoyaConfig.DisableVideoPreview || false);
    }
  }, [config]);

  const handleSave = async () => {
    await withLoading('saveXiaoya', async () => {
      try {
        const response = await fetch('/api/admin/xiaoya', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'save',
            Enabled: enabled,
            ServerURL: serverURL,
            Token: token,
            Username: username,
            Password: password,
            DisableVideoPreview: disableVideoPreview,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || '保存失败');
        }

        showSuccess('保存成功');
        await refreshConfig();
      } catch (error) {
        showError(error instanceof Error ? error.message : '保存失败');
        throw error;
      }
    });
  };

  const handleTest = async () => {
    await withLoading('testXiaoya', async () => {
      try {
        const response = await fetch('/api/admin/xiaoya', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'test',
            ServerURL: serverURL,
            Token: token,
            Username: username,
            Password: password,
          }),
        });

        const data = await response.json();
        if (data.success) {
          showSuccess('连接成功');
        } else {
          showError(data.message || '连接失败');
        }
      } catch (error) {
        showError(error instanceof Error ? error.message : '连接失败');
        throw error;
      }
    });
  };

  return (
    <div className='space-y-6'>
      <div className='bg-muted  border border-border  rounded-lg p-4'>
        <h3 className='text-sm font-medium text-primary  mb-2'>关于小雅</h3>
        <div className='text-sm text-primary  space-y-1'>
          <p>• 小雅是基于 Alist 的网盘资源聚合服务</p>
          <p>
            • 支持文件夹名自动识别 TMDb ID（格式：标题 (年份) {'{tmdb-id}'}）
          </p>
          <p>• 支持 NFO 文件元数据（poster.jpg、background.jpg）</p>
          <p>• 按需加载，无需全量扫描</p>
        </div>
      </div>

      <div className='space-y-4'>
        <div className='flex items-center justify-between py-3 border-b border-border '>
          <div>
            <h3 className='text-sm font-medium text-foreground '>
              启用小雅功能
            </h3>
            <p className='text-xs text-muted-foreground  mt-1'>
              关闭后将不显示小雅入口
            </p>
          </div>
          <button
            onClick={() => setEnabled(!enabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              enabled ? 'bg-primary' : 'bg-muted '
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-card transition-transform ${
                enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div>
          <label className='block text-sm font-medium text-foreground  mb-2'>
            Alist 服务器地址
          </label>
          <input
            type='text'
            value={serverURL}
            onChange={(e) => setServerURL(e.target.value)}
            placeholder='http://localhost:5244'
            className='w-full px-3 py-2 border border-border  rounded-lg bg-card  text-foreground '
          />
          <p className='mt-1 text-xs text-muted-foreground '>
            小雅 Alist 服务器的完整地址
          </p>
        </div>

        <div>
          <label className='block text-sm font-medium text-foreground  mb-2'>
            Token（推荐）
          </label>
          <input
            type='password'
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder='可选，使用 Token 认证'
            className='w-full px-3 py-2 border border-border  rounded-lg bg-card  text-foreground '
          />
        </div>

        <div className='grid grid-cols-2 gap-4'>
          <div>
            <label className='block text-sm font-medium text-foreground  mb-2'>
              用户名
            </label>
            <input
              type='text'
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder='可选，用户名密码认证'
              className='w-full px-3 py-2 border border-border  rounded-lg bg-card  text-foreground '
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-foreground  mb-2'>
              密码
            </label>
            <input
              type='password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder='可选'
              className='w-full px-3 py-2 border border-border  rounded-lg bg-card  text-foreground '
            />
          </div>
        </div>

        <div className='flex items-center justify-between py-3 border-b border-border '>
          <div>
            <h3 className='text-sm font-medium text-foreground '>
              禁用预览视频
            </h3>
            <p className='text-xs text-muted-foreground  mt-1'>
              开启后将直接返回直连链接，不使用视频预览流
            </p>
          </div>
          <button
            onClick={() => setDisableVideoPreview(!disableVideoPreview)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              disableVideoPreview ? 'bg-primary' : 'bg-muted '
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-card transition-transform ${
                disableVideoPreview ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className='flex gap-3'>
          <button
            onClick={handleTest}
            disabled={!serverURL || isLoading('testXiaoya')}
            className={adminButtonStyles.primary}
          >
            {isLoading('testXiaoya') ? '测试中...' : '测试连接'}
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading('saveXiaoya')}
            className={adminButtonStyles.success}
          >
            {isLoading('saveXiaoya') ? '保存中...' : '保存配置'}
          </button>
        </div>
      </div>

      {alertElement}
    </div>
  );
};
