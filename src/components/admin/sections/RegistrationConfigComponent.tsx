'use client';

import { AlertTriangle, X } from 'lucide-react';
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


export const RegistrationConfigComponent = ({
  config,
  refreshConfig,
}: {
  config: AdminConfig | null;
  refreshConfig: () => Promise<void>;
}) => {
  const { alertElement } = useAdminAlert();
  const { isLoading, withLoading } = useLoadingState();
  const [showEnableRegistrationModal, setShowEnableRegistrationModal] =
    useState(false);
  const [registrationSettings, setRegistrationSettings] = useState<{
    EnableRegistration: boolean;
    RequireRegistrationInviteCode: boolean;
    RegistrationInviteCode: string;
    RegistrationRequireTurnstile: boolean;
    LoginRequireTurnstile: boolean;
    TurnstileSiteKey: string;
    TurnstileSecretKey: string;
    DefaultUserTags: string[];
    EnableOIDCLogin: boolean;
    EnableOIDCRegistration: boolean;
    OIDCIssuer: string;
    OIDCAuthorizationEndpoint: string;
    OIDCTokenEndpoint: string;
    OIDCUserInfoEndpoint: string;
    OIDCClientId: string;
    OIDCClientSecret: string;
    OIDCButtonText: string;
    OIDCMinTrustLevel: number;
  }>({
    EnableRegistration: false,
    RequireRegistrationInviteCode: false,
    RegistrationInviteCode: '',
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
    OIDCMinTrustLevel: 0,
  });

  useEffect(() => {
    if (config?.SiteConfig) {
      setRegistrationSettings({
        EnableRegistration: config.SiteConfig.EnableRegistration || false,
        RequireRegistrationInviteCode:
          config.SiteConfig.RequireRegistrationInviteCode || false,
        RegistrationInviteCode: config.SiteConfig.RegistrationInviteCode || '',
        RegistrationRequireTurnstile:
          config.SiteConfig.RegistrationRequireTurnstile || false,
        LoginRequireTurnstile: config.SiteConfig.LoginRequireTurnstile || false,
        TurnstileSiteKey: config.SiteConfig.TurnstileSiteKey || '',
        TurnstileSecretKey: config.SiteConfig.TurnstileSecretKey || '',
        DefaultUserTags: config.SiteConfig.DefaultUserTags || [],
        EnableOIDCLogin: config.SiteConfig.EnableOIDCLogin || false,
        EnableOIDCRegistration:
          config.SiteConfig.EnableOIDCRegistration || false,
        OIDCIssuer: config.SiteConfig.OIDCIssuer || '',
        OIDCAuthorizationEndpoint:
          config.SiteConfig.OIDCAuthorizationEndpoint || '',
        OIDCTokenEndpoint: config.SiteConfig.OIDCTokenEndpoint || '',
        OIDCUserInfoEndpoint: config.SiteConfig.OIDCUserInfoEndpoint || '',
        OIDCClientId: config.SiteConfig.OIDCClientId || '',
        OIDCClientSecret: config.SiteConfig.OIDCClientSecret || '',
        OIDCButtonText: config.SiteConfig.OIDCButtonText || '',
        OIDCMinTrustLevel: config.SiteConfig.OIDCMinTrustLevel ?? 0,
      });
    }
  }, [config]);

  // 处理注册开关变化
  const handleRegistrationToggle = (checked: boolean) => {
    if (checked) {
      setShowEnableRegistrationModal(true);
    } else {
      setRegistrationSettings((prev) => ({
        ...prev,
        EnableRegistration: false,
      }));
    }
  };

  // 确认开启注册
  const handleConfirmEnableRegistration = () => {
    setRegistrationSettings((prev) => ({
      ...prev,
      EnableRegistration: true,
    }));
    setShowEnableRegistrationModal(false);
  };

  // 保存注册配置
  const handleSave = async () => {
    await withLoading('saveRegistrationConfig', async () => {
      try {
        if (!config) {
          throw new Error('配置未加载');
        }

        if (
          registrationSettings.RequireRegistrationInviteCode &&
          !registrationSettings.RegistrationInviteCode.trim()
        ) {
          throw new Error('已开启注册邀请码时，邀请码不能为空');
        }

        // 合并站点配置和注册配置
        const updatedSiteConfig = {
          ...config.SiteConfig,
          ...registrationSettings,
          RegistrationInviteCode:
            registrationSettings.RegistrationInviteCode.trim(),
        };

        const resp = await fetch('/api/admin/site', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedSiteConfig),
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
    return <div className='text-center text-muted-foreground '>加载中...</div>;
  }

  return (
    <div className='space-y-6'>
      {/* 注册相关配置 */}
      <div className='space-y-4'>
        <h3 className='text-sm font-semibold text-foreground '>注册配置</h3>

        <details open className='pt-4 border-t border-border '>
          <summary className='text-sm font-semibold text-foreground  cursor-pointer'>
            基础注册设置
          </summary>
          <div className='mt-4 space-y-4'>
            <div>
              <div className='flex items-center justify-between'>
                <label className='block text-sm font-medium text-foreground  mb-2'>
                  开启注册
                </label>
                <button
                  type='button'
                  onClick={() =>
                    handleRegistrationToggle(
                      !registrationSettings.EnableRegistration
                    )
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                    registrationSettings.EnableRegistration
                      ? adminButtonStyles.toggleOn
                      : adminButtonStyles.toggleOff
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full ${
                      adminButtonStyles.toggleThumb
                    } transition-transform ${
                      registrationSettings.EnableRegistration
                        ? adminButtonStyles.toggleThumbOn
                        : adminButtonStyles.toggleThumbOff
                    }`}
                  />
                </button>
              </div>
              <p className='mt-1 text-xs text-muted-foreground '>
                开启后登录页面将显示注册按钮，允许用户自行注册账号。
              </p>
            </div>

            <div>
              <label className='block text-sm font-medium text-foreground  mb-2'>
                默认用户组
              </label>
              <select
                value={
                  registrationSettings.DefaultUserTags &&
                  registrationSettings.DefaultUserTags.length > 0
                    ? registrationSettings.DefaultUserTags[0]
                    : ''
                }
                onChange={(e) => {
                  const value = e.target.value;
                  setRegistrationSettings((prev) => ({
                    ...prev,
                    DefaultUserTags: value ? [value] : [],
                  }));
                }}
                className='w-full px-3 py-2 border border-border  rounded-lg bg-card  text-foreground  focus:ring-2 focus:ring-ring focus:border-transparent'
              >
                <option value=''>无用户组（无限制）</option>
                {config?.UserConfig?.Tags &&
                  config.UserConfig.Tags.map((tag) => (
                    <option key={tag.name} value={tag.name}>
                      {tag.name}
                      {tag.enabledApis && tag.enabledApis.length > 0
                        ? ` (${tag.enabledApis.length} 个源)`
                        : ''}
                    </option>
                  ))}
              </select>
              <p className='mt-1 text-xs text-muted-foreground '>
                新注册的用户将自动分配到选中的用户组，选择"无用户组"为无限制
              </p>
            </div>
          </div>
        </details>

        <details className='pt-4 border-t border-border '>
          <summary className='text-sm font-semibold text-foreground  cursor-pointer'>
            安全设置
          </summary>
          <div className='mt-4 space-y-4'>
            <div>
              <div className='flex items-center justify-between'>
                <label className='block text-sm font-medium text-foreground  mb-2'>
                  要求注册邀请码
                </label>
                <button
                  type='button'
                  onClick={() =>
                    setRegistrationSettings((prev) => ({
                      ...prev,
                      RequireRegistrationInviteCode:
                        !prev.RequireRegistrationInviteCode,
                    }))
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                    registrationSettings.RequireRegistrationInviteCode
                      ? adminButtonStyles.toggleOn
                      : adminButtonStyles.toggleOff
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full ${
                      adminButtonStyles.toggleThumb
                    } transition-transform ${
                      registrationSettings.RequireRegistrationInviteCode
                        ? adminButtonStyles.toggleThumbOn
                        : adminButtonStyles.toggleThumbOff
                    }`}
                  />
                </button>
              </div>
              <p className='mt-1 text-xs text-muted-foreground '>
                开启后，普通注册必须填写管理员设置的统一邀请码。
              </p>
            </div>

            <div>
              <label className='block text-sm font-medium text-foreground  mb-2'>
                通用注册邀请码
              </label>
              <input
                type='text'
                placeholder='请输入通用注册邀请码'
                value={registrationSettings.RegistrationInviteCode || ''}
                onChange={(e) =>
                  setRegistrationSettings((prev) => ({
                    ...prev,
                    RegistrationInviteCode: e.target.value,
                  }))
                }
                className='w-full px-3 py-2 border border-border  rounded-lg bg-card  text-foreground  focus:ring-2 focus:ring-ring focus:border-transparent'
              />
              <p className='mt-1 text-xs text-muted-foreground '>
                仅普通注册生效；开启邀请码注册时不能为空。
              </p>
            </div>

            <div>
              <div className='flex items-center justify-between'>
                <label className='block text-sm font-medium text-foreground  mb-2'>
                  注册启用Cloudflare Turnstile
                </label>
                <button
                  type='button'
                  disabled={
                    !registrationSettings.TurnstileSiteKey ||
                    !registrationSettings.TurnstileSecretKey
                  }
                  onClick={() =>
                    setRegistrationSettings((prev) => ({
                      ...prev,
                      RegistrationRequireTurnstile:
                        !prev.RegistrationRequireTurnstile,
                    }))
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                    !registrationSettings.TurnstileSiteKey ||
                    !registrationSettings.TurnstileSecretKey
                      ? 'opacity-50 cursor-not-allowed bg-muted '
                      : registrationSettings.RegistrationRequireTurnstile
                      ? adminButtonStyles.toggleOn
                      : adminButtonStyles.toggleOff
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full ${
                      adminButtonStyles.toggleThumb
                    } transition-transform ${
                      registrationSettings.RegistrationRequireTurnstile
                        ? adminButtonStyles.toggleThumbOn
                        : adminButtonStyles.toggleThumbOff
                    }`}
                  />
                </button>
              </div>
              <p className='mt-1 text-xs text-muted-foreground '>
                开启后注册时需要通过Cloudflare Turnstile人机验证。
                {(!registrationSettings.TurnstileSiteKey ||
                  !registrationSettings.TurnstileSecretKey) && (
                  <span className='text-muted-foreground '>
                    {' '}
                    需要先配置Site Key和Secret Key才能启用。
                  </span>
                )}
              </p>
            </div>

            <div>
              <div className='flex items-center justify-between'>
                <label className='block text-sm font-medium text-foreground  mb-2'>
                  登录启用Cloudflare Turnstile
                </label>
                <button
                  type='button'
                  disabled={
                    !registrationSettings.TurnstileSiteKey ||
                    !registrationSettings.TurnstileSecretKey
                  }
                  onClick={() =>
                    setRegistrationSettings((prev) => ({
                      ...prev,
                      LoginRequireTurnstile: !prev.LoginRequireTurnstile,
                    }))
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                    !registrationSettings.TurnstileSiteKey ||
                    !registrationSettings.TurnstileSecretKey
                      ? 'opacity-50 cursor-not-allowed bg-muted '
                      : registrationSettings.LoginRequireTurnstile
                      ? adminButtonStyles.toggleOn
                      : adminButtonStyles.toggleOff
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full ${
                      adminButtonStyles.toggleThumb
                    } transition-transform ${
                      registrationSettings.LoginRequireTurnstile
                        ? adminButtonStyles.toggleThumbOn
                        : adminButtonStyles.toggleThumbOff
                    }`}
                  />
                </button>
              </div>
              <p className='mt-1 text-xs text-muted-foreground '>
                开启后登录时需要通过Cloudflare Turnstile人机验证。
                {(!registrationSettings.TurnstileSiteKey ||
                  !registrationSettings.TurnstileSecretKey) && (
                  <span className='text-muted-foreground '>
                    {' '}
                    需要先配置Site Key和Secret Key才能启用。
                  </span>
                )}
              </p>
            </div>

            <div>
              <label className='block text-sm font-medium text-foreground  mb-2'>
                Cloudflare Turnstile Site Key
              </label>
              <input
                type='text'
                placeholder='请输入Cloudflare Turnstile Site Key'
                value={registrationSettings.TurnstileSiteKey || ''}
                onChange={(e) =>
                  setRegistrationSettings((prev) => ({
                    ...prev,
                    TurnstileSiteKey: e.target.value,
                  }))
                }
                className='w-full px-3 py-2 border border-border  rounded-lg bg-card  text-foreground  focus:ring-2 focus:ring-ring focus:border-transparent'
              />
              <p className='mt-1 text-xs text-muted-foreground '>
                在Cloudflare Dashboard中获取的Site Key（公钥）
              </p>
            </div>

            <div>
              <label className='block text-sm font-medium text-foreground  mb-2'>
                Cloudflare Turnstile Secret Key
              </label>
              <input
                type='password'
                placeholder='请输入Cloudflare Turnstile Secret Key'
                value={registrationSettings.TurnstileSecretKey || ''}
                onChange={(e) =>
                  setRegistrationSettings((prev) => ({
                    ...prev,
                    TurnstileSecretKey: e.target.value,
                  }))
                }
                className='w-full px-3 py-2 border border-border  rounded-lg bg-card  text-foreground  focus:ring-2 focus:ring-ring focus:border-transparent'
              />
              <p className='mt-1 text-xs text-muted-foreground '>
                在Cloudflare Dashboard中获取的Secret Key（私钥），用于服务端验证
              </p>
            </div>
          </div>
        </details>
      </div>

      {/* OIDC配置 */}
      <details className='pt-4 border-t border-border '>
        <summary className='text-sm font-semibold text-foreground  cursor-pointer'>
          OIDC配置
        </summary>
        <div className='mt-4 space-y-4'>
          {/* 启用OIDC登录 */}
          <div>
            <div className='flex items-center justify-between'>
              <label className='block text-sm font-medium text-foreground  mb-2'>
                启用OIDC登录
              </label>
              <button
                type='button'
                onClick={() =>
                  setRegistrationSettings((prev) => ({
                    ...prev,
                    EnableOIDCLogin: !prev.EnableOIDCLogin,
                  }))
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                  registrationSettings.EnableOIDCLogin
                    ? adminButtonStyles.toggleOn
                    : adminButtonStyles.toggleOff
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full ${
                    adminButtonStyles.toggleThumb
                  } transition-transform ${
                    registrationSettings.EnableOIDCLogin
                      ? adminButtonStyles.toggleThumbOn
                      : adminButtonStyles.toggleThumbOff
                  }`}
                />
              </button>
            </div>
            <p className='mt-1 text-xs text-muted-foreground '>
              开启后登录页面将显示OIDC登录按钮
            </p>
          </div>

          {/* 启用OIDC注册 */}
          <div>
            <div className='flex items-center justify-between'>
              <label className='block text-sm font-medium text-foreground  mb-2'>
                启用OIDC注册
              </label>
              <button
                type='button'
                onClick={() =>
                  setRegistrationSettings((prev) => ({
                    ...prev,
                    EnableOIDCRegistration: !prev.EnableOIDCRegistration,
                  }))
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                  registrationSettings.EnableOIDCRegistration
                    ? adminButtonStyles.toggleOn
                    : adminButtonStyles.toggleOff
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full ${
                    adminButtonStyles.toggleThumb
                  } transition-transform ${
                    registrationSettings.EnableOIDCRegistration
                      ? adminButtonStyles.toggleThumbOn
                      : adminButtonStyles.toggleThumbOff
                  }`}
                />
              </button>
            </div>
            <p className='mt-1 text-xs text-muted-foreground '>
              开启后允许通过OIDC方式注册新用户（需要先启用OIDC登录）
            </p>
          </div>

          {/* OIDC Issuer */}
          <div>
            <label className='block text-sm font-medium text-foreground  mb-2'>
              OIDC Issuer URL（可选）
            </label>
            <div className='flex flex-col sm:flex-row gap-2'>
              <input
                type='text'
                placeholder='https://your-oidc-provider.com/realms/your-realm'
                value={registrationSettings.OIDCIssuer || ''}
                onChange={(e) =>
                  setRegistrationSettings((prev) => ({
                    ...prev,
                    OIDCIssuer: e.target.value,
                  }))
                }
                className='flex-1 px-3 py-2 border border-border  rounded-lg bg-card  text-foreground  focus:ring-2 focus:ring-ring focus:border-transparent'
              />
              <button
                type='button'
                onClick={async () => {
                  if (!registrationSettings.OIDCIssuer) {
                    showError('请先输入Issuer URL');
                    return;
                  }

                  await withLoading('oidcDiscover', async () => {
                    try {
                      const res = await fetch('/api/admin/oidc-discover', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          issuerUrl: registrationSettings.OIDCIssuer,
                        }),
                      });

                      if (!res.ok) {
                        const data = await res.json().catch(() => ({}));
                        throw new Error(data.error || '获取配置失败');
                      }

                      const data = await res.json();
                      setRegistrationSettings((prev) => ({
                        ...prev,
                        OIDCAuthorizationEndpoint:
                          data.authorization_endpoint || '',
                        OIDCTokenEndpoint: data.token_endpoint || '',
                        OIDCUserInfoEndpoint: data.userinfo_endpoint || '',
                      }));
                      showSuccess('自动发现成功');
                    } catch (error) {
                      const errorMessage =
                        error instanceof Error
                          ? error.message
                          : '自动发现失败，请手动配置端点';
                      showError(errorMessage);
                      throw error;
                    }
                  });
                }}
                disabled={isLoading('oidcDiscover')}
                className={`px-4 py-2 ${
                  isLoading('oidcDiscover')
                    ? adminButtonStyles.disabled
                    : adminButtonStyles.primary
                } rounded-lg whitespace-nowrap sm:w-auto w-full`}
              >
                {isLoading('oidcDiscover') ? '发现中...' : '自动发现'}
              </button>
            </div>
            <p className='mt-1 text-xs text-muted-foreground '>
              OIDC提供商的Issuer URL，填写后可点击"自动发现"按钮自动获取端点配置
            </p>
          </div>

          {/* Authorization Endpoint */}
          <div>
            <label className='block text-sm font-medium text-foreground  mb-2'>
              Authorization Endpoint（授权端点）
            </label>
            <input
              type='text'
              placeholder='https://your-oidc-provider.com/realms/your-realm/protocol/openid-connect/auth'
              value={registrationSettings.OIDCAuthorizationEndpoint || ''}
              onChange={(e) =>
                setRegistrationSettings((prev) => ({
                  ...prev,
                  OIDCAuthorizationEndpoint: e.target.value,
                }))
              }
              className='w-full px-3 py-2 border border-border  rounded-lg bg-card  text-foreground  focus:ring-2 focus:ring-ring focus:border-transparent'
            />
            <p className='mt-1 text-xs text-muted-foreground '>
              用户授权的端点URL
            </p>
          </div>

          {/* Token Endpoint */}
          <div>
            <label className='block text-sm font-medium text-foreground  mb-2'>
              Token Endpoint（Token端点）
            </label>
            <input
              type='text'
              placeholder='https://your-oidc-provider.com/realms/your-realm/protocol/openid-connect/token'
              value={registrationSettings.OIDCTokenEndpoint || ''}
              onChange={(e) =>
                setRegistrationSettings((prev) => ({
                  ...prev,
                  OIDCTokenEndpoint: e.target.value,
                }))
              }
              className='w-full px-3 py-2 border border-border  rounded-lg bg-card  text-foreground  focus:ring-2 focus:ring-ring focus:border-transparent'
            />
            <p className='mt-1 text-xs text-muted-foreground '>
              交换授权码获取token的端点URL
            </p>
          </div>

          {/* UserInfo Endpoint */}
          <div>
            <label className='block text-sm font-medium text-foreground  mb-2'>
              UserInfo Endpoint（用户信息端点）
            </label>
            <input
              type='text'
              placeholder='https://your-oidc-provider.com/realms/your-realm/protocol/openid-connect/userinfo'
              value={registrationSettings.OIDCUserInfoEndpoint || ''}
              onChange={(e) =>
                setRegistrationSettings((prev) => ({
                  ...prev,
                  OIDCUserInfoEndpoint: e.target.value,
                }))
              }
              className='w-full px-3 py-2 border border-border  rounded-lg bg-card  text-foreground  focus:ring-2 focus:ring-ring focus:border-transparent'
            />
            <p className='mt-1 text-xs text-muted-foreground '>
              获取用户信息的端点URL
            </p>
          </div>

          {/* OIDC Client ID */}
          <div>
            <label className='block text-sm font-medium text-foreground  mb-2'>
              OIDC Client ID
            </label>
            <input
              type='text'
              placeholder='请输入Client ID'
              value={registrationSettings.OIDCClientId || ''}
              onChange={(e) =>
                setRegistrationSettings((prev) => ({
                  ...prev,
                  OIDCClientId: e.target.value,
                }))
              }
              className='w-full px-3 py-2 border border-border  rounded-lg bg-card  text-foreground  focus:ring-2 focus:ring-ring focus:border-transparent'
            />
            <p className='mt-1 text-xs text-muted-foreground '>
              在OIDC提供商处注册应用后获得的Client ID
            </p>
          </div>

          {/* OIDC Client Secret */}
          <div>
            <label className='block text-sm font-medium text-foreground  mb-2'>
              OIDC Client Secret
            </label>
            <input
              type='password'
              placeholder='请输入Client Secret'
              value={registrationSettings.OIDCClientSecret || ''}
              onChange={(e) =>
                setRegistrationSettings((prev) => ({
                  ...prev,
                  OIDCClientSecret: e.target.value,
                }))
              }
              className='w-full px-3 py-2 border border-border  rounded-lg bg-card  text-foreground  focus:ring-2 focus:ring-ring focus:border-transparent'
            />
            <p className='mt-1 text-xs text-muted-foreground '>
              在OIDC提供商处注册应用后获得的Client Secret
            </p>
          </div>

          {/* OIDC Redirect URI - 只读显示 */}
          <div>
            <label className='block text-sm font-medium text-foreground  mb-2'>
              OIDC Redirect URI（回调地址）
            </label>
            <div className='relative'>
              <input
                type='text'
                readOnly
                value={
                  typeof window !== 'undefined'
                    ? `${
                        (window as any).RUNTIME_CONFIG?.SITE_BASE ||
                        window.location.origin
                      }/api/auth/oidc/callback`
                    : ''
                }
                className='w-full px-3 py-2 border border-border  rounded-lg bg-muted/50  text-foreground  cursor-default'
              />
              <button
                type='button'
                onClick={() => {
                  const uri = `${
                    (window as any).RUNTIME_CONFIG?.SITE_BASE ||
                    window.location.origin
                  }/api/auth/oidc/callback`;
                  navigator.clipboard.writeText(uri);
                  showSuccess('已复制到剪贴板');
                }}
                className='absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary transition-colors'
              >
                复制
              </button>
            </div>
            <p className='mt-1 text-xs text-muted-foreground '>
              这是系统自动生成的回调地址，基于环境变量SITE_BASE。请在OIDC提供商（如Keycloak、Auth0等）的应用配置中添加此地址作为允许的重定向URI
            </p>
          </div>

          {/* OIDC登录按钮文字 */}
          <div>
            <label className='block text-sm font-medium text-foreground  mb-2'>
              OIDC登录按钮文字
            </label>
            <input
              type='text'
              placeholder='使用OIDC登录'
              value={registrationSettings.OIDCButtonText || ''}
              onChange={(e) =>
                setRegistrationSettings((prev) => ({
                  ...prev,
                  OIDCButtonText: e.target.value,
                }))
              }
              className='w-full px-3 py-2 border border-border  rounded-lg bg-card  text-foreground  focus:ring-2 focus:ring-ring focus:border-transparent'
            />
            <p className='mt-1 text-xs text-muted-foreground '>
              自定义OIDC登录按钮显示的文字,如"使用企业账号登录"、"使用SSO登录"等。留空则显示默认文字"使用OIDC登录"
            </p>
          </div>

          {/* OIDC最低信任等级 */}
          <div>
            <label className='block text-sm font-medium text-foreground  mb-2'>
              最低信任等级
            </label>
            <input
              type='number'
              min='0'
              max='4'
              placeholder='0'
              value={
                registrationSettings.OIDCMinTrustLevel === 0
                  ? ''
                  : registrationSettings.OIDCMinTrustLevel
              }
              onChange={(e) =>
                setRegistrationSettings((prev) => ({
                  ...prev,
                  OIDCMinTrustLevel:
                    e.target.value === '' ? 0 : parseInt(e.target.value),
                }))
              }
              className='w-full px-3 py-2 border border-border  rounded-lg bg-card  text-foreground  focus:ring-2 focus:ring-ring focus:border-transparent'
            />
            <p className='mt-1 text-xs text-muted-foreground '>
              仅LinuxDo网站有效。设置为0时不判断，1-4表示最低信任等级要求
            </p>
          </div>
        </div>
      </details>

      {/* 操作按钮 */}
      <div className='flex justify-end'>
        <button
          onClick={handleSave}
          disabled={isLoading('saveRegistrationConfig')}
          className={`px-4 py-2 ${
            isLoading('saveRegistrationConfig')
              ? adminButtonStyles.disabled
              : adminButtonStyles.success
          } rounded-lg transition-colors`}
        >
          {isLoading('saveRegistrationConfig') ? '保存中…' : '保存'}
        </button>
      </div>

      {/* 通用弹窗组件 */}
      {alertElement}

      {/* 开启注册确认弹窗 */}
      {showEnableRegistrationModal &&
        createPortal(
          <div
            className='fixed inset-0 bg-black bg-opacity-50 z-modal flex items-center justify-center p-4'
            onClick={() => setShowEnableRegistrationModal(false)}
          >
            <div
              className='bg-card  rounded-lg shadow-xl max-w-md w-full'
              onClick={(e) => e.stopPropagation()}
            >
              <div className='p-6'>
                <div className='flex items-center justify-between mb-6'>
                  <h3 className='text-xl font-semibold text-foreground '>
                    开启注册功能
                  </h3>
                  <button
                    onClick={() => setShowEnableRegistrationModal(false)}
                    className='text-muted-foreground hover:text-foreground  transition-colors'
                  >
                    <X className='h-6 w-6' />
                  </button>
                </div>

                <div className='mb-6'>
                  <div className='bg-muted/50  border border-border  rounded-lg p-4'>
                    <div className='flex items-center space-x-2 mb-2'>
                      <AlertTriangle className='w-5 h-5 text-muted-foreground ' />
                      <span className='text-sm font-medium text-muted-foreground '>
                        安全提示
                      </span>
                    </div>
                    <p className='text-sm text-muted-foreground '>
                      为了您的安全和避免潜在的法律风险,如果您的网站部署在公网不建议开启。
                    </p>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className='flex justify-end space-x-3'>
                  <button
                    onClick={() => setShowEnableRegistrationModal(false)}
                    className={`px-6 py-2.5 text-sm font-medium ${adminButtonStyles.secondary}`}
                  >
                    取消
                  </button>
                  <button
                    onClick={handleConfirmEnableRegistration}
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
