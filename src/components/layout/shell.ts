/**
 * 全站布局几何的单一来源。
 *
 * 放在 src/components/ 而不是 src/lib/：Tailwind 的 content 扫描范围是
 * ./src/pages、./src/components、./src/app 三处，src/lib/** 不在其中，
 * 把带工具类的常量放进 lib 会导致 JIT 不生成对应 CSS（video-grid.ts 踩过这个坑）。
 *
 * 背景：重构前全站并存 5 套内容宽度策略（max-w-[95%] / max-w-6xl /
 * Tailwind container / max-w-7xl / 完全无上限），翻页时左右边界会跳；
 * 两套外壳（主站 PageLayout / 媒体区 MediaShell）的断点、顶栏高度、
 * 底栏高度也互不一致。这里收敛成一套，两个外壳都从这里取。
 */

/** 浏览类页面：首页、搜索、豆瓣、短剧、源站寻片、直播、网路直播、播放。 */
export const PAGE_WIDE = 'mx-auto w-full max-w-[1600px] px-3 sm:px-6 lg:px-8';

/** 阅读与表单类页面：书库、漫画、音乐、私人影库、求片、高级推荐、admin。 */
export const PAGE_READ = 'mx-auto w-full max-w-7xl px-3 sm:px-6 lg:px-8';

/** 页面级区块之间的垂直节奏（替代 mb-6 / mb-8 / mb-10 / mb-12 的随机取值）。 */
export const SECTION_GAP = 'mb-8 sm:mb-10';

/** 区块内小节之间的垂直节奏。 */
export const SUBSECTION_GAP = 'mb-4 sm:mb-6';

/**
 * 区块之间靠上边距分隔时的节奏（SECTION_GAP 是下边距版本）。
 * 搜索页结果区用上边距，不能拿 SECTION_GAP 顶替——那是 mb-*，会把间距挪到下方。
 */
export const SECTION_TOP_GAP = 'mt-8 sm:mt-10';

/** 移动端顶栏内容行高度。主站此前是 h-12(48)，媒体区是 h-14(56)，统一取大者。 */
export const MOBILE_HEADER_H = 'h-14';

/** 移动端底栏高度。主站此前是 56px，媒体区是 64px，统一取大者。 */
export const BOTTOM_NAV_H = 'min-h-16';

/**
 * 内容区顶部让位：顶栏高度 + 安全区。
 * 移动端顶栏 h-14 = 3.5rem；桌面端主站没有实心顶栏（只有悬浮按钮簇，
 * 由 DESKTOP_TOPBAR_RESERVE 让位），媒体区顶栏 sm:h-16 = 4rem。
 */
export const CONTENT_TOP =
  'pt-[calc(3.5rem+env(safe-area-inset-top))] sm:pt-[calc(4rem+env(safe-area-inset-top))]';

/**
 * 内容区底部让位：底栏高度 + 安全区，桌面端没有底栏所以收到普通页脚留白。
 *
 * 此前主站的写法是 mb-14(56px) 与内联 paddingBottom: calc(3.5rem + safe)(56px)
 * 叠加成 112px，而底栏实际只有 56px——每页尾部多出约 56px 空白；且那条内联
 * padding 没有 md: 前缀，桌面端无底栏也照样留 56px。这里一次修正两处。
 */
export const CONTENT_BOTTOM =
  'pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-8';

/**
 * 桌面端顶部让位：右上角 ThemeToggle + UserMenu 是 absolute top-2 right-4
 * 的悬浮簇（高 40px，纵向占 8–48px），而 <main> 桌面顶边距为 0、页面自身
 * py-8 从 32px 起算，两者在 32–48px 区间重叠。留 3rem 把这段让出来。
 */
export const DESKTOP_TOPBAR_RESERVE = 'md:pt-12';

/** 桌面侧栏宽度。globals.css 的加载遮罩偏移读同一个 CSS 变量。 */
export const SIDEBAR_W = 'w-[var(--sidebar-w)]';

/**
 * 横向卡片轨道（ScrollableRow）的内侧留白。
 *
 * 单独抽出来的原因：轨道自带这段 padding，而区块标题行此前不带，导致首页
 * 每个区块的标题与下方卡片左右错位 16px（移动）/ 24px（桌面）——这是"布局
 * 看着不舒服"最直接的一处。标题行必须用同一个值，两边才对齐。
 */
export const RAIL_GUTTER = 'px-4 sm:px-6';

/**
 * 有意保留的差异（不要"顺手统一"）：
 *
 * 1. ui/input.tsx 与 ui/textarea.tsx 用 `text-base md:text-sm`——移动端 16px 是
 *    防 iOS 聚焦时自动缩放页面的必要手段，不能跟着正文降到 14px。
 * 2. ui/button.tsx 的三档高度 h-8/h-9/h-10 是 shadcn 原语既有约定，保留；
 *    手写按钮应收敛到 <Button> 或 h-10，而不是各自 px-4 py-2.5。
 * 3. 桌面侧栏导航标签 14px（text-sm）与移动底栏标签 12px（text-xs）的差异是有意
 *    的：移动底栏空间受限且以图标为主。此前的问题不是"不一样"，而是侧栏根本
 *    没写字号（继承 body 的 16px）——那才是要修的。底栏没有跟着降到 11px
 *    （text-micro）也是刻意的：导航标签不该用角标那一档。
 */
