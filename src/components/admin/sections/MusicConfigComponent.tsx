'use client';

import { AlertTriangle, Music } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { AdminConfig } from '@/lib/admin.types';

import {
  adminButtonStyles,
  showError,
  showSuccess,
  useAdminAlert,
  useLoadingState,
} from '@/components/admin/shared';


export const MusicConfigComponent = ({
  config,
  refreshConfig,
}: {
  config: AdminConfig | null;
  refreshConfig: () => Promise<void>;
}) => {
  const { alertElement } = useAdminAlert();
  const { isLoading, withLoading } = useLoadingState();
  const [enabled, setEnabled] = useState(false);
  const [baseUrl, setBaseUrl] = useState('');
  const [token, setToken] = useState('');
  const [proxyEnabled, setProxyEnabled] = useState(true);
  const [showMusicDisclaimer, setShowMusicDisclaimer] = useState(false);
  const [musicCountdown, setMusicCountdown] = useState(10);

  useEffect(() => {
    if (config?.MusicConfig) {
      setEnabled(config.MusicConfig.Enabled || false);
      setBaseUrl(config.MusicConfig.BaseUrl || '');
      setToken(config.MusicConfig.Token || '');
      setProxyEnabled(config.MusicConfig.ProxyEnabled ?? true);
    }
  }, [config]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showMusicDisclaimer && musicCountdown > 0) {
      timer = setTimeout(() => setMusicCountdown(musicCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [showMusicDisclaimer, musicCountdown]);

  const handleSave = async () => {
    await withLoading('saveMusicConfig', async () => {
      try {
        const normalizedBaseUrl = baseUrl.trim().replace(/\/$/, '');

        if (enabled && !normalizedBaseUrl) {
          throw new Error('启用音乐功能时必须填写 lxserver 地址');
        }

        const response = await fetch('/api/admin/music', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            Enabled: enabled,
            BaseUrl: normalizedBaseUrl,
            Token: token.trim(),
            ProxyEnabled: proxyEnabled,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || '保存失败');
        }

        showSuccess('音乐配置保存成功');
        await refreshConfig();
      } catch (error) {
        showError(error instanceof Error ? error.message : '保存失败');
        throw error;
      }
    });
  };

  return (
    <div className='space-y-6'>
      <div className='bg-muted  border border-border  rounded-lg p-4'>
        <div className='flex items-center gap-2 mb-2'>
          <Music className='h-5 w-5' />
          <span className='text-sm font-medium text-primary '>使用说明</span>
        </div>
        <div className='text-sm text-primary  space-y-1'>
          <p>
            • 音乐功能基于 lxserver 提供搜索、热搜、榜单、歌词与播放解析能力
          </p>
          <p>
            • 建议填写服务端 Base URL 与持久 Token，由 MoonTV 服务端代为访问
            lxserver
          </p>
          <p>
            • 项目地址：
            <a
              href='https://github.com/XCQ0607/lxserver'
              target='_blank'
              rel='noreferrer'
              className='underline hover:text-muted-foreground'
            >
              https://github.com/XCQ0607/lxserver
            </a>
          </p>
        </div>
      </div>

      <div className='flex items-center justify-between p-4 bg-muted/50  rounded-lg border border-border '>
        <div>
          <h3 className='text-sm font-medium text-foreground '>启用音乐功能</h3>
          <p className='text-xs text-muted-foreground  mt-1'>
            关闭后不显示音乐入口，前端音乐页与接口将不可用
          </p>
        </div>
        <label className='relative inline-flex items-center cursor-pointer'>
          <input
            type='checkbox'
            checked={enabled}
            onChange={(e) => {
              if (e.target.checked) {
                setShowMusicDisclaimer(true);
                setMusicCountdown(10);
              } else {
                setEnabled(false);
              }
            }}
            className='sr-only peer'
          />
          <div className="w-14 h-7 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-ring  rounded-full peer  peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-card after:border-border after:border after:rounded-full after:h-6 after:w-6 after:transition-all  peer-checked:bg-primary"></div>
        </label>
      </div>

      {/* 音乐免责声明弹窗 */}
      {showMusicDisclaimer &&
        createPortal(
          <div className='fixed inset-0 bg-black bg-opacity-50 z-modal flex items-center justify-center p-4'>
            <div className='bg-card  rounded-lg shadow-xl max-w-md w-full border border-destructive/30 '>
              <div className='p-6'>
                <div className='flex justify-center mb-4'>
                  <AlertTriangle className='w-12 h-12 text-destructive' />
                </div>

                <h3 className='text-xl font-bold text-foreground  mb-4 text-center'>
                  免责声明
                </h3>

                <div className='bg-destructive/10  border border-destructive/30  rounded-lg p-4 mb-6'>
                  <p className='text-sm text-foreground  leading-relaxed'>
                    本功能仅供个人学习和技术研究使用，请勿将其部署在公网环境中，更不得用于任何违法违规行为。
                    使用本功能所产生的一切法律责任由使用者自行承担，与开发者无关。
                    启用此功能即表示您已充分理解并同意承担相应风险。
                  </p>
                </div>

                <div className='flex gap-3 justify-center'>
                  <button
                    onClick={() => {
                      setShowMusicDisclaimer(false);
                      setMusicCountdown(10);
                    }}
                    className={adminButtonStyles.secondary}
                  >
                    取消
                  </button>
                  <button
                    onClick={() => {
                      setEnabled(true);
                      setShowMusicDisclaimer(false);
                      setMusicCountdown(10);
                    }}
                    disabled={musicCountdown > 0}
                    className={
                      musicCountdown > 0
                        ? adminButtonStyles.disabled
                        : adminButtonStyles.danger
                    }
                  >
                    {musicCountdown > 0
                      ? `确认 (${musicCountdown}s)`
                      : '确认启用'}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      <div className='space-y-4'>
        <div className='flex items-center justify-between p-4 bg-muted/50  rounded-lg border border-border '>
          <div>
            <h3 className='text-sm font-medium text-foreground '>
              启用播放代理
            </h3>
            <p className='text-xs text-muted-foreground  mt-1'>
              开启后走服务器代理并设置浏览器永久缓存，关闭后将每次都解析播放链接
            </p>
          </div>
          <label className='relative inline-flex items-center cursor-pointer'>
            <input
              type='checkbox'
              checked={proxyEnabled}
              onChange={(e) => setProxyEnabled(e.target.checked)}
              className='sr-only peer'
            />
            <div className="w-14 h-7 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-ring  rounded-full peer  peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-card after:border-border after:border after:rounded-full after:h-6 after:w-6 after:transition-all  peer-checked:bg-primary"></div>
          </label>
        </div>

        <div>
          <label className='block text-sm font-medium text-foreground  mb-2'>
            lxserver Base URL
          </label>
          <input
            type='text'
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder='http://127.0.0.1:9527'
            className='w-full px-3 py-2 border border-border  rounded-lg bg-card  text-foreground '
          />
          <p className='mt-1 text-xs text-muted-foreground '>
            例如： http://127.0.0.1:9527 或 https://music.example.com
          </p>
        </div>

        <div>
          <label className='block text-sm font-medium text-foreground  mb-2'>
            x-user-token
          </label>
          <input
            type='password'
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder='lx_tk_xxx'
            className='w-full px-3 py-2 border border-border  rounded-lg bg-card  text-foreground '
          />
          <p className='mt-1 text-xs text-muted-foreground '>
            推荐填写 lxserver 持久 Token；留空则按匿名访问处理
          </p>
        </div>
      </div>

      <div className='flex justify-end'>
        <button
          onClick={handleSave}
          disabled={isLoading('saveMusicConfig')}
          className={
            isLoading('saveMusicConfig')
              ? adminButtonStyles.disabled
              : adminButtonStyles.success
          }
        >
          {isLoading('saveMusicConfig') ? '保存中...' : '保存音乐配置'}
        </button>
      </div>

      {alertElement}
    </div>
  );
};
