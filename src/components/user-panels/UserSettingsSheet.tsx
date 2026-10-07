/* eslint-disable no-console,@typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion */

'use client';

import {
  Check,
  ChevronDown,
  ChevronUp,
  CircleHelp,
  Copy,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  Gauge,
  Globe,
  Home,
  MessageSquare,
  MoveDown,
  MoveUp,
  Package,
  Sliders,
  Trash2,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { getAuthInfoFromBrowserCookie } from '@/lib/auth';
import { clearAllDanmakuCache, getDanmakuCacheStats } from '@/lib/danmaku/api';
import { SAVE_LIVE_PLAY_RECORDS_KEY } from '@/lib/db.client';
import {
  type LocalSettingsPayload,
  LOCAL_SETTINGS_KEYS,
  LOCAL_SETTINGS_SYNC_LAST_PULL_KEY,
} from '@/lib/local-settings-sync';
import { showError, showSuccess } from '@/lib/toast';
import { clearBangumiImageFallbackCache } from '@/lib/utils';

interface UserSettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenDownloadManagement: () => void;
  confirm: (opts: {
    title: string;
    message: string;
    onConfirm: () => void;
  }) => void;
}

// 本地设置面板。由 UserMenu 常驻挂载（云同步的自动拉取/关闭时静默上传依赖挂载即生效），
// open 仅控制 portal 渲染，与拆分前行为一致。
export const UserSettingsSheet = ({
  open,
  onOpenChange,
  onOpenDownloadManagement,
  confirm,
}: UserSettingsSheetProps) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  // 设置相关状态
  const [defaultAggregateSearch, setDefaultAggregateSearch] = useState(true);
  const [saveLivePlayRecords, setSaveLivePlayRecords] = useState(false);
  const [doubanProxyUrl, setDoubanProxyUrl] = useState('');
  const [enableOptimization, setEnableOptimization] = useState(true);
  const [preferStrategy, setPreferStrategy] = useState<'fast' | 'full'>('fast');
  const [preferMode, setPreferMode] = useState<
    'balanced' | 'resolution' | 'speed'
  >('balanced'); // 优选偏好：综合判定/分辨率优先/网速优先
  const [speedTestTimeout, setSpeedTestTimeout] = useState(4000); // 测速超时时间（毫秒）
  const [fluidSearch, setFluidSearch] = useState(true);
  const [tmdbBackdropDisabled, setTmdbBackdropDisabled] = useState(false);
  const [enableTrailers, setEnableTrailers] = useState(false);
  const [doubanDataSource, setDoubanDataSource] = useState(
    'cmliussss-cdn-tencent'
  );
  const [doubanDataSourceBackup, setDoubanDataSourceBackup] =
    useState('direct');
  const [animeDataSource, setAnimeDataSource] = useState('direct');
  const [animeDataSourceBackup, setAnimeDataSourceBackup] =
    useState('server-proxy');
  const [animeCustomBaseUrl, setAnimeCustomBaseUrl] = useState('');
  const [animeImageBaseUrl, setAnimeImageBaseUrl] = useState('');
  const [bangumiProxyScript, setBangumiProxyScript] = useState('');
  const [bangumiProxyScriptCopied, setBangumiProxyScriptCopied] =
    useState(false);
  const [doubanImageProxyType, setDoubanImageProxyType] = useState(
    'cmliussss-cdn-tencent'
  );
  const [doubanImageProxyTypeBackup, setDoubanImageProxyTypeBackup] =
    useState('server');
  const [doubanImageProxyUrl, setDoubanImageProxyUrl] = useState('');
  const [doubanProxyUrlBackup, setDoubanProxyUrlBackup] = useState('');
  const [doubanImageProxyUrlBackup, setDoubanImageProxyUrlBackup] =
    useState('');
  const [isDoubanDropdownOpen, setIsDoubanDropdownOpen] = useState(false);
  const [isDoubanBackupDropdownOpen, setIsDoubanBackupDropdownOpen] =
    useState(false);
  const [isAnimeDropdownOpen, setIsAnimeDropdownOpen] = useState(false);
  const [isAnimeBackupDropdownOpen, setIsAnimeBackupDropdownOpen] =
    useState(false);
  const [isDoubanImageProxyDropdownOpen, setIsDoubanImageProxyDropdownOpen] =
    useState(false);
  const [
    isDoubanImageProxyBackupDropdownOpen,
    setIsDoubanImageProxyBackupDropdownOpen,
  ] = useState(false);
  const [bufferStrategy, setBufferStrategy] = useState('medium');
  const [nextEpisodePreCache, setNextEpisodePreCache] = useState(true);
  const [nextEpisodeDanmakuPreload, setNextEpisodeDanmakuPreload] =
    useState(true);
  const [disablePlaybackThumbnail, setDisablePlaybackThumbnail] =
    useState(true);
  const [disableEpisodeTitleFetch, setDisableEpisodeTitleFetch] =
    useState(false);
  const [disableAutoLoadDanmaku, setDisableAutoLoadDanmaku] = useState(false);
  const [danmakuMaxCount, setDanmakuMaxCount] = useState(5000);
  const [danmakuHeatmapDisabled, setDanmakuHeatmapDisabled] = useState(false);
  const [danmakuTraditionalToSimplified, setDanmakuTraditionalToSimplified] =
    useState(false);
  const [searchTraditionalToSimplified, setSearchTraditionalToSimplified] =
    useState(false);
  const [exactSearch, setExactSearch] = useState(true);
  const [maxConcurrentDownloads, setMaxConcurrentDownloads] = useState(6);
  const [downloadThreadsPerTask, setDownloadThreadsPerTask] = useState(6);
  const [downloadSegmentTimeout, setDownloadSegmentTimeout] = useState(30000);
  const [downloadMode, setDownloadMode] = useState<'browser' | 'filesystem' | 'indexeddb'>(
    'browser'
  );
  const [filesystemSavePath, setFilesystemSavePath] = useState<string>('');
  // 折叠面板状态
  const [isDoubanSectionOpen, setIsDoubanSectionOpen] = useState(false);

  // TMDB 图片设置（默认取站点配置的 TMDB 图片默认地址，用户可本地覆盖）
  const [tmdbImageBaseUrl, setTmdbImageBaseUrl] = useState(
    typeof window !== 'undefined'
      ? ((window as any).RUNTIME_CONFIG?.TMDB_IMAGE_BASE_URL as string) ||
        'https://image.tmdb.org'
      : 'https://image.tmdb.org'
  );
  const [isUsageSectionOpen, setIsUsageSectionOpen] = useState(false);
  const [isDownloadSectionOpen, setIsDownloadSectionOpen] = useState(false);
  const [isBufferSectionOpen, setIsBufferSectionOpen] = useState(false);
  const [isDanmakuSectionOpen, setIsDanmakuSectionOpen] = useState(false);
  const [isHomepageSectionOpen, setIsHomepageSectionOpen] = useState(false);

  // 本地设置云同步状态
  const [syncMode, setSyncMode] = useState<'off' | 'manual' | 'auto'>('off');
  const [syncAvailable, setSyncAvailable] = useState(false);
  const [syncBusy, setSyncBusy] = useState(false);
  const [isCloudBackupDropdownOpen, setIsCloudBackupDropdownOpen] =
    useState(false);

  // 首页模块配置
  interface HomeModule {
    id: string;
    name: string;
    enabled: boolean;
    order: number;
  }

  type HomeBannerHeightScale = '1' | '1.5' | '2';

  const defaultHomeModules: HomeModule[] = [
    { id: 'hotMovies', name: '热门电影', enabled: true, order: 0 },
    { id: 'hotDuanju', name: '热播短剧', enabled: true, order: 1 },
    { id: 'bangumiCalendar', name: '新番放送', enabled: true, order: 2 },
    { id: 'hotTvShows', name: '热门剧集', enabled: true, order: 3 },
    { id: 'hotVarietyShows', name: '热门综艺', enabled: true, order: 4 },
    { id: 'upcomingContent', name: '即将上映', enabled: true, order: 5 },
  ];

  const [homeModules, setHomeModules] =
    useState<HomeModule[]>(defaultHomeModules);
  const [homeBannerEnabled, setHomeBannerEnabled] = useState(true);
  const [homeBannerHeightScale, setHomeBannerHeightScale] =
    useState<HomeBannerHeightScale>('1');
  const [homeContinueWatchingEnabled, setHomeContinueWatchingEnabled] =
    useState(true);

  const homeBannerHeightOptions: {
    value: HomeBannerHeightScale;
    label: string;
    description: string;
  }[] = [
    { value: '1', label: '标准', description: '1x' },
    { value: '1.5', label: '增高', description: '1.5x' },
    { value: '2', label: '特高', description: '2x' },
  ];
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

  const animeDataSourceOptions = [
    { value: 'direct', label: '直连（浏览器直连 Bangumi）' },
    { value: 'server-proxy', label: '服务器代理（由服务器访问 Bangumi）' },
    { value: 'sakura', label: '桜色镜像站（bangumi.lol）' },
    { value: 'custom-baseurl', label: '自定义 Base URL' },
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

  // 缓冲策略选项
  const bufferStrategyOptions = [
    { value: 'low', label: '低缓冲（省流量）' },
    { value: 'medium', label: '中缓冲（推荐）' },
    { value: 'high', label: '高缓冲（流畅播放）' },
    { value: 'ultra', label: '超高缓冲（极速体验）' },
  ];
  // 清除弹幕缓存相关状态
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [clearCacheMessage, setClearCacheMessage] = useState<string | null>(
    null
  );
  const [danmakuCacheUsage, setDanmakuCacheUsage] = useState('计算中...');
  const formatCacheSize = useCallback((size: number) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    return `${(size / 1024 / 1024).toFixed(2)} MB`;
  }, []);

  const loadDanmakuCacheUsage = useCallback(async () => {
    try {
      const stats = await getDanmakuCacheStats();
      setDanmakuCacheUsage(formatCacheSize(stats.totalSize));
    } catch (error) {
      console.error('获取弹幕缓存占用失败:', error);
      setDanmakuCacheUsage('获取失败');
    }
  }, [formatCacheSize]);
  useEffect(() => {
    if (!mounted || !open || !isDanmakuSectionOpen) return;
    void (async () => {
      await loadDanmakuCacheUsage();
    })();
  }, [loadDanmakuCacheUsage, mounted, open, isDanmakuSectionOpen]);
  // 从 localStorage 读取设置
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedAggregateSearch = localStorage.getItem(
        'defaultAggregateSearch'
      );
      if (savedAggregateSearch !== null) {
        setDefaultAggregateSearch(JSON.parse(savedAggregateSearch));
      }

      const savedSaveLivePlayRecords = localStorage.getItem(
        SAVE_LIVE_PLAY_RECORDS_KEY
      );
      if (savedSaveLivePlayRecords !== null) {
        setSaveLivePlayRecords(savedSaveLivePlayRecords === 'true');
      }

      const savedDoubanDataSource = localStorage.getItem('doubanDataSource');
      const defaultDoubanProxyType =
        (window as any).RUNTIME_CONFIG?.DOUBAN_PROXY_TYPE ||
        'cmliussss-cdn-tencent';
      if (savedDoubanDataSource !== null) {
        setDoubanDataSource(savedDoubanDataSource);
      } else if (defaultDoubanProxyType) {
        setDoubanDataSource(defaultDoubanProxyType);
      }

      const savedDoubanProxyUrl = localStorage.getItem('doubanProxyUrl');
      const defaultDoubanProxy =
        (window as any).RUNTIME_CONFIG?.DOUBAN_PROXY || '';
      if (savedDoubanProxyUrl !== null) {
        setDoubanProxyUrl(savedDoubanProxyUrl);
      } else if (defaultDoubanProxy) {
        setDoubanProxyUrl(defaultDoubanProxy);
      }

      const savedDoubanDataSourceBackup = localStorage.getItem(
        'doubanDataSourceBackup'
      );
      setDoubanDataSourceBackup(savedDoubanDataSourceBackup || 'direct');

      const savedDoubanProxyUrlBackup = localStorage.getItem(
        'doubanProxyUrlBackup'
      );
      setDoubanProxyUrlBackup(savedDoubanProxyUrlBackup || '');

      const savedAnimeDataSource = localStorage.getItem('animeDataSource');
      const defaultAnimeDataSource =
        (window as any).RUNTIME_CONFIG?.BANGUMI_DATA_SOURCE || 'direct';
      setAnimeDataSource(savedAnimeDataSource || defaultAnimeDataSource);

      const savedAnimeDataSourceBackup = localStorage.getItem(
        'animeDataSourceBackup'
      );
      setAnimeDataSourceBackup(savedAnimeDataSourceBackup || 'server-proxy');

      const savedAnimeCustomBaseUrl =
        localStorage.getItem('animeCustomBaseUrl');
      setAnimeCustomBaseUrl(savedAnimeCustomBaseUrl || '');

      const savedAnimeImageBaseUrl = localStorage.getItem('animeImageBaseUrl');
      setAnimeImageBaseUrl(savedAnimeImageBaseUrl || '');

      fetch('/scripts/bangumi-proxy.worker.js')
        .then((response) => (response.ok ? response.text() : ''))
        .then(setBangumiProxyScript)
        .catch((error) => {
          console.error('加载 Bangumi Workers 脚本失败:', error);
        });

      const savedDoubanImageProxyType = localStorage.getItem(
        'doubanImageProxyType'
      );
      const defaultDoubanImageProxyType =
        (window as any).RUNTIME_CONFIG?.DOUBAN_IMAGE_PROXY_TYPE ||
        'cmliussss-cdn-tencent';
      if (savedDoubanImageProxyType !== null) {
        setDoubanImageProxyType(savedDoubanImageProxyType);
      } else if (defaultDoubanImageProxyType) {
        setDoubanImageProxyType(defaultDoubanImageProxyType);
      }

      const savedDoubanImageProxyUrl = localStorage.getItem(
        'doubanImageProxyUrl'
      );
      const defaultDoubanImageProxyUrl =
        (window as any).RUNTIME_CONFIG?.DOUBAN_IMAGE_PROXY || '';
      if (savedDoubanImageProxyUrl !== null) {
        setDoubanImageProxyUrl(savedDoubanImageProxyUrl);
      } else if (defaultDoubanImageProxyUrl) {
        setDoubanImageProxyUrl(defaultDoubanImageProxyUrl);
      }

      const savedDoubanImageProxyTypeBackup = localStorage.getItem(
        'doubanImageProxyTypeBackup'
      );
      setDoubanImageProxyTypeBackup(
        savedDoubanImageProxyTypeBackup || 'server'
      );

      const savedDoubanImageProxyUrlBackup = localStorage.getItem(
        'doubanImageProxyUrlBackup'
      );
      setDoubanImageProxyUrlBackup(savedDoubanImageProxyUrlBackup || '');

      const savedTmdbImageBaseUrl = localStorage.getItem('tmdbImageBaseUrl');
      if (savedTmdbImageBaseUrl !== null) {
        setTmdbImageBaseUrl(savedTmdbImageBaseUrl);
      }

      const savedEnableOptimization =
        localStorage.getItem('enableOptimization');
      if (savedEnableOptimization !== null) {
        setEnableOptimization(JSON.parse(savedEnableOptimization));
      }

      const savedPreferStrategy = localStorage.getItem('preferStrategy');
      if (savedPreferStrategy === 'fast' || savedPreferStrategy === 'full') {
        setPreferStrategy(savedPreferStrategy);
      }

      const savedPreferMode = localStorage.getItem('preferMode');
      if (
        savedPreferMode === 'balanced' ||
        savedPreferMode === 'resolution' ||
        savedPreferMode === 'speed'
      ) {
        setPreferMode(savedPreferMode);
      }

      const savedSpeedTestTimeout = localStorage.getItem('speedTestTimeout');
      if (savedSpeedTestTimeout !== null) {
        setSpeedTestTimeout(Number(savedSpeedTestTimeout));
      }

      const savedFluidSearch = localStorage.getItem('fluidSearch');
      const defaultFluidSearch =
        (window as any).RUNTIME_CONFIG?.FLUID_SEARCH !== false;
      if (savedFluidSearch !== null) {
        setFluidSearch(JSON.parse(savedFluidSearch));
      } else if (defaultFluidSearch !== undefined) {
        setFluidSearch(defaultFluidSearch);
      }

      const savedTmdbBackdropDisabled = localStorage.getItem(
        'tmdb_backdrop_disabled'
      );
      if (savedTmdbBackdropDisabled !== null) {
        setTmdbBackdropDisabled(savedTmdbBackdropDisabled === 'true');
      }

      const savedEnableTrailers = localStorage.getItem('enableTrailers');
      if (savedEnableTrailers !== null) {
        setEnableTrailers(savedEnableTrailers === 'true');
      }

      const savedBufferStrategy = localStorage.getItem('bufferStrategy');
      if (savedBufferStrategy !== null) {
        setBufferStrategy(savedBufferStrategy);
      }

      const savedNextEpisodePreCache = localStorage.getItem(
        'nextEpisodePreCache'
      );
      if (savedNextEpisodePreCache !== null) {
        setNextEpisodePreCache(savedNextEpisodePreCache === 'true');
      }

      const savedNextEpisodeDanmakuPreload = localStorage.getItem(
        'nextEpisodeDanmakuPreload'
      );
      if (savedNextEpisodeDanmakuPreload !== null) {
        setNextEpisodeDanmakuPreload(savedNextEpisodeDanmakuPreload === 'true');
      }

      const savedDisablePlaybackThumbnail = localStorage.getItem(
        'disablePlaybackThumbnail'
      );
      if (savedDisablePlaybackThumbnail !== null) {
        setDisablePlaybackThumbnail(savedDisablePlaybackThumbnail === 'true');
      }

      const savedDisableEpisodeTitleFetch = localStorage.getItem(
        'disableEpisodeTitleFetch'
      );
      if (savedDisableEpisodeTitleFetch !== null) {
        setDisableEpisodeTitleFetch(savedDisableEpisodeTitleFetch === 'true');
      }

      const savedDisableAutoLoadDanmaku = localStorage.getItem(
        'disableAutoLoadDanmaku'
      );
      if (savedDisableAutoLoadDanmaku !== null) {
        setDisableAutoLoadDanmaku(savedDisableAutoLoadDanmaku === 'true');
      } else {
        const runtimeDefault =
          (window as any).RUNTIME_CONFIG?.DANMAKU_AUTO_LOAD_DEFAULT !== false;
        setDisableAutoLoadDanmaku(!runtimeDefault);
      }

      const savedDanmakuMaxCount = localStorage.getItem('danmakuMaxCount');
      if (savedDanmakuMaxCount !== null) {
        setDanmakuMaxCount(parseInt(savedDanmakuMaxCount, 10));
      }

      const savedDanmakuHeatmapDisabled = localStorage.getItem(
        'danmaku_heatmap_disabled'
      );
      if (savedDanmakuHeatmapDisabled !== null) {
        setDanmakuHeatmapDisabled(savedDanmakuHeatmapDisabled === 'true');
      }

      const savedHomeBannerEnabled = localStorage.getItem('homeBannerEnabled');
      if (savedHomeBannerEnabled !== null) {
        setHomeBannerEnabled(savedHomeBannerEnabled === 'true');
      }

      const savedHomeBannerHeightScale = localStorage.getItem(
        'homeBannerHeightScale'
      );
      if (
        savedHomeBannerHeightScale === '1' ||
        savedHomeBannerHeightScale === '1.5' ||
        savedHomeBannerHeightScale === '2'
      ) {
        setHomeBannerHeightScale(savedHomeBannerHeightScale);
      }

      const savedHomeContinueWatchingEnabled = localStorage.getItem(
        'homeContinueWatchingEnabled'
      );
      if (savedHomeContinueWatchingEnabled !== null) {
        setHomeContinueWatchingEnabled(
          savedHomeContinueWatchingEnabled === 'true'
        );
      }

      // 加载首页模块配置
      const savedHomeModules = localStorage.getItem('homeModules');
      if (savedHomeModules !== null) {
        try {
          setHomeModules(JSON.parse(savedHomeModules));
        } catch (error) {
          console.error('解析首页模块配置失败:', error);
        }
      }

      // 加载弹幕繁简转换设置
      const savedDanmakuTraditionalToSimplified = localStorage.getItem(
        'danmakuTraditionalToSimplified'
      );
      if (savedDanmakuTraditionalToSimplified !== null) {
        setDanmakuTraditionalToSimplified(
          savedDanmakuTraditionalToSimplified === 'true'
        );
      }

      // 加载搜索繁体转简体设置
      const savedSearchTraditionalToSimplified = localStorage.getItem(
        'searchTraditionalToSimplified'
      );
      if (savedSearchTraditionalToSimplified !== null) {
        setSearchTraditionalToSimplified(
          savedSearchTraditionalToSimplified === 'true'
        );
      }

      // 加载精确搜索设置
      const savedExactSearch = localStorage.getItem('exactSearch');
      if (savedExactSearch !== null) {
        setExactSearch(savedExactSearch === 'true');
      }

      // 加载最大同时下载限制设置
      const savedMaxConcurrentDownloads = localStorage.getItem(
        'maxConcurrentDownloads'
      );
      if (savedMaxConcurrentDownloads !== null) {
        setMaxConcurrentDownloads(Number(savedMaxConcurrentDownloads));
      }

      // 加载单任务线程数设置
      const savedDownloadThreadsPerTask = localStorage.getItem(
        'downloadThreadsPerTask'
      );
      if (savedDownloadThreadsPerTask !== null) {
        setDownloadThreadsPerTask(Number(savedDownloadThreadsPerTask));
      }

      // 加载分片下载超时设置
      const savedDownloadSegmentTimeout = localStorage.getItem(
        'downloadSegmentTimeout'
      );
      if (savedDownloadSegmentTimeout !== null) {
        const timeout = Number(savedDownloadSegmentTimeout);
        if (Number.isFinite(timeout)) {
          setDownloadSegmentTimeout(Math.min(Math.max(timeout, 30000), 300000));
        }
      }

      // 加载下载模式设置
      const savedDownloadMode = localStorage.getItem('downloadMode');
      if (
        savedDownloadMode === 'browser' ||
        savedDownloadMode === 'filesystem' ||
        savedDownloadMode === 'indexeddb'
      ) {
        setDownloadMode(savedDownloadMode);
      }

      // 加载保存路径设置
      const savedFilesystemSavePath =
        localStorage.getItem('filesystemSavePath');
      if (savedFilesystemSavePath !== null) {
        setFilesystemSavePath(savedFilesystemSavePath);
      }
    }
  }, []);
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
      if (isDoubanBackupDropdownOpen) {
        const target = event.target as Element;
        if (!target.closest('[data-dropdown="douban-datasource-backup"]')) {
          setIsDoubanBackupDropdownOpen(false);
        }
      }
    };

    if (isDoubanBackupDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDoubanBackupDropdownOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isAnimeDropdownOpen) {
        const target = event.target as Element;
        if (!target.closest('[data-dropdown="anime-datasource"]')) {
          setIsAnimeDropdownOpen(false);
        }
      }
    };

    if (isAnimeDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isAnimeDropdownOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isAnimeBackupDropdownOpen) {
        const target = event.target as Element;
        if (!target.closest('[data-dropdown="anime-datasource-backup"]')) {
          setIsAnimeBackupDropdownOpen(false);
        }
      }
    };

    if (isAnimeBackupDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isAnimeBackupDropdownOpen]);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isDoubanImageProxyBackupDropdownOpen) {
        const target = event.target as Element;
        if (!target.closest('[data-dropdown="douban-image-proxy-backup"]')) {
          setIsDoubanImageProxyBackupDropdownOpen(false);
        }
      }
    };

    if (isDoubanImageProxyBackupDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDoubanImageProxyBackupDropdownOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isCloudBackupDropdownOpen) {
        const target = event.target as Element;
        if (!target.closest('[data-dropdown="cloud-backup"]')) {
          setIsCloudBackupDropdownOpen(false);
        }
      }
    };

    if (isCloudBackupDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isCloudBackupDropdownOpen]);

  const handleAggregateToggle = (value: boolean) => {
    setDefaultAggregateSearch(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('defaultAggregateSearch', JSON.stringify(value));
    }
  };

  const handleSaveLivePlayRecordsToggle = (value: boolean) => {
    setSaveLivePlayRecords(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem(SAVE_LIVE_PLAY_RECORDS_KEY, String(value));
    }
  };

  const handleDoubanProxyUrlChange = (value: string) => {
    setDoubanProxyUrl(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('doubanProxyUrl', value);
    }
  };

  const handleOptimizationToggle = (value: boolean) => {
    setEnableOptimization(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('enableOptimization', JSON.stringify(value));
    }
  };

  const handlePreferStrategyChange = (value: 'fast' | 'full') => {
    setPreferStrategy(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferStrategy', value);
    }
  };

  const handlePreferModeChange = (
    value: 'balanced' | 'resolution' | 'speed'
  ) => {
    setPreferMode(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferMode', value);
    }
  };

  const handleSpeedTestTimeoutChange = (value: number) => {
    setSpeedTestTimeout(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('speedTestTimeout', String(value));
    }
  };

  const handleMaxConcurrentDownloadsChange = (value: number) => {
    setMaxConcurrentDownloads(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('maxConcurrentDownloads', String(value));
    }
  };

  const handleDownloadThreadsPerTaskChange = (value: number) => {
    setDownloadThreadsPerTask(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('downloadThreadsPerTask', String(value));
    }
  };

  const handleDownloadSegmentTimeoutChange = (value: number) => {
    const normalizedValue = Math.min(Math.max(value, 30000), 300000);
    setDownloadSegmentTimeout(normalizedValue);
    if (typeof window !== 'undefined') {
      localStorage.setItem('downloadSegmentTimeout', String(normalizedValue));
    }
  };

  const formatDownloadSegmentTimeout = (value: number) => {
    if (value < 60000) {
      return `${Math.round(value / 1000)}秒`;
    }

    const minutes = Math.floor(value / 60000);
    const seconds = Math.round((value % 60000) / 1000);
    return seconds > 0 ? `${minutes}分${seconds}秒` : `${minutes}分钟`;
  };

  const handleDownloadModeChange = (mode: 'browser' | 'filesystem' | 'indexeddb') => {
    // 如果选择 filesystem 模式，先检测浏览器是否支持
    if (
      mode === 'filesystem' &&
      typeof window !== 'undefined' &&
      !('showDirectoryPicker' in window)
    ) {
      confirm({
        title: '浏览器不支持',
        message:
          '您的浏览器不支持 File System Access API，请使用 Chrome 86+ 或 Edge 86+',
        onConfirm: () => undefined,
      });
      return;
    }

    setDownloadMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('downloadMode', mode);
    }
  };

  const handleSelectSavePath = async () => {
    try {
      const dirHandle = await (window as any).showDirectoryPicker();
      setFilesystemSavePath(dirHandle.name);
      localStorage.setItem('filesystemSavePath', dirHandle.name);

      // 保存目录句柄到 IndexedDB
      const dbName = 'MoonTVPlus';
      const storeName = 'dirHandles';

      // 使用 Promise 包装 IndexedDB 操作
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.open(dbName, 2); // 使用版本 2，与 download-db.ts 保持一致

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;

          // 创建 dirHandles 表（如果不存在）
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName);
          }

          // 创建 activeTasks 表（如果不存在）
          if (!db.objectStoreNames.contains('activeTasks')) {
            const activeStore = db.createObjectStore('activeTasks', {
              keyPath: 'id',
            });
            activeStore.createIndex('status', 'status', { unique: false });
            activeStore.createIndex('createdAt', 'createdAt', {
              unique: false,
            });
          }

          // 创建 completedTasks 表（如果不存在）
          if (!db.objectStoreNames.contains('completedTasks')) {
            const completedStore = db.createObjectStore('completedTasks', {
              keyPath: 'id',
            });
            completedStore.createIndex('source', 'source', { unique: false });
            completedStore.createIndex('videoId', 'videoId', { unique: false });
            completedStore.createIndex('completedAt', 'completedAt', {
              unique: false,
            });
            completedStore.createIndex('sourceVideoId', ['source', 'videoId'], {
              unique: false,
            });
          }
        };

        request.onsuccess = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          const transaction = db.transaction([storeName], 'readwrite');
          const store = transaction.objectStore(storeName);
          const putRequest = store.put(dirHandle, 'downloadDir');

          putRequest.onsuccess = () => {
            db.close();
            resolve();
          };

          putRequest.onerror = () => {
            db.close();
            reject(new Error('保存目录句柄失败'));
          };
        };

        request.onerror = () => {
          reject(new Error('无法打开 IndexedDB'));
        };
      });
    } catch (err) {
      console.error('选择目录失败:', err);
    }
  };

  const handleFluidSearchToggle = (value: boolean) => {
    setFluidSearch(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('fluidSearch', JSON.stringify(value));
    }
  };

  const handleTmdbBackdropDisabledToggle = (value: boolean) => {
    setTmdbBackdropDisabled(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('tmdb_backdrop_disabled', String(value));
    }
  };

  const handleEnableTrailersToggle = (value: boolean) => {
    setEnableTrailers(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('enableTrailers', String(value));
    }
  };

  const handleDoubanDataSourceChange = (value: string) => {
    setDoubanDataSource(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('doubanDataSource', value);
    }
  };

  const handleDoubanDataSourceBackupChange = (value: string) => {
    setDoubanDataSourceBackup(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('doubanDataSourceBackup', value);
    }
  };

  const handleAnimeDataSourceChange = (value: string) => {
    clearBangumiImageFallbackCache();
    setAnimeDataSource(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('animeDataSource', value);
    }
  };

  const handleAnimeDataSourceBackupChange = (value: string) => {
    clearBangumiImageFallbackCache();
    setAnimeDataSourceBackup(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('animeDataSourceBackup', value);
    }
  };

  const handleAnimeCustomBaseUrlChange = (value: string) => {
    clearBangumiImageFallbackCache();
    setAnimeCustomBaseUrl(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('animeCustomBaseUrl', value);
    }
  };

  const handleAnimeImageBaseUrlChange = (value: string) => {
    clearBangumiImageFallbackCache();
    setAnimeImageBaseUrl(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('animeImageBaseUrl', value);
    }
  };

  const handleCopyBangumiProxyScript = async () => {
    if (!bangumiProxyScript) return;
    try {
      await navigator.clipboard.writeText(bangumiProxyScript);
      setBangumiProxyScriptCopied(true);
      setTimeout(() => setBangumiProxyScriptCopied(false), 2000);
    } catch (error) {
      console.error('复制 Bangumi Workers 脚本失败:', error);
    }
  };

  const handleDoubanImageProxyTypeChange = (value: string) => {
    setDoubanImageProxyType(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('doubanImageProxyType', value);
    }
  };

  const handleDoubanImageProxyTypeBackupChange = (value: string) => {
    setDoubanImageProxyTypeBackup(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('doubanImageProxyTypeBackup', value);
    }
  };

  const handleDoubanProxyUrlBackupChange = (value: string) => {
    setDoubanProxyUrlBackup(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('doubanProxyUrlBackup', value);
    }
  };

  const handleDoubanImageProxyUrlChange = (value: string) => {
    setDoubanImageProxyUrl(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('doubanImageProxyUrl', value);
    }
  };

  const handleDoubanImageProxyUrlBackupChange = (value: string) => {
    setDoubanImageProxyUrlBackup(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('doubanImageProxyUrlBackup', value);
    }
  };

  const handleTmdbImageBaseUrlChange = (value: string) => {
    setTmdbImageBaseUrl(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('tmdbImageBaseUrl', value);
    }
  };

  const handleBufferStrategyChange = (value: string) => {
    setBufferStrategy(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('bufferStrategy', value);
    }
  };

  // 将滑块值转换为策略值
  const getBufferStrategyFromSlider = (sliderValue: number): string => {
    const strategies = ['low', 'medium', 'high', 'ultra'];
    return strategies[sliderValue] || 'medium';
  };

  // 将策略值转换为滑块值
  const getSliderValueFromStrategy = (strategy: string): number => {
    const strategies = ['low', 'medium', 'high', 'ultra'];
    const index = strategies.indexOf(strategy);
    return index >= 0 ? index : 1; // 默认返回 1 (medium)
  };

  const handleNextEpisodePreCacheToggle = (value: boolean) => {
    setNextEpisodePreCache(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nextEpisodePreCache', String(value));
    }
  };

  const handleNextEpisodeDanmakuPreloadToggle = (value: boolean) => {
    setNextEpisodeDanmakuPreload(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nextEpisodeDanmakuPreload', String(value));
    }
  };

  const handleDisablePlaybackThumbnailToggle = (value: boolean) => {
    setDisablePlaybackThumbnail(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('disablePlaybackThumbnail', String(value));
    }
  };

  const handleDisableEpisodeTitleFetchToggle = (value: boolean) => {
    setDisableEpisodeTitleFetch(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('disableEpisodeTitleFetch', String(value));
    }
  };

  const handleDisableAutoLoadDanmakuToggle = (value: boolean) => {
    setDisableAutoLoadDanmaku(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('disableAutoLoadDanmaku', String(value));
    }
  };

  const handleDanmakuMaxCountChange = (value: number) => {
    setDanmakuMaxCount(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('danmakuMaxCount', String(value));
    }
  };

  const handleDanmakuHeatmapDisabledToggle = (value: boolean) => {
    setDanmakuHeatmapDisabled(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('danmaku_heatmap_disabled', String(value));
    }
  };

  const handleDanmakuTraditionalToSimplifiedToggle = (value: boolean) => {
    setDanmakuTraditionalToSimplified(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('danmakuTraditionalToSimplified', String(value));
    }
  };

  const handleSearchTraditionalToSimplifiedToggle = (value: boolean) => {
    setSearchTraditionalToSimplified(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('searchTraditionalToSimplified', String(value));
    }
  };

  const handleExactSearchToggle = (value: boolean) => {
    setExactSearch(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('exactSearch', String(value));
    }
  };

  const handleHomeBannerToggle = (value: boolean) => {
    setHomeBannerEnabled(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('homeBannerEnabled', String(value));
      window.dispatchEvent(new CustomEvent('homeModulesUpdated'));
    }
  };

  const handleHomeBannerHeightScaleChange = (value: HomeBannerHeightScale) => {
    setHomeBannerHeightScale(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('homeBannerHeightScale', value);
      window.dispatchEvent(new CustomEvent('homeModulesUpdated'));
    }
  };

  const handleHomeContinueWatchingToggle = (value: boolean) => {
    setHomeContinueWatchingEnabled(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('homeContinueWatchingEnabled', String(value));
      window.dispatchEvent(new CustomEvent('homeModulesUpdated'));
    }
  };

  // 首页模块配置处理函数
  const handleHomeModuleToggle = (id: string, enabled: boolean) => {
    const updatedModules = homeModules.map((module) =>
      module.id === id ? { ...module, enabled } : module
    );
    setHomeModules(updatedModules);
    if (typeof window !== 'undefined') {
      localStorage.setItem('homeModules', JSON.stringify(updatedModules));
      // 触发自定义事件通知首页刷新
      window.dispatchEvent(new CustomEvent('homeModulesUpdated'));
    }
  };

  const handleHomeModuleMoveUp = (index: number) => {
    if (index === 0) return;
    const updatedModules = [...homeModules];
    const temp = updatedModules[index];
    updatedModules[index] = updatedModules[index - 1];
    updatedModules[index - 1] = temp;
    // 更新order
    updatedModules.forEach((module, idx) => {
      module.order = idx;
    });
    setHomeModules(updatedModules);
    if (typeof window !== 'undefined') {
      localStorage.setItem('homeModules', JSON.stringify(updatedModules));
      window.dispatchEvent(new CustomEvent('homeModulesUpdated'));
    }
  };

  const handleHomeModuleMoveDown = (index: number) => {
    if (index === homeModules.length - 1) return;
    const updatedModules = [...homeModules];
    const temp = updatedModules[index];
    updatedModules[index] = updatedModules[index + 1];
    updatedModules[index + 1] = temp;
    // 更新order
    updatedModules.forEach((module, idx) => {
      module.order = idx;
    });
    setHomeModules(updatedModules);
    if (typeof window !== 'undefined') {
      localStorage.setItem('homeModules', JSON.stringify(updatedModules));
      window.dispatchEvent(new CustomEvent('homeModulesUpdated'));
    }
  };

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

  const handleResetSettings = () => {
    const defaultDoubanProxyType =
      (window as any).RUNTIME_CONFIG?.DOUBAN_PROXY_TYPE ||
      'cmliussss-cdn-tencent';
    const defaultDoubanProxy =
      (window as any).RUNTIME_CONFIG?.DOUBAN_PROXY || '';
    const defaultDoubanImageProxyType =
      (window as any).RUNTIME_CONFIG?.DOUBAN_IMAGE_PROXY_TYPE ||
      'cmliussss-cdn-tencent';
    const defaultDoubanImageProxyUrl =
      (window as any).RUNTIME_CONFIG?.DOUBAN_IMAGE_PROXY || '';
    const defaultFluidSearch =
      (window as any).RUNTIME_CONFIG?.FLUID_SEARCH !== false;
    const defaultAnimeDataSource =
      (window as any).RUNTIME_CONFIG?.BANGUMI_DATA_SOURCE || 'direct';
    const defaultAnimeBaseUrl = '';
    const defaultAnimeImageBaseUrl = '';

    setDefaultAggregateSearch(true);
    setSaveLivePlayRecords(false);
    setEnableOptimization(true);
    setPreferStrategy('fast');
    setPreferMode('balanced');
    setFluidSearch(defaultFluidSearch);
    setTmdbBackdropDisabled(false);
    setEnableTrailers(false);
    setDoubanProxyUrl(defaultDoubanProxy);
    setDoubanDataSource(defaultDoubanProxyType);
    setDoubanDataSourceBackup('direct');
    setDoubanProxyUrlBackup('');
    setAnimeDataSource(defaultAnimeDataSource);
    setAnimeDataSourceBackup('server-proxy');
    setAnimeCustomBaseUrl(defaultAnimeBaseUrl);
    setAnimeImageBaseUrl(defaultAnimeImageBaseUrl);
    setDoubanImageProxyType(defaultDoubanImageProxyType);
    setDoubanImageProxyUrl(defaultDoubanImageProxyUrl);
    setDoubanImageProxyTypeBackup('server');
    setDoubanImageProxyUrlBackup('');
    setTmdbImageBaseUrl('https://image.tmdb.org');
    setBufferStrategy('medium');
    setNextEpisodePreCache(true);
    setNextEpisodeDanmakuPreload(true);
    setDisablePlaybackThumbnail(true);
    setDisableEpisodeTitleFetch(false);
    const defaultDanmakuAutoLoad =
      (typeof window !== 'undefined' &&
        (window as any).RUNTIME_CONFIG?.DANMAKU_AUTO_LOAD_DEFAULT !== false) ||
      false;
    setDisableAutoLoadDanmaku(!defaultDanmakuAutoLoad);
    setHomeBannerEnabled(true);
    setHomeBannerHeightScale('1');
    setHomeContinueWatchingEnabled(true);
    setHomeModules(defaultHomeModules);
    setDanmakuTraditionalToSimplified(false);
    setSearchTraditionalToSimplified(false);

    if (typeof window !== 'undefined') {
      localStorage.setItem('defaultAggregateSearch', JSON.stringify(true));
      localStorage.setItem(SAVE_LIVE_PLAY_RECORDS_KEY, 'false');
      localStorage.setItem('enableOptimization', JSON.stringify(true));
      localStorage.setItem('preferStrategy', 'fast');
      localStorage.setItem('preferMode', 'balanced');
      localStorage.setItem('fluidSearch', JSON.stringify(defaultFluidSearch));
      localStorage.setItem('liveDirectConnect', JSON.stringify(false));
      localStorage.setItem('tmdb_backdrop_disabled', 'false');
      localStorage.setItem('enableTrailers', 'false');
      localStorage.setItem('doubanProxyUrl', defaultDoubanProxy);
      localStorage.setItem('doubanDataSource', defaultDoubanProxyType);
      localStorage.setItem('doubanDataSourceBackup', 'direct');
      localStorage.setItem('doubanProxyUrlBackup', '');
      localStorage.setItem('animeDataSource', defaultAnimeDataSource);
      localStorage.setItem('animeDataSourceBackup', 'server-proxy');
      localStorage.setItem('animeCustomBaseUrl', defaultAnimeBaseUrl);
      localStorage.setItem('animeImageBaseUrl', defaultAnimeImageBaseUrl);
      localStorage.setItem('doubanImageProxyType', defaultDoubanImageProxyType);
      localStorage.setItem('doubanImageProxyUrl', defaultDoubanImageProxyUrl);
      localStorage.setItem('doubanImageProxyTypeBackup', 'server');
      localStorage.setItem('doubanImageProxyUrlBackup', '');
      localStorage.setItem('tmdbImageBaseUrl', 'https://image.tmdb.org');
      localStorage.setItem('bufferStrategy', 'medium');
      localStorage.setItem('nextEpisodePreCache', 'true');
      localStorage.setItem('nextEpisodeDanmakuPreload', 'true');
      localStorage.setItem('disablePlaybackThumbnail', 'true');
      localStorage.setItem('disableEpisodeTitleFetch', 'false');
      localStorage.setItem(
        'disableAutoLoadDanmaku',
        String(!defaultDanmakuAutoLoad)
      );
      localStorage.setItem('danmakuMaxCount', '5000');
      localStorage.setItem('danmaku_heatmap_disabled', 'false');
      localStorage.setItem('homeBannerEnabled', 'true');
      localStorage.setItem('homeBannerHeightScale', '1');
      localStorage.setItem('homeContinueWatchingEnabled', 'true');
      localStorage.setItem('homeModules', JSON.stringify(defaultHomeModules));
      localStorage.setItem('danmakuTraditionalToSimplified', 'false');
      localStorage.setItem('searchTraditionalToSimplified', 'false');
      window.dispatchEvent(new CustomEvent('homeModulesUpdated'));
    }
  };

  // ---------- 本地设置云同步 ----------

  // 初始化：读取根布局注入的全局模式
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const runtimeConfig = (window as any).RUNTIME_CONFIG || {};
    const mode =
      runtimeConfig.LOCAL_SETTINGS_SYNC_MODE === 'manual' ||
      runtimeConfig.LOCAL_SETTINGS_SYNC_MODE === 'auto'
        ? runtimeConfig.LOCAL_SETTINGS_SYNC_MODE
        : 'off';
    const storageType = runtimeConfig.STORAGE_TYPE || 'localstorage';
    const supportedStorageTypes = new Set([
      'd1',
      'postgres',
      'turso',
      'redis',
      'upstash',
      'kvrocks',
    ]);
    const username = getAuthInfoFromBrowserCookie()?.username;
    const enabled =
      supportedStorageTypes.has(storageType) &&
      Boolean(username) &&
      mode !== 'off';

    setSyncAvailable(enabled);
    setSyncMode(mode);

    // 自动模式：同一用户在当前页面生命周期内只恢复一次，两个 UserMenu 实例共享同一请求。
    if (mode === 'auto' && enabled && username) {
      const syncState = (window as any).__moontvLocalSettingsAutoPull as
        | { username: string; promise: Promise<boolean> }
        | undefined;
      if (!syncState || syncState.username !== username) {
        (window as any).__moontvLocalSettingsAutoPull = {
          username,
          promise: pullRemoteSettings(false),
        };
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // 从 localStorage 读取白名单键的当前快照（仅含已设置的键）
  const snapshotLocalSettings = (): Record<string, string> => {
    if (typeof window === 'undefined') return {};
    const data: Record<string, string> = {};
    for (const key of LOCAL_SETTINGS_KEYS) {
      const value = localStorage.getItem(key);
      if (value !== null) {
        data[key] = value;
      }
    }
    return data;
  };

  // 把单个键重置为「未设置」：删除 localStorage 并将组件状态恢复为默认值
  const resetKeyToDefault = (key: string) => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
    }
    switch (key) {
      case 'defaultAggregateSearch':
        setDefaultAggregateSearch(true);
        break;
      case 'saveLivePlayRecords':
        setSaveLivePlayRecords(false);
        break;
      case 'enableOptimization':
        setEnableOptimization(true);
        break;
      case 'preferStrategy':
        setPreferStrategy('fast');
        break;
      case 'preferMode':
        setPreferMode('balanced');
        break;
      case 'speedTestTimeout':
        setSpeedTestTimeout(4000);
        break;
      case 'maxConcurrentDownloads':
        setMaxConcurrentDownloads(6);
        break;
      case 'downloadThreadsPerTask':
        setDownloadThreadsPerTask(6);
        break;
      case 'downloadSegmentTimeout':
        setDownloadSegmentTimeout(30000);
        break;
      case 'downloadMode':
        setDownloadMode('browser');
        break;
      case 'filesystemSavePath':
        setFilesystemSavePath('');
        break;
      case 'fluidSearch':
        setFluidSearch(
          typeof window === 'undefined' ||
            (window as any).RUNTIME_CONFIG?.FLUID_SEARCH !== false
        );
        break;
      case 'tmdb_backdrop_disabled':
        setTmdbBackdropDisabled(false);
        break;
      case 'enableTrailers':
        setEnableTrailers(false);
        break;
      case 'doubanProxyUrl':
        setDoubanProxyUrl((window as any).RUNTIME_CONFIG?.DOUBAN_PROXY || '');
        break;
      case 'doubanDataSource':
        setDoubanDataSource(
          (window as any).RUNTIME_CONFIG?.DOUBAN_PROXY_TYPE ||
            'cmliussss-cdn-tencent'
        );
        break;
      case 'doubanDataSourceBackup':
        setDoubanDataSourceBackup('direct');
        break;
      case 'doubanProxyUrlBackup':
        setDoubanProxyUrlBackup('');
        break;
      case 'animeDataSource':
        setAnimeDataSource(
          (window as any).RUNTIME_CONFIG?.BANGUMI_DATA_SOURCE || 'direct'
        );
        break;
      case 'animeDataSourceBackup':
        setAnimeDataSourceBackup('server-proxy');
        break;
      case 'animeCustomBaseUrl':
        setAnimeCustomBaseUrl('');
        break;
      case 'animeImageBaseUrl':
        setAnimeImageBaseUrl('');
        break;
      case 'doubanImageProxyType':
        setDoubanImageProxyType(
          (window as any).RUNTIME_CONFIG?.DOUBAN_IMAGE_PROXY_TYPE ||
            'cmliussss-cdn-tencent'
        );
        break;
      case 'doubanImageProxyUrl':
        setDoubanImageProxyUrl(
          (window as any).RUNTIME_CONFIG?.DOUBAN_IMAGE_PROXY || ''
        );
        break;
      case 'doubanImageProxyTypeBackup':
        setDoubanImageProxyTypeBackup('server');
        break;
      case 'doubanImageProxyUrlBackup':
        setDoubanImageProxyUrlBackup('');
        break;
      case 'tmdbImageBaseUrl':
        setTmdbImageBaseUrl(
          (window as any).RUNTIME_CONFIG?.TMDB_IMAGE_BASE_URL ||
            'https://image.tmdb.org'
        );
        break;
      case 'bufferStrategy':
        setBufferStrategy('medium');
        break;
      case 'nextEpisodePreCache':
        setNextEpisodePreCache(true);
        break;
      case 'nextEpisodeDanmakuPreload':
        setNextEpisodeDanmakuPreload(true);
        break;
      case 'disablePlaybackThumbnail':
        setDisablePlaybackThumbnail(true);
        break;
      case 'disableEpisodeTitleFetch':
        setDisableEpisodeTitleFetch(false);
        break;
      case 'disableAutoLoadDanmaku':
        setDisableAutoLoadDanmaku(
          (window as any).RUNTIME_CONFIG?.DANMAKU_AUTO_LOAD_DEFAULT === false
        );
        break;
      case 'danmakuMaxCount':
        setDanmakuMaxCount(5000);
        break;
      case 'danmaku_heatmap_disabled':
        setDanmakuHeatmapDisabled(false);
        break;
      case 'homeBannerEnabled':
        setHomeBannerEnabled(true);
        break;
      case 'homeBannerHeightScale':
        setHomeBannerHeightScale('1');
        break;
      case 'homeContinueWatchingEnabled':
        setHomeContinueWatchingEnabled(true);
        break;
      case 'homeModules':
        setHomeModules(defaultHomeModules);
        break;
      case 'danmakuTraditionalToSimplified':
        setDanmakuTraditionalToSimplified(false);
        break;
      case 'searchTraditionalToSimplified':
        setSearchTraditionalToSimplified(false);
        break;
      case 'exactSearch':
        setExactSearch(true);
        break;
      default:
        break;
    }
  };

  // 把云端 payload 写回 localStorage（不触发服务端，仅本地生效）
  const applyRemotePayloadCore = (payload: LocalSettingsPayload | null) => {
    if (!payload || typeof payload.data !== 'object') return;
    if (typeof window === 'undefined') return;
    for (const key of Object.keys(payload.data)) {
      if (!LOCAL_SETTINGS_KEYS.includes(key)) continue;
      const value = payload.data[key];
      localStorage.setItem(key, value);
      // 同步更新状态，保证界面即时生效
      switch (key) {
        case 'defaultAggregateSearch':
          setDefaultAggregateSearch(value === 'true');
          break;
        case 'saveLivePlayRecords':
          setSaveLivePlayRecords(value === 'true');
          break;
        case 'enableOptimization':
          setEnableOptimization(value === 'true');
          break;
        case 'preferStrategy':
          setPreferStrategy(value === 'full' ? 'full' : 'fast');
          break;
        case 'preferMode':
          setPreferMode(
            value === 'resolution' || value === 'speed' ? value : 'balanced'
          );
          break;
        case 'speedTestTimeout':
          setSpeedTestTimeout(Number(value) || 10);
          break;
        case 'maxConcurrentDownloads':
          setMaxConcurrentDownloads(Number(value) || 1);
          break;
        case 'downloadThreadsPerTask':
          setDownloadThreadsPerTask(Number(value) || 1);
          break;
        case 'downloadSegmentTimeout':
          setDownloadSegmentTimeout(Number(value) || 10);
          break;
        case 'downloadMode':
          setDownloadMode(value as any);
          break;
        case 'fluidSearch':
          setFluidSearch(value === 'true');
          break;
        case 'tmdb_backdrop_disabled':
          setTmdbBackdropDisabled(value === 'true');
          break;
        case 'enableTrailers':
          setEnableTrailers(value === 'true');
          break;
        case 'doubanProxyUrl':
          setDoubanProxyUrl(value);
          break;
        case 'doubanDataSource':
          setDoubanDataSource(value);
          break;
        case 'doubanDataSourceBackup':
          setDoubanDataSourceBackup(value);
          break;
        case 'doubanProxyUrlBackup':
          setDoubanProxyUrlBackup(value);
          break;
        case 'animeDataSource':
          setAnimeDataSource(value);
          break;
        case 'animeDataSourceBackup':
          setAnimeDataSourceBackup(value);
          break;
        case 'animeCustomBaseUrl':
          setAnimeCustomBaseUrl(value);
          break;
        case 'animeImageBaseUrl':
          setAnimeImageBaseUrl(value);
          break;
        case 'doubanImageProxyType':
          setDoubanImageProxyType(value);
          break;
        case 'doubanImageProxyUrl':
          setDoubanImageProxyUrl(value);
          break;
        case 'doubanImageProxyTypeBackup':
          setDoubanImageProxyTypeBackup(value);
          break;
        case 'doubanImageProxyUrlBackup':
          setDoubanImageProxyUrlBackup(value);
          break;
        case 'tmdbImageBaseUrl':
          setTmdbImageBaseUrl(value);
          break;
        case 'bufferStrategy':
          setBufferStrategy(value as any);
          break;
        case 'nextEpisodePreCache':
          setNextEpisodePreCache(value === 'true');
          break;
        case 'nextEpisodeDanmakuPreload':
          setNextEpisodeDanmakuPreload(value === 'true');
          break;
        case 'disablePlaybackThumbnail':
          setDisablePlaybackThumbnail(value === 'true');
          break;
        case 'disableEpisodeTitleFetch':
          setDisableEpisodeTitleFetch(value === 'true');
          break;
        case 'disableAutoLoadDanmaku':
          setDisableAutoLoadDanmaku(value === 'true');
          break;
        case 'danmakuMaxCount':
          setDanmakuMaxCount(Number(value) || 5000);
          break;
        case 'danmaku_heatmap_disabled':
          setDanmakuHeatmapDisabled(value === 'true');
          break;
        case 'homeBannerEnabled':
          setHomeBannerEnabled(value === 'true');
          break;
        case 'homeBannerHeightScale':
          setHomeBannerHeightScale(value as HomeBannerHeightScale);
          break;
        case 'homeContinueWatchingEnabled':
          setHomeContinueWatchingEnabled(value === 'true');
          break;
        case 'homeModules':
          try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) setHomeModules(parsed);
          } catch {
            // 忽略解析失败
          }
          break;
        case 'danmakuTraditionalToSimplified':
          setDanmakuTraditionalToSimplified(value === 'true');
          break;
        case 'searchTraditionalToSimplified':
          setSearchTraditionalToSimplified(value === 'true');
          break;
        case 'exactSearch':
          setExactSearch(value === 'true');
          break;
        default:
          break;
      }
    }
    // 恢复时删除「未设置」的键：data 中不存在的白名单键视为源设备未设置，
    // 删除本地键回退默认，避免目标设备残留自定义值
    for (const key of LOCAL_SETTINGS_KEYS) {
      if (!(key in payload.data)) {
        resetKeyToDefault(key);
      }
    }
    // 更新本地拉取时间标记，避免每次进入都重复写入
    try {
      const last = localStorage.getItem(LOCAL_SETTINGS_SYNC_LAST_PULL_KEY);
      if (payload.updatedAt && last !== String(payload.updatedAt)) {
        localStorage.setItem(
          LOCAL_SETTINGS_SYNC_LAST_PULL_KEY,
          String(payload.updatedAt)
        );
      }
    } catch {
      // 忽略
    }
  };

  // 应用远端 payload：写 localStorage + 广播事件，让所有 UserMenu 实例同步状态
  const applyRemotePayload = (payload: LocalSettingsPayload | null) => {
    if (!payload || typeof payload.data !== 'object') return;
    if (typeof window === 'undefined') return;
    applyRemotePayloadCore(payload);
    // 页面上存在多个 UserMenu 实例（桌面端/移动端），
    // 仅发起拉取的那个实例会更新 state，其余实例通过事件同步
    window.dispatchEvent(
      new CustomEvent('moontv_local_settings_applied', {
        detail: { payload },
      })
    );
  };

  // 监听其他实例的恢复广播，同步本实例状态
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ payload?: LocalSettingsPayload }>)
        .detail;
      if (detail?.payload) {
        applyRemotePayloadCore(detail.payload);
      }
    };
    window.addEventListener('moontv_local_settings_applied', handler);
    return () => {
      window.removeEventListener('moontv_local_settings_applied', handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 云同步结果以 Toast 展示
  const showSyncToast = (text: string, ok: boolean) => {
    if (ok) {
      showSuccess(text);
    } else {
      showError(text);
    }
  };
  // 从云端拉取副本（自动模式进入网站时、手动恢复时调用）
  const pullRemoteSettings = async (manual: boolean): Promise<boolean> => {
    if (manual) setSyncBusy(true);
    try {
      const res = await fetch('/api/local-settings-sync', { cache: 'no-store' });
      if (!res.ok) {
        if (manual) {
          showSyncToast('拉取失败，云端暂无备份或未登录', false);
        }
        return false;
      }
      const data = await res.json();

      if (manual) {
        // 手动恢复：需要用户确认，由调用方（按钮）先弹确认框
        if (!data.payload) {
          showSyncToast('云端暂无备份', false);
          return false;
        }
        applyRemotePayload(data.payload);
        showSyncToast('已从云端恢复本地设置', true);
        return true;
      }

      // 自动模式：仅在远端比本地上次同步新时才写入，避免重复刷新
      const lastLocal = Number(
        localStorage.getItem(LOCAL_SETTINGS_SYNC_LAST_PULL_KEY) || 0
      );
      if (data.payload && data.updatedAt && data.updatedAt > lastLocal) {
        applyRemotePayload(data.payload);
      }
      return true;
    } catch {
      if (manual) {
        showSyncToast('拉取失败，请检查网络', false);
      }
      return false;
    } finally {
      if (manual) setSyncBusy(false);
    }
  };
  // 上传本地设置到云端（手动备份 / 自动静默同步共用）
  const pushRemoteSettings = async (
    opts?: { silent?: boolean; confirmBefore?: boolean }
  ) => {
    const doPush = async (): Promise<boolean> => {
      if (!opts?.silent) setSyncBusy(true);
      const data = snapshotLocalSettings();
      const payload: LocalSettingsPayload = {
        version: 1,
        data,
        updatedAt: Date.now(),
      };

      try {
        const res = await fetch('/api/local-settings-sync', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payload }),
        });
        if (!res.ok) {
          if (!opts?.silent) {
            showSyncToast('备份失败，请确认已登录', false);
          }
          return false;
        }
        const result = await res.json();
        // 服务端判定内容未变，无需重复备份
        if (result.changed === false) {
          if (!opts?.silent) {
            showSyncToast('本地设置无变化，无需备份', false);
          }
          return true;
        }
        // 记录本次上传时间，避免自动模式下反复推送
        try {
          localStorage.setItem(
            LOCAL_SETTINGS_SYNC_LAST_PULL_KEY,
            String(result.updatedAt ?? payload.updatedAt)
          );
        } catch {
          // 忽略
        }
        if (!opts?.silent) {
          showSyncToast('已备份到云端', true);
        }
        return true;
      } catch {
        if (!opts?.silent) {
          showSyncToast('备份失败，请检查网络', false);
        }
        return false;
      } finally {
        if (!opts?.silent) setSyncBusy(false);
      }
    };

    if (opts?.confirmBefore) {
      confirm({
        title: '备份本地设置',
        message: '将把当前设备的本地设置备份到云端（仅单副本，会覆盖云端旧备份）。确定继续吗？',
        onConfirm: () => {
          void doPush();
        },
      });
      return;
    }
    return doPush();
  };

  const handleRestoreFromCloud = () => {
    confirm({
      title: '恢复云端设置',
      message:
        '将用云端备份覆盖当前设备的本地设置。确定继续吗？\n（不会影响播放记录、收藏等隐私数据）',
      onConfirm: () => {
        void pullRemoteSettings(true);
      },
    });
  };

  const prevSettingsOpenRef = useRef(false);
  useEffect(() => {
    if (prevSettingsOpenRef.current && !open) {
      // 面板从打开 → 关闭：自动模式下静默上传本地设置
      if (syncAvailable && syncMode === 'auto') {
        void pushRemoteSettings({ silent: true });
      }
    }
    prevSettingsOpenRef.current = open;
  }, [open, syncAvailable, syncMode]);


  // 清除弹幕缓存
  const handleClearDanmakuCache = async () => {
    setIsClearingCache(true);
    setClearCacheMessage(null);

    try {
      await clearAllDanmakuCache();
      setClearCacheMessage('弹幕缓存已清除成功！');
      setDanmakuCacheUsage('0 B');
      console.log('弹幕缓存已清除');

      // 3秒后自动清除提示
      setTimeout(() => {
        setClearCacheMessage(null);
      }, 3000);
    } catch (error) {
      console.error('清除弹幕缓存失败:', error);
      setClearCacheMessage('清除失败，请重试');

      // 3秒后自动清除提示
      setTimeout(() => {
        setClearCacheMessage(null);
      }, 3000);
    } finally {
      setIsClearingCache(false);
    }
  };


  const handleCloseSettingsInternal = () => {
    setIsCloudBackupDropdownOpen(false);
    onOpenChange(false);
  };

  if (!open) return null;
  return createPortal(
    <>
      {/* 背景遮罩 */}
      <div
        className='fixed inset-0 bg-black/50 backdrop-blur-sm z-modal'
        onClick={handleCloseSettingsInternal}
        onTouchMove={(e) => {
          // 只阻止滚动，允许其他触摸事件
          e.preventDefault();
        }}
        onWheel={(e) => {
          // 阻止滚轮滚动
          e.preventDefault();
        }}
        style={{
          touchAction: 'none',
        }}
      />

      {/* 设置面板 */}
      <div className='fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl max-h-[90vh] bg-card rounded-xl shadow-xl z-popover flex flex-col'>
        {/* 内容容器 - 独立的滚动区域 */}
        <div
          className='flex-1 px-4 py-6 md:p-6 overflow-y-auto'
          data-panel-content
          style={{
            touchAction: 'pan-y', // 只允许垂直滚动
            overscrollBehavior: 'contain', // 防止滚动冒泡
          }}
        >
          {/* 标题栏 */}
          <div className='flex items-center justify-between mb-6'>
            <div className='flex items-center gap-3'>
              <h3 className='text-xl font-bold text-foreground'>
                本地设置
              </h3>
              <button
                onClick={handleResetSettings}
                className='px-2 py-1 text-xs text-destructive hover:bg-destructive/10 border border-destructive/30 hover:border-destructive/60 rounded transition-colors'
                title='重置为默认设置'
              >
                恢复默认
              </button>
              {/* 云备份：仅手动模式显示 */}
              {syncAvailable && syncMode === 'manual' && (
                <div className='relative' data-dropdown='cloud-backup'>
                  <button
                    onClick={() =>
                      setIsCloudBackupDropdownOpen(!isCloudBackupDropdownOpen)
                    }
                    disabled={syncBusy}
                    className='px-2 py-1 text-xs text-primary hover:bg-primary/10 border border-primary/30 hover:border-primary/60 rounded transition-colors disabled:opacity-50 flex items-center gap-1'
                    title='云备份设置'
                  >
                    云备份
                    {isCloudBackupDropdownOpen ? (
                      <ChevronUp className='w-3.5 h-3.5' />
                    ) : (
                      <ChevronDown className='w-3.5 h-3.5' />
                    )}
                  </button>
                  {isCloudBackupDropdownOpen && (
                    <div className='absolute z-popover right-0 top-full mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden min-w-[150px]'>
                      <button
                        onClick={() => {
                          setIsCloudBackupDropdownOpen(false);
                          void pushRemoteSettings({ confirmBefore: true });
                        }}
                        disabled={syncBusy}
                        className='w-full px-3 py-2 text-left text-sm text-foreground hover:bg-accent transition-colors'
                      >
                        备份到云端
                      </button>
                      <button
                        onClick={() => {
                          setIsCloudBackupDropdownOpen(false);
                          handleRestoreFromCloud();
                        }}
                        disabled={syncBusy}
                        className='w-full px-3 py-2 text-left text-sm text-foreground hover:bg-accent transition-colors'
                      >
                        恢复云端备份
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={handleCloseSettingsInternal}
              className='w-8 h-8 p-1 rounded-full flex items-center justify-center text-muted-foreground hover:bg-accent transition-colors'
              aria-label='Close'
            >
              <X className='w-full h-full' />
            </button>
          </div>

          {/* 设置项 */}
          <div className='space-y-3 md:space-y-4'>
            {/* 豆瓣设置 */}
            <div className='border border-border rounded-lg overflow-visible'>
              <button
                onClick={() => setIsDoubanSectionOpen(!isDoubanSectionOpen)}
                className='w-full px-3 py-2.5 md:px-4 md:py-3 bg-muted hover:bg-accent transition-colors flex items-center justify-between'
              >
                <div className='flex items-center gap-2'>
                  <Globe className='w-5 h-5 text-muted-foreground' />
                  <h3 className='text-base font-semibold text-foreground'>
                    数据源设置
                  </h3>
                </div>
                {isDoubanSectionOpen ? (
                  <ChevronUp className='w-5 h-5 text-muted-foreground' />
                ) : (
                  <ChevronDown className='w-5 h-5 text-muted-foreground' />
                )}
              </button>
              {isDoubanSectionOpen && (
                <div className='p-3 md:p-4 space-y-4 md:space-y-6'>
                  {/* 豆瓣数据源选择 */}
                  <div className='space-y-3'>
                    <div>
                      <h4 className='text-sm font-medium text-foreground'>
                        豆瓣数据代理
                      </h4>
                      <p className='text-xs text-muted-foreground mt-1'>
                        选择获取豆瓣数据的方式
                      </p>
                    </div>
                    <div className='relative' data-dropdown='douban-datasource'>
                      {/* 自定义下拉选择框 */}
                      <button
                        type='button'
                        onClick={() =>
                          setIsDoubanDropdownOpen(!isDoubanDropdownOpen)
                        }
                        className='w-full px-3 py-2.5 pr-10 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 bg-background text-foreground shadow-sm hover:border-ring text-left'
                      >
                        {
                          doubanDataSourceOptions.find(
                            (option) => option.value === doubanDataSource
                          )?.label
                        }
                      </button>

                      {/* 下拉箭头 */}
                      <div className='absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none'>
                        <ChevronDown
                          className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                            isDoubanDropdownOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </div>

                      {/* 下拉选项列表 */}
                      {isDoubanDropdownOpen && (
                        <div className='absolute z-popover w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-60 overflow-auto'>
                          {doubanDataSourceOptions.map((option) => (
                            <button
                              key={option.value}
                              type='button'
                              onClick={() => {
                                handleDoubanDataSourceChange(option.value);
                                setIsDoubanDropdownOpen(false);
                              }}
                              className={`w-full px-3 py-2.5 text-left text-sm transition-colors duration-150 flex items-center justify-between hover:bg-accent ${
                                doubanDataSource === option.value
                                  ? 'bg-primary/10 text-primary'
                                  : 'text-foreground'
                              }`}
                            >
                              <span className='truncate'>{option.label}</span>
                              {doubanDataSource === option.value && (
                                <Check className='w-4 h-4 text-primary flex-shrink-0 ml-2' />
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 感谢信息 */}
                    {getThanksInfo(doubanDataSource) && (
                      <div className='mt-3'>
                        <button
                          type='button'
                          onClick={() =>
                            window.open(
                              getThanksInfo(doubanDataSource)!.url,
                              '_blank'
                            )
                          }
                          className='flex items-center justify-center gap-1.5 w-full px-3 text-xs text-muted-foreground cursor-pointer'
                        >
                          <span className='font-medium'>
                            {getThanksInfo(doubanDataSource)!.text}
                          </span>
                          <ExternalLink className='w-3.5 opacity-70' />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 豆瓣代理地址设置 - 仅在选择自定义代理时显示 */}
                  {doubanDataSource === 'custom' && (
                    <div className='space-y-3'>
                      <div>
                        <h4 className='text-sm font-medium text-foreground'>
                          豆瓣代理地址
                        </h4>
                        <p className='text-xs text-muted-foreground mt-1'>
                          自定义代理服务器地址
                        </p>
                      </div>
                      <input
                        type='text'
                        className='w-full px-3 py-2.5 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 bg-background text-foreground placeholder:text-muted-foreground shadow-sm hover:border-ring'
                        placeholder='例如: https://proxy.example.com/fetch?url='
                        value={doubanProxyUrl}
                        onChange={(e) =>
                          handleDoubanProxyUrlChange(e.target.value)
                        }
                      />
                      {!doubanProxyUrl.trim() && (
                        <p className='text-xs text-muted-foreground mt-1'>
                          未填写地址时将自动按直连处理
                        </p>
                      )}
                    </div>
                  )}

                  <div className='space-y-3'>
                    <div>
                      <h4 className='text-sm font-medium text-foreground'>
                        豆瓣数据备用渠道
                      </h4>
                      <p className='text-xs text-muted-foreground mt-1'>
                        主渠道失败后自动切换，默认直连
                      </p>
                    </div>
                    <div
                      className='relative'
                      data-dropdown='douban-datasource-backup'
                    >
                      <button
                        type='button'
                        onClick={() =>
                          setIsDoubanBackupDropdownOpen(
                            !isDoubanBackupDropdownOpen
                          )
                        }
                        className='w-full px-3 py-2.5 pr-10 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 bg-background text-foreground shadow-sm hover:border-ring text-left'
                      >
                        {
                          doubanDataSourceOptions.find(
                            (option) => option.value === doubanDataSourceBackup
                          )?.label
                        }
                      </button>
                      <div className='absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none'>
                        <ChevronDown
                          className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                            isDoubanBackupDropdownOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </div>
                      {isDoubanBackupDropdownOpen && (
                        <div className='absolute z-popover w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-60 overflow-auto'>
                          {doubanDataSourceOptions.map((option) => (
                            <button
                              key={option.value}
                              type='button'
                              onClick={() => {
                                handleDoubanDataSourceBackupChange(
                                  option.value
                                );
                                setIsDoubanBackupDropdownOpen(false);
                              }}
                              className={`w-full px-3 py-2.5 text-left text-sm transition-colors duration-150 flex items-center justify-between hover:bg-accent ${
                                doubanDataSourceBackup === option.value
                                  ? 'bg-primary/10 text-primary'
                                  : 'text-foreground'
                              }`}
                            >
                              <span className='truncate'>{option.label}</span>
                              {doubanDataSourceBackup === option.value && (
                                <Check className='w-4 h-4 text-primary flex-shrink-0 ml-2' />
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {doubanDataSourceBackup === 'custom' && (
                    <div className='space-y-3'>
                      <div>
                        <h4 className='text-sm font-medium text-foreground'>
                          豆瓣备用代理地址
                        </h4>
                        <p className='text-xs text-muted-foreground mt-1'>
                          备用渠道为自定义代理时生效
                        </p>
                      </div>
                      <input
                        type='text'
                        className='w-full px-3 py-2.5 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 bg-background text-foreground placeholder:text-muted-foreground shadow-sm hover:border-ring'
                        placeholder='例如: https://proxy.example.com/fetch?url='
                        value={doubanProxyUrlBackup}
                        onChange={(e) =>
                          handleDoubanProxyUrlBackupChange(e.target.value)
                        }
                      />
                      {!doubanProxyUrlBackup.trim() && (
                        <p className='text-xs text-muted-foreground mt-1'>
                          未填写地址时备用渠道将自动按直连处理
                        </p>
                      )}
                    </div>
                  )}

                  {/* 分割线 */}
                  <div className='border-t border-border'></div>

                  {/* 分割线 */}
                  <div className='border-t border-border'></div>

                  {/* 豆瓣图片代理设置 */}
                  <div className='space-y-3'>
                    <div>
                      <h4 className='text-sm font-medium text-foreground'>
                        豆瓣图片代理
                      </h4>
                      <p className='text-xs text-muted-foreground mt-1'>
                        选择获取豆瓣图片的方式
                      </p>
                    </div>
                    <div
                      className='relative'
                      data-dropdown='douban-image-proxy'
                    >
                      {/* 自定义下拉选择框 */}
                      <button
                        type='button'
                        onClick={() =>
                          setIsDoubanImageProxyDropdownOpen(
                            !isDoubanImageProxyDropdownOpen
                          )
                        }
                        className='w-full px-3 py-2.5 pr-10 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 bg-background text-foreground shadow-sm hover:border-ring text-left'
                      >
                        {
                          doubanImageProxyTypeOptions.find(
                            (option) => option.value === doubanImageProxyType
                          )?.label
                        }
                      </button>

                      {/* 下拉箭头 */}
                      <div className='absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none'>
                        <ChevronDown
                          className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                            isDoubanDropdownOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </div>

                      {/* 下拉选项列表 */}
                      {isDoubanImageProxyDropdownOpen && (
                        <div className='absolute z-popover w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-60 overflow-auto'>
                          {doubanImageProxyTypeOptions.map((option) => (
                            <button
                              key={option.value}
                              type='button'
                              onClick={() => {
                                handleDoubanImageProxyTypeChange(option.value);
                                setIsDoubanImageProxyDropdownOpen(false);
                              }}
                              className={`w-full px-3 py-2.5 text-left text-sm transition-colors duration-150 flex items-center justify-between hover:bg-accent ${
                                doubanImageProxyType === option.value
                                  ? 'bg-primary/10 text-primary'
                                  : 'text-foreground'
                              }`}
                            >
                              <span className='truncate'>{option.label}</span>
                              {doubanImageProxyType === option.value && (
                                <Check className='w-4 h-4 text-primary flex-shrink-0 ml-2' />
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 感谢信息 */}
                    {getThanksInfo(doubanImageProxyType) && (
                      <div className='mt-3'>
                        <button
                          type='button'
                          onClick={() =>
                            window.open(
                              getThanksInfo(doubanImageProxyType)!.url,
                              '_blank'
                            )
                          }
                          className='flex items-center justify-center gap-1.5 w-full px-3 text-xs text-muted-foreground cursor-pointer'
                        >
                          <span className='font-medium'>
                            {getThanksInfo(doubanImageProxyType)!.text}
                          </span>
                          <ExternalLink className='w-3.5 opacity-70' />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 豆瓣图片代理地址设置 - 仅在选择自定义代理时显示 */}
                  {doubanImageProxyType === 'custom' && (
                    <div className='space-y-3'>
                      <div>
                        <h4 className='text-sm font-medium text-foreground'>
                          豆瓣图片代理地址
                        </h4>
                        <p className='text-xs text-muted-foreground mt-1'>
                          自定义图片代理服务器地址
                        </p>
                      </div>
                      <input
                        type='text'
                        className='w-full px-3 py-2.5 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 bg-background text-foreground placeholder:text-muted-foreground shadow-sm hover:border-ring'
                        placeholder='例如: https://proxy.example.com/fetch?url='
                        value={doubanImageProxyUrl}
                        onChange={(e) =>
                          handleDoubanImageProxyUrlChange(e.target.value)
                        }
                      />
                      {!doubanImageProxyUrl.trim() && (
                        <p className='text-xs text-muted-foreground mt-1'>
                          未填写地址时将自动按服务器代理处理
                        </p>
                      )}
                    </div>
                  )}

                  <div className='space-y-3'>
                    <div>
                      <h4 className='text-sm font-medium text-foreground'>
                        豆瓣图片备用渠道
                      </h4>
                      <p className='text-xs text-muted-foreground mt-1'>
                        主图片渠道失败后自动切换，默认服务器代理
                      </p>
                    </div>
                    <div
                      className='relative'
                      data-dropdown='douban-image-proxy-backup'
                    >
                      <button
                        type='button'
                        onClick={() =>
                          setIsDoubanImageProxyBackupDropdownOpen(
                            !isDoubanImageProxyBackupDropdownOpen
                          )
                        }
                        className='w-full px-3 py-2.5 pr-10 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 bg-background text-foreground shadow-sm hover:border-ring text-left'
                      >
                        {
                          doubanImageProxyTypeOptions.find(
                            (option) =>
                              option.value === doubanImageProxyTypeBackup
                          )?.label
                        }
                      </button>
                      <div className='absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none'>
                        <ChevronDown
                          className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                            isDoubanImageProxyBackupDropdownOpen
                              ? 'rotate-180'
                              : ''
                          }`}
                        />
                      </div>
                      {isDoubanImageProxyBackupDropdownOpen && (
                        <div className='absolute z-popover w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-60 overflow-auto'>
                          {doubanImageProxyTypeOptions.map((option) => (
                            <button
                              key={option.value}
                              type='button'
                              onClick={() => {
                                handleDoubanImageProxyTypeBackupChange(
                                  option.value
                                );
                                setIsDoubanImageProxyBackupDropdownOpen(false);
                              }}
                              className={`w-full px-3 py-2.5 text-left text-sm transition-colors duration-150 flex items-center justify-between hover:bg-accent ${
                                doubanImageProxyTypeBackup === option.value
                                  ? 'bg-primary/10 text-primary'
                                  : 'text-foreground'
                              }`}
                            >
                              <span className='truncate'>{option.label}</span>
                              {doubanImageProxyTypeBackup === option.value && (
                                <Check className='w-4 h-4 text-primary flex-shrink-0 ml-2' />
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {doubanImageProxyTypeBackup === 'custom' && (
                    <div className='space-y-3'>
                      <div>
                        <h4 className='text-sm font-medium text-foreground'>
                          豆瓣图片备用代理地址
                        </h4>
                        <p className='text-xs text-muted-foreground mt-1'>
                          备用图片渠道为自定义代理时生效
                        </p>
                      </div>
                      <input
                        type='text'
                        className='w-full px-3 py-2.5 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 bg-background text-foreground placeholder:text-muted-foreground shadow-sm hover:border-ring'
                        placeholder='例如: https://proxy.example.com/fetch?url='
                        value={doubanImageProxyUrlBackup}
                        onChange={(e) =>
                          handleDoubanImageProxyUrlBackupChange(e.target.value)
                        }
                      />
                      {!doubanImageProxyUrlBackup.trim() && (
                        <p className='text-xs text-muted-foreground mt-1'>
                          未填写地址时备用图片渠道将自动按服务器代理处理
                        </p>
                      )}
                    </div>
                  )}

                  {/* 分割线 */}
                  <div className='border-t border-border'></div>

                  {/* TMDB 图片网络请求地址设置 */}
                  <div className='space-y-3'>
                    <div>
                      <h4 className='text-sm font-medium text-foreground'>
                        TMDB 图片网络请求地址
                      </h4>
                      <p className='text-xs text-muted-foreground mt-1'>
                        TMDB 图片的 Base URL（默认: https://image.tmdb.org）
                      </p>
                    </div>
                    <input
                      type='text'
                      className='w-full px-3 py-2.5 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 bg-background text-foreground placeholder:text-muted-foreground shadow-sm hover:border-ring'
                      placeholder='例如: https://image.tmdb.org'
                      value={tmdbImageBaseUrl}
                      onChange={(e) =>
                        handleTmdbImageBaseUrlChange(e.target.value)
                      }
                    />
                  </div>

                  {/* 分割线 */}
                  <div className='border-t border-border'></div>

                  {/* 动漫数据源设置 */}
                  <div className='space-y-4'>
                    <div>
                      <h4 className='text-sm font-medium text-foreground'>
                        动漫数据源
                      </h4>
                      <p className='text-xs text-muted-foreground mt-1'>
                        用于 Bangumi
                        新番放送和番剧详情；默认主源直连，备用源服务器代理。
                      </p>
                    </div>

                    <div className='grid gap-3 md:grid-cols-2'>
                      <div className='space-y-2'>
                        <label className='text-xs font-medium text-muted-foreground'>
                          主数据源
                        </label>
                        <div
                          className='relative'
                          data-dropdown='anime-datasource'
                        >
                          <button
                            type='button'
                            onClick={() =>
                              setIsAnimeDropdownOpen(!isAnimeDropdownOpen)
                            }
                            className='w-full px-3 py-2.5 pr-10 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 bg-background text-foreground shadow-sm hover:border-ring text-left'
                          >
                            {
                              animeDataSourceOptions.find(
                                (option) => option.value === animeDataSource
                              )?.label
                            }
                          </button>
                          <div className='absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none'>
                            <ChevronDown
                              className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                                isAnimeDropdownOpen ? 'rotate-180' : ''
                              }`}
                            />
                          </div>
                          {isAnimeDropdownOpen && (
                            <div className='absolute z-popover w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-60 overflow-auto'>
                              {animeDataSourceOptions.map((option) => (
                                <button
                                  key={option.value}
                                  type='button'
                                  onClick={() => {
                                    handleAnimeDataSourceChange(option.value);
                                    setIsAnimeDropdownOpen(false);
                                  }}
                                  className={`w-full px-3 py-2.5 text-left text-sm transition-colors duration-150 flex items-center justify-between hover:bg-accent ${
                                    animeDataSource === option.value
                                      ? 'bg-primary/10 text-primary'
                                      : 'text-foreground'
                                  }`}
                                >
                                  <span className='truncate'>
                                    {option.label}
                                  </span>
                                  {animeDataSource === option.value && (
                                    <Check className='w-4 h-4 text-primary flex-shrink-0 ml-2' />
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className='space-y-2'>
                        <label className='text-xs font-medium text-muted-foreground'>
                          备用数据源
                        </label>
                        <div
                          className='relative'
                          data-dropdown='anime-datasource-backup'
                        >
                          <button
                            type='button'
                            onClick={() =>
                              setIsAnimeBackupDropdownOpen(
                                !isAnimeBackupDropdownOpen
                              )
                            }
                            className='w-full px-3 py-2.5 pr-10 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 bg-background text-foreground shadow-sm hover:border-ring text-left'
                          >
                            {
                              animeDataSourceOptions.find(
                                (option) =>
                                  option.value === animeDataSourceBackup
                              )?.label
                            }
                          </button>
                          <div className='absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none'>
                            <ChevronDown
                              className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                                isAnimeBackupDropdownOpen ? 'rotate-180' : ''
                              }`}
                            />
                          </div>
                          {isAnimeBackupDropdownOpen && (
                            <div className='absolute z-popover w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-60 overflow-auto'>
                              {animeDataSourceOptions.map((option) => (
                                <button
                                  key={option.value}
                                  type='button'
                                  onClick={() => {
                                    handleAnimeDataSourceBackupChange(
                                      option.value
                                    );
                                    setIsAnimeBackupDropdownOpen(false);
                                  }}
                                  className={`w-full px-3 py-2.5 text-left text-sm transition-colors duration-150 flex items-center justify-between hover:bg-accent ${
                                    animeDataSourceBackup === option.value
                                      ? 'bg-primary/10 text-primary'
                                      : 'text-foreground'
                                  }`}
                                >
                                  <span className='truncate'>
                                    {option.label}
                                  </span>
                                  {animeDataSourceBackup === option.value && (
                                    <Check className='w-4 h-4 text-primary flex-shrink-0 ml-2' />
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {(animeDataSource === 'custom-baseurl' ||
                      animeDataSourceBackup === 'custom-baseurl') && (
                      <div className='space-y-2'>
                        <label className='text-xs font-medium text-muted-foreground'>
                          动漫自定义 Base URL
                        </label>
                        <input
                          type='text'
                          className='w-full px-3 py-2.5 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 bg-background text-foreground placeholder:text-muted-foreground shadow-sm hover:border-ring'
                          placeholder='例如: https://api.bgm.tv 或 https://bangumi-proxy.example.com'
                          value={animeCustomBaseUrl}
                          onChange={(e) =>
                            handleAnimeCustomBaseUrlChange(e.target.value)
                          }
                        />
                        {!animeCustomBaseUrl.trim() && (
                          <p className='text-xs text-muted-foreground mt-1'>
                            未填写时自定义 Base URL 会自动按 Bangumi
                            官方直连处理。
                          </p>
                        )}
                      </div>
                    )}
                    <div className='space-y-2'>
                      <label className='text-xs font-medium text-muted-foreground'>
                        动漫图片 Base URL
                      </label>
                      <input
                        type='text'
                        className='w-full px-3 py-2.5 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 bg-background text-foreground placeholder:text-muted-foreground shadow-sm hover:border-ring'
                        placeholder='例如: https://proxy.example.com'
                        value={animeImageBaseUrl}
                        onChange={(e) =>
                          handleAnimeImageBaseUrlChange(e.target.value)
                        }
                      />
                      <p className='text-xs text-muted-foreground mt-1'>
                        用于替换 Bangumi
                        图片域名。只需填写基础部分，不需要填写完整图片路径。
                      </p>
                    </div>

                    <details className='group rounded-lg border border-border bg-muted p-3'>
                      <summary className='flex cursor-pointer list-none items-center justify-between gap-2'>
                        <div className='min-w-0'>
                          <label className='text-xs font-medium text-foreground'>
                            Bangumi Cloudflare Workers 代理脚本
                          </label>
                          <p className='mt-1 text-xs text-muted-foreground'>
                            复制后粘贴到 Cloudflare Workers，部署地址可填入上方
                            Base URL。
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
                            className='inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50'
                          >
                            <Copy className='h-3.5 w-3.5' />
                            {bangumiProxyScriptCopied ? '已复制' : '复制脚本'}
                          </button>
                          <ChevronDown className='h-4 w-4 text-primary transition-transform group-open:rotate-180' />
                        </div>
                      </summary>
                      <pre className='mt-3 max-h-40 overflow-auto rounded-lg border border-border bg-background p-3 text-xs text-foreground'>
                        <code>
                          {bangumiProxyScript || '正在加载 /scripts/bangumi-proxy.worker.js ...'}
                        </code>
                      </pre>
                    </details>
                  </div>
                </div>
              )}
            </div>

            <div className='border border-border rounded-lg overflow-visible'>
              <button
                onClick={() => setIsUsageSectionOpen(!isUsageSectionOpen)}
                className='w-full px-3 py-2.5 md:px-4 md:py-3 bg-muted hover:bg-accent transition-colors flex items-center justify-between'
              >
                <div className='flex items-center gap-2'>
                  <Sliders className='w-5 h-5 text-muted-foreground' />
                  <h3 className='text-base font-semibold text-foreground'>
                    通用设置
                  </h3>
                </div>
                {isUsageSectionOpen ? (
                  <ChevronUp className='w-5 h-5 text-muted-foreground' />
                ) : (
                  <ChevronDown className='w-5 h-5 text-muted-foreground' />
                )}
              </button>
              {isUsageSectionOpen && (
                <div className='p-3 md:p-4 space-y-4 md:space-y-6'>
                  {/* 默认聚合搜索结果 */}
                  <div className='flex items-center justify-between'>
                    <div>
                      <h4 className='text-sm font-medium text-foreground'>
                        默认聚合搜索结果
                      </h4>
                      <p className='text-xs text-muted-foreground mt-1'>
                        搜索时默认按标题和年份聚合显示结果
                      </p>
                    </div>
                    <label className='flex items-center cursor-pointer'>
                      <div className='relative'>
                        <input
                          type='checkbox'
                          className='sr-only peer'
                          checked={defaultAggregateSearch}
                          onChange={(e) =>
                            handleAggregateToggle(e.target.checked)
                          }
                        />
                        <div className='w-11 h-6 bg-input rounded-full peer-checked:bg-primary transition-colors'></div>
                        <div className='absolute top-0.5 left-0.5 w-5 h-5 bg-background rounded-full transition-transform peer-checked:translate-x-5'></div>
                      </div>
                    </label>
                  </div>

                  {/* 优选和测速 */}
                  <div className='flex items-center justify-between'>
                    <div>
                      <h4 className='text-sm font-medium text-foreground'>
                        优选和测速
                      </h4>
                      <p className='text-xs text-muted-foreground mt-1'>
                        如出现播放器劫持问题可关闭
                      </p>
                    </div>
                    <label className='flex items-center cursor-pointer'>
                      <div className='relative'>
                        <input
                          type='checkbox'
                          className='sr-only peer'
                          checked={enableOptimization}
                          onChange={(e) =>
                            handleOptimizationToggle(e.target.checked)
                          }
                        />
                        <div className='w-11 h-6 bg-input rounded-full peer-checked:bg-primary transition-colors'></div>
                        <div className='absolute top-0.5 left-0.5 w-5 h-5 bg-background rounded-full transition-transform peer-checked:translate-x-5'></div>
                      </div>
                    </label>
                  </div>

                  {/* 测速超时设置 */}
                  {enableOptimization && (
                    <div className='ml-4 mt-2 space-y-2'>
                      <div className='space-y-2'>
                        <div className='flex items-center justify-between gap-3'>
                          <span className='flex items-center gap-1 text-xs text-muted-foreground'>
                            优选策略
                            <button
                              type='button'
                              className='group relative inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring'
                              aria-label='优选策略说明'
                            >
                              <CircleHelp className='h-3.5 w-3.5' />
                              <span className='pointer-events-none absolute left-1/2 top-full z-popover mt-2 hidden w-56 -translate-x-1/2 rounded-lg bg-popover px-3 py-2 text-left text-xs leading-relaxed text-popover-foreground shadow-lg group-hover:block group-focus:block'>
                                快速策略：快速优选高权重播放源
                                <br />
                                全量策略：全量优选全部源
                              </span>
                            </button>
                          </span>
                          <div className='inline-flex rounded-lg border border-border bg-muted p-1'>
                            <button
                              type='button'
                              onClick={() => handlePreferStrategyChange('fast')}
                              className={`rounded-md px-4 py-1.5 text-xs font-medium transition-all ${
                                preferStrategy === 'fast'
                                  ? 'bg-background text-foreground shadow-sm'
                                  : 'text-muted-foreground hover:text-foreground'
                              }`}
                            >
                              快速优选
                            </button>
                            <button
                              type='button'
                              onClick={() => handlePreferStrategyChange('full')}
                              className={`rounded-md px-4 py-1.5 text-xs font-medium transition-all ${
                                preferStrategy === 'full'
                                  ? 'bg-background text-foreground shadow-sm'
                                  : 'text-muted-foreground hover:text-foreground'
                              }`}
                            >
                              全量优选
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className='space-y-2'>
                        <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3'>
                          <span className='flex items-center gap-1 text-xs text-muted-foreground'>
                            优选偏好
                            <button
                              type='button'
                              className='group relative inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring'
                              aria-label='优选偏好说明'
                            >
                              <CircleHelp className='h-3.5 w-3.5' />
                              <span className='pointer-events-none absolute left-1/2 top-full z-popover mt-2 hidden w-56 -translate-x-1/2 rounded-lg bg-popover px-3 py-2 text-left text-xs leading-relaxed text-popover-foreground shadow-lg group-hover:block group-focus:block'>
                                综合判定：分辨率与网速均衡评分
                                <br />
                                分辨率优先：优选时给分辨率加权重
                                <br />
                                网速优先：优选时给网速加权重
                              </span>
                            </button>
                          </span>
                          <div className='flex w-full rounded-lg border border-border bg-muted p-1 sm:inline-flex sm:w-auto'>
                            <button
                              type='button'
                              onClick={() => handlePreferModeChange('balanced')}
                              className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all sm:flex-none ${
                                preferMode === 'balanced'
                                  ? 'bg-background text-foreground shadow-sm'
                                  : 'text-muted-foreground hover:text-foreground'
                              }`}
                            >
                              综合判定
                            </button>
                            <button
                              type='button'
                              onClick={() =>
                                handlePreferModeChange('resolution')
                              }
                              className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all sm:flex-none ${
                                preferMode === 'resolution'
                                  ? 'bg-background text-foreground shadow-sm'
                                  : 'text-muted-foreground hover:text-foreground'
                              }`}
                            >
                              分辨率优先
                            </button>
                            <button
                              type='button'
                              onClick={() => handlePreferModeChange('speed')}
                              className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all sm:flex-none ${
                                preferMode === 'speed'
                                  ? 'bg-background text-foreground shadow-sm'
                                  : 'text-muted-foreground hover:text-foreground'
                              }`}
                            >
                              网速优先
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className='flex items-center justify-between'>
                        <span className='text-xs text-muted-foreground'>
                          换源面板测速超时
                        </span>
                        <span className='text-xs font-medium text-foreground'>
                          {speedTestTimeout / 1000}秒
                        </span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <input
                          type='range'
                          min='4000'
                          max='30000'
                          step='1000'
                          value={speedTestTimeout}
                          onChange={(e) =>
                            handleSpeedTestTimeoutChange(Number(e.target.value))
                          }
                          className='flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer'
                          style={{
                            background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${
                              ((speedTestTimeout - 4000) / (30000 - 4000)) * 100
                            }%, hsl(var(--muted)) ${
                              ((speedTestTimeout - 4000) / (30000 - 4000)) * 100
                            }%, hsl(var(--muted)) 100%)`,
                          }}
                        />
                      </div>
                      <div className='flex justify-between text-xs text-muted-foreground'>
                        <button
                          onClick={() => handleSpeedTestTimeoutChange(4000)}
                          className={`px-2 py-0.5 rounded ${
                            speedTestTimeout === 4000
                              ? 'bg-primary text-primary-foreground'
                              : 'hover:bg-accent'
                          }`}
                        >
                          4秒
                        </button>
                        <button
                          onClick={() => handleSpeedTestTimeoutChange(10000)}
                          className={`px-2 py-0.5 rounded ${
                            speedTestTimeout === 10000
                              ? 'bg-primary text-primary-foreground'
                              : 'hover:bg-accent'
                          }`}
                        >
                          10秒
                        </button>
                        <button
                          onClick={() => handleSpeedTestTimeoutChange(20000)}
                          className={`px-2 py-0.5 rounded ${
                            speedTestTimeout === 20000
                              ? 'bg-primary text-primary-foreground'
                              : 'hover:bg-accent'
                          }`}
                        >
                          20秒
                        </button>
                        <button
                          onClick={() => handleSpeedTestTimeoutChange(30000)}
                          className={`px-2 py-0.5 rounded ${
                            speedTestTimeout === 30000
                              ? 'bg-primary text-primary-foreground'
                              : 'hover:bg-accent'
                          }`}
                        >
                          30秒
                        </button>
                      </div>
                      <p className='text-xs text-muted-foreground italic'>
                        注：此设置仅对换源面板测速生效，优选播放源时仍使用4秒超时
                      </p>
                    </div>
                  )}

                  {/* 流式搜索 */}
                  <div className='flex items-center justify-between'>
                    <div>
                      <h4 className='text-sm font-medium text-foreground'>
                        流式搜索输出
                      </h4>
                      <p className='text-xs text-muted-foreground mt-1'>
                        启用搜索结果实时流式输出，关闭后使用传统一次性搜索
                      </p>
                    </div>
                    <label className='flex items-center cursor-pointer'>
                      <div className='relative'>
                        <input
                          type='checkbox'
                          className='sr-only peer'
                          checked={fluidSearch}
                          onChange={(e) =>
                            handleFluidSearchToggle(e.target.checked)
                          }
                        />
                        <div className='w-11 h-6 bg-input rounded-full peer-checked:bg-primary transition-colors'></div>
                        <div className='absolute top-0.5 left-0.5 w-5 h-5 bg-background rounded-full transition-transform peer-checked:translate-x-5'></div>
                      </div>
                    </label>
                  </div>

                  {/* 禁用背景图渲染 */}
                  <div className='flex items-center justify-between'>
                    <div>
                      <h4 className='text-sm font-medium text-foreground'>
                        禁用背景图渲染
                      </h4>
                      <p className='text-xs text-muted-foreground mt-1'>
                        关闭播放页面的TMDB背景图显示（需手动刷新页面生效）
                      </p>
                    </div>
                    <label className='flex items-center cursor-pointer'>
                      <div className='relative'>
                        <input
                          type='checkbox'
                          className='sr-only peer'
                          checked={tmdbBackdropDisabled}
                          onChange={(e) =>
                            handleTmdbBackdropDisabledToggle(e.target.checked)
                          }
                        />
                        <div className='w-11 h-6 bg-input rounded-full peer-checked:bg-primary transition-colors'></div>
                        <div className='absolute top-0.5 left-0.5 w-5 h-5 bg-background rounded-full transition-transform peer-checked:translate-x-5'></div>
                      </div>
                    </label>
                  </div>

                  {/* 启用预告片 */}
                  <div className='flex items-center justify-between'>
                    <div>
                      <h4 className='text-sm font-medium text-foreground'>
                        首页预告片
                      </h4>
                      <p className='text-xs text-muted-foreground mt-1'>
                        在首页轮播图中显示视频预告片（需刷新页面生效）
                      </p>
                    </div>
                    <label className='flex items-center cursor-pointer'>
                      <div className='relative'>
                        <input
                          type='checkbox'
                          className='sr-only peer'
                          checked={enableTrailers}
                          onChange={(e) =>
                            handleEnableTrailersToggle(e.target.checked)
                          }
                        />
                        <div className='w-11 h-6 bg-input rounded-full peer-checked:bg-primary transition-colors'></div>
                        <div className='absolute top-0.5 left-0.5 w-5 h-5 bg-background rounded-full transition-transform peer-checked:translate-x-5'></div>
                      </div>
                    </label>
                  </div>

                  {/* 搜索繁体转简体 */}
                  <div className='flex items-center justify-between'>
                    <div>
                      <h4 className='text-sm font-medium text-foreground'>
                        搜索繁体转简体
                      </h4>
                      <p className='text-xs text-muted-foreground mt-1'>
                        搜索时自动将繁体中文转换为简体中文
                      </p>
                    </div>
                    <label className='flex items-center cursor-pointer'>
                      <div className='relative'>
                        <input
                          type='checkbox'
                          className='sr-only peer'
                          checked={searchTraditionalToSimplified}
                          onChange={(e) =>
                            handleSearchTraditionalToSimplifiedToggle(
                              e.target.checked
                            )
                          }
                        />
                        <div className='w-11 h-6 bg-input rounded-full peer-checked:bg-primary transition-colors'></div>
                        <div className='absolute top-0.5 left-0.5 w-5 h-5 bg-background rounded-full transition-transform peer-checked:translate-x-5'></div>
                      </div>
                    </label>
                  </div>

                  {/* 精确搜索 */}
                  <div className='flex items-center justify-between'>
                    <div>
                      <h4 className='text-sm font-medium text-foreground'>
                        精确搜索
                      </h4>
                      <p className='text-xs text-muted-foreground mt-1'>
                        开启后，搜索结果将过滤掉不包含搜索词的内容
                      </p>
                    </div>
                    <label className='flex items-center cursor-pointer'>
                      <div className='relative'>
                        <input
                          type='checkbox'
                          className='sr-only peer'
                          checked={exactSearch}
                          onChange={(e) =>
                            handleExactSearchToggle(e.target.checked)
                          }
                        />
                        <div className='w-11 h-6 bg-input rounded-full peer-checked:bg-primary transition-colors'></div>
                        <div className='absolute top-0.5 left-0.5 w-5 h-5 bg-background rounded-full transition-transform peer-checked:translate-x-5'></div>
                      </div>
                    </label>
                  </div>

                  {/* 直播播放记录 */}
                  <div className='flex items-center justify-between'>
                    <div>
                      <h4 className='text-sm font-medium text-foreground'>
                        保存直播的播放记录
                      </h4>
                      <p className='text-xs text-muted-foreground mt-1'>
                        开启后将保存直播频道观看记录
                      </p>
                    </div>
                    <label className='flex items-center cursor-pointer'>
                      <div className='relative'>
                        <input
                          type='checkbox'
                          className='sr-only peer'
                          checked={saveLivePlayRecords}
                          onChange={(e) =>
                            handleSaveLivePlayRecordsToggle(e.target.checked)
                          }
                        />
                        <div className='w-11 h-6 bg-input rounded-full peer-checked:bg-primary transition-colors'></div>
                        <div className='absolute top-0.5 left-0.5 w-5 h-5 bg-background rounded-full transition-transform peer-checked:translate-x-5'></div>
                      </div>
                    </label>
                  </div>

                </div>
              )}
            </div>

            {/* 下载设置 */}
            <div className='border border-border rounded-lg overflow-visible'>
              <button
                onClick={() => setIsDownloadSectionOpen(!isDownloadSectionOpen)}
                className='w-full px-3 py-2.5 md:px-4 md:py-3 bg-muted hover:bg-accent transition-colors flex items-center justify-between'
              >
                <div className='flex items-center gap-2'>
                  <Download className='w-5 h-5 text-muted-foreground' />
                  <h3 className='text-base font-semibold text-foreground'>
                    下载设置
                  </h3>
                </div>
                {isDownloadSectionOpen ? (
                  <ChevronUp className='w-5 h-5 text-muted-foreground' />
                ) : (
                  <ChevronDown className='w-5 h-5 text-muted-foreground' />
                )}
              </button>
              {isDownloadSectionOpen && (
                <div className='p-3 md:p-4 space-y-4 md:space-y-6'>
                  {/* 最大同时下载限制 */}
                  <div className='space-y-2'>
                    <div>
                      <h4 className='text-sm font-medium text-foreground'>
                        最大同时下载限制
                      </h4>
                      <p className='text-xs text-muted-foreground mt-1'>
                        控制播放页面下载时的同时下载数量
                      </p>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-xs text-muted-foreground'>
                        同时下载数量
                      </span>
                      <span className='text-xs font-medium text-foreground'>
                        {maxConcurrentDownloads}个
                      </span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <input
                        type='range'
                        min='1'
                        max='10'
                        step='1'
                        value={maxConcurrentDownloads}
                        onChange={(e) =>
                          handleMaxConcurrentDownloadsChange(
                            Number(e.target.value)
                          )
                        }
                        className='flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer'
                        style={{
                          background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${
                            ((maxConcurrentDownloads - 1) / (10 - 1)) * 100
                          }%, hsl(var(--muted)) ${
                            ((maxConcurrentDownloads - 1) / (10 - 1)) * 100
                          }%, hsl(var(--muted)) 100%)`,
                        }}
                      />
                    </div>
                    <div className='flex justify-between text-xs text-muted-foreground'>
                      <button
                        onClick={() => handleMaxConcurrentDownloadsChange(1)}
                        className={`px-2 py-0.5 rounded ${
                          maxConcurrentDownloads === 1
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-accent'
                        }`}
                      >
                        1个
                      </button>
                      <button
                        onClick={() => handleMaxConcurrentDownloadsChange(10)}
                        className={`px-2 py-0.5 rounded ${
                          maxConcurrentDownloads === 10
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-accent'
                        }`}
                      >
                        10个
                      </button>
                    </div>
                  </div>

                  {/* 单任务线程数 */}
                  <div className='space-y-2'>
                    <div>
                      <h4 className='text-sm font-medium text-foreground'>
                        单任务线程数
                      </h4>
                      <p className='text-xs text-muted-foreground mt-1'>
                        控制每个下载任务使用的线程数量，线程越多下载越快但占用资源越多
                      </p>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-xs text-muted-foreground'>
                        线程数量
                      </span>
                      <span className='text-xs font-medium text-foreground'>
                        {downloadThreadsPerTask}个
                      </span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <input
                        type='range'
                        min='1'
                        max='32'
                        step='1'
                        value={downloadThreadsPerTask}
                        onChange={(e) =>
                          handleDownloadThreadsPerTaskChange(
                            Number(e.target.value)
                          )
                        }
                        className='flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer'
                        style={{
                          background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${
                            ((downloadThreadsPerTask - 1) / (32 - 1)) * 100
                          }%, hsl(var(--muted)) ${
                            ((downloadThreadsPerTask - 1) / (32 - 1)) * 100
                          }%, hsl(var(--muted)) 100%)`,
                        }}
                      />
                    </div>
                    <div className='flex justify-between text-xs text-muted-foreground'>
                      <button
                        onClick={() => handleDownloadThreadsPerTaskChange(1)}
                        className={`px-2 py-0.5 rounded ${
                          downloadThreadsPerTask === 1
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-accent'
                        }`}
                      >
                        1个
                      </button>
                      <button
                        onClick={() => handleDownloadThreadsPerTaskChange(32)}
                        className={`px-2 py-0.5 rounded ${
                          downloadThreadsPerTask === 32
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-accent'
                        }`}
                      >
                        32个
                      </button>
                    </div>
                  </div>

                  {/* 分片下载超时 */}
                  <div className='space-y-2'>
                    <div>
                      <h4 className='text-sm font-medium text-foreground'>
                        分片下载超时
                      </h4>
                      <p className='text-xs text-muted-foreground mt-1'>
                        单个分片超过该时间仍未完成时会自动判定超时并按原分片重试
                      </p>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-xs text-muted-foreground'>
                        超时时间
                      </span>
                      <span className='text-xs font-medium text-foreground'>
                        {formatDownloadSegmentTimeout(downloadSegmentTimeout)}
                      </span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <input
                        type='range'
                        min='30000'
                        max='300000'
                        step='10000'
                        value={downloadSegmentTimeout}
                        onChange={(e) =>
                          handleDownloadSegmentTimeoutChange(
                            Number(e.target.value)
                          )
                        }
                        className='flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer'
                        style={{
                          background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${
                            ((downloadSegmentTimeout - 30000) / (300000 - 30000)) * 100
                          }%, hsl(var(--muted)) ${
                            ((downloadSegmentTimeout - 30000) / (300000 - 30000)) * 100
                          }%, hsl(var(--muted)) 100%)`,
                        }}
                      />
                    </div>
                    <div className='flex justify-between text-xs text-muted-foreground'>
                      <button
                        onClick={() => handleDownloadSegmentTimeoutChange(30000)}
                        className={`px-2 py-0.5 rounded cursor-pointer ${
                          downloadSegmentTimeout === 30000
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-accent'
                        }`}
                      >
                        30秒
                      </button>
                      <button
                        onClick={() => handleDownloadSegmentTimeoutChange(120000)}
                        className={`px-2 py-0.5 rounded cursor-pointer ${
                          downloadSegmentTimeout === 120000
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-accent'
                        }`}
                      >
                        2分钟
                      </button>
                      <button
                        onClick={() => handleDownloadSegmentTimeoutChange(300000)}
                        className={`px-2 py-0.5 rounded cursor-pointer ${
                          downloadSegmentTimeout === 300000
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-accent'
                        }`}
                      >
                        5分钟
                      </button>
                    </div>
                  </div>

                  {/* 下载模式 */}
                  <div className='space-y-2'>
                    <div>
                      <h4 className='text-sm font-medium text-foreground'>
                        下载模式
                      </h4>
                    </div>
                    <div className='space-y-2'>
                      <label className='flex items-center gap-2 cursor-pointer'>
                        <input
                          type='radio'
                          name='downloadMode'
                          value='browser'
                          checked={downloadMode === 'browser'}
                          onChange={() => handleDownloadModeChange('browser')}
                          className='w-4 h-4 text-primary'
                        />
                        <span className='text-sm text-foreground'>
                          浏览器下载（合并为单文件）
                        </span>
                      </label>
                      <label className='flex items-center gap-2 cursor-pointer'>
                        <input
                          type='radio'
                          name='downloadMode'
                          value='filesystem'
                          checked={downloadMode === 'filesystem'}
                          onChange={() =>
                            handleDownloadModeChange('filesystem')
                          }
                          className='w-4 h-4 text-primary'
                        />
                        <span className='text-sm text-foreground'>
                          File System API（保存分片到本地目录）
                        </span>
                      </label>
                      <label className='flex items-start gap-2 cursor-pointer'>
                        <input
                          type='radio'
                          name='downloadMode'
                          value='indexeddb'
                          checked={downloadMode === 'indexeddb'}
                          onChange={() =>
                            handleDownloadModeChange('indexeddb')
                          }
                          className='mt-0.5 w-4 h-4 text-primary'
                        />
                        <span className='text-sm text-foreground'>
                          IndexedDB 缓存（应用内离线播放）
                        </span>
                      </label>
                    </div>

                    {/* 保存路径选择（仅在 filesystem 模式显示） */}
                    {downloadMode === 'filesystem' && (
                      <div className='mt-3 p-3 bg-muted rounded-lg space-y-2'>
                        <label className='block text-xs font-medium text-foreground'>
                          保存路径
                        </label>
                        <div className='flex gap-2'>
                          <input
                            type='text'
                            value={filesystemSavePath}
                            readOnly
                            placeholder='点击选择保存目录'
                            className='flex-1 px-3 py-2 text-sm border border-input rounded bg-background text-foreground'
                          />
                          <button
                            onClick={handleSelectSavePath}
                            className='px-4 py-2 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors'
                          >
                            选择目录
                          </button>
                        </div>
                        <p className='text-xs text-muted-foreground'>
                          需要 Chrome 86+ 或 Edge 86+ 浏览器支持
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 下载文件管理 */}
                  <div className='space-y-2'>
                    <button
                      onClick={onOpenDownloadManagement}
                      className='w-full px-4 py-2 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors flex items-center justify-center gap-2'
                    >
                      <Package className='w-4 h-4' />
                      下载文件管理
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 播放设置 */}
            <div className='border border-border rounded-lg overflow-visible'>
              <button
                onClick={() => setIsBufferSectionOpen(!isBufferSectionOpen)}
                className='w-full px-3 py-2.5 md:px-4 md:py-3 bg-muted hover:bg-accent transition-colors flex items-center justify-between'
              >
                <div className='flex items-center gap-2'>
                  <Gauge className='w-5 h-5 text-muted-foreground' />
                  <h3 className='text-base font-semibold text-foreground'>
                    播放设置
                  </h3>
                </div>
                {isBufferSectionOpen ? (
                  <ChevronUp className='w-5 h-5 text-muted-foreground' />
                ) : (
                  <ChevronDown className='w-5 h-5 text-muted-foreground' />
                )}
              </button>
              {isBufferSectionOpen && (
                <div className='p-3 md:p-4 space-y-4 md:space-y-6'>
                  <div>
                    <p className='text-xs text-muted-foreground'>
                      调整播放器相关设置（仅在播放页面生效）
                    </p>
                  </div>

                  {/* 缓冲策略 */}
                  <div className='space-y-3'>
                    <div>
                      <h4 className='text-sm font-medium text-foreground'>
                        缓冲策略
                      </h4>
                      <p className='text-xs text-muted-foreground mt-1'>
                        设置视频缓冲块大小，影响播放流畅度和流量消耗
                      </p>
                    </div>

                    {/* 滑块控件 */}
                    <div className='space-y-2'>
                      <input
                        type='range'
                        min='0'
                        max='3'
                        step='1'
                        value={getSliderValueFromStrategy(bufferStrategy)}
                        onChange={(e) => {
                          const sliderValue = parseInt(e.target.value);
                          const strategy =
                            getBufferStrategyFromSlider(sliderValue);
                          handleBufferStrategyChange(strategy);
                        }}
                        className='w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary'
                        style={{
                          background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${
                            (getSliderValueFromStrategy(bufferStrategy) / 3) *
                            100
                          }%, hsl(var(--muted)) ${
                            (getSliderValueFromStrategy(bufferStrategy) / 3) *
                            100
                          }%, hsl(var(--muted)) 100%)`,
                        }}
                      />

                      {/* 标签显示 */}
                      <div className='flex justify-between text-xs text-muted-foreground px-1'>
                        <span
                          className={
                            bufferStrategy === 'low'
                              ? 'font-semibold text-foreground'
                              : ''
                          }
                        >
                          低缓冲
                        </span>
                        <span
                          className={
                            bufferStrategy === 'medium'
                              ? 'font-semibold text-foreground'
                              : ''
                          }
                        >
                          中缓冲
                        </span>
                        <span
                          className={
                            bufferStrategy === 'high'
                              ? 'font-semibold text-foreground'
                              : ''
                          }
                        >
                          高缓冲
                        </span>
                        <span
                          className={
                            bufferStrategy === 'ultra'
                              ? 'font-semibold text-foreground'
                              : ''
                          }
                        >
                          超高缓冲
                        </span>
                      </div>

                      {/* 当前选择的说明 */}
                      <div className='text-center text-sm font-medium text-foreground mt-2'>
                        {
                          bufferStrategyOptions.find(
                            (option) => option.value === bufferStrategy
                          )?.label
                        }
                      </div>
                    </div>
                  </div>

                  {/* 下集预缓冲 */}
                  <div className='flex items-center justify-between'>
                    <div>
                      <h4 className='text-sm font-medium text-foreground'>
                        下集预缓冲
                      </h4>
                      <p className='text-xs text-muted-foreground mt-1'>
                        播放进度达到90%时，自动预缓冲下一集内容
                      </p>
                    </div>
                    <label className='flex items-center cursor-pointer'>
                      <div className='relative'>
                        <input
                          type='checkbox'
                          className='sr-only peer'
                          checked={nextEpisodePreCache}
                          onChange={(e) =>
                            handleNextEpisodePreCacheToggle(e.target.checked)
                          }
                        />
                        <div className='w-11 h-6 bg-input rounded-full peer-checked:bg-primary transition-colors'></div>
                        <div className='absolute top-0.5 left-0.5 w-5 h-5 bg-background rounded-full transition-transform peer-checked:translate-x-5'></div>
                      </div>
                    </label>
                  </div>

                  {/* 禁用播放预览图 */}
                  <div className='flex items-center justify-between'>
                    <div>
                      <h4 className='text-sm font-medium text-foreground'>
                        禁用播放预览图
                      </h4>
                      <p className='text-xs text-muted-foreground mt-1'>
                        关闭后不再生成进度条悬停预览图。生成预览图需完整抽帧整个视频，流量开销较大，修改后重新进入播放页生效
                      </p>
                    </div>
                    <label className='flex items-center cursor-pointer'>
                      <div className='relative'>
                        <input
                          type='checkbox'
                          className='sr-only peer'
                          checked={disablePlaybackThumbnail}
                          onChange={(e) =>
                            handleDisablePlaybackThumbnailToggle(
                              e.target.checked
                            )
                          }
                        />
                        <div className='w-11 h-6 bg-input rounded-full peer-checked:bg-primary transition-colors'></div>
                        <div className='absolute top-0.5 left-0.5 w-5 h-5 bg-background rounded-full transition-transform peer-checked:translate-x-5'></div>
                      </div>
                    </label>
                  </div>

                  {/* 禁用集数标题获取并切换 */}
                  <div className='flex items-center justify-between'>
                    <div>
                      <h4 className='text-sm font-medium text-foreground'>
                        禁用集数标题获取并切换
                      </h4>
                      <p className='text-xs text-muted-foreground mt-1'>
                        开启后不再获取分集标题，选集面板保持数字网格视图，不自动切换为列表视图
                      </p>
                    </div>
                    <label className='flex items-center cursor-pointer'>
                      <div className='relative'>
                        <input
                          type='checkbox'
                          className='sr-only peer'
                          checked={disableEpisodeTitleFetch}
                          onChange={(e) =>
                            handleDisableEpisodeTitleFetchToggle(
                              e.target.checked
                            )
                          }
                        />
                        <div className='w-11 h-6 bg-input rounded-full peer-checked:bg-primary transition-colors'></div>
                        <div className='absolute top-0.5 left-0.5 w-5 h-5 bg-background rounded-full transition-transform peer-checked:translate-x-5'></div>
                      </div>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* 弹幕设置 */}
            <div className='border border-border rounded-lg overflow-visible'>
              <button
                onClick={() => setIsDanmakuSectionOpen(!isDanmakuSectionOpen)}
                className='w-full px-3 py-2.5 md:px-4 md:py-3 bg-muted hover:bg-accent transition-colors flex items-center justify-between'
              >
                <div className='flex items-center gap-2'>
                  <MessageSquare className='w-5 h-5 text-muted-foreground' />
                  <h3 className='text-base font-semibold text-foreground'>
                    弹幕设置
                  </h3>
                </div>
                {isDanmakuSectionOpen ? (
                  <ChevronUp className='w-5 h-5 text-muted-foreground' />
                ) : (
                  <ChevronDown className='w-5 h-5 text-muted-foreground' />
                )}
              </button>
              {isDanmakuSectionOpen && (
                <div className='p-3 md:p-4 space-y-4 md:space-y-6'>
                  {/* 禁用自动装填弹幕 */}
                  <div className='flex items-center justify-between'>
                    <div>
                      <h4 className='text-sm font-medium text-foreground'>
                        禁用自动装填弹幕
                      </h4>
                      <p className='text-xs text-muted-foreground mt-1'>
                        开启后，播放页面不会自动匹配弹幕，只能手动匹配
                      </p>
                    </div>
                    <label className='flex items-center cursor-pointer'>
                      <div className='relative'>
                        <input
                          type='checkbox'
                          className='sr-only peer'
                          checked={disableAutoLoadDanmaku}
                          onChange={(e) =>
                            handleDisableAutoLoadDanmakuToggle(e.target.checked)
                          }
                        />
                        <div className='w-11 h-6 bg-input rounded-full peer-checked:bg-primary transition-colors'></div>
                        <div className='absolute top-0.5 left-0.5 w-5 h-5 bg-background rounded-full transition-transform peer-checked:translate-x-5'></div>
                      </div>
                    </label>
                  </div>

                  {/* 下集弹幕预加载 */}
                  <div className='flex items-center justify-between'>
                    <div>
                      <h4 className='text-sm font-medium text-foreground'>
                        下集弹幕预加载
                      </h4>
                      <p className='text-xs text-muted-foreground mt-1'>
                        播放进度达到90%时，自动预加载下一集弹幕
                      </p>
                    </div>
                    <label className='flex items-center cursor-pointer'>
                      <div className='relative'>
                        <input
                          type='checkbox'
                          className='sr-only peer'
                          checked={nextEpisodeDanmakuPreload}
                          onChange={(e) =>
                            handleNextEpisodeDanmakuPreloadToggle(
                              e.target.checked
                            )
                          }
                        />
                        <div className='w-11 h-6 bg-input rounded-full peer-checked:bg-primary transition-colors'></div>
                        <div className='absolute top-0.5 left-0.5 w-5 h-5 bg-background rounded-full transition-transform peer-checked:translate-x-5'></div>
                      </div>
                    </label>
                  </div>

                  {/* 禁用弹幕热力图 */}
                  <div className='flex items-center justify-between'>
                    <div>
                      <h4 className='text-sm font-medium text-foreground'>
                        禁用弹幕热力图
                      </h4>
                      <p className='text-xs text-muted-foreground mt-1'>
                        开启后不显示弹幕热力图和热力图开关
                      </p>
                    </div>
                    <label className='flex items-center cursor-pointer'>
                      <div className='relative'>
                        <input
                          type='checkbox'
                          className='sr-only peer'
                          checked={danmakuHeatmapDisabled}
                          onChange={(e) =>
                            handleDanmakuHeatmapDisabledToggle(e.target.checked)
                          }
                        />
                        <div className='w-11 h-6 bg-input rounded-full peer-checked:bg-primary transition-colors'></div>
                        <div className='absolute top-0.5 left-0.5 w-5 h-5 bg-background rounded-full transition-transform peer-checked:translate-x-5'></div>
                      </div>
                    </label>
                  </div>

                  {/* 弹幕繁简转换 */}
                  <div className='flex items-center justify-between'>
                    <div>
                      <h4 className='text-sm font-medium text-foreground'>
                        弹幕繁简转换
                      </h4>
                      <p className='text-xs text-muted-foreground mt-1'>
                        开启后，拉取弹幕时自动将繁体中文转换为简体中文
                      </p>
                    </div>
                    <label className='flex items-center cursor-pointer'>
                      <div className='relative'>
                        <input
                          type='checkbox'
                          className='sr-only peer'
                          checked={danmakuTraditionalToSimplified}
                          onChange={(e) =>
                            handleDanmakuTraditionalToSimplifiedToggle(
                              e.target.checked
                            )
                          }
                        />
                        <div className='w-11 h-6 bg-input rounded-full peer-checked:bg-primary transition-colors'></div>
                        <div className='absolute top-0.5 left-0.5 w-5 h-5 bg-background rounded-full transition-transform peer-checked:translate-x-5'></div>
                      </div>
                    </label>
                  </div>

                  {/* 弹幕加载上限 */}
                  <div className='space-y-2'>
                    <div className='flex items-center justify-between'>
                      <span className='text-xs text-muted-foreground'>
                        弹幕加载上限
                      </span>
                      <span className='text-xs font-medium text-foreground'>
                        {danmakuMaxCount === 0
                          ? '无上限'
                          : `${danmakuMaxCount} 条`}
                      </span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <input
                        type='range'
                        min='0'
                        max='10000'
                        step='100'
                        value={danmakuMaxCount}
                        onChange={(e) =>
                          handleDanmakuMaxCountChange(parseInt(e.target.value))
                        }
                        className='flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer'
                        style={{
                          background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${
                            (danmakuMaxCount / 10000) * 100
                          }%, hsl(var(--muted)) ${
                            (danmakuMaxCount / 10000) * 100
                          }%, hsl(var(--muted)) 100%)`,
                        }}
                      />
                    </div>
                    <div
                      className='relative text-xs text-muted-foreground'
                      style={{ height: '24px' }}
                    >
                      <button
                        onClick={() => handleDanmakuMaxCountChange(0)}
                        className={`absolute px-2 py-0.5 rounded ${
                          danmakuMaxCount === 0
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-accent'
                        }`}
                        style={{ left: '0%', transform: 'translateX(0%)' }}
                      >
                        无上限
                      </button>
                      <button
                        onClick={() => handleDanmakuMaxCountChange(3000)}
                        className={`absolute px-2 py-0.5 rounded ${
                          danmakuMaxCount === 3000
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-accent'
                        }`}
                        style={{ left: '30%', transform: 'translateX(-50%)' }}
                      >
                        3000
                      </button>
                      <button
                        onClick={() => handleDanmakuMaxCountChange(5000)}
                        className={`absolute px-2 py-0.5 rounded ${
                          danmakuMaxCount === 5000
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-accent'
                        }`}
                        style={{ left: '50%', transform: 'translateX(-50%)' }}
                      >
                        5000
                      </button>
                      <button
                        onClick={() => handleDanmakuMaxCountChange(10000)}
                        className={`absolute px-2 py-0.5 rounded ${
                          danmakuMaxCount === 10000
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-accent'
                        }`}
                        style={{ left: '100%', transform: 'translateX(-100%)' }}
                      >
                        10000
                      </button>
                    </div>
                    <p className='text-xs text-muted-foreground mt-1'>
                      限制加载的弹幕数量，减少性能消耗
                    </p>
                  </div>

                  {/* 清除弹幕缓存 */}
                  <div className='space-y-3'>
                    <div>
                      <h4 className='text-sm font-medium text-foreground'>
                        弹幕缓存管理
                      </h4>
                      <p className='text-xs text-muted-foreground mt-1'>
                        弹幕缓存空间占用：{danmakuCacheUsage}
                      </p>
                      <p className='text-xs text-muted-foreground mt-1'>
                        清除所有已缓存的弹幕数据
                      </p>
                    </div>
                    <button
                      onClick={handleClearDanmakuCache}
                      disabled={isClearingCache}
                      className='w-full px-4 py-2.5 bg-destructive hover:bg-destructive/90 disabled:bg-destructive/50 text-destructive-foreground text-sm font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md disabled:cursor-not-allowed flex items-center justify-center gap-2'
                    >
                      {isClearingCache ? (
                        <>
                          <div className='w-4 h-4 border-2 border-destructive-foreground border-t-transparent rounded-full animate-spin'></div>
                          <span>清除中...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 className='w-4 h-4' />
                          <span>清除弹幕缓存</span>
                        </>
                      )}
                    </button>

                    {/* 成功/失败提示 */}
                    {clearCacheMessage && (
                      <div
                        className={`text-sm p-3 rounded-lg border ${
                          clearCacheMessage.includes('成功')
                            ? 'bg-primary/10 border-primary/30 text-primary'
                            : 'bg-destructive/10 border-destructive/30 text-destructive'
                        }`}
                      >
                        {clearCacheMessage}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 首页设置 */}
            <div className='border border-border rounded-lg overflow-visible'>
              <button
                onClick={() => setIsHomepageSectionOpen(!isHomepageSectionOpen)}
                className='w-full px-3 py-2.5 md:px-4 md:py-3 bg-muted hover:bg-accent transition-colors flex items-center justify-between'
              >
                <div className='flex items-center gap-2'>
                  <Home className='w-5 h-5 text-muted-foreground' />
                  <h3 className='text-base font-semibold text-foreground'>
                    首页设置
                  </h3>
                </div>
                {isHomepageSectionOpen ? (
                  <ChevronUp className='w-5 h-5 text-muted-foreground' />
                ) : (
                  <ChevronDown className='w-5 h-5 text-muted-foreground' />
                )}
              </button>
              {isHomepageSectionOpen && (
                <div className='p-3 md:p-4 space-y-4 md:space-y-6'>
                  <div>
                    <p className='text-xs text-muted-foreground mb-3'>
                      配置首页轮播图显示效果，以及首页模块布局
                    </p>
                  </div>

                  {/* 轮播图配置 */}
                  <div className='space-y-2'>
                    <div>
                      <h4 className='text-sm font-semibold text-foreground'>
                        轮播图配置
                      </h4>
                    </div>
                    <div className='p-3 bg-muted rounded-lg border border-border space-y-3'>
                      <div>
                        <div className='text-sm font-medium text-foreground'>
                          轮播图高度
                        </div>
                        <p className='text-xs text-muted-foreground mt-1'>
                          调整首页轮播图显示高度
                        </p>
                      </div>
                      <div className='grid grid-cols-3 gap-2'>
                        {homeBannerHeightOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() =>
                              handleHomeBannerHeightScaleChange(option.value)
                            }
                            className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                              homeBannerHeightScale === option.value
                                ? 'bg-primary border-primary text-primary-foreground shadow-sm'
                                : 'bg-background border-border text-foreground hover:bg-accent'
                            }`}
                            title={`${option.label}（${option.description}）`}
                          >
                            <span>{option.label}</span>
                            <span
                              className={`ml-1 text-xs ${
                                homeBannerHeightScale === option.value
                                  ? 'text-primary-foreground'
                                  : 'text-muted-foreground'
                              }`}
                            >
                              {option.description}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 模块显示与排序 */}
                  <div className='space-y-3 rounded-lg border border-border p-3'>
                    <div>
                      <h4 className='text-sm font-semibold text-foreground'>
                        模块显示与排序
                      </h4>
                      <p className='text-xs text-muted-foreground mt-1'>
                        控制首页组件和内容模块的显示/隐藏与顺序
                      </p>
                    </div>
                    <div className='flex items-center gap-2 p-3 bg-muted rounded-lg border border-border'>
                      <button
                        onClick={() =>
                          handleHomeBannerToggle(!homeBannerEnabled)
                        }
                        className='flex-shrink-0'
                        title={homeBannerEnabled ? '点击隐藏' : '点击显示'}
                      >
                        {homeBannerEnabled ? (
                          <Eye className='w-5 h-5 text-primary' />
                        ) : (
                          <EyeOff className='w-5 h-5 text-muted-foreground' />
                        )}
                      </button>
                      <div className='flex-1'>
                        <span
                          className={`text-sm font-medium ${
                            homeBannerEnabled
                              ? 'text-foreground'
                              : 'text-muted-foreground'
                          }`}
                        >
                          首页轮播图
                        </span>
                      </div>
                    </div>

                    <div className='flex items-center gap-2 p-3 bg-muted rounded-lg border border-border'>
                      <button
                        onClick={() =>
                          handleHomeContinueWatchingToggle(
                            !homeContinueWatchingEnabled
                          )
                        }
                        className='flex-shrink-0'
                        title={
                          homeContinueWatchingEnabled ? '点击隐藏' : '点击显示'
                        }
                      >
                        {homeContinueWatchingEnabled ? (
                          <Eye className='w-5 h-5 text-primary' />
                        ) : (
                          <EyeOff className='w-5 h-5 text-muted-foreground' />
                        )}
                      </button>
                      <div className='flex-1'>
                        <span
                          className={`text-sm font-medium ${
                            homeContinueWatchingEnabled
                              ? 'text-foreground'
                              : 'text-muted-foreground'
                          }`}
                        >
                          继续观看
                        </span>
                      </div>
                    </div>

                    {/* 模块列表 */}
                    <div className='space-y-2'>
                      {homeModules.map((module, index) => (
                        <div
                          key={module.id}
                          className='flex items-center gap-2 p-3 bg-muted rounded-lg border border-border'
                        >
                          {/* 左侧：显示/隐藏开关 */}
                          <button
                            onClick={() =>
                              handleHomeModuleToggle(module.id, !module.enabled)
                            }
                            className='flex-shrink-0'
                            title={module.enabled ? '点击隐藏' : '点击显示'}
                          >
                            {module.enabled ? (
                              <Eye className='w-5 h-5 text-primary' />
                            ) : (
                              <EyeOff className='w-5 h-5 text-muted-foreground' />
                            )}
                          </button>

                          {/* 中间：模块名称 */}
                          <div className='flex-1'>
                            <span
                              className={`text-sm font-medium ${
                                module.enabled
                                  ? 'text-foreground'
                                  : 'text-muted-foreground'
                              }`}
                            >
                              {module.name}
                            </span>
                          </div>

                          {/* 右侧：上下移动按钮 */}
                          <div className='flex gap-1'>
                            <button
                              onClick={() => handleHomeModuleMoveUp(index)}
                              disabled={index === 0}
                              className='p-1.5 rounded hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors'
                              title='上移'
                            >
                              <MoveUp className='w-4 h-4 text-muted-foreground' />
                            </button>
                            <button
                              onClick={() => handleHomeModuleMoveDown(index)}
                              disabled={index === homeModules.length - 1}
                              className='p-1.5 rounded hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors'
                              title='下移'
                            >
                              <MoveDown className='w-4 h-4 text-muted-foreground' />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 恢复默认按钮 */}
                  <button
                    onClick={() => {
                      setHomeModules(defaultHomeModules);
                      setHomeBannerEnabled(true);
                      setHomeBannerHeightScale('1');
                      setHomeContinueWatchingEnabled(true);
                      if (typeof window !== 'undefined') {
                        localStorage.setItem(
                          'homeModules',
                          JSON.stringify(defaultHomeModules)
                        );
                        localStorage.setItem('homeBannerEnabled', 'true');
                        localStorage.setItem('homeBannerHeightScale', '1');
                        localStorage.setItem(
                          'homeContinueWatchingEnabled',
                          'true'
                        );
                        window.dispatchEvent(
                          new CustomEvent('homeModulesUpdated')
                        );
                      }
                    }}
                    className='w-full px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 text-sm font-medium rounded-lg transition-colors'
                  >
                    恢复默认配置
                  </button>

                  {/* 提示信息 */}
                  <div className='text-xs text-muted-foreground p-3 bg-muted border border-border rounded-lg'>
                    <p>
                      💡
                      提示：点击眼睛图标可显示/隐藏模块，使用箭头按钮调整模块顺序
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 底部说明 */}
          <div className='mt-6 pt-4 border-t border-border'>
            <p className='text-xs text-muted-foreground text-center'>
              这些设置保存在本地浏览器中
            </p>
          </div>
        </div>
      </div>
    </>
, document.body
  );
};
