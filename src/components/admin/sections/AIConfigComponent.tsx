'use client';

import { Check, Info } from 'lucide-react';
import { useEffect, useState } from 'react';

import { AdminConfig } from '@/lib/admin.types';

import {
  adminButtonStyles,
  showError,
  showSuccess,
  useAdminAlert,
  useLoadingState,
} from '@/components/admin/shared';


export const AIConfigComponent = ({
  config,
  refreshConfig,
}: {
  config: AdminConfig | null;
  refreshConfig: () => Promise<void>;
}) => {
  const { alertElement } = useAdminAlert();
  const { isLoading, withLoading } = useLoadingState();

  // 状态管理
  const [enabled, setEnabled] = useState(false);

  // 自定义配置
  const [customApiKey, setCustomApiKey] = useState('');
  const [customBaseURL, setCustomBaseURL] = useState('');
  const [customModel, setCustomModel] = useState('');

  // 决策模型配置
  const [decisionCustomModel, setDecisionCustomModel] = useState('');

  // 联网搜索配置
  const [enableWebSearch, setEnableWebSearch] = useState(false);
  const [webSearchProvider, setWebSearchProvider] = useState<
    'tavily' | 'serper' | 'serpapi' | 'bing'
  >('tavily');
  const [tavilyApiKey, setTavilyApiKey] = useState('');
  const [serperApiKey, setSerperApiKey] = useState('');
  const [serpApiKey, setSerpApiKey] = useState('');

  // 新版工具式调用配置
  const [enableNewMode, setEnableNewMode] = useState(true);
  const [newProtocol, setNewProtocol] = useState<
    'openai-completions' | 'openai-responses' | 'claude'
  >('openai-completions');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [openaiBaseURL, setOpenaiBaseURL] = useState('');
  const [openaiModel, setOpenaiModel] = useState('');
  const [claudeApiKey, setClaudeApiKey] = useState('');
  const [claudeBaseURL, setClaudeBaseURL] = useState('');
  const [claudeModel, setClaudeModel] = useState('');

  // 新版上下文压缩配置
  const [maxContext, setMaxContext] = useState(131072);
  const [compressThreshold, setCompressThreshold] = useState(90);

  // 功能开关
  const [enableHomepageEntry, setEnableHomepageEntry] = useState(true);
  const [enableVideoCardEntry, setEnableVideoCardEntry] = useState(true);
  const [enablePlayPageEntry, setEnablePlayPageEntry] = useState(true);
  const [enableAIComments, setEnableAIComments] = useState(false);
  const [enableAICommentsToolMode, setEnableAICommentsToolMode] =
    useState(false);

  // 高级设置（Temperature / MaxTokens 未设置时留空，实际调用由代码兜底默认值）
  const [temperature, setTemperature] = useState<number | ''>('');
  const [maxTokens, setMaxTokens] = useState<number | ''>('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [enableStreaming, setEnableStreaming] = useState(true);

  // AI默认消息配置
  const [defaultMessageNoVideo, setDefaultMessageNoVideo] = useState('');
  const [defaultMessageWithVideo, setDefaultMessageWithVideo] = useState('');

  // 从配置加载数据
  useEffect(() => {
    if (config?.AIConfig) {
      setEnabled(config.AIConfig.Enabled || false);
      setCustomApiKey(config.AIConfig.CustomApiKey || '');
      setCustomBaseURL(config.AIConfig.CustomBaseURL || '');
      setCustomModel(config.AIConfig.CustomModel || '');
      setDecisionCustomModel(config.AIConfig.DecisionCustomModel || '');
      setEnableWebSearch(config.AIConfig.EnableWebSearch || false);
      setWebSearchProvider(config.AIConfig.WebSearchProvider || 'tavily');
      setTavilyApiKey(config.AIConfig.TavilyApiKey || '');
      setSerperApiKey(config.AIConfig.SerperApiKey || '');
      setSerpApiKey(config.AIConfig.SerpApiKey || '');
      setEnableNewMode(config.AIConfig.EnableNewMode ?? true);
      setNewProtocol(config.AIConfig.NewProtocol || 'openai-completions');
      setOpenaiApiKey(config.AIConfig.OpenAIApiKey || '');
      setOpenaiBaseURL(config.AIConfig.OpenAIBaseURL || '');
      setOpenaiModel(config.AIConfig.OpenAIModel || '');
      setClaudeApiKey(config.AIConfig.ClaudeApiKey || '');
      setClaudeBaseURL(config.AIConfig.ClaudeBaseURL || '');
      setClaudeModel(config.AIConfig.ClaudeModel || '');
      setMaxContext(config.AIConfig.MaxContext ?? 131072);
      setCompressThreshold(config.AIConfig.CompressThreshold ?? 90);
      setEnableHomepageEntry(config.AIConfig.EnableHomepageEntry !== false);
      setEnableVideoCardEntry(config.AIConfig.EnableVideoCardEntry !== false);
      setEnablePlayPageEntry(config.AIConfig.EnablePlayPageEntry !== false);
      setEnableAIComments(config.AIConfig.EnableAIComments || false);
      setEnableAICommentsToolMode(
        config.AIConfig.EnableAICommentsToolMode || false
      );
      setTemperature(config.AIConfig.Temperature ?? '');
      setMaxTokens(config.AIConfig.MaxTokens ?? '');
      setSystemPrompt(config.AIConfig.SystemPrompt || '');
      setEnableStreaming(config.AIConfig.EnableStreaming !== false);
      setDefaultMessageNoVideo(config.AIConfig.DefaultMessageNoVideo || '');
      setDefaultMessageWithVideo(config.AIConfig.DefaultMessageWithVideo || '');
    }
  }, [config]);

  const handleSave = async () => {
    await withLoading('saveAIConfig', async () => {
      try {
        const response = await fetch('/api/admin/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            Enabled: enabled,
            Provider: 'custom',
            CustomApiKey: customApiKey,
            CustomBaseURL: customBaseURL,
            CustomModel: customModel,
            EnableDecisionModel: true,
            DecisionProvider: 'custom',
            DecisionCustomModel: decisionCustomModel,
            EnableWebSearch: enableWebSearch,
            WebSearchProvider: webSearchProvider,
            TavilyApiKey: tavilyApiKey,
            SerperApiKey: serperApiKey,
            SerpApiKey: serpApiKey,
            EnableNewMode: enableNewMode,
            NewProtocol: newProtocol,
            MaxContext: maxContext,
            CompressThreshold: compressThreshold,
            OpenAIApiKey: openaiApiKey,
            OpenAIBaseURL: openaiBaseURL,
            OpenAIModel: openaiModel,
            ClaudeApiKey: claudeApiKey,
            ClaudeBaseURL: claudeBaseURL,
            ClaudeModel: claudeModel,
            EnableHomepageEntry: enableHomepageEntry,
            EnableVideoCardEntry: enableVideoCardEntry,
            EnablePlayPageEntry: enablePlayPageEntry,
            EnableAIComments: enableAIComments,
            EnableAICommentsToolMode: enableAICommentsToolMode,
            Temperature: temperature === '' ? undefined : temperature,
            MaxTokens: maxTokens === '' ? undefined : maxTokens,
            SystemPrompt: systemPrompt,
            EnableStreaming: enableStreaming,
            DefaultMessageNoVideo: defaultMessageNoVideo,
            DefaultMessageWithVideo: defaultMessageWithVideo,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || '保存失败');
        }

        showSuccess('AI配置保存成功');
        await refreshConfig();
      } catch (error) {
        showError(error instanceof Error ? error.message : '保存失败');
        throw error;
      }
    });
  };

  return (
    <div className='space-y-6'>
      {/* 使用说明 */}
      <div className='bg-muted  border border-border  rounded-lg p-4'>
        <div className='flex items-center gap-2 mb-2'>
          <Info className='h-5 w-5' />
          <span className='text-sm font-medium text-primary '>使用说明</span>
        </div>
        <div className='text-sm text-primary  space-y-1'>
          <p>• AI问片功能可以让用户通过AI对话获取影视推荐和信息查询</p>
          <p>• 支持 OpenAI、Claude 和自定义兼容 OpenAI 格式的 API</p>
          <p>• 启用决策模型后,AI会智能判断是否需要联网搜索/豆瓣/TMDB数据</p>
          <p>• 开启联网搜索后,AI可以获取最新的影视资讯和信息</p>
          <p>• 配置后可在首页、视频卡片和播放页启用AI问片入口</p>
        </div>
      </div>

      {/* 功能开关 */}
      <div className='flex items-center justify-between p-4 bg-muted/50  rounded-lg border border-border '>
        <div>
          <h3 className='text-sm font-medium text-foreground '>
            启用AI问片功能
          </h3>
          <p className='text-xs text-muted-foreground  mt-1'>
            关闭后所有AI问片入口将不可用
          </p>
        </div>
        <label className='relative inline-flex items-center cursor-pointer'>
          <input
            type='checkbox'
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className='sr-only peer'
          />
          <div className="w-14 h-7 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-ring  rounded-full peer  peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-card after:border-border after:border after:rounded-full after:h-6 after:w-6 after:transition-all  peer-checked:bg-primary"></div>
        </label>
      </div>

      {/* 调用模式切换（旧版/新版卡片） */}
      <div className='space-y-4'>
        <h3 className='text-base font-semibold text-foreground '>调用模式</h3>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
          {/* 旧版卡片 */}
          <button
            type='button'
            onClick={() => setEnableNewMode(false)}
            className={`p-4 rounded-lg border-2 text-left transition-colors ${
              !enableNewMode
                ? 'border-border bg-muted '
                : 'border-border  bg-card  hover:border-border '
            }`}
          >
            <div className='flex items-center justify-between'>
              <span className='text-sm font-semibold text-foreground '>
                旧版
              </span>
              {!enableNewMode && <Check className='w-5 h-5 text-primary' />}
            </div>
            <p className='text-xs text-muted-foreground  mt-1'>
              预先分析意图并抓取 联网搜索/豆瓣/TMDB 数据后回答
            </p>
          </button>

          {/* 新版卡片 */}
          <button
            type='button'
            onClick={() => setEnableNewMode(true)}
            className={`p-4 rounded-lg border-2 text-left transition-colors ${
              enableNewMode
                ? 'border-border bg-muted '
                : 'border-border  bg-card  hover:border-border '
            }`}
          >
            <div className='flex items-center justify-between'>
              <span className='text-sm font-semibold text-foreground '>
                新版（工具式调用）
              </span>
              {enableNewMode && <Check className='w-5 h-5 text-primary' />}
            </div>
            <p className='text-xs text-muted-foreground  mt-1'>
              由模型自主决定是否调用相关工具
            </p>
          </button>
        </div>
      </div>

      {/* 旧版 AI模型配置（仅旧版显示） */}
      {!enableNewMode && (
        <>
          <div className='space-y-4'>
            <h3 className='text-base font-semibold text-foreground '>
              AI模型配置
            </h3>
            <p className='text-sm text-muted-foreground '>
              请配置兼容OpenAI格式的API
            </p>
            <div className='space-y-4 p-4 bg-muted/50  rounded-lg'>
              <h4 className='text-sm font-semibold text-foreground '>
                自定义 API 配置
              </h4>
              <div>
                <label className='block text-sm font-medium text-foreground  mb-2'>
                  API Key <span className='text-destructive'>*</span>
                </label>
                <input
                  type='password'
                  value={customApiKey}
                  onChange={(e) => setCustomApiKey(e.target.value)}
                  placeholder='your-api-key'
                  className='w-full px-3 py-2 border border-border  rounded-lg bg-card  text-foreground '
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-foreground  mb-2'>
                  Base URL <span className='text-destructive'>*</span>
                </label>
                <input
                  type='text'
                  value={customBaseURL}
                  onChange={(e) => setCustomBaseURL(e.target.value)}
                  placeholder='https://your-api.example.com/v1'
                  className='w-full px-3 py-2 border border-border  rounded-lg bg-card  text-foreground '
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-foreground  mb-2'>
                  模型名称 <span className='text-destructive'>*</span>
                </label>
                <input
                  type='text'
                  value={customModel}
                  onChange={(e) => setCustomModel(e.target.value)}
                  placeholder='model-name'
                  className='w-full px-3 py-2 border border-border  rounded-lg bg-card  text-foreground '
                />
              </div>
            </div>
          </div>

          {/* 旧版 决策模型配置（仅旧版显示） */}
          <div className='space-y-4 p-4 border border-border  rounded-lg'>
            <div>
              <h4 className='text-sm font-semibold text-foreground '>
                AI决策模型配置
              </h4>
              <p className='text-xs text-muted-foreground  mt-1'>
                使用AI智能判断是否需要联网搜索、豆瓣或TMDB数据,并优化搜索关键词(复用主模型的API配置)
              </p>
            </div>

            <div className='space-y-3 p-3 bg-muted/50  rounded-lg'>
              <div>
                <label className='block text-xs font-medium text-foreground  mb-1'>
                  决策模型名称
                </label>
                <input
                  type='text'
                  value={decisionCustomModel}
                  onChange={(e) => setDecisionCustomModel(e.target.value)}
                  placeholder='gpt-4o-mini (建议使用成本较低的小模型)'
                  className='w-full px-3 py-2 text-sm border border-border  rounded-lg bg-card  text-foreground '
                />
                <p className='text-xs text-muted-foreground  mt-1'>
                  留空则使用传统关键词匹配方式,不进行AI决策
                </p>
              </div>
            </div>

            <div className='bg-muted  border border-border  rounded-lg p-3'>
              <p className='text-xs text-primary '>
                💡 <strong>提示:</strong>{' '}
                决策模型用于智能判断是否需要调用各个数据源,建议使用成本较低的小模型(如
                gpt-4o-mini)。会复用主模型的API Key和Base URL配置。
              </p>
            </div>
          </div>
        </>
      )}

      {/* 新版 调用配置（仅新版显示） */}
      {enableNewMode && (
        <div className='space-y-4 p-4 border border-border  rounded-lg'>
          <div>
            <h4 className='text-sm font-semibold text-foreground '>
              新版调用配置
            </h4>
            <p className='text-xs text-muted-foreground  mt-1'>
              由模型自主决定是否调用相关工具
            </p>
          </div>

          <div>
            <label className='block text-sm font-medium text-foreground  mb-2'>
              调用协议
            </label>
            <select
              value={newProtocol}
              onChange={(e) => setNewProtocol(e.target.value as any)}
              className='w-full px-3 py-2 border border-border  rounded-lg bg-card  text-foreground '
            >
              <option value='openai-completions'>
                OpenAI 普通协议 (chat/completions)
              </option>
              <option value='openai-responses'>
                OpenAI Response 协议 (/responses)
              </option>
              <option value='claude'>
                Claude Messages 协议 (/v1/messages)
              </option>
            </select>
          </div>

          <div>
            <label className='block text-sm font-medium text-foreground  mb-2'>
              最大上下文Token数
            </label>
            <input
              type='number'
              min='1024'
              step='1024'
              value={maxContext}
              onChange={(e) =>
                setMaxContext(parseInt(e.target.value) || 131072)
              }
              className='w-full px-3 py-2 border border-border  rounded-lg bg-card  text-foreground '
            />
            <p className='text-xs text-muted-foreground  mt-1'>
              上下文窗口 token 上限，默认 131072（128k）
            </p>
          </div>

          <div>
            <label className='block text-sm font-medium text-foreground  mb-2'>
              上下文压缩触发阈值 (%)
            </label>
            <input
              type='number'
              min='0'
              max='100'
              step='1'
              value={compressThreshold}
              onChange={(e) =>
                setCompressThreshold(parseInt(e.target.value) || 0)
              }
              className='w-full px-3 py-2 border border-border  rounded-lg bg-card  text-foreground '
            />
            <p className='text-xs text-muted-foreground  mt-1'>
              超出后调用 LLM 将较早的工具调用摘要化并丢弃工具消息；0=关闭压缩
            </p>
          </div>

          {(newProtocol === 'openai-completions' ||
            newProtocol === 'openai-responses') && (
            <div className='space-y-3 p-3 bg-muted/50  rounded-lg'>
              <div>
                <label className='block text-sm font-medium text-foreground  mb-2'>
                  OpenAI API Key
                </label>
                <input
                  type='password'
                  value={openaiApiKey}
                  onChange={(e) => setOpenaiApiKey(e.target.value)}
                  placeholder='sk-...'
                  className='w-full px-3 py-2 border border-border  rounded-lg bg-card  text-foreground '
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-foreground  mb-2'>
                  OpenAI Base URL
                </label>
                <input
                  type='text'
                  value={openaiBaseURL}
                  onChange={(e) => setOpenaiBaseURL(e.target.value)}
                  placeholder='https://api.openai.com'
                  className='w-full px-3 py-2 border border-border  rounded-lg bg-card  text-foreground '
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-foreground  mb-2'>
                  OpenAI 模型
                </label>
                <input
                  type='text'
                  value={openaiModel}
                  onChange={(e) => setOpenaiModel(e.target.value)}
                  placeholder='gpt-4o-mini'
                  className='w-full px-3 py-2 border border-border  rounded-lg bg-card  text-foreground '
                />
              </div>
            </div>
          )}

          {newProtocol === 'claude' && (
            <div className='space-y-3 p-3 bg-muted/50  rounded-lg'>
              <div>
                <label className='block text-sm font-medium text-foreground  mb-2'>
                  Claude API Key
                </label>
                <input
                  type='password'
                  value={claudeApiKey}
                  onChange={(e) => setClaudeApiKey(e.target.value)}
                  placeholder='sk-ant-...'
                  className='w-full px-3 py-2 border border-border  rounded-lg bg-card  text-foreground '
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-foreground  mb-2'>
                  Claude Base URL
                </label>
                <input
                  type='text'
                  value={claudeBaseURL}
                  onChange={(e) => setClaudeBaseURL(e.target.value)}
                  placeholder='https://api.anthropic.com'
                  className='w-full px-3 py-2 border border-border  rounded-lg bg-card  text-foreground '
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-foreground  mb-2'>
                  Claude 模型
                </label>
                <input
                  type='text'
                  value={claudeModel}
                  onChange={(e) => setClaudeModel(e.target.value)}
                  placeholder='claude-sonnet-4-6'
                  className='w-full px-3 py-2 border border-border  rounded-lg bg-card  text-foreground '
                />
              </div>
            </div>
          )}

          <div className='bg-muted  border border-border  rounded-lg p-3'>
            <p className='text-xs text-primary '>
              💡 <strong>提示:</strong> 由模型自主决定是否调用相关工具。
              需在站点设置中配置 TMDB API Key（TMDB 工具）、
              在下方「启用联网搜索」中配置对应搜索服务 API
              Key（联网搜索工具）。豆瓣工具始终可用。
            </p>
          </div>
        </div>
      )}

      {/* 联网搜索配置 */}
      <div className='space-y-4 p-4 border border-border  rounded-lg'>
        <div className='flex items-center justify-between'>
          <div>
            <h4 className='text-sm font-semibold text-foreground '>
              启用联网搜索
            </h4>
            <p className='text-xs text-muted-foreground  mt-1'>
              AI可以搜索最新的影视资讯和信息
            </p>
          </div>
          <label className='relative inline-flex items-center cursor-pointer'>
            <input
              type='checkbox'
              checked={enableWebSearch}
              onChange={(e) => setEnableWebSearch(e.target.checked)}
              className='sr-only peer'
            />
            <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-ring  rounded-full peer  peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-card after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all  peer-checked:bg-primary"></div>
          </label>
        </div>

        {enableWebSearch && (
          <div className='space-y-4 mt-4'>
            <div>
              <label className='block text-sm font-medium text-foreground  mb-2'>
                搜索服务提供商
              </label>
              <select
                value={webSearchProvider}
                onChange={(e) => setWebSearchProvider(e.target.value as any)}
                className='w-full px-3 py-2 border border-border  rounded-lg bg-card  text-foreground '
              >
                <option value='tavily'>Tavily (推荐)</option>
                <option value='serper'>Serper.dev</option>
                <option value='serpapi'>SerpAPI</option>
                <option value='bing'>Bing RSS（免费，无需 API Key）</option>
              </select>
            </div>

            {webSearchProvider === 'tavily' && (
              <div>
                <label className='block text-sm font-medium text-foreground  mb-2'>
                  Tavily API Key
                </label>
                <input
                  type='password'
                  value={tavilyApiKey}
                  onChange={(e) => setTavilyApiKey(e.target.value)}
                  placeholder='tvly-...'
                  className='w-full px-3 py-2 border border-border  rounded-lg bg-card  text-foreground '
                />
                <p className='text-xs text-muted-foreground  mt-1'>
                  在{' '}
                  <a
                    href='https://tavily.com'
                    target='_blank'
                    className='text-primary hover:underline'
                  >
                    tavily.com
                  </a>{' '}
                  注册获取
                </p>
              </div>
            )}

            {webSearchProvider === 'serper' && (
              <div>
                <label className='block text-sm font-medium text-foreground  mb-2'>
                  Serper API Key
                </label>
                <input
                  type='password'
                  value={serperApiKey}
                  onChange={(e) => setSerperApiKey(e.target.value)}
                  placeholder='your-serper-key'
                  className='w-full px-3 py-2 border border-border  rounded-lg bg-card  text-foreground '
                />
                <p className='text-xs text-muted-foreground  mt-1'>
                  在{' '}
                  <a
                    href='https://serper.dev'
                    target='_blank'
                    className='text-primary hover:underline'
                  >
                    serper.dev
                  </a>{' '}
                  注册获取
                </p>
              </div>
            )}

            {webSearchProvider === 'serpapi' && (
              <div>
                <label className='block text-sm font-medium text-foreground  mb-2'>
                  SerpAPI Key
                </label>
                <input
                  type='password'
                  value={serpApiKey}
                  onChange={(e) => setSerpApiKey(e.target.value)}
                  placeholder='your-serpapi-key'
                  className='w-full px-3 py-2 border border-border  rounded-lg bg-card  text-foreground '
                />
                <p className='text-xs text-muted-foreground  mt-1'>
                  在{' '}
                  <a
                    href='https://serpapi.com'
                    target='_blank'
                    className='text-primary hover:underline'
                  >
                    serpapi.com
                  </a>{' '}
                  注册获取
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 入口开关 */}
      <div className='space-y-3 p-4 border border-border  rounded-lg'>
        <h4 className='text-sm font-semibold text-foreground  mb-3'>
          功能入口设置
        </h4>

        {[
          {
            key: 'homepage',
            label: '首页入口',
            desc: '在首页显示AI问片入口',
            state: enableHomepageEntry,
            setState: setEnableHomepageEntry,
          },
          {
            key: 'videocard',
            label: '视频卡片入口',
            desc: '在视频卡片菜单中显示AI问片选项',
            state: enableVideoCardEntry,
            setState: setEnableVideoCardEntry,
          },
          {
            key: 'playpage',
            label: '播放页入口',
            desc: '在视频播放页显示AI问片功能',
            state: enablePlayPageEntry,
            setState: setEnablePlayPageEntry,
          },
          {
            key: 'aicomments',
            label: 'AI评论功能',
            desc: '在播放页生成AI评论（独立于豆瓣评论）',
            state: enableAIComments,
            setState: setEnableAIComments,
          },
          {
            key: 'aicommentstoolmode',
            label: 'AI评论工具式调用',
            desc: '开启后评论生成走工具式调用，模型自主联网/查豆瓣/TMDB 获取真实评价（需模型支持 function calling；关闭则单轮直调，联网仅预抓取参考）',
            state: enableAICommentsToolMode,
            setState: setEnableAICommentsToolMode,
          },
        ].map((item) => (
          <div
            key={item.key}
            className='flex items-center justify-between py-2'
          >
            <div>
              <div className='text-sm font-medium text-foreground '>
                {item.label}
              </div>
              <div className='text-xs text-muted-foreground '>{item.desc}</div>
            </div>
            <label className='relative inline-flex items-center cursor-pointer'>
              <input
                type='checkbox'
                checked={item.state}
                onChange={(e) => item.setState(e.target.checked)}
                className='sr-only peer'
              />
              <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-ring  rounded-full peer  peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-card after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all  peer-checked:bg-primary"></div>
            </label>
          </div>
        ))}
      </div>

      {/* 高级设置 */}
      <details className='p-4 border border-border  rounded-lg'>
        <summary className='text-sm font-semibold text-foreground  cursor-pointer'>
          高级设置 (可选)
        </summary>
        <div className='mt-4 space-y-4'>
          <div>
            <label className='block text-sm font-medium text-foreground  mb-2'>
              Temperature ({temperature === '' ? '未设置' : temperature})
            </label>
            <input
              type='range'
              min='-0.1'
              max='2'
              step='0.1'
              value={temperature === '' ? -0.1 : temperature}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                // 滑到最左（-0.1）视为「不设置」，保留 0 为可选真实值
                setTemperature(v < 0 ? '' : v);
              }}
              className='w-full'
            />
            <p className='text-xs text-muted-foreground  mt-1'>
              控制回复的创造性，0=保守，2=创造；滑到最左则不设置
            </p>
          </div>

          <div>
            <label className='block text-sm font-medium text-foreground  mb-2'>
              最大回复Token数
            </label>
            <input
              type='number'
              min='1'
              value={maxTokens}
              placeholder='留空则不设置'
              onChange={(e) => {
                const v = e.target.value;
                const n = parseInt(v, 10);
                setMaxTokens(v === '' || Number.isNaN(n) ? '' : n);
              }}
              className='w-full px-3 py-2 border border-border  rounded-lg bg-card  text-foreground '
            />
            <p className='text-xs text-muted-foreground  mt-1'>留空则不设置</p>
          </div>

          <div>
            <label className='block text-sm font-medium text-foreground  mb-2'>
              自定义系统提示词
            </label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={4}
              placeholder='可自定义AI的角色和行为规则...'
              className='w-full px-3 py-2 border border-border  rounded-lg bg-card  text-foreground '
            />
          </div>

          {/* 流式响应开关 */}
          <div className='flex items-center justify-between py-3 border-t border-border '>
            <div className='flex-1'>
              <label className='text-sm font-medium text-foreground '>
                流式响应
              </label>
              <p className='text-xs text-muted-foreground  mt-1'>
                启用后AI消息将实时流式显示，关闭后将等待完整响应后一次性显示
              </p>
            </div>
            <button
              onClick={() => setEnableStreaming(!enableStreaming)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                enableStreaming ? 'bg-primary' : 'bg-muted '
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-card transition-transform ${
                  enableStreaming ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </details>

      {/* AI默认消息配置 */}
      <details className='p-4 border border-border  rounded-lg'>
        <summary className='text-sm font-semibold text-foreground  cursor-pointer'>
          默认消息配置 (可选)
        </summary>
        <div className='mt-4 space-y-4'>
          <div>
            <label className='block text-sm font-medium text-foreground  mb-2'>
              无视频时的默认消息
            </label>
            <textarea
              value={defaultMessageNoVideo}
              onChange={(e) => setDefaultMessageNoVideo(e.target.value)}
              rows={3}
              placeholder='例如：你好！我是MoonTVPlus的AI影视助手。想看什么电影或剧集？需要推荐吗？'
              className='w-full px-3 py-2 border border-border  rounded-lg bg-card  text-foreground '
            />
            <p className='mt-2 text-sm text-foreground '>
              当用户在首页或没有视频上下文时打开AI问片，将显示此默认消息
            </p>
          </div>

          <div>
            <label className='block text-sm font-medium text-foreground  mb-2'>
              有视频时的默认消息
            </label>
            <textarea
              value={defaultMessageWithVideo}
              onChange={(e) => setDefaultMessageWithVideo(e.target.value)}
              rows={3}
              placeholder='例如：你好！我看到你正在浏览《{title}》，有什么想了解的吗？'
              className='w-full px-3 py-2 border border-border  rounded-lg bg-card  text-foreground '
            />
            <p className='mt-2 text-sm text-foreground '>
              当用户在视频卡片或播放页打开AI问片时，将显示此默认消息。支持使用{' '}
              <code className='px-1.5 py-0.5 bg-muted  rounded text-xs font-mono'>
                {'{title}'}
              </code>{' '}
              替换符来显示片名
            </p>
          </div>
        </div>
      </details>

      {/* 保存按钮 */}
      <div className='flex justify-end'>
        <button
          onClick={handleSave}
          disabled={isLoading('saveAIConfig')}
          className={
            isLoading('saveAIConfig')
              ? adminButtonStyles.disabled
              : adminButtonStyles.success
          }
        >
          {isLoading('saveAIConfig') ? '保存中...' : '保存配置'}
        </button>
      </div>

      {/* 通用弹窗组件 */}
      {alertElement}
    </div>
  );
};
