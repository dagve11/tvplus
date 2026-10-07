'use client';

import { AlertTriangle, BarChart3, Check, ChevronDown, Copy, ExternalLink, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { AdminConfig } from '@/lib/admin.types';

import { adminButtonStyles, showError, showSuccess, useAdminAlert, useLoadingState } from '@/components/admin/shared';

interface SiteConfig {
  SiteName: string;
  Announcement: string;
  AnnouncementDisplayMode?: 'once' | 'every';
  SearchDownstreamMaxPage: number;
  SiteInterfaceCacheTime: number;
  DoubanProxyType: string;
  DoubanProxy: string;
  DoubanImageProxyType: string;
  DoubanImageProxy: string;
  DisableYellowFilter: boolean;
  FluidSearch: boolean;
  DanmakuSourceType?: 'builtin' | 'custom';
  DanmakuApiBase: string;
  DanmakuApiToken: string;
  DanmakuAutoLoadDefault?: boolean;
  TMDBApiKey?: string;
  TMDBProxy?: string;
  TMDBReverseProxy?: string;
  TMDBImageBaseUrl?: string;
  BangumiDataSource?:
    | 'direct'
    | 'server-proxy'
    | 'custom-baseurl'
    | 'sakura';
  BangumiApiBaseUrl?: string;
  BangumiImageBaseUrl?: string;
  BangumiProxy?: string;
  LiveChartProxy?: string;
  BannerDataSource?: string;
  RecommendationDataSource?: string;
  LocalSettingsSyncMode?: 'off' | 'manual' | 'auto';
  PansouApiUrl?: string;
  PansouUsername?: string;
  PansouPassword?: string;
  PansouKeywordBlocklist?: string;
  MagnetProxy?: string;
  MagnetMikanReverseProxy?: string;
  MagnetDmhyReverseProxy?: string;
  MagnetAcgripReverseProxy?: string;
  MagnetNyaaReverseProxy?: string;
  EnableComments: boolean;
  EnableRegistration?: boolean;
  RequireRegistrationInviteCode?: boolean;
  RegistrationInviteCode?: string;
  RegistrationRequireTurnstile?: boolean;
  LoginRequireTurnstile?: boolean;
  TurnstileSiteKey?: string;
  TurnstileSecretKey?: string;
  DefaultUserTags?: string[];
  EnableOIDCLogin?: boolean;
  EnableOIDCRegistration?: boolean;
  OIDCIssuer?: string;
  OIDCAuthorizationEndpoint?: string;
  OIDCTokenEndpoint?: string;
  OIDCUserInfoEndpoint?: string;
  OIDCClientId?: string;
  OIDCClientSecret?: string;
  OIDCButtonText?: string;
  AnalyticsEnabled?: boolean;
  AnalyticsProvider?: 'umami' | 'google' | 'clarity' | 'custom';
  AnalyticsScriptUrl?: string;
  AnalyticsWebsiteId?: string;
  AnalyticsCustomScript?: string;
}

export const SiteConfigComponent = ({
  config,
  refreshConfig,
}: {
  config: AdminConfig | null;
  refreshConfig: () => Promise<void>;
}) => {
  const { alertElement } = useAdminAlert();
  const { isLoading, withLoading } = useLoadingState();
  const [showEnableCommentsModal, setShowEnableCommentsModal] = useState(false);
  const [bangumiProxyScript, setBangumiProxyScript] = useState('');
  const [bangumiProxyScriptCopied, setBangumiProxyScriptCopied] =
    useState(false);
  const [siteSettings, setSiteSettings] = useState<SiteConfig>({
    SiteName: '',
    Announcement: '',
    AnnouncementDisplayMode: 'once',
    SearchDownstreamMaxPage: 1,
    SiteInterfaceCacheTime: 7200,
    DoubanProxyType: 'cmliussss-cdn-tencent',
    DoubanProxy: '',
    DoubanImageProxyType: 'cmliussss-cdn-tencent',
    DoubanImageProxy: '',
    DisableYellowFilter: false,
    FluidSearch: true,
    DanmakuSourceType: 'builtin',
    DanmakuApiBase: 'https://mtvpls-danmu.netlify.app/87654321',
    DanmakuApiToken: '87654321',
    DanmakuAutoLoadDefault: true,
    TMDBApiKey: '',
    TMDBProxy: '',
    TMDBReverseProxy: '',
    TMDBImageBaseUrl: 'https://image.tmdb.org',
    BangumiDataSource: 'direct',
    BangumiApiBaseUrl: 'https://api.bgm.tv',
    BangumiImageBaseUrl: '',
    BangumiProxy: '',
    LiveChartProxy: '',
    BannerDataSource: 'Douban',
    RecommendationDataSource: 'Mixed',
    LocalSettingsSyncMode: 'off',
    PansouApiUrl: '',
    PansouUsername: '',
    PansouPassword: '',
    PansouKeywordBlocklist: '',
    MagnetProxy: '',
    MagnetMikanReverseProxy: '',
    MagnetDmhyReverseProxy: '',
    MagnetAcgripReverseProxy: '',
    MagnetNyaaReverseProxy: '',
    EnableComments: false,
    EnableRegistration: false,
    RegistrationRequireTurnstile: false,
    LoginRequireTurnstile: false,
    TurnstileSiteKey: '',
    TurnstileSecretKey: '',
    DefaultUserTags: [],
    EnableOIDCLogin: false,
    EnableOIDCRegistration: false,
    OIDCIssuer: '',
    OIDCAuthorizationEndpoint: '',
    OIDCTokenEndpoint: '',
    OIDCUserInfoEndpoint: '',
    OIDCClientId: '',
    OIDCClientSecret: '',
    OIDCButtonText: '',
    AnalyticsEnabled: false,
    AnalyticsProvider: 'umami',
    AnalyticsScriptUrl: '',
    AnalyticsWebsiteId: '',
    AnalyticsCustomScript: '',
  });

  // 豆瓣数据源相关状态
  const [isDoubanDropdownOpen, setIsDoubanDropdownOpen] = useState(false);
  const [isDoubanImageProxyDropdownOpen, setIsDoubanImageProxyDropdownOpen] =
    useState(false);

  // 豆瓣数据源选项
  const doubanDataSourceOptions = [
    { value: 'direct', label: '直连（服务器直接请求豆瓣）' },
    { value: 'cors-proxy-zwei', label: 'Cors Proxy By Zwei' },
    {
      value: 'cmliussss-cdn-tencent',
      label: '豆瓣 CDN By CMLiussss（腾讯云）',
    },
    { value: 'cmliussss-cdn-ali', label: '豆瓣 CDN By CMLiussss（阿里云）' },
    { value: 'custom', label: '自定义代理' },
  ];

  // 豆瓣图片代理选项
  const doubanImageProxyTypeOptions = [
    { value: 'server', label: '服务器代理（由服务器代理请求豆瓣）' },
    {
      value: 'cmliussss-cdn-tencent',
      label: '豆瓣 CDN By CMLiussss（腾讯云）',
    },
    { value: 'cmliussss-cdn-ali', label: '豆瓣 CDN By CMLiussss（阿里云）' },
    { value: 'custom', label: '自定义代理' },
    {
      value: 'direct',
      label: '直连（浏览器直接请求豆瓣，可能需要浏览器插件才能正常显示）',
    },
    {
      value: 'img3',
      label: '豆瓣官方精品 CDN（阿里云，可能需要浏览器插件才能正常显示）',
    },
  ];

  // 获取感谢信息
  const getThanksInfo = (dataSource: string) => {
    switch (dataSource) {
      case 'cors-proxy-zwei':
        return {
          text: 'Thanks to @Zwei',
          url: 'https://github.com/bestzwei',
        };
      case 'cmliussss-cdn-tencent':
      case 'cmliussss-cdn-ali':
        return {
          text: 'Thanks to @CMLiussss',
          url: 'https://github.com/cmliu',
        };
      default:
        return null;
    }
  };

  useEffect(() => {
    fetch('/scripts/bangumi-proxy.worker.js')
      .then((response) => (response.ok ? response.text() : ''))
      .then(setBangumiProxyScript)
      .catch((error) => {
        console.error('加载 Bangumi Workers 脚本失败:', error);
      });
  }, []);

  useEffect(() => {
    if (config?.SiteConfig) {
      setSiteSettings({
        ...config.SiteConfig,
        DoubanProxyType:
          config.SiteConfig.DoubanProxyType || 'cmliussss-cdn-tencent',
        DoubanProxy: config.SiteConfig.DoubanProxy || '',
        DoubanImageProxyType:
          config.SiteConfig.DoubanImageProxyType || 'cmliussss-cdn-tencent',
        DoubanImageProxy: config.SiteConfig.DoubanImageProxy || '',
        DisableYellowFilter: config.SiteConfig.DisableYellowFilter || false,
        FluidSearch: config.SiteConfig.FluidSearch || true,
        DanmakuSourceType: config.SiteConfig.DanmakuSourceType || 'custom',
        DanmakuApiBase:
          config.SiteConfig.DanmakuApiBase || 'http://localhost:9321',
        DanmakuApiToken: config.SiteConfig.DanmakuApiToken || '87654321',
        DanmakuAutoLoadDefault:
          config.SiteConfig.DanmakuAutoLoadDefault !== false,
        TMDBApiKey: config.SiteConfig.TMDBApiKey || '',
        TMDBProxy: config.SiteConfig.TMDBProxy || '',
        TMDBReverseProxy: config.SiteConfig.TMDBReverseProxy || '',
        TMDBImageBaseUrl:
          config.SiteConfig.TMDBImageBaseUrl || 'https://image.tmdb.org',
        BangumiDataSource: config.SiteConfig.BangumiDataSource || 'direct',
        BangumiApiBaseUrl:
          config.SiteConfig.BangumiApiBaseUrl || 'https://api.bgm.tv',
        BangumiImageBaseUrl: config.SiteConfig.BangumiImageBaseUrl || '',
        BangumiProxy: config.SiteConfig.BangumiProxy || '',
        LiveChartProxy: config.SiteConfig.LiveChartProxy || '',
        BannerDataSource: config.SiteConfig.BannerDataSource || 'Douban',
        RecommendationDataSource:
          config.SiteConfig.RecommendationDataSource || 'Mixed',
        LocalSettingsSyncMode: config.SiteConfig.LocalSettingsSyncMode || 'off',
        PansouApiUrl: config.SiteConfig.PansouApiUrl || '',
        PansouUsername: config.SiteConfig.PansouUsername || '',
        PansouPassword: config.SiteConfig.PansouPassword || '',
        PansouKeywordBlocklist: config.SiteConfig.PansouKeywordBlocklist || '',
        MagnetProxy: config.SiteConfig.MagnetProxy || '',
        MagnetMikanReverseProxy:
          config.SiteConfig.MagnetMikanReverseProxy || '',
        MagnetDmhyReverseProxy: config.SiteConfig.MagnetDmhyReverseProxy || '',
        MagnetAcgripReverseProxy:
          config.SiteConfig.MagnetAcgripReverseProxy || '',
        MagnetNyaaReverseProxy: config.SiteConfig.MagnetNyaaReverseProxy || '',
        EnableComments: config.SiteConfig.EnableComments || false,
        AnnouncementDisplayMode:
          config.SiteConfig.AnnouncementDisplayMode === 'every'
            ? 'every'
            : 'once',
      });
    }
  }, [config]);

  // 点击外部区域关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isDoubanDropdownOpen) {
        const target = event.target as Element;
        if (!target.closest('[data-dropdown="douban-datasource"]')) {
          setIsDoubanDropdownOpen(false);
        }
      }
    };

    if (isDoubanDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDoubanDropdownOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isDoubanImageProxyDropdownOpen) {
        const target = event.target as Element;
        if (!target.closest('[data-dropdown="douban-image-proxy"]')) {
          setIsDoubanImageProxyDropdownOpen(false);
        }
      }
    };

    if (isDoubanImageProxyDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDoubanImageProxyDropdownOpen]);

  // 处理豆瓣数据源变化
  const handleDoubanDataSourceChange = (value: string) => {
    setSiteSettings((prev) => ({
      ...prev,
      DoubanProxyType: value,
    }));
  };

  // 处理豆瓣图片代理变化
  const handleDoubanImageProxyChange = (value: string) => {
    setSiteSettings((prev) => ({
      ...prev,
      DoubanImageProxyType: value,
    }));
  };

  // 处理评论开关变化
  const handleCommentsToggle = (checked: boolean) => {
    if (checked) {
      // 如果要开启评论，弹出确认框
      setShowEnableCommentsModal(true);
    } else {
      // 直接关闭评论
      setSiteSettings((prev) => ({
        ...prev,
        EnableComments: false,
      }));
    }
  };

  // 确认开启评论
  const handleConfirmEnableComments = () => {
    setSiteSettings((prev) => ({
      ...prev,
      EnableComments: true,
    }));
    setShowEnableCommentsModal(false);
  };

  const handleCopyBangumiProxyScript = async () => {
    if (!bangumiProxyScript) return;
    try {
      await navigator.clipboard.writeText(bangumiProxyScript);
      setBangumiProxyScriptCopied(true);
      showSuccess('已复制 Bangumi Workers 脚本');
      setTimeout(() => setBangumiProxyScriptCopied(false), 2000);
    } catch (error) {
      console.error('复制 Bangumi Workers 脚本失败:', error);
      showError('复制失败');
    }
  };

  // 保存站点配置
  const handleSave = async () => {
    await withLoading('saveSiteConfig', async () => {
      try {
        const resp = await fetch('/api/admin/site', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...siteSettings }),
        });

        if (!resp.ok) {
          const data = await resp.json().catch(() => ({}));
          throw new Error(data.error || `保存失败: ${resp.status}`);
        }

        showSuccess('保存成功, 请刷新页面');
        await refreshConfig();
      } catch (err) {
        showError(err instanceof Error ? err.message : '保存失败');
        throw err;
      }
    });
  };

  if (!config) {
    return (
      <div className='text-center text-muted-foreground '>
        加载中...
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* 站点名称 */}
      <div>
        <label className='block text-sm font-medium text-foreground mb-2'>
          站点名称
        </label>
        <input
          type='text'
          value={siteSettings.SiteName}
          onChange={(e) =>
            setSiteSettings((prev) => ({ ...prev, SiteName: e.target.value }))
          }
          className='w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-ring focus:border-transparent'
        />
      </div>

      {/* 站点公告 */}
      <div>
        <label className='block text-sm font-medium text-foreground mb-2'>
          站点公告
        </label>
        <textarea
          value={siteSettings.Announcement}
          onChange={(e) =>
            setSiteSettings((prev) => ({
              ...prev,
              Announcement: e.target.value,
            }))
          }
          rows={3}
          className='w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-ring focus:border-transparent'
        />
      </div>

      {/* 公告显示模式 */}
      <div>
        <label className='block text-sm font-medium text-foreground mb-2'>
          公告显示模式
        </label>
        <div className='flex gap-4'>
          <label className='inline-flex items-center gap-2 cursor-pointer'>
            <input
              type='radio'
              name='announcementDisplayMode'
              value='once'
              checked={siteSettings.AnnouncementDisplayMode !== 'every'}
              onChange={() =>
                setSiteSettings((prev) => ({
                  ...prev,
                  AnnouncementDisplayMode: 'once',
                }))
              }
              className='text-primary focus:ring-ring'
            />
            <span className='text-sm text-foreground '>
              单次显示
            </span>
          </label>
          <label className='inline-flex items-center gap-2 cursor-pointer'>
            <input
              type='radio'
              name='announcementDisplayMode'
              value='every'
              checked={siteSettings.AnnouncementDisplayMode === 'every'}
              onChange={() =>
                setSiteSettings((prev) => ({
                  ...prev,
                  AnnouncementDisplayMode: 'every',
                }))
              }
              className='text-primary focus:ring-ring'
            />
            <span className='text-sm text-foreground '>
              每次显示
            </span>
          </label>
        </div>
      </div>

      {/* 豆瓣数据源设置 */}
      <div className='space-y-3'>
        <div>
          <label className='block text-sm font-medium text-foreground mb-2'>
            豆瓣数据代理
          </label>
          <div className='relative' data-dropdown='douban-datasource'>
            {/* 自定义下拉选择框 */}
            <button
              type='button'
              onClick={() => setIsDoubanDropdownOpen(!isDoubanDropdownOpen)}
              className='w-full px-3 py-2.5 pr-10 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-border transition-all duration-200 bg-card text-foreground shadow-sm hover:border-border text-left'
            >
              {
                doubanDataSourceOptions.find(
                  (option) => option.value === siteSettings.DoubanProxyType
                )?.label
              }
            </button>

            {/* 下拉箭头 */}
            <div className='absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none'>
              <ChevronDown
                className={`w-4 h-4 text-muted-foreground  transition-transform duration-200 ${
                  isDoubanDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </div>

            {/* 下拉选项列表 */}
            {isDoubanDropdownOpen && (
              <div className='absolute z-modal w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-auto'>
                {doubanDataSourceOptions.map((option) => (
                  <button
                    key={option.value}
                    type='button'
                    onClick={() => {
                      handleDoubanDataSourceChange(option.value);
                      setIsDoubanDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2.5 text-left text-sm transition-colors duration-150 flex items-center justify-between hover:bg-muted  ${
                      siteSettings.DoubanProxyType === option.value
                        ? 'bg-muted text-primary'
                        : 'text-foreground '
                    }`}
                  >
                    <span className='truncate'>{option.label}</span>
                    {siteSettings.DoubanProxyType === option.value && (
                      <Check className='w-4 h-4 text-primary flex-shrink-0 ml-2' />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className='mt-1 text-xs text-muted-foreground '>
            选择获取豆瓣数据的方式
          </p>

          {/* 感谢信息 */}
          {getThanksInfo(siteSettings.DoubanProxyType) && (
            <div className='mt-3'>
              <button
                type='button'
                onClick={() =>
                  window.open(
                    getThanksInfo(siteSettings.DoubanProxyType)!.url,
                    '_blank'
                  )
                }
                className='flex items-center justify-center gap-1.5 w-full px-3 text-xs text-muted-foreground cursor-pointer'
              >
                <span className='font-medium'>
                  {getThanksInfo(siteSettings.DoubanProxyType)!.text}
                </span>
                <ExternalLink className='w-3.5 opacity-70' />
              </button>
            </div>
          )}
        </div>

        {/* 豆瓣代理地址设置 - 仅在选择自定义代理时显示 */}
        {siteSettings.DoubanProxyType === 'custom' && (
          <div>
            <label className='block text-sm font-medium text-foreground mb-2'>
              豆瓣代理地址
            </label>
            <input
              type='text'
              placeholder='例如: https://proxy.example.com/fetch?url='
              value={siteSettings.DoubanProxy}
              onChange={(e) =>
                setSiteSettings((prev) => ({
                  ...prev,
                  DoubanProxy: e.target.value,
                }))
              }
              className='w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-border transition-all duration-200 bg-card text-foreground placeholder:text-muted-foreground shadow-sm hover:border-border'
            />
            <p className='mt-1 text-xs text-muted-foreground '>
              自定义代理服务器地址
            </p>
          </div>
        )}
      </div>

      {/* 豆瓣图片代理设置 */}
      <div className='space-y-3'>
        <div>
          <label className='block text-sm font-medium text-foreground mb-2'>
            豆瓣图片代理
          </label>
          <div className='relative' data-dropdown='douban-image-proxy'>
            {/* 自定义下拉选择框 */}
            <button
              type='button'
              onClick={() =>
                setIsDoubanImageProxyDropdownOpen(
                  !isDoubanImageProxyDropdownOpen
                )
              }
              className='w-full px-3 py-2.5 pr-10 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-border transition-all duration-200 bg-card text-foreground shadow-sm hover:border-border text-left'
            >
              {
                doubanImageProxyTypeOptions.find(
                  (option) => option.value === siteSettings.DoubanImageProxyType
                )?.label
              }
            </button>

            {/* 下拉箭头 */}
            <div className='absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none'>
              <ChevronDown
                className={`w-4 h-4 text-muted-foreground  transition-transform duration-200 ${
                  isDoubanImageProxyDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </div>

            {/* 下拉选项列表 */}
            {isDoubanImageProxyDropdownOpen && (
              <div className='absolute z-modal w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-auto'>
                {doubanImageProxyTypeOptions.map((option) => (
                  <button
                    key={option.value}
                    type='button'
                    onClick={() => {
                      handleDoubanImageProxyChange(option.value);
                      setIsDoubanImageProxyDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2.5 text-left text-sm transition-colors duration-150 flex items-center justify-between hover:bg-muted  ${
                      siteSettings.DoubanImageProxyType === option.value
                        ? 'bg-muted text-primary'
                        : 'text-foreground '
                    }`}
                  >
                    <span className='truncate'>{option.label}</span>
                    {siteSettings.DoubanImageProxyType === option.value && (
                      <Check className='w-4 h-4 text-primary flex-shrink-0 ml-2' />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className='mt-1 text-xs text-muted-foreground '>
            选择获取豆瓣图片的方式
          </p>

          {/* 感谢信息 */}
          {getThanksInfo(siteSettings.DoubanImageProxyType) && (
            <div className='mt-3'>
              <button
                type='button'
                onClick={() =>
                  window.open(
                    getThanksInfo(siteSettings.DoubanImageProxyType)!.url,
                    '_blank'
                  )
                }
                className='flex items-center justify-center gap-1.5 w-full px-3 text-xs text-muted-foreground cursor-pointer'
              >
                <span className='font-medium'>
                  {getThanksInfo(siteSettings.DoubanImageProxyType)!.text}
                </span>
                <ExternalLink className='w-3.5 opacity-70' />
              </button>
            </div>
          )}
        </div>

        {/* 豆瓣代理地址设置 - 仅在选择自定义代理时显示 */}
        {siteSettings.DoubanImageProxyType === 'custom' && (
          <div>
            <label className='block text-sm font-medium text-foreground mb-2'>
              豆瓣图片代理地址
            </label>
            <input
              type='text'
              placeholder='例如: https://proxy.example.com/fetch?url='
              value={siteSettings.DoubanImageProxy}
              onChange={(e) =>
                setSiteSettings((prev) => ({
                  ...prev,
                  DoubanImageProxy: e.target.value,
                }))
              }
              className='w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-border transition-all duration-200 bg-card text-foreground placeholder:text-muted-foreground shadow-sm hover:border-border'
            />
            <p className='mt-1 text-xs text-muted-foreground '>
              自定义图片代理服务器地址
            </p>
          </div>
        )}
      </div>

      {/* 搜索接口可拉取最大页数 */}
      <div>
        <label className='block text-sm font-medium text-foreground mb-2'>
          搜索接口可拉取最大页数
        </label>
        <input
          type='number'
          min={1}
          value={siteSettings.SearchDownstreamMaxPage}
          onChange={(e) =>
            setSiteSettings((prev) => ({
              ...prev,
              SearchDownstreamMaxPage: Number(e.target.value),
            }))
          }
          className='w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-ring focus:border-transparent'
        />
      </div>

      {/* 站点接口缓存时间 */}
      <div>
        <label className='block text-sm font-medium text-foreground mb-2'>
          站点接口缓存时间（秒）
        </label>
        <input
          type='number'
          min={1}
          value={siteSettings.SiteInterfaceCacheTime}
          onChange={(e) =>
            setSiteSettings((prev) => ({
              ...prev,
              SiteInterfaceCacheTime: Number(e.target.value),
            }))
          }
          className='w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-ring focus:border-transparent'
        />
      </div>

      {/* 禁用黄色过滤器 */}
      <div>
        <div className='flex items-center justify-between'>
          <label className='block text-sm font-medium text-foreground mb-2'>
            禁用黄色过滤器
          </label>
          <button
            type='button'
            onClick={() =>
              setSiteSettings((prev) => ({
                ...prev,
                DisableYellowFilter: !prev.DisableYellowFilter,
              }))
            }
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
              siteSettings.DisableYellowFilter
                ? adminButtonStyles.toggleOn
                : adminButtonStyles.toggleOff
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full ${
                adminButtonStyles.toggleThumb
              } transition-transform ${
                siteSettings.DisableYellowFilter
                  ? adminButtonStyles.toggleThumbOn
                  : adminButtonStyles.toggleThumbOff
              }`}
            />
          </button>
        </div>
        <p className='mt-1 text-xs text-muted-foreground '>
          禁用黄色内容的过滤功能，允许显示所有内容。
        </p>
      </div>

      {/* 流式搜索 */}
      <div>
        <div className='flex items-center justify-between'>
          <label className='block text-sm font-medium text-foreground mb-2'>
            启用流式搜索
          </label>
          <button
            type='button'
            onClick={() =>
              setSiteSettings((prev) => ({
                ...prev,
                FluidSearch: !prev.FluidSearch,
              }))
            }
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
              siteSettings.FluidSearch
                ? adminButtonStyles.toggleOn
                : adminButtonStyles.toggleOff
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full ${
                adminButtonStyles.toggleThumb
              } transition-transform ${
                siteSettings.FluidSearch
                  ? adminButtonStyles.toggleThumbOn
                  : adminButtonStyles.toggleThumbOff
              }`}
            />
          </button>
        </div>
        <p className='mt-1 text-xs text-muted-foreground '>
          启用后搜索结果将实时流式返回,提升用户体验。
        </p>
      </div>

      {/* 本地设置云同步模式 */}
      <div>
        <label className='block text-sm font-medium text-foreground mb-2'>
          本地设置云同步
        </label>
        <select
          value={siteSettings.LocalSettingsSyncMode || 'off'}
          onChange={(e) =>
            setSiteSettings((prev) => ({
              ...prev,
              LocalSettingsSyncMode: e.target.value as
                | 'off'
                | 'manual'
                | 'auto',
            }))
          }
          className='w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-ring focus:border-transparent'
        >
          <option value='off'>关闭</option>
          <option value='manual'>手动模式</option>
          <option value='auto'>自动模式</option>
        </select>
        <p className='mt-1 text-xs text-muted-foreground '>
          登录用户可把本地设置同步到云端，多设备保持一致。
          <br />
          手动模式：本地设置面板右上角出现「备份/恢复」按钮。
          <br />
          自动模式：进入网站自动拉取云端副本，打开本地设置面板时后台静默同步。
        </p>
      </div>

      <details className='pt-4 border-t border-border '>
        <summary className='text-sm font-semibold text-foreground cursor-pointer'>
          数据源配置
        </summary>
        <div className='mt-4 space-y-4'>
          {/* 轮播图数据源 */}
          <div>
            <label className='block text-sm font-medium text-foreground mb-2'>
              轮播图数据源
            </label>
            <select
              value={siteSettings.BannerDataSource || 'Douban'}
              onChange={(e) =>
                setSiteSettings((prev) => ({
                  ...prev,
                  BannerDataSource: e.target.value,
                }))
              }
              className='w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-ring focus:border-transparent'
            >
              <option value='Douban'>豆瓣</option>
              <option value='TMDB'>TMDB</option>
              <option value='TX'>TX</option>
            </select>
            <p className='mt-1 text-xs text-muted-foreground '>
              选择首页轮播图的数据来源
            </p>
          </div>

          {/* 更多推荐数据源 */}
          <div>
            <label className='block text-sm font-medium text-foreground mb-2'>
              更多推荐数据源
            </label>
            <select
              value={siteSettings.RecommendationDataSource || 'Mixed'}
              onChange={(e) =>
                setSiteSettings((prev) => ({
                  ...prev,
                  RecommendationDataSource: e.target.value,
                }))
              }
              className='w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-ring focus:border-transparent'
            >
              <option value='Mixed'>混合</option>
              <option value='Douban'>豆瓣</option>
              <option value='TMDB'>TMDB</option>
            </select>
            <p className='mt-1 text-xs text-muted-foreground '>
              选择详情页"更多推荐"的数据来源。混合模式会根据豆瓣ID和评论开关自动切换数据源
            </p>
          </div>
        </div>
      </details>

      {/* 弹幕 API 配置 */}
      <details className='pt-4 border-t border-border '>
        <summary className='text-sm font-semibold text-foreground cursor-pointer'>
          弹幕配置
        </summary>
        <div className='mt-4 space-y-4'>
          <div className='inline-flex rounded-lg bg-muted p-1 '>
            <button
              type='button'
              onClick={() =>
                setSiteSettings((prev) => ({
                  ...prev,
                  DanmakuSourceType: 'builtin',
                }))
              }
              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                siteSettings.DanmakuSourceType !== 'custom'
                  ? 'bg-card text-primary shadow-sm'
                  : 'text-foreground hover:text-foreground'
              }`}
            >
              内置源
            </button>
            <button
              type='button'
              onClick={() =>
                setSiteSettings((prev) => ({
                  ...prev,
                  DanmakuSourceType: 'custom',
                }))
              }
              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                siteSettings.DanmakuSourceType === 'custom'
                  ? 'bg-card text-primary shadow-sm'
                  : 'text-foreground hover:text-foreground'
              }`}
            >
              自定义源
            </button>
          </div>

          {siteSettings.DanmakuSourceType !== 'custom' && (
            <p className='text-xs text-muted-foreground '>
              ⚠️
              内置弹幕源为多人共享服务，稳定性可能受使用高峰影响，建议自行部署后使用自定义源。
            </p>
          )}

          {siteSettings.DanmakuSourceType === 'custom' && (
            <>
              {/* 弹幕 API 地址 */}
              <div>
                <label className='block text-sm font-medium text-foreground mb-2'>
                  弹幕 API 地址
                </label>
                <input
                  type='text'
                  placeholder='http://localhost:9321'
                  value={siteSettings.DanmakuApiBase}
                  onChange={(e) =>
                    setSiteSettings((prev) => ({
                      ...prev,
                      DanmakuApiBase: e.target.value,
                    }))
                  }
                  className='w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-ring focus:border-transparent'
                />
                <p className='mt-1 text-xs text-muted-foreground '>
                  自定义弹幕服务器的 API 地址。API部署参考
                  <a
                    href='https://github.com/huangxd-/danmu_api.git'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='ml-1 text-muted-foreground hover:text-primary'
                  >
                    danmu_api
                  </a>
                </p>
              </div>

              {/* 弹幕 API Token */}
              <div>
                <label className='block text-sm font-medium text-foreground mb-2'>
                  弹幕 API Token
                </label>
                <input
                  type='text'
                  placeholder='87654321'
                  value={siteSettings.DanmakuApiToken}
                  onChange={(e) =>
                    setSiteSettings((prev) => ({
                      ...prev,
                      DanmakuApiToken: e.target.value,
                    }))
                  }
                  className='w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-ring focus:border-transparent'
                />
                <p className='mt-1 text-xs text-muted-foreground '>
                  自定义弹幕服务器的访问令牌，默认为 87654321
                </p>
              </div>
            </>
          )}

          <div className='flex items-center justify-between'>
            <div>
              <h4 className='text-sm font-medium text-foreground '>
                默认自动加载弹幕
              </h4>
              <p className='text-xs text-muted-foreground mt-1'>
                新用户或未设置本地偏好时，播放页是否默认自动匹配并加载弹幕。用户仍可在个人设置中自行覆盖。
              </p>
            </div>
            <label className='flex items-center cursor-pointer'>
              <div className='relative'>
                <input
                  type='checkbox'
                  className='sr-only peer'
                  checked={siteSettings.DanmakuAutoLoadDefault !== false}
                  onChange={(e) =>
                    setSiteSettings((prev) => ({
                      ...prev,
                      DanmakuAutoLoadDefault: e.target.checked,
                    }))
                  }
                />
                <div className='w-11 h-6 bg-muted rounded-full peer-checked:bg-primary transition-colors '></div>
                <div className='absolute top-0.5 left-0.5 w-5 h-5 bg-card rounded-full transition-transform peer-checked:translate-x-5'></div>
              </div>
            </label>
          </div>
        </div>
      </details>

      {/* TMDB 配置 */}
      <details className='pt-4 border-t border-border '>
        <summary className='text-sm font-semibold text-foreground cursor-pointer'>
          TMDB 配置
        </summary>
        <div className='mt-4 space-y-4'>
          <p className='text-xs text-muted-foreground '>
            由于国内网络环境限制，TMDB 服务通常需要配置代理后才能正常使用。
          </p>
          {/* TMDB API Key */}
          <div>
            <label className='block text-sm font-medium text-foreground mb-2'>
              TMDB API Key
            </label>
            <input
              type='text'
              placeholder='请输入 TMDB API Key（多个key用英文逗号分隔）'
              value={siteSettings.TMDBApiKey}
              onChange={(e) =>
                setSiteSettings((prev) => ({
                  ...prev,
                  TMDBApiKey: e.target.value,
                }))
              }
              className='w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-ring focus:border-transparent'
            />
            <p className='mt-1 text-xs text-muted-foreground '>
              配置后首页将显示 TMDB 即将上映电影。支持配置多个 API
              Key（用英文逗号分隔）以实现轮询，避免单个 Key 请求限制。获取 API
              Key 请访问{' '}
              <a
                href='https://www.themoviedb.org/settings/api'
                target='_blank'
                rel='noopener noreferrer'
                className='text-muted-foreground hover:text-primary'
              >
                TMDB API 设置页面
              </a>
            </p>
          </div>

          {/* TMDB Proxy */}
          <div>
            <label className='block text-sm font-medium text-foreground mb-2'>
              TMDB 系统代理
            </label>
            <input
              type='text'
              placeholder='请输入代理地址（可选）'
              value={siteSettings.TMDBProxy}
              onChange={(e) =>
                setSiteSettings((prev) => ({
                  ...prev,
                  TMDBProxy: e.target.value,
                }))
              }
              className='w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-ring focus:border-transparent'
            />
            <p className='mt-1 text-xs text-muted-foreground '>
              配置代理服务器地址，用于访问 TMDB API（可选）
            </p>
          </div>

          {/* TMDB Reverse Proxy */}
          <div>
            <label className='block text-sm font-medium text-foreground mb-2'>
              TMDB 反代代理
            </label>
            <input
              type='text'
              placeholder='请输入反代 Base URL（可选）'
              value={siteSettings.TMDBReverseProxy}
              onChange={(e) =>
                setSiteSettings((prev) => ({
                  ...prev,
                  TMDBReverseProxy: e.target.value,
                }))
              }
              className='w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-ring focus:border-transparent'
            />
            <p className='mt-1 text-xs text-muted-foreground '>
              配置 TMDB 反向代理 Base URL（可选）
            </p>
          </div>

          {/* TMDB Image Base URL */}
          <div>
            <label className='block text-sm font-medium text-foreground mb-2'>
              TMDB 图片默认地址
            </label>
            <input
              type='text'
              placeholder='https://image.tmdb.org'
              value={siteSettings.TMDBImageBaseUrl}
              onChange={(e) =>
                setSiteSettings((prev) => ({
                  ...prev,
                  TMDBImageBaseUrl: e.target.value,
                }))
              }
              className='w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-ring focus:border-transparent'
            />
            <p className='mt-1 text-xs text-muted-foreground '>
              用户未在本地数据源设置中配置 TMDB 图片地址时，图片默认使用该地址（默认
              https://image.tmdb.org）
            </p>
          </div>
        </div>
      </details>

      {/* 动漫/Bangumi 配置 */}
      <details className='pt-4 border-t border-border '>
        <summary className='text-sm font-semibold text-foreground cursor-pointer'>
          动漫数据源配置
        </summary>
        <div className='mt-4 space-y-4'>
          <p className='text-xs text-muted-foreground '>
            Bangumi
            在部分国内网络环境下可能无法直连，可按部署环境选择合适的数据源。
          </p>

          <div>
            <label className='block text-sm font-medium text-foreground mb-2'>
              默认动漫数据源
            </label>
            <div className='inline-flex rounded-lg bg-muted p-1 '>
              {[
                { value: 'direct', label: '直连' },
                { value: 'server-proxy', label: '服务器代理' },
                { value: 'sakura', label: '桜色镜像站' },
                { value: 'custom-baseurl', label: '自定义 Base URL' },
              ].map((option) => (
                <button
                  key={option.value}
                  type='button'
                  onClick={() =>
                    setSiteSettings((prev) => ({
                      ...prev,
                      BangumiDataSource:
                        option.value as SiteConfig['BangumiDataSource'],
                    }))
                  }
                  className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                    (siteSettings.BangumiDataSource || 'direct') ===
                    option.value
                      ? 'bg-card text-primary shadow-sm'
                      : 'text-foreground hover:text-foreground'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p className='mt-1 text-xs text-muted-foreground '>
              作为新用户本地设置的默认动漫数据源；用户仍可在本地网络配置中覆盖。
            </p>
          </div>

          <div>
            <label className='block text-sm font-medium text-foreground mb-2'>
              Bangumi Base URL
            </label>
            <input
              type='text'
              placeholder='https://api.bgm.tv'
              value={siteSettings.BangumiApiBaseUrl || ''}
              onChange={(e) =>
                setSiteSettings((prev) => ({
                  ...prev,
                  BangumiApiBaseUrl: e.target.value,
                }))
              }
              className='w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-ring focus:border-transparent'
            />
            <p className='mt-1 text-xs text-muted-foreground '>
              Bangumi 官方或自建反代地址，不要带末尾路径，例如
              https://api.bgm.tv。
            </p>
          </div>

          <div>
            <label className='block text-sm font-medium text-foreground mb-2'>
              Bangumi 图片 Base URL
            </label>
            <input
              type='text'
              placeholder='例如: https://proxy.example.com'
              value={siteSettings.BangumiImageBaseUrl || ''}
              onChange={(e) =>
                setSiteSettings((prev) => ({
                  ...prev,
                  BangumiImageBaseUrl: e.target.value,
                }))
              }
              className='w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-ring focus:border-transparent'
            />
            <p className='mt-1 text-xs text-muted-foreground '>
              用于替换 Bangumi
              图片域名。只需填写基础部分，不需要填写完整图片路径，例如
              https://lain.bgm.tv。
            </p>
          </div>

          <div>
            <label className='block text-sm font-medium text-foreground mb-2'>
              Bangumi 系统代理
            </label>
            <input
              type='text'
              placeholder='例如: http://127.0.0.1:7890'
              value={siteSettings.BangumiProxy || ''}
              onChange={(e) =>
                setSiteSettings((prev) => ({
                  ...prev,
                  BangumiProxy: e.target.value,
                }))
              }
              className='w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-ring focus:border-transparent'
            />
            <p className='mt-1 text-xs text-muted-foreground '>
              用于服务器代理访问 Bangumi API。Cloudflare
              部署环境下不会使用该代理。
            </p>
          </div>

          <div>
            <label className='block text-sm font-medium text-foreground mb-2'>
              LiveChart 系统代理
            </label>
            <input
              type='text'
              placeholder='例如: http://127.0.0.1:7890'
              value={siteSettings.LiveChartProxy || ''}
              onChange={(e) =>
                setSiteSettings((prev) => ({
                  ...prev,
                  LiveChartProxy: e.target.value,
                }))
              }
              className='w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-ring focus:border-transparent'
            />
            <p className='mt-1 text-xs text-muted-foreground '>
              用于服务器代理访问 LiveChart 番剧时刻表。留空则直连。
            </p>
          </div>

          <details className='group rounded-lg border border-border bg-muted p-4'>
            <summary className='flex cursor-pointer list-none items-start justify-between gap-3'>
              <div className='min-w-0'>
                <label className='block text-sm font-medium text-foreground '>
                  Bangumi Cloudflare Workers 代理脚本
                </label>
                <p className='mt-1 text-xs text-muted-foreground '>
                  复制后粘贴到 Cloudflare Workers，部署后的域名可填入
                  Bangumi Base URL 和 Bangumi 图片 Base URL。
                </p>
              </div>
              <div className='flex shrink-0 items-center gap-2'>
                <button
                  type='button'
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleCopyBangumiProxyScript();
                  }}
                  disabled={!bangumiProxyScript}
                  className='inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary disabled:cursor-not-allowed disabled:opacity-50'
                >
                  <Copy className='h-3.5 w-3.5' />
                  {bangumiProxyScriptCopied ? '已复制' : '复制脚本'}
                </button>
                <ChevronDown className='h-4 w-4 text-primary transition-transform group-open:rotate-180 ' />
              </div>
            </summary>
            <pre className='mt-3 max-h-48 overflow-auto rounded-lg border border-border bg-card p-3 text-xs text-foreground'>
              <code>
                {bangumiProxyScript ||
                  '正在加载 /scripts/bangumi-proxy.worker.js ...'}
              </code>
            </pre>
          </details>
        </div>
      </details>

      <details className='pt-4 border-t border-border '>
        <summary className='text-sm font-semibold text-foreground cursor-pointer'>
          磁链配置
        </summary>
        <div className='mt-4 space-y-4'>
          <p className='text-xs text-muted-foreground '>
            由于国内网络环境限制，部分磁链搜索站点通常需要配置代理后才能正常访问。
          </p>
          <div>
            <label className='block text-sm font-medium text-foreground mb-2'>
              系统代理
            </label>
            <input
              type='text'
              placeholder='请输入代理地址（可选）'
              value={siteSettings.MagnetProxy || ''}
              onChange={(e) =>
                setSiteSettings((prev) => ({
                  ...prev,
                  MagnetProxy: e.target.value,
                }))
              }
              className='w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-ring focus:border-transparent'
            />
            <p className='mt-1 text-xs text-muted-foreground '>
              用于访问磁链搜索站点的系统代理。Cloudflare
              部署环境下不会使用该代理。
            </p>
          </div>

          <div>
            <label className='block text-sm font-medium text-foreground mb-2'>
              Mikan 反代代理
            </label>
            <input
              type='text'
              placeholder='请输入 Mikan 反代 Base URL（可选）'
              value={siteSettings.MagnetMikanReverseProxy || ''}
              onChange={(e) =>
                setSiteSettings((prev) => ({
                  ...prev,
                  MagnetMikanReverseProxy: e.target.value,
                }))
              }
              className='w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-ring focus:border-transparent'
            />
            <p className='mt-1 text-xs text-muted-foreground '>
              配置后将使用该地址替代默认的 Mikan 域名进行请求。
            </p>
          </div>

          <div>
            <label className='block text-sm font-medium text-foreground mb-2'>
              动漫花园反代代理
            </label>
            <input
              type='text'
              placeholder='请输入动漫花园反代 Base URL（可选）'
              value={siteSettings.MagnetDmhyReverseProxy || ''}
              onChange={(e) =>
                setSiteSettings((prev) => ({
                  ...prev,
                  MagnetDmhyReverseProxy: e.target.value,
                }))
              }
              className='w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-ring focus:border-transparent'
            />
            <p className='mt-1 text-xs text-muted-foreground '>
              配置后将使用该地址替代默认的动漫花园域名进行请求。
            </p>
          </div>

          <div>
            <label className='block text-sm font-medium text-foreground mb-2'>
              ACG.RIP 反代代理
            </label>
            <input
              type='text'
              placeholder='请输入 ACG.RIP 反代 Base URL（可选）'
              value={siteSettings.MagnetAcgripReverseProxy || ''}
              onChange={(e) =>
                setSiteSettings((prev) => ({
                  ...prev,
                  MagnetAcgripReverseProxy: e.target.value,
                }))
              }
              className='w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-ring focus:border-transparent'
            />
            <p className='mt-1 text-xs text-muted-foreground '>
              配置后将使用该地址替代默认的 ACG.RIP 域名进行请求。
            </p>
          </div>

          <div>
            <label className='block text-sm font-medium text-foreground mb-2'>
              Nyaa 反代代理
            </label>
            <input
              type='text'
              placeholder='请输入 Nyaa 反代 Base URL（可选）'
              value={siteSettings.MagnetNyaaReverseProxy || ''}
              onChange={(e) =>
                setSiteSettings((prev) => ({
                  ...prev,
                  MagnetNyaaReverseProxy: e.target.value,
                }))
              }
              className='w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-ring focus:border-transparent'
            />
            <p className='mt-1 text-xs text-muted-foreground '>
              配置后将使用该地址替代默认的 Nyaa 域名进行请求。
            </p>
          </div>
        </div>
      </details>

      {/* Pansou 配置 */}
      <details className='pt-4 border-t border-border '>
        <summary className='text-sm font-semibold text-foreground cursor-pointer'>
          Pansou 网盘搜索配置
        </summary>
        <div className='mt-4 space-y-4'>
          {/* Pansou API 地址 */}
          <div>
            <label className='block text-sm font-medium text-foreground mb-2'>
              Pansou API 地址
            </label>
            <input
              type='text'
              placeholder='请输入 Pansou API 地址，如：http://localhost:8888'
              value={siteSettings.PansouApiUrl}
              onChange={(e) =>
                setSiteSettings((prev) => ({
                  ...prev,
                  PansouApiUrl: e.target.value,
                }))
              }
              className='w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-ring focus:border-transparent'
            />
            <p className='mt-1 text-xs text-muted-foreground '>
              配置 Pansou 服务器地址，用于网盘资源搜索。项目地址：{' '}
              <a
                href='https://github.com/fish2018/pansou'
                target='_blank'
                rel='noopener noreferrer'
                className='text-muted-foreground hover:text-primary'
              >
                https://github.com/fish2018/pansou
              </a>
            </p>
          </div>

          {/* Pansou 账号 */}
          <div>
            <label className='block text-sm font-medium text-foreground mb-2'>
              Pansou 账号（可选）
            </label>
            <input
              type='text'
              placeholder='如果 Pansou 启用了认证，请输入账号'
              value={siteSettings.PansouUsername}
              onChange={(e) =>
                setSiteSettings((prev) => ({
                  ...prev,
                  PansouUsername: e.target.value,
                }))
              }
              className='w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-ring focus:border-transparent'
            />
            <p className='mt-1 text-xs text-muted-foreground '>
              如果 Pansou 服务启用了认证功能，需要提供账号密码
            </p>
          </div>

          {/* Pansou 密码 */}
          <div>
            <label className='block text-sm font-medium text-foreground mb-2'>
              Pansou 密码（可选）
            </label>
            <input
              type='password'
              placeholder='如果 Pansou 启用了认证，请输入密码'
              value={siteSettings.PansouPassword}
              onChange={(e) =>
                setSiteSettings((prev) => ({
                  ...prev,
                  PansouPassword: e.target.value,
                }))
              }
              className='w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-ring focus:border-transparent'
            />
            <p className='mt-1 text-xs text-muted-foreground '>
              配置账号密码后，系统会自动登录并缓存 Token
            </p>
          </div>

          {/* 关键词屏蔽 */}
          <div>
            <label className='block text-sm font-medium text-foreground mb-2'>
              关键词屏蔽（可选）
            </label>
            <input
              type='text'
              placeholder='多个关键词用中文或英文逗号分隔'
              value={siteSettings.PansouKeywordBlocklist}
              onChange={(e) =>
                setSiteSettings((prev) => ({
                  ...prev,
                  PansouKeywordBlocklist: e.target.value,
                }))
              }
              className='w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-ring focus:border-transparent'
            />
            <p className='mt-1 text-xs text-muted-foreground '>
              设置后会过滤包含这些关键词的搜索结果
            </p>
          </div>
        </div>
      </details>

      {/* 评论功能配置 */}
      <details className='pt-4 border-t border-border '>
        <summary className='text-sm font-semibold text-foreground cursor-pointer'>
          评论配置
        </summary>
        <div className='mt-4 space-y-4'>
          {/* 开启评论与相似推荐 */}
          <div>
            <div className='flex items-center justify-between'>
              <label className='block text-sm font-medium text-foreground mb-2'>
                开启评论与相似推荐
              </label>
              <button
                type='button'
                onClick={() =>
                  handleCommentsToggle(!siteSettings.EnableComments)
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                  siteSettings.EnableComments
                    ? adminButtonStyles.toggleOn
                    : adminButtonStyles.toggleOff
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full ${
                    adminButtonStyles.toggleThumb
                  } transition-transform ${
                    siteSettings.EnableComments
                      ? adminButtonStyles.toggleThumbOn
                      : adminButtonStyles.toggleThumbOff
                  }`}
                />
              </button>
            </div>
            <p className='mt-1 text-xs text-muted-foreground '>
              开启后将显示豆瓣评论与相似推荐。评论为逆向抓取，请自行承担责任。
            </p>
          </div>
        </div>
      </details>

      {/* 流量统计配置 */}
      <details className='group rounded-lg border border-border p-4 '>
        <summary className='flex cursor-pointer items-center justify-between font-medium text-foreground '>
          <span className='flex items-center gap-2'>
            <BarChart3 className='h-5 w-5' />
            流量统计
          </span>
          <ChevronDown className='h-5 w-5 transition-transform group-open:rotate-180' />
        </summary>
        <div className='mt-4 space-y-4'>
          {/* 启用开关 */}
          <div className='flex items-center justify-between'>
            <div>
              <label className='block text-sm font-medium text-foreground '>
                启用流量统计
              </label>
              <p className='mt-1 text-xs text-muted-foreground '>
                开启后将在页面中注入统计脚本，支持 Umami、Google Analytics 和自定义代码
              </p>
            </div>
            <button
              type='button'
              onClick={() =>
                setSiteSettings((prev) => ({
                  ...prev,
                  AnalyticsEnabled: !prev.AnalyticsEnabled,
                }))
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                siteSettings.AnalyticsEnabled
                  ? adminButtonStyles.toggleOn
                  : adminButtonStyles.toggleOff
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full ${
                  adminButtonStyles.toggleThumb
                } transition-transform ${
                  siteSettings.AnalyticsEnabled
                    ? adminButtonStyles.toggleThumbOn
                    : adminButtonStyles.toggleThumbOff
                }`}
              />
            </button>
          </div>

          {siteSettings.AnalyticsEnabled && (
            <>
              {/* 统计服务提供商 */}
              <div>
                <label className='block text-sm font-medium text-foreground '>
                  统计服务
                </label>
                <select
                  value={siteSettings.AnalyticsProvider}
                  onChange={(e) =>
                    setSiteSettings((prev) => ({
                      ...prev,
                      AnalyticsProvider: e.target.value as 'umami' | 'google' | 'clarity' | 'custom',
                    }))
                  }
                  className='mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm'
                >
                  <option value='umami'>Umami（开源，自托管）</option>
                  <option value='google'>Google Analytics</option>
                  <option value='clarity'>Microsoft Clarity（免费，热力图+会话回放）</option>
                  <option value='custom'>自定义代码</option>
                </select>
              </div>

              {siteSettings.AnalyticsProvider === 'umami' && (
                <>
                  <div>
                    <label className='block text-sm font-medium text-foreground '>
                      Umami 脚本地址
                    </label>
                    <input
                      type='text'
                      value={siteSettings.AnalyticsScriptUrl}
                      onChange={(e) =>
                        setSiteSettings((prev) => ({
                          ...prev,
                          AnalyticsScriptUrl: e.target.value,
                        }))
                      }
                      placeholder='https://your-umami-server.com/script.js'
                      className='mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm'
                    />
                    <p className='mt-1 text-xs text-muted-foreground '>
                      Umami 实例的 script.js 完整 URL
                    </p>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-foreground '>
                      网站 ID (Website ID)
                    </label>
                    <input
                      type='text'
                      value={siteSettings.AnalyticsWebsiteId}
                      onChange={(e) =>
                        setSiteSettings((prev) => ({
                          ...prev,
                          AnalyticsWebsiteId: e.target.value,
                        }))
                      }
                      placeholder='e.g. 12345678-abcd-efgh-ijkl-1234567890ab'
                      className='mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm'
                    />
                    <p className='mt-1 text-xs text-muted-foreground '>
                      在 Umami 后台添加网站后获取的 Website ID
                    </p>
                  </div>
                </>
              )}

              {siteSettings.AnalyticsProvider === 'google' && (
                <div>
                  <label className='block text-sm font-medium text-foreground '>
                    Measurement ID
                  </label>
                  <input
                    type='text'
                    value={siteSettings.AnalyticsWebsiteId}
                    onChange={(e) =>
                      setSiteSettings((prev) => ({
                        ...prev,
                        AnalyticsWebsiteId: e.target.value,
                      }))
                    }
                    placeholder='G-XXXXXXXXXX'
                    className='mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm'
                  />
                  <p className='mt-1 text-xs text-muted-foreground '>
                    Google Analytics 4 的 Measurement ID，在 GA 后台「数据流」中获取
                  </p>
                </div>
              )}

              {siteSettings.AnalyticsProvider === 'clarity' && (
                <div>
                  <label className='block text-sm font-medium text-foreground '>
                    Project ID
                  </label>
                  <input
                    type='text'
                    value={siteSettings.AnalyticsWebsiteId}
                    onChange={(e) =>
                      setSiteSettings((prev) => ({
                        ...prev,
                        AnalyticsWebsiteId: e.target.value,
                      }))
                    }
                    placeholder='e.g. abc1234567'
                    className='mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm'
                  />
                  <p className='mt-1 text-xs text-muted-foreground '>
                    Microsoft Clarity 的 Project ID，在 clarity.microsoft.com 项目设置中获取
                  </p>
                </div>
              )}

              {siteSettings.AnalyticsProvider === 'custom' && (
                <div>
                  <label className='block text-sm font-medium text-foreground '>
                    自定义统计代码
                  </label>
                  <textarea
                    value={siteSettings.AnalyticsCustomScript}
                    onChange={(e) =>
                      setSiteSettings((prev) => ({
                        ...prev,
                        AnalyticsCustomScript: e.target.value,
                      }))
                    }
                    placeholder='粘贴完整的统计脚本代码，如百度统计、Plausible、51la 等...'
                    rows={6}
                    className='mt-1 block w-full rounded-md border border-border px-3 py-2 font-mono text-sm'
                  />
                  <p className='mt-1 text-xs text-muted-foreground '>
                    支持任意第三方统计服务的脚本代码，将直接注入到页面 &lt;head&gt; 中
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </details>

      {/* 操作按钮 */}
      <div className='flex justify-end'>
        <button
          onClick={handleSave}
          disabled={isLoading('saveSiteConfig')}
          className={`px-4 py-2 ${
            isLoading('saveSiteConfig')
              ? adminButtonStyles.disabled
              : adminButtonStyles.success
          } rounded-lg transition-colors`}
        >
          {isLoading('saveSiteConfig') ? '保存中…' : '保存'}
        </button>
      </div>

      {alertElement}
      {/* 开启评论确认弹窗 */}
      {showEnableCommentsModal &&
        createPortal(
          <div
            className='fixed inset-0 bg-black/50 z-modal flex items-center justify-center p-4'
            onClick={() => setShowEnableCommentsModal(false)}
          >
            <div
              className='bg-card rounded-lg shadow-xl max-w-md w-full'
              onClick={(e) => e.stopPropagation()}
            >
              <div className='p-6'>
                <div className='flex items-center justify-between mb-6'>
                  <h3 className='text-xl font-semibold text-foreground '>
                    开启评论与相似推荐功能
                  </h3>
                  <button
                    onClick={() => setShowEnableCommentsModal(false)}
                    className='text-muted-foreground hover:text-foreground transition-colors'
                  >
                    <X className='w-6 h-6' />
                  </button>
                </div>

                <div className='mb-6'>
                  <div className='bg-muted/50 border border-border rounded-lg p-4'>
                    <div className='flex items-center space-x-2 mb-2'>
                      <AlertTriangle className='w-5 h-5 text-muted-foreground ' />
                      <span className='text-sm font-medium text-muted-foreground '>
                        重要提示
                      </span>
                    </div>
                    <p className='text-sm text-muted-foreground '>
                      评论功能为逆向抓取豆瓣评论数据，此功能仅供学习，开启后请自行承担相关责任和风险。
                    </p>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className='flex justify-end space-x-3'>
                  <button
                    onClick={() => setShowEnableCommentsModal(false)}
                    className={`px-6 py-2.5 text-sm font-medium ${adminButtonStyles.secondary}`}
                  >
                    取消
                  </button>
                  <button
                    onClick={handleConfirmEnableComments}
                    className={`px-6 py-2.5 text-sm font-medium ${adminButtonStyles.primary}`}
                  >
                    我已知晓，确认开启
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
