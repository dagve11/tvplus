/* eslint-disable @typescript-eslint/no-explicit-any, no-console, @typescript-eslint/no-non-null-assertion,react-hooks/exhaustive-deps,@typescript-eslint/no-empty-function */

'use client';

import {
  closestCenter,
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  restrictToParentElement,
  restrictToVerticalAxis,
} from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  BarChart3,
  BookMarked,
  BookOpen,
  Bot,
  Cat,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Cloud,
  Copy,
  Database,
  ExternalLink,
  FileText,
  FolderOpen,
  Globe,
  Mail,
  Monitor,
  Palette,
  Plus,
  Search,
  Send,
  Settings,
  Smartphone,
  Tablet,
  Trash2,
  Tv,
  UserPlus,
  Users,
  Video,
  X,
} from 'lucide-react';
import { GripVertical } from 'lucide-react';
import {
  Fragment,
  memo,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

import { AdminConfig, AdminConfigResult } from '@/lib/admin.types';
import { getAuthInfoFromBrowserCookie } from '@/lib/auth';
import { BookSource } from '@/lib/book.types';
import {
  ALL_FEATURE_PERMISSION_KEYS,
  FEATURE_PERMISSION_OPTIONS,
} from '@/lib/feature-permissions';

import { AdminShell } from '@/components/admin/AdminShell';
import { AlertModal } from '@/components/admin/sections/AlertModal';
import { UserConfig } from '@/components/admin/sections/UserConfig';
import { VideoSourceConfig } from '@/components/admin/sections/VideoSourceConfig';
import { CategoryConfig } from '@/components/admin/sections/CategoryConfig';
import { VideoSourceScriptLab } from '@/components/admin/sections/VideoSourceScriptLab';
import { ConfigFileComponent } from '@/components/admin/sections/ConfigFileComponent';
import { ThemeConfigComponent } from '@/components/admin/sections/ThemeConfigComponent';
import { SiteConfigComponent } from '@/components/admin/sections/SiteConfigComponent';
import { OpenListConfigComponent } from '@/components/admin/sections/OpenListConfigComponent';
import { NetDiskConfigComponent } from '@/components/admin/sections/NetDiskConfigComponent';
import { EmbyConfigComponent } from '@/components/admin/sections/EmbyConfigComponent';
import { RegistrationConfigComponent } from '@/components/admin/sections/RegistrationConfigComponent';
import { CustomAdFilterConfig } from '@/components/admin/sections/CustomAdFilterConfig';
import { SuwayomiConfigComponent } from '@/components/admin/sections/SuwayomiConfigComponent';
import { OPDSConfigComponent } from '@/components/admin/sections/OPDSConfigComponent';
import { XiaoyaConfigComponent } from '@/components/admin/sections/XiaoyaConfigComponent';
import { TelegramConfigComponent } from '@/components/admin/sections/TelegramConfigComponent';
import { EmailConfigComponent } from '@/components/admin/sections/EmailConfigComponent';
import { MovieRequestsComponent } from '@/components/admin/sections/MovieRequestsComponent';
import { AIConfigComponent } from '@/components/admin/sections/AIConfigComponent';
import { MusicConfigComponent } from '@/components/admin/sections/MusicConfigComponent';
import { LiveSourceConfig } from '@/components/admin/sections/LiveSourceConfig';
import { WebLiveConfig } from '@/components/admin/sections/WebLiveConfig';
import { adminButtonStyles, useAdminAlert } from '@/components/admin/shared';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import AnimeSubscriptionComponent from '@/components/AnimeSubscriptionComponent';
import CorrectDialog from '@/components/CorrectDialog';
import DataMigration from '@/components/DataMigration';
import PageLayout from '@/components/PageLayout';

const DEFAULT_GROUP_PERMISSIONS = [...ALL_FEATURE_PERMISSION_KEYS];


// 统一弹窗方法（必须在首次使用前定义）
const showError = (message: string, showAlert?: (config: any) => void) => {
  if (showAlert) {
    showAlert({ type: 'error', title: '错误', message, showConfirm: true });
  } else {
    console.error(message);
  }
};

const showSuccess = (message: string, showAlert?: (config: any) => void) => {
  if (showAlert) {
    showAlert({ type: 'success', title: '成功', message, timer: 2000 });
  } else {
    console.log(message);
  }
};

// 通用加载状态管理系统
interface LoadingState {
  [key: string]: boolean;
}

const useLoadingState = () => {
  const [loadingStates, setLoadingStates] = useState<LoadingState>({});

  const setLoading = (key: string, loading: boolean) => {
    setLoadingStates((prev) => ({ ...prev, [key]: loading }));
  };

  const isLoading = (key: string) => loadingStates[key] || false;

  const withLoading = async (
    key: string,
    operation: () => Promise<any>
  ): Promise<any> => {
    setLoading(key, true);
    try {
      const result = await operation();
      return result;
    } finally {
      setLoading(key, false);
    }
  };

  return { loadingStates, setLoading, isLoading, withLoading };
};

interface StandaloneSourceScript {
  id: string;
  key: string;
  name: string;
  description?: string;
  enabled: boolean;
  version: string;
  code: string;
  createdAt: number;
  updatedAt: number;
}

// 新增站点配置类型
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

// 视频源数据类型
interface DataSource {
  name: string;
  key: string;
  api: string;
  detail?: string;
  disabled?: boolean;
  from: 'config' | 'custom';
  proxyMode?: boolean;
  weight?: number;
  special?: boolean;
}

// 直播源数据类型
interface LiveDataSource {
  name: string;
  key: string;
  url: string;
  ua?: string;
  epg?: string;
  channelNumber?: number;
  disabled?: boolean;
  from: 'config' | 'custom';
  proxyMode?: 'full' | 'm3u8-only' | 'direct'; // 代理模式
}

// 自定义分类数据类型
interface CustomCategory {
  name?: string;
  type: 'movie' | 'tv';
  query: string;
  disabled?: boolean;
  from: 'config' | 'custom';
}

// 可折叠标签组件
interface CollapsibleTabProps {
  title: string;
  icon?: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  isParent?: boolean;
}











// 音乐配置组件（已停用）
// const MusicConfigComponent = (...) => { ... }




// 小雅配置组件












function AdminPageClient() {
  const { alertModal, showAlert, hideAlert, alertElement } = useAdminAlert();
  const { isLoading, withLoading } = useLoadingState();
  const [config, setConfig] = useState<AdminConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<'owner' | 'admin' | null>(null);
  const [showResetConfigModal, setShowResetConfigModal] = useState(false);
  
  // PC 左右布局：当前选中的区块（单选），持久化以便保存刷新后仍停留在原区块
  const [activeKey, setActiveKey] = useState<string>(() => {
    if (typeof window === 'undefined') return 'siteConfig';
    return localStorage.getItem('admin_active_section') || 'siteConfig';
  });
  // PC 内容区滚动容器，切换区块时回到顶部
  const contentScrollRef = useRef<HTMLDivElement | null>(null);
  // PC 侧边栏中分组的展开状态
  const [expandedGroups, setExpandedGroups] = useState<{
    [key: string]: boolean;
  }>({ mediaLibrary: true });

  // 获取管理员配置
  // showLoading 用于控制是否在请求期间显示整体加载骨架。
  const fetchConfig = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) {
        setLoading(true);
      }

      const response = await fetch(`/api/admin/config`);

      if (!response.ok) {
        const data = (await response.json()) as any;
        throw new Error(`获取配置失败: ${data.error}`);
      }

      const data = (await response.json()) as AdminConfigResult;
      setConfig(data.Config);
      setRole(data.Role);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '获取配置失败';
      // 只在首次加载时设置错误状态，避免弹窗和错误页面同时显示
      if (showLoading) {
        setError(msg);
      } else {
        showError(msg, showAlert);
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

  // 新版本用户列表状态
  const [usersV2, setUsersV2] = useState<Array<{
    username: string;
    role: 'owner' | 'admin' | 'user';
    banned: boolean;
    tags?: string[];
    enabledApis?: string[];
    created_at: number;
  }> | null>(null);

  // 用户列表分页状态
  const [userPage, setUserPage] = useState(1);
  const [userTotalPages, setUserTotalPages] = useState(1);
  const [userTotal, setUserTotal] = useState(0);
  const [userListLoading, setUserListLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const userLimit = 10;

  // 获取新版本用户列表
  const fetchUsersV2 = useCallback(
    async (page = 1, search = userSearch) => {
      try {
        setUserListLoading(true);
        const params = new URLSearchParams({
          page: String(page),
          limit: String(userLimit),
        });
        const trimmedSearch = search.trim();
        if (trimmedSearch) {
          params.set('search', trimmedSearch);
        }
        const response = await fetch(`/api/admin/users?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setUsersV2(data.users);
          setUserTotalPages(data.totalPages || 1);
          setUserTotal(data.total || 0);
          setUserPage(page);
        }
      } catch (err) {
        console.error('获取新版本用户列表失败:', err);
      } finally {
        setUserListLoading(false);
      }
    },
    [userSearch]
  );

  // 刷新配置和用户列表
  const refreshConfigAndUsers = useCallback(async () => {
    await fetchConfig();
    await fetchUsersV2(userPage); // 保持当前页码
  }, [fetchConfig, fetchUsersV2, userPage]);

  useEffect(() => {
    // 首次加载时显示骨架
    fetchConfig(true);
    // 若恢复的区块是用户管理，则补拉一次用户列表
    if (activeKey === 'userConfig') {
      fetchUsersV2();
    }
    // 仅在挂载时执行
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchConfig]);

  // PC 切换区块时，内容区滚动回顶部
  useEffect(() => {
    contentScrollRef.current?.scrollTo({ top: 0 });
  }, [activeKey]);


  // PC 左右布局：选中某个区块
  const selectSection = (key: string) => {
    setActiveKey(key);
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_active_section', key);
    }
    // 首次进入用户管理时懒加载用户列表
    if (key === 'userConfig' && !usersV2) {
      fetchUsersV2();
    }
  };

  // PC 侧边栏：切换分组展开
  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // 新增: 重置配置处理函数
  const handleResetConfig = () => {
    setShowResetConfigModal(true);
  };

  const handleConfirmResetConfig = async () => {
    await withLoading('resetConfig', async () => {
      try {
        const response = await fetch(`/api/admin/reset`);
        if (!response.ok) {
          throw new Error(`重置失败: ${response.status}`);
        }
        showSuccess('重置成功，请刷新页面！', showAlert);
        await fetchConfig();
        setShowResetConfigModal(false);
      } catch (err) {
        showError(err instanceof Error ? err.message : '重置失败', showAlert);
        throw err;
      }
    });
  };

  // 新增: 重载配置处理函数
  const handleReloadConfig = async () => {
    await withLoading('reloadConfig', async () => {
      try {
        const response = await fetch(`/api/admin/reload`);
        if (!response.ok) {
          throw new Error(`重载失败: ${response.status}`);
        }
        showSuccess('重载成功，配置缓存已清除！', showAlert);
        await fetchConfig();
      } catch (err) {
        showError(err instanceof Error ? err.message : '重载失败', showAlert);
        throw err;
      }
    });
  };

  if (loading) {
    return (
      <PageLayout activePath='/admin'>
        <div className='px-2 sm:px-10 py-4 sm:py-8'>
          <div className='max-w-[95%] mx-auto'>
            <h1 className='text-2xl font-bold text-foreground mb-8'>
              管理员设置
            </h1>
            <div className='space-y-4'>
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className='h-20 bg-muted rounded-lg animate-pulse'
                />
              ))}
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    // 显示无权限提示页面
    return (
      <PageLayout activePath='/admin'>
        <div className='min-h-screen flex items-center justify-center px-4'>
          <div className='max-w-md w-full'>
            <div className='bg-card rounded-lg shadow-lg p-8 text-center'>
              <div className='mb-6'>
                <div className='mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center'>
                  <AlertCircle className='w-8 h-8 text-destructive' />
                </div>
              </div>
              <h2 className='text-2xl font-bold text-foreground mb-4'>
                无权限访问
              </h2>
              <p className='text-muted-foreground mb-6'>{error}</p>
              <div className='space-y-3'>
                <button
                  onClick={() => (window.location.href = '/')}
                  className='w-full px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors'
                >
                  返回首页
                </button>
                <button
                  onClick={() => (window.location.href = '/login')}
                  className='w-full px-6 py-3 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg font-medium transition-colors'
                >
                  重新登录
                </button>
              </div>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  // 管理面板区块导航配置（PC 侧边栏与移动端手风琴共用同一份数据）
  type AdminNavItem = {
    key: string;
    title: string;
    icon: React.ReactNode;
    ownerOnly?: boolean;
    render?: () => React.ReactNode;
    children?: AdminNavItem[];
  };

  const navIconClass = 'text-muted-foreground';
  const navItems: AdminNavItem[] = [
    {
      key: 'configFile',
      title: '配置文件',
      ownerOnly: true,
      icon: <FileText size={20} className={navIconClass} />,
      render: () => (
        <ConfigFileComponent config={config} refreshConfig={fetchConfig} />
      ),
    },
    {
      key: 'siteConfig',
      title: '站点配置',
      icon: <Settings size={20} className={navIconClass} />,
      render: () => (
        <SiteConfigComponent config={config} refreshConfig={fetchConfig} />
      ),
    },
    {
      key: 'registrationConfig',
      title: '注册配置',
      icon: <UserPlus size={20} className={navIconClass} />,
      render: () => (
        <RegistrationConfigComponent
          config={config}
          refreshConfig={fetchConfig}
        />
      ),
    },
    {
      key: 'themeConfig',
      title: '个性化配置',
      icon: <Palette size={20} className={navIconClass} />,
      render: () => (
        <ThemeConfigComponent config={config} refreshConfig={fetchConfig} />
      ),
    },
    {
      key: 'userConfig',
      title: '用户管理',
      icon: <Users size={20} className={navIconClass} />,
      render: () => (
        <UserConfig
          config={config}
          role={role}
          refreshConfig={refreshConfigAndUsers}
          usersV2={usersV2}
          userPage={userPage}
          userTotalPages={userTotalPages}
          userTotal={userTotal}
          fetchUsersV2={fetchUsersV2}
          userListLoading={userListLoading}
          userSearch={userSearch}
          setUserSearch={setUserSearch}
        />
      ),
    },
    {
      key: 'videoSource',
      title: '视频源配置',
      icon: <Video size={20} className={navIconClass} />,
      render: () => (
        <VideoSourceConfig config={config} refreshConfig={fetchConfig} />
      ),
    },
    {
      key: 'sourceScriptLab',
      title: '视频源脚本',
      icon: <Bot size={20} className={navIconClass} />,
      render: () => <VideoSourceScriptLab />,
    },
    {
      key: 'musicConfig',
      title: '音乐配置',
      icon: (
        <svg
          width='20'
          height='20'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
          className={navIconClass}
        >
          <path d='M9 18V5l12-2v13' />
          <circle cx='6' cy='18' r='3' />
          <circle cx='18' cy='16' r='3' />
        </svg>
      ),
      render: () => (
        <MusicConfigComponent config={config} refreshConfig={fetchConfig} />
      ),
    },
    {
      key: 'suwayomiConfig',
      title: '漫画配置',
      icon: <BookOpen size={20} className={navIconClass} />,
      render: () => (
        <SuwayomiConfigComponent config={config} refreshConfig={fetchConfig} />
      ),
    },
    {
      key: 'opdsConfig',
      title: '电子书配置',
      icon: <BookMarked size={20} className={navIconClass} />,
      render: () => (
        <OPDSConfigComponent config={config} refreshConfig={fetchConfig} />
      ),
    },
    {
      key: 'liveSource',
      title: '电视直播源配置',
      icon: <Tv size={20} className={navIconClass} />,
      render: () => (
        <LiveSourceConfig config={config} refreshConfig={fetchConfig} />
      ),
    },
    {
      key: 'webLive',
      title: '网络直播配置',
      icon: <Globe size={20} className={navIconClass} />,
      render: () => (
        <WebLiveConfig config={config} refreshConfig={fetchConfig} />
      ),
    },
    {
      key: 'mediaLibrary',
      title: '私人影库',
      icon: (
        <Database size={20} className={navIconClass} />
      ),
      children: [
        {
          key: 'openListConfig',
          title: 'Openlist配置',
          icon: <FolderOpen size={20} className={navIconClass} />,
          render: () => (
            <OpenListConfigComponent
              config={config}
              refreshConfig={fetchConfig}
            />
          ),
        },
        {
          key: 'embyConfig',
          title: 'Emby 媒体库',
          icon: <FolderOpen size={20} className={navIconClass} />,
          render: () => (
            <EmbyConfigComponent config={config} refreshConfig={fetchConfig} />
          ),
        },
        {
          key: 'xiaoyaConfig',
          title: '小雅配置',
          icon: <FolderOpen size={20} className={navIconClass} />,
          render: () => (
            <XiaoyaConfigComponent
              config={config}
              refreshConfig={fetchConfig}
            />
          ),
        },
        {
          key: 'movieRequests',
          title: '求片管理',
          icon: <Video size={20} className={navIconClass} />,
          render: () => (
            <MovieRequestsComponent
              config={config}
              refreshConfig={fetchConfig}
            />
          ),
        },
        {
          key: 'animeSubscription',
          title: '追番订阅',
          icon: <Cat size={20} className={navIconClass} />,
          render: () => (
            <AnimeSubscriptionComponent
              config={config}
              refreshConfig={fetchConfig}
            />
          ),
        },
        {
          key: 'netDiskConfig',
          title: '网盘配置',
          icon: <Cloud size={20} className={navIconClass} />,
          render: () => (
            <NetDiskConfigComponent
              config={config}
              refreshConfig={fetchConfig}
            />
          ),
        },
      ],
    },
    {
      key: 'aiConfig',
      title: 'AI设定',
      icon: <Bot size={20} className={navIconClass} />,
      render: () => (
        <AIConfigComponent config={config} refreshConfig={fetchConfig} />
      ),
    },
    {
      key: 'emailConfig',
      title: '邮件配置',
      icon: <Mail size={20} className={navIconClass} />,
      render: () => (
        <EmailConfigComponent config={config} refreshConfig={fetchConfig} />
      ),
    },
    {
      key: 'telegramConfig',
      title: 'Telegram Bot',
      icon: <Send size={20} className={navIconClass} />,
      render: () => (
        <TelegramConfigComponent config={config} refreshConfig={fetchConfig} />
      ),
    },
    {
      key: 'categoryConfig',
      title: '分类配置',
      icon: <FolderOpen size={20} className={navIconClass} />,
      render: () => (
        <CategoryConfig config={config} refreshConfig={fetchConfig} />
      ),
    },
    {
      key: 'customAdFilter',
      title: '自定义去广告',
      icon: (
        <svg
          width='20'
          height='20'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
          className={navIconClass}
        >
          <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z' />
          <path d='M8 12h8' />
        </svg>
      ),
      render: () => (
        <CustomAdFilterConfig config={config} refreshConfig={fetchConfig} />
      ),
    },
    {
      key: 'dataMigration',
      title: '数据迁移',
      ownerOnly: true,
      icon: <Database size={20} className={navIconClass} />,
      render: () => <DataMigration onRefreshConfig={refreshConfigAndUsers} />,
    },
  ];

  // 根据 key 查找区块（含分组子项）
  const findNavItem = (key: string): AdminNavItem | undefined => {
    for (const it of navItems) {
      if (it.key === key) return it;
      const child = it.children?.find((c) => c.key === key);
      if (child) return child;
    }
    return undefined;
  };

  const visibleNavItems = navItems.filter(
    (it) => !it.ownerOnly || role === 'owner'
  );
  const activeItem = findNavItem(activeKey);

  return (
    <PageLayout activePath='/admin'>
      <div className='px-2 py-4 sm:px-10 sm:py-8'>
        <div className='mx-auto max-w-[95%]'>
          {/* 标题 + 重置/重载配置按钮（仅站长） */}
          <div className='mb-8 flex items-center gap-2'>
            <h1 className='text-2xl font-bold text-foreground'>管理员设置</h1>
            {config && role === 'owner' && (
              <>
                <button
                  onClick={handleResetConfig}
                  className={`rounded-md px-3 py-1 text-xs transition-colors ${adminButtonStyles.dangerSmall}`}
                >
                  重置配置
                </button>
                <button
                  onClick={handleReloadConfig}
                  className={`rounded-md px-3 py-1 text-xs transition-colors ${adminButtonStyles.primarySmall}`}
                >
                  重载配置
                </button>
              </>
            )}
          </div>

          {/* TMDB 未配置提示 */}
          {config && !config.SiteConfig.TMDBApiKey && (
            <div className='mb-4 flex items-start gap-3 rounded-lg border border-border bg-muted p-4'>
              <Info className='mt-0.5 h-5 w-5 flex-shrink-0 text-muted-foreground' />
              <p className='flex-1 text-sm font-medium text-foreground'>
                未配置 TMDB API Key，配置后可获得更丰富的影视信息和推荐内容
              </p>
            </div>
          )}

          {/* 视频源过多提示 */}
          {config && (config.SourceConfig?.length ?? 0) > 50 && (
            <div className='mb-4 flex items-start gap-3 rounded-lg border border-border bg-muted p-4'>
              <AlertTriangle className='mt-0.5 h-5 w-5 flex-shrink-0 text-muted-foreground' />
              <p className='flex-1 text-sm font-medium text-foreground'>
                当前视频源数量较多，可能会拖慢搜索与优选速度，建议适当精简
              </p>
            </div>
          )}

          <AdminShell
            navItems={visibleNavItems}
            activeKey={activeKey}
            onSelect={selectSection}
            expandedGroups={expandedGroups}
            onToggleGroup={toggleGroup}
            contentScrollRef={contentScrollRef}
            renderActiveSection={() => activeItem?.render?.()}
          />
        </div>
      </div>

      {/* 通用弹窗组件 */}
      {alertElement}

      {/* 重置配置确认弹窗 */}
      <ConfirmDialog
        isOpen={showResetConfigModal}
        title='确认重置配置'
        message='此操作将重置用户封禁和管理员设置、自定义视频源，站点配置将重置为默认值，是否继续？'
        confirmText={isLoading('resetConfig') ? '重置中...' : '确认重置'}
        cancelText='取消'
        variant='danger'
        onConfirm={() => {
          if (!isLoading('resetConfig')) handleConfirmResetConfig();
        }}
        onCancel={() => setShowResetConfigModal(false)}
      />
    </PageLayout>
  );
}


export default function AdminPage() {
  return (
    <Suspense>
      <AdminPageClient />
    </Suspense>
  );
}
