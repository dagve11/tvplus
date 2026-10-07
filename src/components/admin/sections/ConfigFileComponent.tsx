'use client';

import { Upload } from 'lucide-react';
import { useEffect, useState } from 'react';

import { AdminConfig } from '@/lib/admin.types';

import { adminButtonStyles, showError, showSuccess, useAdminAlert, useLoadingState } from '@/components/admin/shared';

export const ConfigFileComponent = ({
  config,
  refreshConfig,
}: {
  config: AdminConfig | null;
  refreshConfig: () => Promise<void>;
}) => {
  const { alertElement } = useAdminAlert();
  const { isLoading, withLoading } = useLoadingState();
  const [configContent, setConfigContent] = useState('');
  const [subscriptionUrl, setSubscriptionUrl] = useState('');
  const [autoUpdate, setAutoUpdate] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<string>('');

  useEffect(() => {
    if (config?.ConfigFile) {
      setConfigContent(config.ConfigFile);
    }
    if (config?.ConfigSubscribtion) {
      setSubscriptionUrl(config.ConfigSubscribtion.URL);
      setAutoUpdate(config.ConfigSubscribtion.AutoUpdate);
      setLastCheckTime(config.ConfigSubscribtion.LastCheck || '');
    }
  }, [config]);

  // 拉取订阅配置
  const handleFetchConfig = async () => {
    if (!subscriptionUrl.trim()) {
      showError('请输入订阅URL');
      return;
    }

    await withLoading('fetchConfig', async () => {
      try {
        const resp = await fetch('/api/admin/config_subscription/fetch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: subscriptionUrl }),
        });

        if (!resp.ok) {
          const data = await resp.json().catch(() => ({}));
          throw new Error(data.error || `拉取失败: ${resp.status}`);
        }

        const data = await resp.json();
        if (data.configContent) {
          setConfigContent(data.configContent);
          // 更新本地配置的最后检查时间
          const currentTime = new Date().toISOString();
          setLastCheckTime(currentTime);
          showSuccess('配置拉取成功');
        } else {
          showError('拉取失败：未获取到配置内容');
        }
      } catch (err) {
        showError(err instanceof Error ? err.message : '拉取失败');
        throw err;
      }
    });
  };

  // 处理文件上传
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 检查文件类型
    if (!file.name.toLowerCase().endsWith('.json')) {
      showError('请上传JSON格式的文件');
      return;
    }

    await withLoading('uploadConfig', async () => {
      try {
        const fileContent = await file.text();

        // 验证JSON格式
        let parsedConfig;
        try {
          parsedConfig = JSON.parse(fileContent);
        } catch (parseError) {
          showError('JSON格式错误，请检查文件内容');
          return;
        }

        // 检查是否包含api_site字段
        if (!parsedConfig.api_site) {
          showError('配置文件必须包含api_site字段');
          return;
        }

        // 根据api字段进行去重
        const existingConfig = configContent
          ? JSON.parse(configContent)
          : { api_site: {} };
        const existingApis = new Set();

        // 收集现有配置中的所有api
        Object.values(existingConfig.api_site || {}).forEach((site: any) => {
          if (site.api) {
            existingApis.add(site.api);
          }
        });

        // 合并新配置，去重处理
        const mergedApiSite = { ...existingConfig.api_site };
        let duplicateCount = 0;

        Object.entries(parsedConfig.api_site || {}).forEach(
          ([key, site]: [string, any]) => {
            if (site.api && existingApis.has(site.api)) {
              duplicateCount++;
              // 跳过重复的api
              return;
            }
            mergedApiSite[key] = site;
          }
        );

        const mergedConfig = {
          ...parsedConfig,
          api_site: mergedApiSite,
        };

        // 更新配置内容
        setConfigContent(JSON.stringify(mergedConfig, null, 2));

        const message =
          duplicateCount > 0
            ? `配置上传成功，跳过了 ${duplicateCount} 个重复的API`
            : '配置上传成功';
        showSuccess(message);
      } catch (err) {
        showError(
          err instanceof Error ? err.message : '文件上传失败'
        );
        throw err;
      }
    });

    // 清空文件输入
    event.target.value = '';
  };

  // 保存配置文件
  const handleSave = async () => {
    await withLoading('saveConfig', async () => {
      try {
        const resp = await fetch('/api/admin/config_file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            configFile: configContent,
            subscriptionUrl,
            autoUpdate,
            lastCheckTime: lastCheckTime || new Date().toISOString(),
          }),
        });

        if (!resp.ok) {
          const data = await resp.json().catch(() => ({}));
          throw new Error(data.error || `保存失败: ${resp.status}`);
        }

        showSuccess('配置文件保存成功');
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
    <div className='space-y-4'>
      {/* 配置订阅区域 */}
      <div className='bg-card rounded-lg p-6 border border-border shadow-sm'>
        <div className='flex items-center justify-between mb-6'>
          <h3 className='text-xl font-semibold text-foreground '>
            配置订阅
          </h3>
          <div className='text-sm text-muted-foreground px-3 py-1.5 rounded-full'>
            最后更新:{' '}
            {lastCheckTime
              ? new Date(lastCheckTime).toLocaleString('zh-CN')
              : '从未更新'}
          </div>
        </div>

        <div className='space-y-6'>
          {/* 订阅URL输入 */}
          <div>
            <label className='block text-sm font-medium text-foreground mb-3'>
              订阅URL
            </label>
            <input
              type='url'
              value={subscriptionUrl}
              onChange={(e) => setSubscriptionUrl(e.target.value)}
              placeholder='https://example.com/config.json'
              disabled={false}
              className='w-full px-4 py-3 border border-border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 shadow-sm hover:border-border'
            />
            <p className='mt-2 text-xs text-muted-foreground '>
              输入配置文件的订阅地址，要求 JSON 格式，且使用 Base58 编码
            </p>
          </div>

          {/* 拉取配置按钮 */}
          <div className='pt-2'>
            <button
              onClick={handleFetchConfig}
              disabled={isLoading('fetchConfig') || !subscriptionUrl.trim()}
              className={`w-full px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                isLoading('fetchConfig') || !subscriptionUrl.trim()
                  ? adminButtonStyles.disabled
                  : adminButtonStyles.success
              }`}
            >
              {isLoading('fetchConfig') ? (
                <div className='flex items-center justify-center gap-2'>
                  <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                  拉取中…
                </div>
              ) : (
                '拉取配置'
              )}
            </button>
          </div>

          {/* 自动更新开关 */}
          <div className='flex items-center justify-between'>
            <div>
              <label className='text-sm font-medium text-foreground '>
                自动更新
              </label>
              <p className='text-xs text-muted-foreground mt-1'>
                启用后系统将定期自动拉取最新配置
              </p>
            </div>
            <button
              type='button'
              onClick={() => setAutoUpdate(!autoUpdate)}
              disabled={false}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                autoUpdate ? adminButtonStyles.toggleOn : adminButtonStyles.toggleOff
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full ${
                  adminButtonStyles.toggleThumb
                } transition-transform ${
                  autoUpdate
                    ? adminButtonStyles.toggleThumbOn
                    : adminButtonStyles.toggleThumbOff
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* 配置文件编辑区域 */}
      <div className='space-y-4'>
        <div className='relative'>
          <textarea
            value={configContent}
            onChange={(e) => setConfigContent(e.target.value)}
            rows={20}
            placeholder='请输入配置文件内容（JSON 格式）...'
            disabled={false}
            className='w-full px-4 py-3 border border-border rounded-lg bg-card text-foreground font-mono text-sm leading-relaxed resize-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 hover:border-border'
            style={{
              fontFamily:
                'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
            }}
            spellCheck={false}
            data-gramm={false}
          />
        </div>

        {/* 文件上传区域 */}
        <div className='border-t border-border pt-4'>
          <div className='flex items-center justify-between mb-3'>
            <label className='text-sm font-medium text-foreground '>
              上传JSON配置文件
            </label>
            <div className='text-xs text-muted-foreground '>
              支持根据API字段自动去重
            </div>
          </div>
          <div className='relative'>
            <input
              type='file'
              accept='.json'
              onChange={handleFileUpload}
              disabled={isLoading('uploadConfig')}
              className='hidden'
              id='json-file-upload'
            />
            <label
              htmlFor='json-file-upload'
              className={`flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-border  rounded-lg cursor-pointer transition-colors ${
                isLoading('uploadConfig')
                  ? 'bg-muted cursor-not-allowed opacity-50'
                  : 'bg-card hover:bg-muted/50 hover:border-border'
              }`}
            >
              <div className='flex items-center space-x-2'>
                {isLoading('uploadConfig') ? (
                  <>
                    <div className='w-4 h-4 border-2 border-border border-t-transparent rounded-full animate-spin'></div>
                    <span className='text-sm text-foreground '>
                      上传中...
                    </span>
                  </>
                ) : (
                  <>
                    <Upload className='w-5 h-5 text-muted-foreground' />
                    <span className='text-sm text-foreground '>
                      点击选择JSON文件或拖拽到此处
                    </span>
                  </>
                )}
              </div>
            </label>
          </div>
          <p className='mt-2 text-xs text-muted-foreground '>
            上传的JSON配置将自动合并到当前配置，重复的API地址将被自动过滤
          </p>
        </div>

        <div className='flex items-center justify-between'>
          <div className='text-xs text-muted-foreground '>
            支持 JSON 格式，用于配置视频源和自定义分类
          </div>
          <button
            onClick={handleSave}
            disabled={isLoading('saveConfig')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              isLoading('saveConfig')
                ? adminButtonStyles.disabled
                : adminButtonStyles.success
            }`}
          >
            {isLoading('saveConfig') ? '保存中…' : '保存'}
          </button>
        </div>
      </div>

      {alertElement}
    </div>
  );
};
