/* eslint-disable no-console,@typescript-eslint/no-explicit-any */

'use client';

import {
  Copy,
  Download,
  ExternalLink,
  Monitor,
  Rss,
  Sliders,
  Smartphone,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface SubscribePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  confirm: (opts: {
    title: string;
    message: string;
    onConfirm: () => void;
  }) => void;
  onOpenTVRemote: () => void;
}

// 电视访问面板（TVBox 订阅 / OrionTV / Web 电视扫码登录）
export const SubscribePanel = ({
  open,
  onOpenChange,
  onOpenTVRemote,
  confirm,
}: SubscribePanelProps) => {
  // 订阅相关状态
  const [subscribeEnabled, setSubscribeEnabled] = useState(false);
  const [tvModeEnabled, setTvModeEnabled] = useState(true);
  const [subscribeUrl, setSubscribeUrl] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [orionBaseUrlCopySuccess, setOrionBaseUrlCopySuccess] = useState(false);
  const [tvboxToken, setTvboxToken] = useState('');
  const [isResettingToken, setIsResettingToken] = useState(false);
  const [isLoadingSubscribeUrl, setIsLoadingSubscribeUrl] = useState(false);
  const [subscribeAdFilterEnabled, setSubscribeAdFilterEnabled] =
    useState(false);
  const [subscribeYellowFilterEnabled, setSubscribeYellowFilterEnabled] =
    useState(false);

  // Web 电视扫码登录入口（手机摄像头扫描电视端二维码）
  const [isTvQrScannerOpen, setIsTvQrScannerOpen] = useState(false);
  const [tvQrScannerStatus, setTvQrScannerStatus] = useState('');
  const [tvQrScannerError, setTvQrScannerError] = useState('');
  const tvQrVideoRef = useRef<HTMLVideoElement | null>(null);
  const tvQrStreamRef = useRef<MediaStream | null>(null);
  const tvQrScanStopRef = useRef(false);
  const [tvAccessTab, setTvAccessTab] = useState<'tvbox' | 'orion' | 'web'>('tvbox');
  // 从运行时配置读取订阅是否启用
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const enabled =
        (window as any).RUNTIME_CONFIG?.ENABLE_TVBOX_SUBSCRIBE || false;
      setSubscribeEnabled(enabled);
      setTvModeEnabled((window as any).RUNTIME_CONFIG?.ENABLE_TV_MODE !== false);
    }
  }, []);
  // 懒加载订阅 URL - 只在打开订阅面板时请求
  const fetchSubscribeUrl = async () => {
    setIsLoadingSubscribeUrl(true);
    try {
      // 获取用户的 TVBox token
      const response = await fetch('/api/user/tvbox-token');
      if (response.ok) {
        const data = await response.json();
        const token = data.token;
        setTvboxToken(token);

        setSubscribeUrl(
          buildSubscribeUrl(
            token,
            subscribeAdFilterEnabled,
            subscribeYellowFilterEnabled
          )
        );
      }
    } catch (error) {
      console.error('获取订阅URL失败:', error);
    } finally {
      setIsLoadingSubscribeUrl(false);
    }
  };

  // 重置 TVBox token
  const handleResetToken = async () => {
    confirm({
      title: '重置订阅Token',
      message: '确定要重置订阅token吗？重置后旧的订阅链接将失效。',
      onConfirm: async () => {
        setIsResettingToken(true);

        try {
          const response = await fetch('/api/user/tvbox-token/reset', {
            method: 'POST',
          });

          const messageEl = document.getElementById('tvbox-token-message');
          if (response.ok) {
            const data = await response.json();
            const token = data.token;
            setTvboxToken(token);

            setSubscribeUrl(
              buildSubscribeUrl(
                token,
                subscribeAdFilterEnabled,
                subscribeYellowFilterEnabled
              )
            );

            if (messageEl) {
              messageEl.textContent = '订阅token已重置！';
              messageEl.className =
                'text-xs text-center text-primary mt-2';
              messageEl.classList.remove('hidden');
              setTimeout(() => {
                messageEl.classList.add('hidden');
              }, 3000);
            }
          } else {
            const data = await response.json();
            if (messageEl) {
              messageEl.textContent = data.error || '重置失败，请重试';
              messageEl.className =
                'text-xs text-center text-destructive mt-2';
              messageEl.classList.remove('hidden');
            }
          }
        } catch (error) {
          console.error('重置token失败:', error);
          const messageEl = document.getElementById('tvbox-token-message');
          if (messageEl) {
            messageEl.textContent = '重置失败，请重试';
            messageEl.className =
              'text-xs text-center text-destructive mt-2';
            messageEl.classList.remove('hidden');
          }
        } finally {
          setIsResettingToken(false);
        }
      },
    });
  };

  const buildSubscribeUrl = (
    token: string,
    adFilter: boolean,
    yellowFilter: boolean
  ) => {
    const currentOrigin = window.location.origin;
    const url = new URL('/api/tvbox/subscribe', currentOrigin);
    url.searchParams.set('token', token);
    if (adFilter) {
      url.searchParams.set('adFilter', 'true');
    }
    if (yellowFilter) {
      url.searchParams.set('yellowFilter', 'true');
    }
    return url.toString();
  };
  const stopTvQrScanner = useCallback(() => {
    tvQrScanStopRef.current = true;
    if (tvQrStreamRef.current) {
      tvQrStreamRef.current.getTracks().forEach((track) => track.stop());
      tvQrStreamRef.current = null;
    }
    if (tvQrVideoRef.current) {
      tvQrVideoRef.current.srcObject = null;
    }
  }, []);

  const closeTvQrScanner = useCallback(() => {
    stopTvQrScanner();
    setIsTvQrScannerOpen(false);
    setTvQrScannerStatus('');
    setTvQrScannerError('');
  }, [stopTvQrScanner]);

  const handleQrLoginResult = useCallback((rawValue: string) => {
    try {
      const url = new URL(rawValue, window.location.origin);

      const isLocalRemoteUrl =
        (url.protocol === 'http:' || url.protocol === 'https:') &&
        url.searchParams.has('token') &&
        (url.pathname === '/remote' || url.pathname.endsWith('/remote'));

      if (isLocalRemoteUrl) {
        setTvQrScannerStatus('识别成功，正在打开局域网遥控器...');
        stopTvQrScanner();
        window.location.href = url.href;
        return true;
      }

      if (url.origin !== window.location.origin || url.pathname !== '/qr-login') {
        setTvQrScannerError('未识别到电视登录二维码或局域网遥控二维码，请扫描电视屏幕上的二维码。');
        return false;
      }

      const token = url.searchParams.get('token');
      if (!token) {
        setTvQrScannerError('二维码缺少登录凭证，请刷新电视端二维码后重试。');
        return false;
      }

      setTvQrScannerStatus('识别成功，正在打开确认登录页...');
      stopTvQrScanner();
      window.location.href = `/qr-login?token=${encodeURIComponent(token)}`;
      return true;
    } catch {
      setTvQrScannerError('二维码内容无效，请扫描电视端显示的登录二维码或局域网遥控二维码。');
      return false;
    }
  }, [stopTvQrScanner]);

  const startTvQrScanner = useCallback(async () => {
    setIsTvQrScannerOpen(true);
    setTvQrScannerError('');
    setTvQrScannerStatus('正在打开手机摄像头...');
    tvQrScanStopRef.current = false;

    if (!navigator.mediaDevices?.getUserMedia) {
      setTvQrScannerError('当前浏览器不支持调用摄像头，请使用手机浏览器或系统相机扫描电视端二维码。');
      setTvQrScannerStatus('');
      return;
    }

    const BarcodeDetectorCtor = (window as any).BarcodeDetector;
    if (!BarcodeDetectorCtor) {
      setTvQrScannerError('当前浏览器不支持网页内二维码识别，请使用系统相机扫描电视端二维码。');
      setTvQrScannerStatus('');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      tvQrStreamRef.current = stream;

      if (!tvQrVideoRef.current) return;
      tvQrVideoRef.current.srcObject = stream;
      await tvQrVideoRef.current.play();

      const detector = new BarcodeDetectorCtor({ formats: ['qr_code'] });
      setTvQrScannerStatus('请将电视屏幕上的登录二维码或局域网遥控二维码放入取景框');

      const scan = async () => {
        if (tvQrScanStopRef.current || !tvQrVideoRef.current) return;
        try {
          const barcodes = await detector.detect(tvQrVideoRef.current);
          const rawValue = barcodes?.[0]?.rawValue;
          if (rawValue && handleQrLoginResult(rawValue)) return;
        } catch (error) {
          console.error('二维码识别失败:', error);
        }
        window.setTimeout(scan, 350);
      };

      scan();
    } catch (error) {
      console.error('打开摄像头失败:', error);
      setTvQrScannerError('无法打开摄像头，请检查浏览器相机权限后重试。');
      setTvQrScannerStatus('');
      stopTvQrScanner();
    }
  }, [handleQrLoginResult, stopTvQrScanner]);

  useEffect(() => {
    return () => stopTvQrScanner();
  }, [stopTvQrScanner]);
  const handleCloseSubscribe = () => {
    onOpenChange(false);
    setCopySuccess(false);
    setOrionBaseUrlCopySuccess(false);
  };
  const handleCopySubscribeUrl = async () => {
    try {
      await navigator.clipboard.writeText(subscribeUrl);
      setCopySuccess(true);
      setTimeout(() => {
        setCopySuccess(false);
      }, 2000);
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  const handleCopyOrionBaseUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      setOrionBaseUrlCopySuccess(true);
      setTimeout(() => {
        setOrionBaseUrlCopySuccess(false);
      }, 2000);
    } catch (error) {
      console.error('复制OrionTV Base URL失败:', error);
    }
  };

  // 面板从关闭 → 打开：重置复制状态并按需懒加载订阅 URL（原 UserMenu handleSubscribe 行为）
  const prevSubscribeOpenRef = useRef(false);
  useEffect(() => {
    if (open && !prevSubscribeOpenRef.current) {
      setCopySuccess(false);
      setOrionBaseUrlCopySuccess(false);
      if (subscribeEnabled) {
        void fetchSubscribeUrl();
      } else {
        setIsLoadingSubscribeUrl(false);
      }
    }
    prevSubscribeOpenRef.current = open;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, subscribeEnabled]);
  useEffect(() => {
    if (!tvboxToken || !open) return;
    setSubscribeUrl(
      buildSubscribeUrl(
        tvboxToken,
        subscribeAdFilterEnabled,
        subscribeYellowFilterEnabled
      )
    );
  }, [
    tvboxToken,
    subscribeAdFilterEnabled,
    subscribeYellowFilterEnabled,
    open,
  ]);

  if (!open) return null;
  return createPortal(
    <>
      {/* 背景遮罩 */}
      <div
        className='fixed inset-0 bg-black/60 backdrop-blur-sm z-modal'
        onClick={handleCloseSubscribe}
        onTouchMove={(e) => {
          e.preventDefault();
        }}
        onWheel={(e) => {
          e.preventDefault();
        }}
        style={{
          touchAction: 'none',
        }}
      />

      {/* 电视访问面板 */}
      <div className='fixed top-1/2 left-1/2 z-popover max-h-[92vh] w-full max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl border border-border bg-card shadow-2xl shadow-black/30'>
        <div
          className='max-h-[92vh] overflow-y-auto p-6 sm:p-7'
          data-panel-content
          onTouchMove={(e) => {
            e.stopPropagation();
          }}
          style={{
            touchAction: 'auto',
          }}
        >
          {isTvQrScannerOpen ? (
            <div className='relative -m-6 min-h-[72vh] overflow-hidden bg-black sm:-m-7'>
              <video
                ref={tvQrVideoRef}
                className='absolute inset-0 h-full w-full object-cover'
                muted
                playsInline
              />
              <div className='pointer-events-none absolute inset-0 grid place-items-center'>
                <div className='h-64 w-64 rounded-xl border-4 border-white/90 [box-shadow:0_0_0_9999px_rgba(0,0,0,0.58),0_0_30px_rgba(255,255,255,0.55)] sm:h-80 sm:w-80' />
              </div>
              <div className='absolute left-0 right-0 top-0 flex items-start justify-between gap-4 bg-gradient-to-b from-black/75 to-transparent p-5 text-white sm:p-7'>
                <div>
                  <div className='inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-black text-white ring-1 ring-white/20'>
                    <Smartphone className='h-4 w-4' />
                    手机相机扫码
                  </div>
                  <h3 className='mt-3 text-2xl font-black'>扫描电视二维码</h3>
                  <p className='mt-1 text-sm text-white/75'>支持扫码登录，也支持打开局域网遥控器</p>
                </div>
                <button
                  type='button'
                  onClick={closeTvQrScanner}
                  className='flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70'
                  aria-label='关闭扫码'
                >
                  <X className='h-5 w-5' />
                </button>
              </div>
              <div className='absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/85 to-transparent p-5 sm:p-7'>
                {tvQrScannerStatus && (
                  <p className='rounded-2xl bg-white/12 px-4 py-3 text-center text-sm font-black text-white backdrop-blur'>
                    {tvQrScannerStatus}
                  </p>
                )}
                {tvQrScannerError && (
                  <p className='mt-3 rounded-2xl bg-destructive/20 px-4 py-3 text-center text-sm font-black text-destructive-foreground ring-1 ring-destructive/30 backdrop-blur'>
                    {tvQrScannerError}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <>
          {/* 标题栏 */}
          <div className='mb-6 flex items-start justify-between gap-4'>
            <div>
              <div className='inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary'>
                <Monitor className='h-4 w-4' />
                TV ACCESS
              </div>
              <h3 className='mt-3 text-2xl font-black text-foreground'>
                电视访问
              </h3>
            </div>
            <button
              onClick={handleCloseSubscribe}
              className='flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
              aria-label='Close'
            >
              <X className='h-5 w-5' />
            </button>
          </div>

          <div className='mb-5 grid grid-cols-3 rounded-2xl bg-muted p-1'>
            {[
              { key: 'tvbox' as const, label: 'TVBox 订阅', icon: Rss },
              { key: 'orion' as const, label: 'OrionTV', icon: Download },
              { key: 'web' as const, label: 'Web 电视', icon: Monitor },
            ].map((item) => {
              const Icon = item.icon;
              const active = tvAccessTab === item.key;
              return (
                <button
                  key={item.key}
                  type='button'
                  onClick={() => {
                    setTvAccessTab(item.key);
                    if (item.key !== 'web') closeTvQrScanner();
                  }}
                  className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    active
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className='h-4 w-4' />
                  <span className='hidden sm:inline'>{item.label}</span>
                  <span className='sm:hidden'>{item.key === 'tvbox' ? 'TVBox' : item.key === 'orion' ? 'Orion' : 'Web'}</span>
                </button>
              );
            })}
          </div>

          {tvAccessTab === 'tvbox' && (
            <section className='rounded-2xl border border-border bg-muted p-5'>
              <div className='flex items-center justify-between gap-3'>
                <div className='flex items-center gap-3'>
                  <div className='flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg'>
                    <Rss className='h-5 w-5' />
                  </div>
                  <div>
                    <h4 className='text-lg font-black text-foreground'>
                      TVBox 订阅
                    </h4>
                    <p className='mt-1 text-sm text-muted-foreground'>
                      复制订阅链接到 TVBox 使用
                    </p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                    subscribeEnabled
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {subscribeEnabled ? '已启用' : '未启用'}
                </span>
              </div>

              {!subscribeEnabled ? (
                <div className='mt-5 rounded-xl border border-dashed border-border bg-muted px-4 py-3 text-sm font-semibold text-muted-foreground'>
                  TVBox 订阅功能未启用
                </div>
              ) : isLoadingSubscribeUrl ? (
                <div className='mt-5 space-y-3'>
                  <div className='h-14 animate-pulse rounded-xl bg-muted' />
                  <div className='h-14 animate-pulse rounded-xl bg-muted' />
                  <div className='h-10 animate-pulse rounded-xl bg-muted' />
                </div>
              ) : (
                <div className='mt-5 space-y-4'>
                  <div className='grid gap-3 sm:grid-cols-2'>
                    <button
                      type='button'
                      onClick={() => setSubscribeAdFilterEnabled((prev) => !prev)}
                      className='flex w-full cursor-pointer items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-left transition hover:border-primary'
                    >
                      <div>
                        <div className='text-sm font-bold text-foreground'>去广告</div>
                        <div className='mt-1 text-xs text-muted-foreground'>开启后通过代理处理播放链接</div>
                      </div>
                      <span className={`h-5 w-9 rounded-full p-0.5 transition ${subscribeAdFilterEnabled ? 'bg-primary' : 'bg-input'}`}>
                        <span className={`block h-4 w-4 rounded-full bg-background transition ${subscribeAdFilterEnabled ? 'translate-x-4' : ''}`} />
                      </span>
                    </button>
                    <button
                      type='button'
                      onClick={() => setSubscribeYellowFilterEnabled((prev) => !prev)}
                      className='flex w-full cursor-pointer items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-left transition hover:border-primary'
                    >
                      <div>
                        <div className='text-sm font-bold text-foreground'>黄色过滤</div>
                        <div className='mt-1 text-xs text-muted-foreground'>过滤代理搜索中的黄色内容</div>
                      </div>
                      <span className={`h-5 w-9 rounded-full p-0.5 transition ${subscribeYellowFilterEnabled ? 'bg-primary' : 'bg-input'}`}>
                        <span className={`block h-4 w-4 rounded-full bg-background transition ${subscribeYellowFilterEnabled ? 'translate-x-4' : ''}`} />
                      </span>
                    </button>
                  </div>

                  <div>
                    <h4 className='mb-2 text-sm font-medium text-foreground'>
                      订阅链接
                    </h4>
                    <div className='flex gap-2'>
                      <input
                        type='text'
                        className='min-w-0 flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring'
                        value={subscribeUrl}
                        readOnly
                      />
                      <button
                        onClick={handleCopySubscribeUrl}
                        className='inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-black text-primary-foreground transition hover:bg-primary/90'
                      >
                        <Copy className='h-4 w-4' />
                        {copySuccess ? '已复制' : '复制'}
                      </button>
                    </div>
                    {(subscribeAdFilterEnabled || subscribeYellowFilterEnabled) && (
                      <p className='mt-2 rounded-xl border border-border bg-muted px-3 py-2 text-xs font-semibold text-foreground'>
                        💡 代理模式已开启，某些源可能因为区域或兼容问题无法播放
                      </p>
                    )}
                  </div>

                  <div className='pt-1'>
                    <button
                      onClick={handleResetToken}
                      disabled={isResettingToken}
                      className='w-full cursor-pointer rounded-xl bg-destructive px-4 py-2.5 text-sm font-black text-destructive-foreground transition hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-60'
                    >
                      {isResettingToken ? '重置中...' : '重置订阅Token'}
                    </button>
                    <p className='mt-2 text-center text-xs text-muted-foreground'>
                      ⚠️ 重置后旧链接将失效
                    </p>
                    <p id='tvbox-token-message' className='hidden text-center text-xs'></p>
                  </div>
                </div>
              )}
            </section>
          )}

          {tvAccessTab === 'orion' && (
            <section className='rounded-2xl border border-border bg-muted p-5'>
              <div className='flex items-center gap-3'>
                <img
                  src='/icons/OrionTV.png'
                  alt='OrionTV'
                  className='h-11 w-11 rounded-2xl object-cover shadow-lg'
                />
                <div>
                  <h4 className='text-lg font-black text-foreground'>
                    OrionTV
                  </h4>
                  <p className='mt-1 text-sm text-muted-foreground'>
                    Android TV 专用客户端
                  </p>
                </div>
              </div>
              <p className='mt-5 text-sm leading-6 text-muted-foreground'>
                可直接作为 MoonTV Plus 电视端使用，适合安装到 Android TV / 电视盒子。
              </p>
              <div className='mt-5'>
                <h5 className='mb-2 text-sm font-bold text-foreground'>
                  Base URL
                </h5>
                <div className='flex gap-2'>
                  <input
                    type='text'
                    readOnly
                    value={typeof window !== 'undefined' ? window.location.origin : ''}
                    className='min-w-0 flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground outline-none'
                  />
                  <button
                    type='button'
                    onClick={handleCopyOrionBaseUrl}
                    className='inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-black text-primary-foreground transition hover:bg-primary/90'
                  >
                    <Copy className='h-4 w-4' />
                    {orionBaseUrlCopySuccess ? '已复制' : '复制'}
                  </button>
                </div>
                <p className='mt-2 text-xs text-muted-foreground'>
                  在 OrionTV 中填写该地址作为后端服务地址。
                </p>
              </div>
              <a
                href='https://github.com/mtvpls/OrionTV_Build/tags'
                target='_blank'
                rel='noopener noreferrer'
                className='mt-5 inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-black text-primary-foreground transition hover:bg-primary/90'
              >
                下载 OrionTV
                <ExternalLink className='h-4 w-4' />
              </a>
            </section>
          )}

          {tvAccessTab === 'web' && (
            <section className='rounded-2xl border border-border bg-muted p-5'>
              <div className='flex items-center gap-3'>
                <div className='flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg'>
                  <Monitor className='h-5 w-5' />
                </div>
                <div>
                  <h4 className='text-lg font-black text-foreground'>
                    Web 电视
                  </h4>
                  <p className='mt-1 text-sm text-muted-foreground'>
                    手机扫描电视屏幕二维码并确认登录
                  </p>
                </div>
              </div>
                <p className='mt-5 text-sm leading-6 text-muted-foreground'>
                {tvModeEnabled
                  ? '电视端打开 /tv 后可扫码登录；在电视端“我的”页也可扫描局域网遥控二维码。'
                  : '当前部署未开启 TV 模式，/tv 页面和 Web 电视遥控不可用。'}
              </p>
              {!tvModeEnabled && (
                <div className='mt-5 rounded-2xl border border-border bg-muted px-4 py-3 text-sm font-bold text-foreground'>
                  TV 模式未开启。请在环境变量中设置 ENABLE_TV_MODE=true 后重启服务。
                </div>
              )}
              <div className='mt-5 grid gap-2 sm:grid-cols-2'>
                <button
                  type='button'
                  onClick={startTvQrScanner}
                  disabled={!tvModeEnabled}
                  className='inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-black text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground'
                >
                  打开相机扫码
                  <Smartphone className='h-4 w-4' />
                </button>
                <button
                  type='button'
                  onClick={() => {
                    if (!tvModeEnabled) return;
                    onOpenTVRemote();
                  }}
                  disabled={!tvModeEnabled}
                  className='inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-3 text-sm font-black text-secondary-foreground transition hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground'
                >
                  <Sliders className='h-4 w-4' />
                  远程电视遥控器
                </button>
              </div>

            </section>
          )}
            </>
          )}
        </div>
      </div>
    </>
, document.body
  );
};
