/* eslint-disable no-console,@typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion */

'use client';

import {
  Bell,
  Download,
  LogOut,
  Monitor,
  Package,
  Settings,
  Shield,
  Star,
  User,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { getAuthInfoFromBrowserCookie } from '@/lib/auth';
import { CURRENT_VERSION } from '@/lib/version';
import { UpdateStatus } from '@/lib/version_check';

import { DeviceManagementPanel } from './DeviceManagementPanel';
import { DownloadManagementPanel } from './DownloadManagementPanel';
import { EmailSettingsPanel } from './EmailSettingsPanel';
import { EmailSettingsPanel } from './EmailSettingsPanel';
import { FavoritesPanel } from './FavoritesPanel';
import { FavoritesPanel } from './FavoritesPanel';
import { NotificationPanel } from './NotificationPanel';
import { NotificationPanel } from './NotificationPanel';
import { OfflineDownloadPanel } from './OfflineDownloadPanel';
import { OfflineDownloadPanel } from './OfflineDownloadPanel';
import { PersonalCenterPanel } from './PersonalCenterPanel';
import TVRemotePanel from './tv/TVRemotePanel';
import { ChangePasswordDialog } from './user-panels/ChangePasswordDialog';
import { EcoAppsPanel } from './user-panels/EcoAppsPanel';
import { ReportDialog } from './user-panels/ReportDialog';
import { SubscribePanel } from './user-panels/SubscribePanel';
import { UserSettingsSheet } from './user-panels/UserSettingsSheet';
import { useVersionCheck } from './VersionCheckProvider';
import { VersionPanel } from './VersionPanel';

export const UserMenu: React.FC = () => {
  const router = useRouter();
  const { updateStatus, isChecking } = useVersionCheck();
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileCenterOpen, setIsProfileCenterOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isSubscribeOpen, setIsSubscribeOpen] = useState(false);
  const [isVersionPanelOpen, setIsVersionPanelOpen] = useState(false);
  const [isOfflineDownloadPanelOpen, setIsOfflineDownloadPanelOpen] =
    useState(false);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [isFavoritesPanelOpen, setIsFavoritesPanelOpen] = useState(false);
  const [isEmailSettingsOpen, setIsEmailSettingsOpen] = useState(false);
  const [isDeviceManagementOpen, setIsDeviceManagementOpen] = useState(false);
  const [isEcoAppsOpen, setIsEcoAppsOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isDownloadManagementOpen, setIsDownloadManagementOpen] =
    useState(false);
  const [isTVRemoteOpen, setIsTVRemoteOpen] = useState(false);
  const [authInfo, setAuthInfo] = useState<AuthInfo | null>(null);
  const [storageType, setStorageType] = useState<string>('localstorage');
  const [displayStorageType, setDisplayStorageType] =
    useState<string>('localstorage');
  const [mounted, setMounted] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // 通知设置
  const [userEmail, setUserEmail] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [pushNotificationsConfigured, setPushNotificationsConfigured] = useState(false);
  const [pushNotificationsSupported, setPushNotificationsSupported] = useState(false);
  const [pushNotificationsBusy, setPushNotificationsBusy] = useState(false);
  const [emailSettingsLoading, setEmailSettingsLoading] = useState(false);
  const [emailSettingsSaving, setEmailSettingsSaving] = useState(false);
  const [emailSettingsMessage, setEmailSettingsMessage] = useState('');
  const [emailSettingsMessageType, setEmailSettingsMessageType] = useState<
    'success' | 'error' | null
  >(null);
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [telegramBound, setTelegramBound] = useState(false);
  const [telegramUsername, setTelegramUsername] = useState('');
  const [telegramBindCode, setTelegramBindCode] = useState('');
  const [telegramDeepLink, setTelegramDeepLink] = useState('');
  const [telegramBindingBusy, setTelegramBindingBusy] = useState(false);

  // 设备管理状态
  const [devices, setDevices] = useState<any[]>([]);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  // 确认对话框状态
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => undefined,
  });

  // Body 滚动锁定 - 使用 overflow 方式避免布局问题
  useEffect(() => {
    if (
      isProfileCenterOpen ||
      isSettingsOpen ||
      isChangePasswordOpen ||
      isSubscribeOpen ||
      isOfflineDownloadPanelOpen ||
      isEmailSettingsOpen ||
      isDeviceManagementOpen ||
      isEcoAppsOpen ||
      isReportOpen ||
      isDownloadManagementOpen ||
      isTVRemoteOpen
    ) {
      const body = document.body;
      const html = document.documentElement;

      // 保存原始样式
      const originalBodyOverflow = body.style.overflow;
      const originalHtmlOverflow = html.style.overflow;

      // 只设置 overflow 来阻止滚动
      body.style.overflow = 'hidden';
      html.style.overflow = 'hidden';

      return () => {
        // 恢复所有原始样式
        body.style.overflow = originalBodyOverflow;
        html.style.overflow = originalHtmlOverflow;
      };
    }
  }, [
    isProfileCenterOpen,
    isSettingsOpen,
    isChangePasswordOpen,
    isSubscribeOpen,
    isOfflineDownloadPanelOpen,
    isEmailSettingsOpen,
    isDeviceManagementOpen,
    isEcoAppsOpen,
    isReportOpen,
    isDownloadManagementOpen,
    isTVRemoteOpen,
  ]);

  // 确保组件已挂载
  useEffect(() => {
    setMounted(true);
  }, []);

  const loadUnreadCount = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        const count = data.unreadCount || 0;
        setUnreadCount(count);
        // 同步到全局，让其他 UserMenu 实例也能获取
        if (typeof window !== 'undefined') {
          (window as any).__unreadNotificationCount = count;
        }
      }
    } catch (error) {
      console.error('加载未读通知数量失败:', error);
    }
  };
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 检查是否已经有其他实例在加载
    const globalWindow = window as any;
    if (globalWindow.__loadingNotifications) {
      // 如果正在加载，等待加载完成后获取结果
      const checkInterval = setInterval(() => {
        if (
          !globalWindow.__loadingNotifications &&
          globalWindow.__unreadNotificationCount !== undefined
        ) {
          setUnreadCount(globalWindow.__unreadNotificationCount);
          clearInterval(checkInterval);
        }
      }, 100);
      return () => clearInterval(checkInterval);
    }

    // 检查是否已经加载过
    if (globalWindow.__unreadNotificationCount !== undefined) {
      setUnreadCount(globalWindow.__unreadNotificationCount);
      return;
    }

    // 标记正在加载
    globalWindow.__loadingNotifications = true;
    loadUnreadCount().finally(() => {
      globalWindow.__loadingNotifications = false;
    });
  }, []);
  useEffect(() => {
    const handleNotificationsUpdated = () => {
      // 清除缓存，强制重新加载
      if (typeof window !== 'undefined') {
        delete (window as any).__unreadNotificationCount;
      }
      loadUnreadCount();
    };

    window.addEventListener('notificationsUpdated', handleNotificationsUpdated);
    return () => {
      window.removeEventListener(
        'notificationsUpdated',
        handleNotificationsUpdated
      );
    };
  }, []);
  // 获取认证信息和存储类型
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const auth = getAuthInfoFromBrowserCookie();
      setAuthInfo(auth);

      const runtimeConfig = (window as any).RUNTIME_CONFIG || {};
      const type = runtimeConfig.STORAGE_TYPE || 'localstorage';
      const displayType = runtimeConfig.DISPLAY_STORAGE_TYPE || type;
      setStorageType(type);
      setDisplayStorageType(displayType);
    }
  }, []);

  // 加载通知设置
  const loadEmailSettings = async () => {
    setEmailSettingsLoading(true);
    setEmailSettingsMessage('');
    setEmailSettingsMessageType(null);
    try {
      const response = await fetch('/api/user/email-settings');
      if (response.ok) {
        const data = await response.json();
        setUserEmail(data.email || '');
        setEmailNotifications(data.emailNotifications || false);
      }

      const pushResponse = await fetch('/api/notifications/push');
      if (pushResponse.ok) {
        const pushData = await pushResponse.json();
        setPushNotificationsConfigured(Boolean(pushData.configured && pushData.publicKey));
        setPushNotificationsSupported(
          Boolean(
            pushData.configured &&
            pushData.publicKey &&
            pushData.hasDeviceToken &&
            typeof window !== 'undefined' &&
            'Notification' in window &&
            'serviceWorker' in navigator &&
            'PushManager' in window
          )
        );
        setPushNotifications(Boolean(pushData.pushNotifications));
      }

      const telegramResponse = await fetch('/api/telegram/bind');
      if (telegramResponse.ok) {
        const telegramData = await telegramResponse.json();
        setTelegramEnabled(Boolean(telegramData.enabled));
        setTelegramBound(Boolean(telegramData.binding));
        setTelegramUsername(telegramData.binding?.telegramUsername || '');
      }
    } catch (error) {
      console.error('加载通知设置失败:', error);
    } finally {
      setEmailSettingsLoading(false);
    }
  };

  const handleCreateTelegramBindCode = async () => {
    setTelegramBindingBusy(true);
    setEmailSettingsMessage('');
    setEmailSettingsMessageType(null);
    try {
      const response = await fetch('/api/telegram/bind', { method: 'POST' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || '生成 Telegram 绑定码失败');
      }
      setTelegramBindCode(data.code || '');
      setTelegramDeepLink(data.deepLink || '');
      setEmailSettingsMessage('Telegram 绑定码已生成，请在 10 分钟内完成绑定');
      setEmailSettingsMessageType('success');
    } catch (error) {
      setEmailSettingsMessage(error instanceof Error ? error.message : '生成 Telegram 绑定码失败');
      setEmailSettingsMessageType('error');
    } finally {
      setTelegramBindingBusy(false);
    }
  };

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; i++) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const arrayBufferToBase64Url = (buffer: ArrayBuffer | null) => {
    if (!buffer) return '';
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window
      .btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
  };

  const isSubscriptionUsingPublicKey = (
    subscription: PushSubscription,
    publicKey: string
  ) => {
    const subscriptionKey = arrayBufferToBase64Url(
      subscription.options?.applicationServerKey || null
    );
    return subscriptionKey === publicKey;
  };

  const waitForServiceWorkerActivation = async (
    registration: ServiceWorkerRegistration
  ) => {
    let pendingWorker = registration.installing || registration.waiting;

    if (!pendingWorker) {
      await registration.update();
      pendingWorker = registration.installing || registration.waiting;
    }

    // 没有新的 installing/waiting worker 时，说明当前 active registration 可直接使用。
    if (!pendingWorker) {
      if (registration.active) return registration;
      throw new Error('Service Worker 注册失败，请刷新页面后重试');
    }

    const activatingWorker = pendingWorker;
    if (activatingWorker.state === 'activated') return registration;

    await new Promise<void>((resolve, reject) => {
      const handleStateChange = () => {
        if (activatingWorker.state === 'activated') {
          activatingWorker.removeEventListener('statechange', handleStateChange);
          resolve();
        } else if (activatingWorker.state === 'redundant') {
          activatingWorker.removeEventListener('statechange', handleStateChange);
          reject(new Error('Service Worker 激活失败，请刷新页面后重试'));
        }
      };

      activatingWorker.addEventListener('statechange', handleStateChange);
      handleStateChange();
    });

    return registration;
  };

  const getReadyServiceWorkerRegistration = async () => {
    if (!('serviceWorker' in navigator)) {
      throw new Error('当前浏览器不支持 Service Worker');
    }

    // 开启系统通知时明确使用带 push 事件处理器的 Service Worker。
    // 如果浏览器里已有旧 /sw.js 注册，重新注册同一 scope 的 /push-sw.js 会更新该注册；
    // push-sw.js 内部会 skipWaiting + clients.claim，激活后再订阅，确保 Push 到达能展示通知。
    const registration = await navigator.serviceWorker.register('/push-sw.js', {
      scope: '/',
      updateViaCache: 'none',
    });

    return waitForServiceWorkerActivation(registration);
  };

  const handlePushNotificationsChange = async (enabled: boolean) => {
    if (!enabled) {
      setPushNotificationsBusy(true);
      try {
        const registration =
          'serviceWorker' in navigator
            ? await navigator.serviceWorker.getRegistration()
            : undefined;
        const subscription = await registration?.pushManager.getSubscription();
        const endpoint = subscription?.endpoint;
        await subscription?.unsubscribe();
        await fetch('/api/notifications/push', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint }),
        });
        setPushNotifications(false);
      } catch (error) {
        console.error('关闭浏览器通知失败:', error);
        setEmailSettingsMessage('关闭浏览器通知失败，请重试');
        setEmailSettingsMessageType('error');
      } finally {
        setPushNotificationsBusy(false);
      }
      return;
    }

    setPushNotificationsBusy(true);
    setEmailSettingsMessage('');
    setEmailSettingsMessageType(null);
    try {
      const statusResponse = await fetch('/api/notifications/push');
      const status = statusResponse.ok ? await statusResponse.json() : null;
      if (!status?.configured || !status?.publicKey) {
        throw new Error('管理员尚未配置 Web Push VAPID 密钥');
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('浏览器通知权限未授权');
      }

      const registration = await getReadyServiceWorkerRegistration();

      let subscription = await registration.pushManager.getSubscription();
      if (subscription && !isSubscriptionUsingPublicKey(subscription, status.publicKey)) {
        await subscription.unsubscribe();
        subscription = null;
      }

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(status.publicKey),
        });
      }

      const response = await fetch('/api/notifications/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: true,
          subscription: subscription.toJSON(),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || '保存浏览器通知订阅失败');
      }

      setPushNotifications(true);
      setEmailSettingsMessage('浏览器系统通知已开启');
      setEmailSettingsMessageType('success');
    } catch (error) {
      console.error('开启浏览器通知失败:', error);
      setPushNotifications(false);
      setEmailSettingsMessage(error instanceof Error ? error.message : '开启浏览器通知失败');
      setEmailSettingsMessageType('error');
    } finally {
      setPushNotificationsBusy(false);
    }
  };

  // 保存通知设置
  const handleSaveEmailSettings = async () => {
    setEmailSettingsSaving(true);
    setEmailSettingsMessage('');
    setEmailSettingsMessageType(null);
    try {
      const response = await fetch('/api/user/email-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          emailNotifications,
        }),
      });

      if (response.ok) {
        setEmailSettingsMessage('保存成功！');
        setEmailSettingsMessageType('success');
        setTimeout(() => {
          setEmailSettingsMessage('');
          setEmailSettingsMessageType(null);
        }, 3000);
      } else {
        const data = await response.json();
        setEmailSettingsMessage(data.error || '保存失败');
        setEmailSettingsMessageType('error');
      }
    } catch (error) {
      console.error('保存通知设置失败:', error);
      setEmailSettingsMessage('保存失败，请重试');
      setEmailSettingsMessageType('error');
    } finally {
      setEmailSettingsSaving(false);
    }
  };

  // 加载设备列表
  const loadDevices = async () => {
    setDevicesLoading(true);
    try {
      const response = await fetch('/api/auth/devices');
      if (response.ok) {
        const data = await response.json();
        setDevices(data.devices || []);
      }
    } catch (error) {
      console.error('加载设备列表失败:', error);
    } finally {
      setDevicesLoading(false);
    }
  };

  // 撤销单个设备
  const handleRevokeDevice = async (tokenId: string) => {
    confirm({
      title: '撤销设备登录',
      message: '确定要撤销该设备的登录吗？',
      onConfirm: async () => {
        setRevoking(tokenId);
        try {
          const response = await fetch('/api/auth/devices', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tokenId }),
          });

          if (response.ok) {
            // 撤销成功后不重新加载列表，仅移除当前撤销的设备项
            setDevices((prevDevices) =>
              prevDevices.filter((device) => device.tokenId !== tokenId)
            );
          } else {
            alert('撤销失败，请重试');
          }
        } catch (error) {
          console.error('撤销设备失败:', error);
          alert('撤销失败，请重试');
        } finally {
          setRevoking(null);
        }
      },
    });
  };

  // 撤销所有设备
  const handleRevokeAllDevices = async () => {
    confirm({
      title: '登出所有设备',
      message:
        '确定要登出所有设备吗？这将清除所有设备的登录状态（包括当前设备）。',
      onConfirm: async () => {
        try {
          const response = await fetch('/api/auth/devices', {
            method: 'POST',
          });

          if (response.ok) {
            // 登出所有设备后，重定向到首页
            window.location.href = '/';
          } else {
            alert('操作失败，请重试');
          }
        } catch (error) {
          console.error('登出所有设备失败:', error);
          alert('操作失败，请重试');
        }
      },
    });
  };

  // 根据设备类型返回对应的图标
  const getDeviceIcon = (deviceInfo: string) => {
    const info = deviceInfo.toLowerCase();

    if (
      info.includes('mobile') ||
      info.includes('iphone') ||
      info.includes('android')
    ) {
      return Smartphone;
    }

    if (info.includes('tablet') || info.includes('ipad')) {
      return Tablet;
    }

    return Monitor;
  };
  const handleMenuClick = () => {
    setIsOpen(!isOpen);
  };

  const handleCloseMenu = () => {
    setIsOpen(false);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('注销请求失败:', error);
    }
    window.location.href = '/';
  };

  const handleAdminPanel = () => {
    router.push('/admin');
  };

  const handleChangePassword = () => {
    setIsOpen(false);
    setIsChangePasswordOpen(true);
  };

  const handleSubscribe = () => {
    setIsOpen(false);
    setIsSubscribeOpen(true);
  };

  const handleSettings = () => {
    setIsOpen(false);
    setIsSettingsOpen(true);
  };

  // 检查是否显示管理面板按钮
  const showAdminPanel =
    (authInfo?.role === 'owner' || authInfo?.role === 'admin') &&
    storageType !== 'localstorage';

  // 检查是否显示离线下载按钮
  const showOfflineDownload =
    (authInfo?.role === 'owner' || authInfo?.role === 'admin') &&
    typeof window !== 'undefined' &&
    (window as any).RUNTIME_CONFIG?.ENABLE_OFFLINE_DOWNLOAD === true;

  // 检查是否显示修改密码按钮
  const showChangePassword =
    authInfo?.role !== 'owner' && storageType !== 'localstorage';

  // 角色中文映射
  const getRoleText = (role?: string) => {
    switch (role) {
      case 'owner':
        return '站长';
      case 'admin':
        return '管理员';
      case 'user':
        return '用户';
      default:
        return '';
    }
  };

  const currentUsername = authInfo?.username || 'default';
  const currentRole = authInfo?.role || 'user';
  const currentRoleText = getRoleText(currentRole);
  const shouldShowRoleBadge = currentRole !== 'user';
  const avatarText = currentUsername.trim().charAt(0).toUpperCase() || 'D';

  const roleBadgeClassName =
    currentRole === 'owner'
      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
      : currentRole === 'admin'
      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
  const handleOpenProfileCenter = () => {
    setIsOpen(false);
    setIsProfileCenterOpen(true);
  };

  // 共享确认对话框（宿主持有，面板通过 prop 调用）
  const confirm = (opts: {
    title: string;
    message: string;
    onConfirm: () => void;
  }) => {
    setConfirmDialog({
      isOpen: true,
      title: opts.title,
      message: opts.message,
      onConfirm: () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        opts.onConfirm();
      },
    });
  };


  return (
    <>
      <div className='relative'>
        <button
          onClick={handleMenuClick}
          className='w-10 h-10 p-2 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200/50 dark:text-gray-300 dark:hover:bg-gray-700/50 transition-colors'
          aria-label='User Menu'
        >
          <User className='w-full h-full' />
        </button>
        {/* 版本更新红点 */}
        {updateStatus === UpdateStatus.HAS_UPDATE && (
          <div className='absolute top-[2px] right-[2px] w-2 h-2 bg-yellow-500 rounded-full'></div>
        )}
        {/* 未读通知红点 */}
        {unreadCount > 0 && (
          <div className='absolute top-[2px] right-[2px] w-2 h-2 bg-red-500 rounded-full'></div>
        )}
      </div>

      {/* 使用 Portal 将菜单面板渲染到 document.body */}
      {isOpen &&
        mounted &&
        createPortal(
    <>
      {/* 背景遮罩 - 普通菜单无需模糊 */}
      <div
        className='fixed inset-0 bg-transparent z-[1000]'
        onClick={handleCloseMenu}
      />

      {/* 菜单面板 */}
      <div className='fixed top-14 right-4 w-56 bg-white dark:bg-gray-900 rounded-lg shadow-xl z-[1001] border border-gray-200/50 dark:border-gray-700/50 overflow-hidden select-none'>
        {/* 用户信息区域 */}
        <div className='px-3 py-1 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-800 dark:to-gray-800/50'>
          <div className='flex items-start justify-between gap-3'>
            <button
              onClick={handleOpenProfileCenter}
              className='flex items-center gap-3 rounded-xl px-2 py-1 text-left hover:bg-white/70 dark:hover:bg-gray-700/40 transition-colors'
            >
              <div className='relative flex h-11 w-11 items-center justify-center rounded-full bg-blue-500 text-lg font-semibold text-white shadow-sm'>
                <span>{avatarText}</span>
                {shouldShowRoleBadge && (
                  <span
                    className={`absolute left-1/2 top-[calc(100%-6px)] z-10 -translate-x-1/2 inline-flex min-w-[26px] items-center justify-center whitespace-nowrap rounded-full px-1.5 py-[2px] text-[8px] leading-none font-medium shadow-sm ${roleBadgeClassName}`}
                  >
                    {currentRoleText}
                  </span>
                )}
              </div>
              <div className='min-w-0'>
                <span className='block max-w-[84px] truncate text-sm font-semibold text-gray-900 dark:text-gray-100 leading-none'>
                  {currentUsername}
                </span>
              </div>
            </button>

            <div className='pt-1 text-right'>
              <div className='text-[10px] text-gray-400 dark:text-gray-500'>
                <div>数据存储</div>
                <div className='mt-0.5'>
                  {displayStorageType === 'localstorage'
                    ? '本地'
                    : displayStorageType}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 菜单项 */}
        <div className='py-1'>
          {/* 通知按钮 */}
          <button
            onClick={() => {
              setIsOpen(false);
              setIsNotificationPanelOpen(true);
            }}
            className='w-full px-3 py-2 text-left flex items-center gap-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm relative'
          >
            <Bell className='w-4 h-4 text-gray-500 dark:text-gray-400' />
            <span className='font-medium'>通知中心</span>
            {unreadCount > 0 && (
              <span className='ml-auto px-2 py-0.5 text-xs font-medium bg-red-500 text-white rounded-full'>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* 我的收藏按钮 */}
          <button
            onClick={() => {
              setIsOpen(false);
              setIsFavoritesPanelOpen(true);
            }}
            className='w-full px-3 py-2 text-left flex items-center gap-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm relative'
          >
            <Star className='w-4 h-4 text-gray-500 dark:text-gray-400' />
            <span className='font-medium'>我的收藏</span>
          </button>

          {/* 设置按钮 */}
          <button
            onClick={handleSettings}
            className='w-full px-3 py-2 text-left flex items-center gap-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm'
          >
            <Settings className='w-4 h-4 text-gray-500 dark:text-gray-400' />
            <span className='font-medium'>设置</span>
          </button>

          {/* 管理面板按钮 */}
          {showAdminPanel && (
            <button
              onClick={handleAdminPanel}
              className='w-full px-3 py-2 text-left flex items-center gap-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm'
            >
              <Shield className='w-4 h-4 text-gray-500 dark:text-gray-400' />
              <span className='font-medium'>管理面板</span>
            </button>
          )}

          {/* 离线下载按钮 */}
          {showOfflineDownload && (
            <button
              onClick={() => {
                setIsOfflineDownloadPanelOpen(true);
                setIsOpen(false);
              }}
              className='w-full px-3 py-2 text-left flex items-center gap-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm'
            >
              <Download className='w-4 h-4 text-gray-500 dark:text-gray-400' />
              <span className='font-medium'>离线下载</span>
            </button>
          )}

          {/* 电视访问按钮 */}
          <button
            onClick={handleSubscribe}
            className='w-full px-3 py-2 text-left flex items-center gap-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm'
          >
            <Monitor className='w-4 h-4 text-gray-500 dark:text-gray-400' />
            <span className='font-medium'>电视访问</span>
          </button>

          {/* 生态应用按钮 */}
          <button
            onClick={() => {
              setIsOpen(false);
              setIsEcoAppsOpen(true);
            }}
            className='w-full px-3 py-2 text-left flex items-center gap-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm'
          >
            <Package className='w-4 h-4 text-gray-500 dark:text-gray-400' />
            <span className='font-medium'>生态应用</span>
          </button>

          {/* 分割线 */}
          <div className='my-1 border-t border-gray-200 dark:border-gray-700'></div>

          {/* 登出按钮 */}
          <button
            onClick={handleLogout}
            className='w-full px-3 py-2 text-left flex items-center gap-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm'
          >
            <LogOut className='w-4 h-4' />
            <span className='font-medium'>登出</span>
          </button>

          {/* 分割线 */}
          <div className='my-1 border-t border-gray-200 dark:border-gray-700'></div>

          {/* 版本信息 */}
          <button
            onClick={() => {
              setIsVersionPanelOpen(true);
              handleCloseMenu();
            }}
            className='w-full px-3 py-2 text-center flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-xs'
          >
            <div className='flex items-center gap-1'>
              <span className='font-mono'>v{CURRENT_VERSION}</span>
              {!isChecking &&
                updateStatus &&
                updateStatus !== UpdateStatus.FETCH_FAILED && (
                  <div
                    className={`w-2 h-2 rounded-full -translate-y-2 ${
                      updateStatus === UpdateStatus.HAS_UPDATE
                        ? 'bg-yellow-500'
                        : updateStatus === UpdateStatus.NO_UPDATE
                        ? 'bg-green-400'
                        : ''
                    }`}
                  ></div>
                )}
            </div>
          </button>
        </div>
      </div>
    </>
          ,
          document.body
        )}

      <PersonalCenterPanel
        isOpen={isProfileCenterOpen}
        mounted={mounted}
        onClose={() => setIsProfileCenterOpen(false)}
        username={currentUsername}
        roleText={currentRoleText}
        showRoleBadge={shouldShowRoleBadge}
        avatarText={avatarText}
        roleBadgeClassName={roleBadgeClassName}
        showDeviceManagement={storageType !== 'localstorage'}
        showChangePassword={showChangePassword}
        onOpenEmailSettings={() => {
          setIsProfileCenterOpen(false);
          setIsEmailSettingsOpen(true);
          loadEmailSettings();
        }}
        onOpenDeviceManagement={() => {
          setIsProfileCenterOpen(false);
          setIsDeviceManagementOpen(true);
          loadDevices();
        }}
        onOpenChangePassword={() => {
          setIsProfileCenterOpen(false);
          handleChangePassword();
        }}
      />

      {/* 设置面板（常驻挂载：云同步自动拉取/关闭时静默上传依赖挂载即生效） */}
      <UserSettingsSheet
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        confirm={confirm}
      />

      {/* 修改密码面板 */}
      <ChangePasswordDialog
        open={isChangePasswordOpen}
        onOpenChange={setIsChangePasswordOpen}
        onLogout={handleLogout}
      />

      {/* 电视访问（订阅）面板 */}
      <SubscribePanel
        open={isSubscribeOpen}
        onOpenChange={setIsSubscribeOpen}
        confirm={confirm}
      />

      {/* 版本面板 */}
      <VersionPanel
        isOpen={isVersionPanelOpen}
        onClose={() => setIsVersionPanelOpen(false)}
      />

      {/* 离线下载面板 */}
      <OfflineDownloadPanel
        isOpen={isOfflineDownloadPanelOpen}
        onClose={() => setIsOfflineDownloadPanelOpen(false)}
      />

      {/* 使用 Portal 将通知面板渲染到 document.body */}
      {isNotificationPanelOpen &&
        mounted &&
        createPortal(
          <NotificationPanel
            isOpen={isNotificationPanelOpen}
            onOpenNotificationSettings={() => {
              setIsNotificationPanelOpen(false);
              setIsEmailSettingsOpen(true);
              void loadEmailSettings();
            }}
            onClose={() => {
              setIsNotificationPanelOpen(false);
              // 不需要在这里刷新，NotificationPanel 内部会触发事件
            }}
          />,
          document.body
        )}

      {/* 使用 Portal 将收藏面板渲染到 document.body */}
      {isFavoritesPanelOpen &&
        mounted &&
        createPortal(
          <FavoritesPanel
            isOpen={isFavoritesPanelOpen}
            onClose={() => setIsFavoritesPanelOpen(false)}
          />,
          document.body
        )}

      {/* 使用 Portal 将下载文件管理面板渲染到 document.body */}
      {isDownloadManagementOpen &&
        mounted &&
        createPortal(
          <DownloadManagementPanel
            isOpen={isDownloadManagementOpen}
            onClose={() => setIsDownloadManagementOpen(false)}
          />,
          document.body
        )}

      <EmailSettingsPanel
        isOpen={isEmailSettingsOpen}
        mounted={mounted}
        onClose={() => setIsEmailSettingsOpen(false)}
        userEmail={userEmail}
        onUserEmailChange={setUserEmail}
        emailNotifications={emailNotifications}
        onEmailNotificationsChange={setEmailNotifications}
        pushNotifications={pushNotifications}
        onPushNotificationsChange={handlePushNotificationsChange}
        pushNotificationsSupported={pushNotificationsSupported}
        pushNotificationsConfigured={pushNotificationsConfigured}
        pushNotificationsBusy={pushNotificationsBusy}
        telegramEnabled={telegramEnabled}
        telegramBound={telegramBound}
        telegramUsername={telegramUsername}
        telegramBindCode={telegramBindCode}
        telegramDeepLink={telegramDeepLink}
        telegramBindingBusy={telegramBindingBusy}
        onCreateTelegramBindCode={handleCreateTelegramBindCode}
        emailSettingsLoading={emailSettingsLoading}
        emailSettingsSaving={emailSettingsSaving}
        onSave={handleSaveEmailSettings}
        statusMessage={emailSettingsMessage}
        statusType={emailSettingsMessageType}
      />

      <DeviceManagementPanel
        isOpen={isDeviceManagementOpen}
        mounted={mounted}
        onClose={() => setIsDeviceManagementOpen(false)}
        devices={devices}
        devicesLoading={devicesLoading}
        revoking={revoking}
        onRevokeDevice={handleRevokeDevice}
        onRevokeAllDevices={handleRevokeAllDevices}
        getDeviceIcon={getDeviceIcon}
      />

      <TVRemotePanel
        isOpen={isTVRemoteOpen}
        mounted={mounted}
        onClose={() => setIsTVRemoteOpen(false)}
      />

      {/* 生态应用面板 */}
      <EcoAppsPanel
        open={isEcoAppsOpen}
        onOpenChange={setIsEcoAppsOpen}
        onOpenReport={() => setIsReportOpen(true)}
      />

      {/* 举报信息面板 */}
      <ReportDialog
        open={isReportOpen}
        onOpenChange={setIsReportOpen}
      />

      {/* 确认对话框 */}
      {confirmDialog.isOpen &&
        mounted &&
        createPortal(
          <div className='fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm'>
            <div className='bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md m-4'>
              {/* 标题 */}
              <div className='p-6 border-b border-gray-200 dark:border-gray-700'>
                <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
                  {confirmDialog.title}
                </h3>
              </div>

              {/* 内容 */}
              <div className='p-6'>
                <p className='text-gray-700 dark:text-gray-300'>
                  {confirmDialog.message}
                </p>
              </div>

              {/* 按钮 */}
              <div className='p-6 pt-0 flex gap-3 justify-end'>
                <button
                  onClick={() =>
                    setConfirmDialog({ ...confirmDialog, isOpen: false })
                  }
                  className='px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors'
                >
                  取消
                </button>
                <button
                  onClick={confirmDialog.onConfirm}
                  className='px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 rounded-lg transition-colors'
                >
                  确定
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
