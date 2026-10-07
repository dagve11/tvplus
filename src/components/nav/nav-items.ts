/**
 * 导航项单一事实来源。
 *
 * 提取自 Sidebar.tsx（桌面端）与 MobileBottomNav.tsx（移动端）中重复的
 * useEffect 导航构建逻辑，供两个导航组件共享。本文件为纯数据/逻辑：
 * 无 JSX、无 hooks。
 *
 * 两端差异（已在本文件内建模）：
 * - 桌面端包含「搜索」项，且在 /under 路径下其 href 切到 /under；
 *   移动端底部导航不含「搜索」（搜索入口在 MobileHeader，且恒为 /search）。
 * - 其余条目两端一致：顺序、文案、href、可见性条件完全相同。
 * - 两个组件的 useState 初始值曾无条件包含「电视直播」，useEffect 后按
 *   LIVE_ENABLED 重建；本构建器直接产出 flag 驱动的最终列表。
 */

import type { LucideIcon } from 'lucide-react';
import {
  Blend,
  Cat,
  Clover,
  Container,
  Film,
  Globe,
  Home,
  Search,
  Star,
  Tv,
  TvMinimalPlay,
  Users,
} from 'lucide-react';

import { SPECIAL_SOURCE_PATH } from '@/lib/special-source.client';

/** window.RUNTIME_CONFIG 的类型，见 src/types/runtime-config.d.ts */
type RuntimeConfig = NonNullable<Window['RUNTIME_CONFIG']>;

export interface NavItem {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  /** 是否出现在移动端底部导航；缺省为仅桌面端 */
  mobile?: boolean;
  /**
   * 除 href 精确匹配外应视为激活的额外路径。
   * 当前仅「搜索」使用：/under 路径下 href 切到 /under，该数组同时覆盖
   * /search 与 /under 两种形态，便于组件做激活判定。
   * 注意：豆瓣类条目（href 带 type= 查询参数）的激活匹配规则
   * （startsWith('/douban') && includes('type=xxx')）由渲染组件负责。
   */
  activePaths?: string[];
}

export interface BuildNavItemsOptions {
  /** 来自 window.RUNTIME_CONFIG 的特性开关（SSR 阶段可为 undefined） */
  runtimeConfig?: RuntimeConfig;
  /** 观影室是否启用，来自 useWatchRoomContextSafe()?.isEnabled */
  watchRoomEnabled: boolean;
  /** 当前 pathname，用于 /under 下「搜索」入口的切换逻辑 */
  pathname: string;
}

interface NavItemDefinition {
  key: string;
  label: string;
  icon: LucideIcon;
  href: string | ((options: BuildNavItemsOptions) => string);
  /** 是否进入移动端底部导航 */
  mobile: boolean;
  /** 可见性条件；缺省为始终可见 */
  visible?: (options: BuildNavItemsOptions) => boolean;
}

/** 与 Sidebar.tsx 一致：/under 及其子路径视为特殊源上下文 */
function isUnderPath(pathname: string): boolean {
  return (
    pathname === SPECIAL_SOURCE_PATH ||
    pathname.startsWith(`${SPECIAL_SOURCE_PATH}/`)
  );
}

/**
 * 全量定义列表，顺序即桌面端渲染顺序：
 * [首页, 搜索, 电影, 剧集, 动漫, 综艺, 直播?, 网络直播?, 私人影库?,
 *  高级推荐?, 观影室?, 自定义?]
 * 移动端为同一列表去掉「搜索」。
 */
