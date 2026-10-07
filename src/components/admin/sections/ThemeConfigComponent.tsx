'use client';

import { Check, Palette, Plus, Video, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { AdminConfig } from '@/lib/admin.types';

import { adminButtonStyles, useAdminAlert, useLoadingState } from '@/components/admin/shared';

export const ThemeConfigComponent = ({
  config,
  refreshConfig,
}: {
  config: AdminConfig | null;
  refreshConfig: () => Promise<void>;
}) => {
  const { showAlert, alertElement } = useAdminAlert();
  const { isLoading, withLoading } = useLoadingState();
  const [themeSettings, setThemeSettings] = useState({
    enableBuiltInTheme: false,
    builtInTheme: 'default',
    customCSS: '',
    enableCache: true,
    cacheMinutes: 1440, // 默认1天（1440分钟）
    progressThumbType: 'default' as 'default' | 'preset' | 'custom',
    progressThumbPresetId: '',
    progressThumbCustomUrl: '',
    loadingStyle: 'talisman' as 'classic' | 'grid' | 'talisman',
    rateBadgeStyle: 'flag' as 'default' | 'flag' | 'medal',
  });
  const [loginBackgroundImages, setLoginBackgroundImages] = useState<string[]>([
    '',
  ]);
  const [registerBackgroundImages, setRegisterBackgroundImages] = useState<
    string[]
  >(['']);
  const [homeBackgroundImages, setHomeBackgroundImages] = useState<string[]>([
    '',
  ]);

  useEffect(() => {
    if (config?.ThemeConfig) {
      setThemeSettings({
        enableBuiltInTheme: config.ThemeConfig.enableBuiltInTheme || false,
        builtInTheme: config.ThemeConfig.builtInTheme || 'default',
        customCSS: config.ThemeConfig.customCSS || '',
        enableCache: config.ThemeConfig.enableCache !== false,
        cacheMinutes: config.ThemeConfig.cacheMinutes || 1440,
        progressThumbType: config.ThemeConfig.progressThumbType || 'default',
        progressThumbPresetId: config.ThemeConfig.progressThumbPresetId || '',
        progressThumbCustomUrl: config.ThemeConfig.progressThumbCustomUrl || '',
        loadingStyle: config.ThemeConfig.loadingStyle || 'talisman',
        rateBadgeStyle: config.ThemeConfig.rateBadgeStyle || 'flag',
      });

      // 解析背景图配置
      if (config.ThemeConfig.loginBackgroundImage) {
        const urls = config.ThemeConfig.loginBackgroundImage
          .split('\n')
          .map((url) => url.trim())
          .filter((url) => url !== '');
        setLoginBackgroundImages(urls.length > 0 ? urls : ['']);
      } else {
        setLoginBackgroundImages(['']);
      }

      if (config.ThemeConfig.registerBackgroundImage) {
        const urls = config.ThemeConfig.registerBackgroundImage
          .split('\n')
          .map((url) => url.trim())
          .filter((url) => url !== '');
        setRegisterBackgroundImages(urls.length > 0 ? urls : ['']);
      } else {
        setRegisterBackgroundImages(['']);
      }

      if (config.ThemeConfig.homeBackgroundImage) {
        const urls = config.ThemeConfig.homeBackgroundImage
          .split('\n')
          .map((url) => url.trim())
          .filter((url) => url !== '');
        setHomeBackgroundImages(urls.length > 0 ? urls : ['']);
      } else {
        setHomeBackgroundImages(['']);
      }
    }
  }, [config]);

  const handleSave = async () => {
    await withLoading('saveThemeConfig', async () => {
      try {
        // 验证登录背景图URL格式
        const validLoginUrls = loginBackgroundImages
          .map((url) => url.trim())
          .filter((url) => url !== '');

        for (const url of validLoginUrls) {
          if (!url.startsWith('http://') && !url.startsWith('https://')) {
            showAlert({
              type: 'error',
              title: '格式错误',
              message: `登录界面背景图URL格式错误：${url}\n每个URL必须以http://或https://开头`,
              showConfirm: true,
            });
            return;
          }
        }

        // 验证注册背景图URL格式
        const validRegisterUrls = registerBackgroundImages
          .map((url) => url.trim())
          .filter((url) => url !== '');

        for (const url of validRegisterUrls) {
          if (!url.startsWith('http://') && !url.startsWith('https://')) {
            showAlert({
              type: 'error',
              title: '格式错误',
              message: `注册界面背景图URL格式错误：${url}\n每个URL必须以http://或https://开头`,
              showConfirm: true,
            });
            return;
          }
        }

        const validHomeUrls = homeBackgroundImages
          .map((url) => url.trim())
          .filter((url) => url !== '');

        for (const url of validHomeUrls) {
          if (!url.startsWith('http://') && !url.startsWith('https://')) {
            showAlert({
              type: 'error',
              title: '格式错误',
              message: `首页背景图URL格式错误：${url}\n每个URL必须以http://或https://开头`,
              showConfirm: true,
            });
            return;
          }
        }

        const response = await fetch('/api/admin/theme', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...themeSettings,
            loginBackgroundImage: validLoginUrls.join('\n'),
            registerBackgroundImage: validRegisterUrls.join('\n'),
            homeBackgroundImage: validHomeUrls.join('\n'),
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || '保存失败');
        }

        showAlert({
          type: 'success',
          title: '保存成功',
          message: '个性化配置已更新',
          timer: 2000,
        });

        await refreshConfig();

        // 刷新页面以应用新主题
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (error) {
        showAlert({
          type: 'error',
          title: '保存失败',
          message: (error as Error).message,
        });
      }
    });
  };

  const builtInThemes = [
    {
      value: 'default',
      label: '默认主题',
      color: '#3b82f6',
    },
    {
      value: 'dark_blue',
      label: '深蓝夜空',
      color: '#3b82f6',
    },
    {
      value: 'purple_dream',
      label: '紫色梦境',
      color: '#a78bfa',
    },
    {
      value: 'green_forest',
      label: '翠绿森林',
      color: '#10b981',
    },
    {
      value: 'orange_sunset',
      label: '橙色日落',
      color: '#f97316',
    },
    {
      value: 'pink_candy',
      label: '粉色糖果',
      color: '#ec4899',
    },
    {
      value: 'cyan_ocean',
      label: '青色海洋',
      color: '#06b6d4',
    },
  ];

  return (
    <div className='space-y-6'>
      {/* 主题类型选择 */}
      <div className='bg-card rounded-lg p-6 border border-border'>
        <h3 className='text-lg font-semibold text-foreground mb-4'>
          主题类型
        </h3>
        <div className='space-y-4'>
          <label className='flex items-center space-x-3 cursor-pointer'>
            <input
              type='radio'
              checked={!themeSettings.enableBuiltInTheme}
              onChange={() =>
                setThemeSettings((prev) => ({
                  ...prev,
                  enableBuiltInTheme: false,
                }))
              }
              className='w-4 h-4 text-primary'
            />
            <span className='text-foreground '>
              自定义CSS（使用下方的CSS编辑器）
            </span>
          </label>
          <label className='flex items-center space-x-3 cursor-pointer'>
            <input
              type='radio'
              checked={themeSettings.enableBuiltInTheme}
              onChange={() =>
                setThemeSettings((prev) => ({
                  ...prev,
                  enableBuiltInTheme: true,
                }))
              }
              className='w-4 h-4 text-primary'
            />
            <span className='text-foreground '>
              内置主题（使用预设的主题样式）
            </span>
          </label>
        </div>
      </div>

      {/* 内置主题选择 */}
      {themeSettings.enableBuiltInTheme && (
        <div className='bg-card rounded-lg p-6 border border-border'>
          <h3 className='text-lg font-semibold text-foreground mb-4'>
            选择内置主题
          </h3>
          <div className='flex flex-wrap gap-3'>
            {builtInThemes.map((theme) => (
              <div
                key={theme.value}
                onClick={() =>
                  setThemeSettings((prev) => ({
                    ...prev,
                    builtInTheme: theme.value,
                  }))
                }
                className={`cursor-pointer rounded-lg border-2 p-3 transition-all hover:shadow-md ${
                  themeSettings.builtInTheme === theme.value
                    ? 'border-border ring-2 ring-ring bg-muted'
                    : 'border-border hover:border-border'
                }`}
              >
                <div className='flex items-center gap-3'>
                  {/* 圆形颜色预览 */}
                  <div
                    className='w-10 h-10 rounded-full flex-shrink-0 shadow-sm'
                    style={{ backgroundColor: theme.color }}
                  />
                  {/* 主题名称 */}
                  <div className='flex items-center gap-2'>
                    <span className='text-sm font-medium text-foreground whitespace-nowrap'>
                      {theme.label}
                    </span>
                    {themeSettings.builtInTheme === theme.value && (
                      <div className='w-4 h-4 rounded-full bg-primary flex items-center justify-center flex-shrink-0'>
                        <Check className='w-2.5 h-2.5 text-primary-foreground' />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className='mt-4 text-sm text-foreground '>
            注意：启用内置主题时，自定义CSS将被禁用
          </p>
        </div>
      )}

      {/* 自定义CSS编辑器 */}
      {!themeSettings.enableBuiltInTheme && (
        <div className='bg-card rounded-lg p-6 border border-border'>
          <h3 className='text-lg font-semibold text-foreground mb-4'>
            自定义CSS
          </h3>
          <textarea
            value={themeSettings.customCSS}
            onChange={(e) =>
              setThemeSettings((prev) => ({
                ...prev,
                customCSS: e.target.value,
              }))
            }
            placeholder='在此输入自定义CSS代码...'
            className='w-full h-96 px-4 py-3 border border-border rounded-lg bg-card text-foreground font-mono text-sm focus:ring-2 focus:ring-ring focus:border-transparent'
          />
          <p className='mt-2 text-sm text-foreground '>
            提示：可以使用CSS变量、媒体查询等高级特性
          </p>
        </div>
      )}

      {/* 缓存设置 */}
      <div className='bg-card rounded-lg p-6 border border-border'>
        <h3 className='text-lg font-semibold text-foreground mb-4'>
          缓存设置
        </h3>
        <div className='space-y-4'>
          <label className='flex items-center space-x-3 cursor-pointer'>
            <input
              type='checkbox'
              checked={themeSettings.enableCache}
              onChange={(e) =>
                setThemeSettings((prev) => ({
                  ...prev,
                  enableCache: e.target.checked,
                }))
              }
              className='w-4 h-4 text-primary rounded'
            />
            <span className='text-foreground '>
              启用浏览器缓存（推荐）
            </span>
          </label>

          {themeSettings.enableCache && (
            <div>
              <label className='block text-sm font-medium text-foreground mb-2'>
                缓存时间（分钟）
              </label>
              <input
                type='number'
                min='1'
                max='43200'
                value={themeSettings.cacheMinutes}
                onChange={(e) =>
                  setThemeSettings((prev) => ({
                    ...prev,
                    cacheMinutes: parseInt(e.target.value) || 1440,
                  }))
                }
                className='w-full px-4 py-2 border border-border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-ring focus:border-transparent'
              />
              <p className='mt-2 text-sm text-foreground '>
                建议值：60分钟（1小时）、1440分钟（1天）、10080分钟（7天）
              </p>
            </div>
          )}
        </div>
        <p className='mt-4 text-sm text-foreground '>
          启用后，用户浏览器会缓存CSS文件指定时间，减少服务器负载。启用该项可能会导致主题更新延迟。
        </p>
      </div>

      {/* 背景图配置 */}
      <div className='bg-card rounded-lg p-6 border border-border'>
        <h3 className='text-lg font-semibold text-foreground mb-4'>
          背景图配置
        </h3>
        <div className='space-y-6'>
          {/* 登录界面背景图 */}
          <div>
            <label className='block text-sm font-medium text-foreground mb-2'>
              登录界面背景图
            </label>
            <div className='space-y-2'>
              {loginBackgroundImages.map((url, index) => (
                <div key={index} className='flex gap-2'>
                  <input
                    type='text'
                    value={url}
                    onChange={(e) => {
                      const newImages = [...loginBackgroundImages];
                      newImages[index] = e.target.value;
                      setLoginBackgroundImages(newImages);
                    }}
                    placeholder='请输入登录界面背景图URL (http:// 或 https://)'
                    className='flex-1 px-4 py-2 border border-border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-ring focus:border-transparent font-mono text-sm'
                  />
                  {loginBackgroundImages.length > 1 && (
                    <button
                      type='button'
                      onClick={() => {
                        setLoginBackgroundImages(
                          loginBackgroundImages.filter((_, i) => i !== index)
                        );
                      }}
                      className='px-3 py-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors'
                      title='删除'
                    >
                      <X className='w-5 h-5' />
                    </button>
                  )}
                </div>
              ))}
              <button
                type='button'
                onClick={() =>
                  setLoginBackgroundImages([...loginBackgroundImages, ''])
                }
                className='flex items-center gap-2 px-4 py-2 text-primary hover:bg-muted rounded-lg transition-colors'
              >
                <Plus className='w-5 h-5' />
                <span>添加URL</span>
              </button>
            </div>
          </div>

          {/* 注册界面背景图 */}
          <div>
            <label className='block text-sm font-medium text-foreground mb-2'>
              注册界面背景图
            </label>
            <div className='space-y-2'>
              {registerBackgroundImages.map((url, index) => (
                <div key={index} className='flex gap-2'>
                  <input
                    type='text'
                    value={url}
                    onChange={(e) => {
                      const newImages = [...registerBackgroundImages];
                      newImages[index] = e.target.value;
                      setRegisterBackgroundImages(newImages);
                    }}
                    placeholder='请输入注册界面背景图URL (http:// 或 https://)'
                    className='flex-1 px-4 py-2 border border-border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-ring focus:border-transparent font-mono text-sm'
                  />
                  {registerBackgroundImages.length > 1 && (
                    <button
                      type='button'
                      onClick={() => {
                        setRegisterBackgroundImages(
                          registerBackgroundImages.filter((_, i) => i !== index)
                        );
                      }}
                      className='px-3 py-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors'
                      title='删除'
                    >
                      <X className='w-5 h-5' />
                    </button>
                  )}
                </div>
              ))}
              <button
                type='button'
                onClick={() =>
                  setRegisterBackgroundImages([...registerBackgroundImages, ''])
                }
                className='flex items-center gap-2 px-4 py-2 text-primary hover:bg-muted rounded-lg transition-colors'
              >
                <Plus className='w-5 h-5' />
                <span>添加URL</span>
              </button>
            </div>
          </div>

          {/* 首页背景图 */}
          <div>
            <label className='block text-sm font-medium text-foreground mb-2'>
              首页背景图
            </label>
            <div className='space-y-2'>
              {homeBackgroundImages.map((url, index) => (
                <div key={index} className='flex gap-2'>
                  <input
                    type='text'
                    value={url}
                    onChange={(e) => {
                      const newImages = [...homeBackgroundImages];
                      newImages[index] = e.target.value;
                      setHomeBackgroundImages(newImages);
                    }}
                    placeholder='请输入首页背景图URL (http:// 或 https://)'
                    className='flex-1 px-4 py-2 border border-border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-ring focus:border-transparent font-mono text-sm'
                  />
                  {homeBackgroundImages.length > 1 && (
                    <button
                      type='button'
                      onClick={() => {
                        setHomeBackgroundImages(
                          homeBackgroundImages.filter((_, i) => i !== index)
                        );
                      }}
                      className='px-3 py-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors'
                      title='删除'
                    >
                      <X className='w-5 h-5' />
                    </button>
                  )}
                </div>
              ))}
              <button
                type='button'
                onClick={() =>
                  setHomeBackgroundImages([...homeBackgroundImages, ''])
                }
                className='flex items-center gap-2 px-4 py-2 text-primary hover:bg-muted rounded-lg transition-colors'
              >
                <Plus className='w-5 h-5' />
                <span>添加URL</span>
              </button>
            </div>
          </div>
        </div>
        <p className='mt-4 text-sm text-foreground '>
          配置登录、注册和首页的背景图链接，留空则使用默认样式。支持配置多张图片，将随机展示其中一张
        </p>
      </div>

      {/* 进度条图标配置 */}
      <div className='bg-card rounded-lg p-6 border border-border'>
        <h3 className='text-lg font-semibold text-foreground mb-4 flex items-center gap-2'>
          <Palette className='w-5 h-5' />
          进度条图标
        </h3>
        <p className='text-sm text-foreground mb-4'>
          自定义视频播放器进度条的滑块图标，让播放器更具个性
        </p>

        {/* 图标类型选择 */}
        <div className='space-y-4 mb-6'>
          <label className='flex items-center space-x-3 cursor-pointer'>
            <input
              type='radio'
              checked={themeSettings.progressThumbType === 'default'}
              onChange={() =>
                setThemeSettings((prev) => ({
                  ...prev,
                  progressThumbType: 'default',
                }))
              }
              className='w-4 h-4 text-primary'
            />
            <span className='text-foreground '>默认圆点</span>
          </label>
          <label className='flex items-center space-x-3 cursor-pointer'>
            <input
              type='radio'
              checked={themeSettings.progressThumbType === 'preset'}
              onChange={() =>
                setThemeSettings((prev) => ({
                  ...prev,
                  progressThumbType: 'preset',
                }))
              }
              className='w-4 h-4 text-primary'
            />
            <span className='text-foreground '>内置图标</span>
          </label>
          <label className='flex items-center space-x-3 cursor-pointer'>
            <input
              type='radio'
              checked={themeSettings.progressThumbType === 'custom'}
              onChange={() =>
                setThemeSettings((prev) => ({
                  ...prev,
                  progressThumbType: 'custom',
                }))
              }
              className='w-4 h-4 text-primary'
            />
            <span className='text-foreground '>自定义图标</span>
          </label>
        </div>

        {/* 预制图标选择 */}
        {themeSettings.progressThumbType === 'preset' && (
          <div className='space-y-3 mb-4'>
            <label className='block text-sm font-medium text-foreground '>
              选择内置图标
            </label>
            <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
              {[
                {
                  id: 'renako',
                  name: '玲奈子',
                  url: '/icons/q/renako.png',
                  color: '#ec4899',
                },
                {
                  id: 'irena',
                  name: '伊蕾娜',
                  url: '/icons/q/irena.png',
                  color: '#f8fafc',
                },
                {
                  id: 'emilia',
                  name: '爱蜜莉雅',
                  url: '/icons/q/emilia.png',
                  color: '#f8fafc',
                },
              ].map((thumb) => (
                <button
                  key={thumb.id}
                  type='button'
                  onClick={() =>
                    setThemeSettings((prev) => ({
                      ...prev,
                      progressThumbPresetId: thumb.id,
                    }))
                  }
                  className={`relative p-4 border-2 rounded-lg transition-all ${
                    themeSettings.progressThumbPresetId === thumb.id
                      ? 'border-border bg-muted '
                      : 'border-border hover:border-border'
                  }`}
                >
                  <div className='flex flex-col items-center gap-2'>
                    <img
                      src={thumb.url}
                      alt={thumb.name}
                      className='w-12 h-12 object-contain'
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48"%3E%3Crect width="48" height="48" fill="%23ddd"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3E?%3C/text%3E%3C/svg%3E';
                      }}
                    />
                    <span className='text-sm font-medium text-foreground text-center'>
                      {thumb.name}
                    </span>
                    <div
                      className='w-8 h-2 rounded-full'
                      style={{ backgroundColor: thumb.color }}
                      title='进度条颜色'
                    />
                  </div>
                  {themeSettings.progressThumbPresetId === thumb.id && (
                    <div className='absolute top-2 right-2'>
                      <Check className='w-5 h-5 text-primary ' />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 自定义图标URL输入 */}
        {themeSettings.progressThumbType === 'custom' && (
          <div className='space-y-3'>
            <label className='block text-sm font-medium text-foreground '>
              自定义图标URL
            </label>
            <input
              type='text'
              className='w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-border transition-all duration-200 bg-card text-foreground placeholder:text-muted-foreground'
              placeholder='例如: https://example.com/icon.png'
              value={themeSettings.progressThumbCustomUrl}
              onChange={(e) =>
                setThemeSettings((prev) => ({
                  ...prev,
                  progressThumbCustomUrl: e.target.value,
                }))
              }
            />
            <p className='text-xs text-muted-foreground '>
              支持 PNG、JPG、GIF、WebP 格式，建议尺寸
              32x32px，图片URL必须可公开访问
            </p>
            {themeSettings.progressThumbCustomUrl && (
              <div className='mt-2 p-3 bg-muted/50 rounded-lg'>
                <p className='text-xs text-foreground mb-2'>
                  预览：
                </p>
                <img
                  src={themeSettings.progressThumbCustomUrl}
                  alt='自定义图标预览'
                  className='w-12 h-12 object-contain border border-border rounded'
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    const parent = (e.target as HTMLImageElement).parentElement;
                    if (parent && !parent.querySelector('.error-msg')) {
                      const errorMsg = document.createElement('p');
                      errorMsg.className = 'text-xs text-destructive error-msg';
                      errorMsg.textContent = '图片加载失败，请检查URL是否正确';
                      parent.appendChild(errorMsg);
                    }
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* 初始化加载样式配置 */}
      <div className='bg-card rounded-lg p-6 border border-border'>
        <h3 className='text-lg font-semibold text-foreground mb-4 flex items-center gap-2'>
          <Video className='w-5 h-5' />
          初始化加载样式
        </h3>
        <p className='text-sm text-foreground mb-4'>
          播放页、直播页首屏加载动画的款式。颜色跟随站点主题色，保存后刷新页面生效
        </p>

        <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
          {(
            [
              {
                id: 'talisman',
                name: '魔法阵',
                desc: '默认',
                preview: (
                  <svg
                    viewBox='0 0 100 100'
                    className='w-12 h-12 text-muted-foreground'
                    fill='none'
                    stroke='currentColor'
                  >
                    <circle cx='50' cy='50' r='46' strokeWidth='2' />
                    <circle
                      cx='50'
                      cy='50'
                      r='34'
                      strokeWidth='1.5'
                      strokeDasharray='4 4'
                    />
                    <polygon points='50,10 85,70 15,70' strokeWidth='2' />
                    <polygon points='50,90 15,30 85,30' strokeWidth='2' />
                    <circle cx='50' cy='50' r='6' fill='currentColor' />
                  </svg>
                ),
              },
              {
                id: 'grid',
                name: '方格',
                desc: '',
                preview: (
                  <div className='grid grid-cols-2 gap-1 w-12 h-12'>
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className={`rounded-sm ${
                          i < 2
                            ? 'bg-primary'
                            : 'bg-muted '
                        }`}
                      />
                    ))}
                  </div>
                ),
              },
              {
                id: 'classic',
                name: '旧版',
                desc: '',
                preview: <span className='text-4xl leading-none'>📺</span>,
              },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type='button'
              onClick={() =>
                setThemeSettings((prev) => ({ ...prev, loadingStyle: opt.id }))
              }
              className={`relative p-4 border-2 rounded-lg transition-all ${
                themeSettings.loadingStyle === opt.id
                  ? 'border-border bg-muted '
                  : 'border-border hover:border-border'
              }`}
            >
              <div className='flex flex-col items-center gap-2'>
                <div className='w-12 h-12 flex items-center justify-center'>
                  {opt.preview}
                </div>
                <span className='text-sm font-medium text-foreground text-center'>
                  {opt.name}
                  {opt.desc ? `（${opt.desc}）` : ''}
                </span>
              </div>
              {themeSettings.loadingStyle === opt.id && (
                <div className='absolute top-2 right-2'>
                  <Check className='w-5 h-5 text-primary ' />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 评分星标样式配置 */}
      <div className='bg-card rounded-lg p-6 border border-border'>
        <h3 className='text-lg font-semibold text-foreground mb-4 flex items-center gap-2'>
          <Video className='w-5 h-5' />
          评分星标样式
        </h3>
        <p className='text-sm text-foreground mb-4'>
          视频卡片右上角评分徽章的款式
        </p>

        <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
          {(
            [
              {
                id: 'default',
                name: '圆点',
                desc: '',
                preview: (
                  <div className='w-9 h-9 rounded-full bg-secondary text-foreground text-xs font-bold flex items-center justify-center shadow-md'>
                    8.5
                  </div>
                ),
              },
              {
                id: 'flag',
                name: '锦旗',
                desc: '默认',
                preview: (
                  <div
                    className='w-8 flex flex-col items-center pt-1 pb-2 text-[#4a2600] font-extrabold text-sm'
                    style={{
                      background:
                        'linear-gradient(180deg,#ffd54a,#ff8a3d)',
                      clipPath:
                        'polygon(0 0,100% 0,100% 100%,50% 84%,0 100%)',
                    }}
                  >
                    <span className='flex gap-[1px] mb-[1px]'>
                      {Array.from({ length: 3 }).map((_, i) => (
                        <svg
                          key={i}
                          viewBox='0 0 24 24'
                          className='w-2 h-2'
                          fill='#4a2600'
                        >
                          <path d='M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 20.4l1.4-6.8L2.2 9l6.9-.7z' />
                        </svg>
                      ))}
                    </span>
                    8.5
                  </div>
                ),
              },
              {
                id: 'medal',
                name: '勋章',
                desc: '',
                preview: (
                  <div className='flex flex-col items-center'>
                    <div className='relative w-6 h-4 -mb-2'>
                      <i
                        className='absolute left-0 top-0 w-2.5 h-4 -rotate-6 bg-[#ff8a3d] block'
                        style={{
                          clipPath:
                            'polygon(0 0,100% 0,100% 100%,50% 72%,0 100%)',
                        }}
                      />
                      <i
                        className='absolute right-0 top-0 w-2.5 h-4 rotate-6 bg-[#ff8a3d] block'
                        style={{
                          clipPath:
                            'polygon(0 0,100% 0,100% 100%,50% 72%,0 100%)',
                        }}
                      />
                    </div>
                    <div
                      className='relative z-sticky w-8 h-8 rounded-full flex flex-col items-center justify-center text-[#4a2600] font-extrabold text-[11px] leading-none border-2 border-white/70'
                      style={{
                        background:
                          'linear-gradient(135deg,#ffd54a,#ff8a3d)',
                      }}
                    >
                      <span className='flex flex-col items-center -mb-[1px]'>
                        <span className='flex'>
                          <svg
                            viewBox='0 0 24 24'
                            className='w-1.5 h-1.5'
                            fill='#4a2600'
                          >
                            <path d='M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 20.4l1.4-6.8L2.2 9l6.9-.7z' />
                          </svg>
                        </span>
                        <span className='flex gap-[1px]'>
                          {Array.from({ length: 2 }).map((_, i) => (
                            <svg
                              key={i}
                              viewBox='0 0 24 24'
                              className='w-1.5 h-1.5'
                              fill='#4a2600'
                            >
                              <path d='M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 20.4l1.4-6.8L2.2 9l6.9-.7z' />
                            </svg>
                          ))}
                        </span>
                      </span>
                      8.5
                    </div>
                  </div>
                ),
              },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type='button'
              onClick={() =>
                setThemeSettings((prev) => ({
                  ...prev,
                  rateBadgeStyle: opt.id,
                }))
              }
              className={`relative p-4 border-2 rounded-lg transition-all ${
                themeSettings.rateBadgeStyle === opt.id
                  ? 'border-border bg-muted '
                  : 'border-border hover:border-border'
              }`}
            >
              <div className='flex flex-col items-center gap-2'>
                <div className='w-12 h-12 flex items-center justify-center'>
                  {opt.preview}
                </div>
                <span className='text-sm font-medium text-foreground text-center'>
                  {opt.name}
                  {opt.desc ? `（${opt.desc}）` : ''}
                </span>
              </div>
              {themeSettings.rateBadgeStyle === opt.id && (
                <div className='absolute top-2 right-2'>
                  <Check className='w-5 h-5 text-primary ' />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 保存按钮 */}
      <div className='flex justify-end'>
        <button
          onClick={handleSave}
          disabled={isLoading('saveThemeConfig')}
          className={
            isLoading('saveThemeConfig')
              ? adminButtonStyles.disabled
              : adminButtonStyles.success
          }
        >
          {isLoading('saveThemeConfig') ? '保存中...' : '保存个性化配置'}
        </button>
      </div>

      {alertElement}
    </div>
  );
};
