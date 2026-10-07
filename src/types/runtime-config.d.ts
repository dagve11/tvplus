/**
 * window.RUNTIME_CONFIG 全局类型声明。
 *
 * 对应 src/app/layout.tsx 中注入到 window 的运行时配置对象：
 *   <script>window.RUNTIME_CONFIG = { JSON.stringify(runtimeConfig) };</script>
 *
 * 该对象在 layout 中以单个对象字面量整体构造，所有键始终存在（在
 * localstorage 与数据库两种存储模式下都会注入，仅取值不同），因此
 * 下列键均为必填；仅 window.RUNTIME_CONFIG 本身为可选（SSR 阶段不存在）。
 *
 * 注意：Sidebar.tsx 内部还有一份旧的局部 declare global 声明
 * （RUNTIME_CONFIG 带索引签名），重构 Sidebar 时需移除该块，否则两处
 * Window 接口合并会因属性类型不一致而报 TS2717。
 */

/** 自定义分类元素：与 layout.tsx 中 customCategories 的构造形状一致 */
interface RuntimeConfigCustomCategory {
  name: string;
  type: 'movie' | 'tv';
  query: string;
}

/** AI 相关子配置 */
interface RuntimeConfigAIConfig {
  EnableAIComments: boolean;
}

interface RuntimeConfig {
  // ---- 存储 ----
  STORAGE_TYPE: string;
  /** d1 在非 Cloudflare 环境展示为 sqlite */
  DISPLAY_STORAGE_TYPE: string;
  LOCAL_SETTINGS_SYNC_MODE: 'off' | 'manual' | 'auto';

  // ---- 豆瓣代理 ----
  DOUBAN_PROXY_TYPE: string;
  DOUBAN_PROXY: string;
  DOUBAN_IMAGE_PROXY_TYPE: string;
  DOUBAN_IMAGE_PROXY: string;
  DISABLE_YELLOW_FILTER: boolean;

  // ---- 导航 / 搜索 / 互动 ----
  CUSTOM_CATEGORIES: RuntimeConfigCustomCategory[];
  FLUID_SEARCH: boolean;
  EnableComments: boolean;
  DANMAKU_AUTO_LOAD_DEFAULT: boolean;
  RecommendationDataSource: string;

  // ---- 图片数据源 ----
  TMDB_IMAGE_BASE_URL: string;
  BANGUMI_DATA_SOURCE: 'direct' | 'server-proxy' | 'custom-baseurl' | 'sakura';
  BANGUMI_API_BASE_URL: string;
  BANGUMI_IMAGE_BASE_URL: string;

  // ---- TV 模式 / 下载 / 语音 ----
  ENABLE_TV_MODE: boolean;
  ENABLE_TVBOX_SUBSCRIBE: boolean;
  ENABLE_OFFLINE_DOWNLOAD: boolean;
  VOICE_CHAT_STRATEGY: string;

  // ---- 私人影库（OpenList / Emby / 小雅）----
  OPENLIST_ENABLED: boolean;
  EMBY_ENABLED: boolean;
  XIAOYA_ENABLED: boolean;
  PRIVATE_LIBRARY_ENABLED: boolean;

  // ---- 主题 ----
  LOGIN_BACKGROUND_IMAGE: string;
  REGISTER_BACKGROUND_IMAGE: string;
  HOME_BACKGROUND_IMAGE: string;
  PROGRESS_THUMB_TYPE: string;
  PROGRESS_THUMB_PRESET_ID: string;
  PROGRESS_THUMB_CUSTOM_URL: string;

  // ---- 注册 / 登录 ----
  ENABLE_REGISTRATION: boolean;
  REQUIRE_REGISTRATION_INVITE_CODE: boolean;
  LOGIN_REQUIRE_TURNSTILE: boolean;
  REGISTRATION_REQUIRE_TURNSTILE: boolean;
  TURNSTILE_SITE_KEY: string;
  ENABLE_OIDC_LOGIN: boolean;
  ENABLE_OIDC_REGISTRATION: boolean;
  OIDC_BUTTON_TEXT: string;
  ENABLE_TELEGRAM_LOGIN: boolean;
  TELEGRAM_BOT_USERNAME: string;

  // ---- AI ----
  AI_ENABLED: boolean;
  AI_ENABLE_HOMEPAGE_ENTRY: boolean;
  AI_ENABLE_VIDEOCARD_ENTRY: boolean;
  AI_ENABLE_PLAYPAGE_ENTRY: boolean;
  AIConfig: RuntimeConfigAIConfig;
  AI_DEFAULT_MESSAGE_NO_VIDEO: string;
  AI_DEFAULT_MESSAGE_WITH_VIDEO: string;

  // ---- 求片 ----
  ENABLE_MOVIE_REQUEST: boolean;

  // ---- 直播 / 推荐 / 广告过滤 ----
  LIVE_ENABLED: boolean;
  WEB_LIVE_ENABLED: boolean;
  ADVANCED_RECOMMENDATION_ENABLED: boolean;
  CUSTOM_AD_FILTER_VERSION: number;

  // ---- 音乐 / 漫画 / 电子书 ----
  MUSIC_ENABLED: boolean;
  MUSIC_PROXY_ENABLED: boolean;
  SUWAYOMI_ENABLED: boolean;
  BOOKS_ENABLED: boolean;

  // ---- 网盘 / 磁力 ----
  NETDISK_SEARCH_ENABLED: boolean;
  MAGNET_SEARCH_ENABLED: boolean;
  MAGNET_SAVE_PRIVATE_LIBRARY_ENABLED: boolean;
  NETDISK_TRANSFER_ENABLED: boolean;
  NETDISK_TEMP_PLAY_ENABLED: boolean;

  // ---- 节日特效 ----
  FESTIVE_EFFECT_ENABLED: boolean;

  // ---- 特殊源 ----
  SPECIAL_SOURCE_APIS: string[];

  // ---- 评分徽章（实际取值为 'default' | 'flag' | 'medal'）----
  RATE_BADGE_STYLE: string;

  /**
   * 站点根地址：src/app/admin/page.tsx 通过 window.RUNTIME_CONFIG?.SITE_BASE
   * 读取，但 layout.tsx 并未注入该键（读取时恒为 undefined，走兜底逻辑），
   * 故此处标为可选。
   */
  SITE_BASE?: string;

  /**
   * 源搜索开关：src/app/page.tsx 与 SearchPageClient.tsx 通过
   * window.RUNTIME_CONFIG?.ENABLE_SOURCE_SEARCH 读取，但 layout.tsx
   * 并未注入该键（恒为 undefined，消费端按 `!== false` 视为开启），
   * 故此处标为可选。
   */
  ENABLE_SOURCE_SEARCH?: boolean;
}

declare global {
  interface Window {
    RUNTIME_CONFIG?: RuntimeConfig;
  }
}

export {};