const NAV_ITEM_DEFINITIONS: NavItemDefinition[] = [
  {
    key: 'home',
    label: '首页',
    icon: Home,
    href: '/',
    mobile: true,
  },
  {
    key: 'search',
    label: '搜索',
    icon: Search,
    // /under 下的「搜索」留在特殊源入口，避免一点就跳回普通搜索
    href: (options) =>
      isUnderPath(options.pathname) ? SPECIAL_SOURCE_PATH : '/search',
    mobile: false,
  },
  {
    key: 'movie',
    label: '电影',
    icon: Film,
    href: '/douban?type=movie',
    mobile: true,
  },
  {
    key: 'tv',
    label: '剧集',
    icon: Tv,
    href: '/douban?type=tv',
    mobile: true,
  },
  {
    key: 'anime',
    label: '动漫',
    icon: Cat,
    href: '/douban?type=anime',
    mobile: true,
  },
  {
    key: 'show',
    label: '综艺',
    icon: Clover,
    href: '/douban?type=show',
    mobile: true,
  },
  {
    key: 'live',
    label: '电视直播',
    icon: TvMinimalPlay,
    href: '/live',
    mobile: true,
    visible: (options) => Boolean(options.runtimeConfig?.LIVE_ENABLED),
  },
  {
    key: 'web-live',
    label: '网络直播',
    icon: Globe,
    href: '/web-live',
    mobile: true,
    visible: (options) => Boolean(options.runtimeConfig?.WEB_LIVE_ENABLED),
  },
  {
    key: 'private-library',
    label: '私人影库',
    icon: Container,
    href: '/private-library',
    mobile: true,
    visible: (options) =>
      Boolean(options.runtimeConfig?.PRIVATE_LIBRARY_ENABLED),
  },
  {
    key: 'advanced-recommendation',
    label: '高级推荐',
    icon: Blend,
    href: '/advanced-recommendation',
    mobile: true,
    visible: (options) =>
      Boolean(options.runtimeConfig?.ADVANCED_RECOMMENDATION_ENABLED),
  },
  {
    key: 'watch-room',
    label: '观影室',
    icon: Users,
    href: '/watch-room',
    mobile: true,
    visible: (options) => options.watchRoomEnabled,
  },
  {
    key: 'custom',
    label: '自定义',
    icon: Star,
    href: '/douban?type=custom',
    mobile: true,
    visible: (options) =>
      (options.runtimeConfig?.CUSTOM_CATEGORIES?.length ?? 0) > 0,
  },
];

/**
 * 桌面端 Sidebar 顶部固定区块（独立 <nav>，位于动态菜单项之上）的条目 key，
 * 按此切分可保持与现有 Sidebar 的双区块渲染结构一致。
 */
export const DESKTOP_PRIMARY_NAV_KEYS = ['home', 'search'] as const;

function resolveNavItems(
  options: BuildNavItemsOptions,
  platform: 'desktop' | 'mobile'
): NavItem[] {
  const items: NavItem[] = [];
  for (const definition of NAV_ITEM_DEFINITIONS) {
    if (platform === 'mobile' && !definition.mobile) {
      continue;
    }
    if (definition.visible && !definition.visible(options)) {
      continue;
    }
    const item: NavItem = {
      key: definition.key,
      label: definition.label,
      href:
        typeof definition.href === 'function'
          ? definition.href(options)
          : definition.href,
      icon: definition.icon,
      mobile: definition.mobile,
    };
    if (definition.key === 'search') {
      item.activePaths = ['/search', SPECIAL_SOURCE_PATH];
    }
    items.push(item);
  }
  return items;
}

/**
 * 通用构建入口，默认返回桌面端完整列表
 * （首页、搜索在前，动态菜单项按定义顺序在后）。
 */
export function buildNavItems(options: BuildNavItemsOptions): NavItem[] {
  return buildDesktopNavItems(options);
}

/** 桌面端（Sidebar）导航列表，含「搜索」及其 /under 切换逻辑 */
export function buildDesktopNavItems(options: BuildNavItemsOptions): NavItem[] {
  return resolveNavItems(options, 'desktop');
}

/** 移动端（MobileBottomNav）底部导航列表，不含「搜索」项 */
export function buildMobileNavItems(options: BuildNavItemsOptions): NavItem[] {
  return resolveNavItems(options, 'mobile');
}
