/**
 * 漫画 / 小说「书库」视觉语言的唯一定义处。
 *
 * 两套功能的所有书库页面都从这里取类名，避免同一套纸面/书脊/强调被抄成十几份。
 * 单色化后全部走 globals.css 的语义 token（background/card/foreground/muted/border/
 * primary/accent/ring/destructive），排版质感保留 font-book。
 */

import { cn } from '@/lib/cn';

/** 页面底色。 */
export const LIBRARY_PAGE = 'bg-background';

/** 实心面板。 */
export const LIBRARY_PANEL = 'rounded-lg border border-border bg-card';

/** 正文主色。 */
export const LIBRARY_TEXT = 'text-foreground';

/** 次要信息。 */
export const LIBRARY_MUTED = 'text-muted-foreground';

/** 书卷衬线，用在书名与小节标题上。 */
export const LIBRARY_SERIF = 'font-book';

/** 强调：实心按钮。 */
export const LIBRARY_BUTTON =
  'inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors duration-200 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

/** 强调：描边按钮。 */
export const LIBRARY_GHOST_BUTTON =
  'inline-flex items-center justify-center gap-2 rounded-md border border-input px-4 py-2.5 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

/** 焦点环，统一给书库区的可聚焦元素用。 */
export const LIBRARY_FOCUS =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

/** 输入框 / 下拉框：聚焦时边框转 ring。 */
export const LIBRARY_FIELD =
  'w-full rounded-md border border-input bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted-foreground focus:border-ring';

/** 圆形图标按钮（缓存管理、清空这类工具栏按钮）。 */
export const LIBRARY_ICON_BUTTON =
  'inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border text-muted-foreground transition-colors duration-200 hover:border-foreground hover:text-foreground';

/** 同上，危险操作（删除 / 清空）。 */
export const LIBRARY_ICON_BUTTON_DANGER =
  'inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border text-muted-foreground transition-colors duration-200 hover:border-destructive hover:text-destructive';

/** 无边框圆图标按钮：顶栏里的工具按钮（章节、设置、更多）。 */
export const LIBRARY_ICON_BUTTON_GHOST =
  'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-accent hover:text-foreground';

/** 下拉菜单里的一项。 */
export const LIBRARY_MENU_ITEM =
  'flex w-full cursor-pointer items-center gap-2 px-4 py-2.5 text-left text-sm text-foreground transition-colors duration-200 hover:bg-accent';

/** 面板内的一行（章节行、格式行）。 */
export const LIBRARY_ROW = 'rounded-md border border-border bg-muted/40';

/** 行的高亮态：当前章节 / 连载中。 */
export const LIBRARY_ROW_ACTIVE = 'border-foreground bg-accent';

/** 骨架块。 */
export const LIBRARY_SKELETON = 'animate-pulse rounded-sm bg-muted';

/** 进度条：轨道 + 前景填充。 */
export const LIBRARY_PROGRESS_TRACK = 'overflow-hidden rounded-full bg-muted';
export const LIBRARY_PROGRESS_BAR =
  'h-full rounded-full bg-foreground transition-all duration-300';

/**
 * 小节标题下的说明行（"共 N 条"这类）。图标单独上色，用 LIBRARY_ACCENT_ICON。
 */
export const LIBRARY_ACCENT_ICON = 'text-foreground';

/**
 * 封面读起来像一本立着的书：外层是贴地投影，内层（renderBookSpineOverlay 里的
 * inset 阴影）是书脊处的高光与暗部。两者必须分开——inset 阴影画在子元素之下，
 * 会被封面图整个盖住，所以只能做成覆盖层。
 */
export const BOOK_COVER_LIFT =
  'shadow-[0_1px_2px_rgba(0,0,0,0.22),0_12px_24px_-16px_rgba(0,0,0,0.5)]';

/** 覆盖在封面之上的书脊层，必须放在 <img> 之后。 */
export const BOOK_SPINE_OVERLAY =
  'pointer-events-none absolute inset-0 shadow-[inset_3px_0_0_rgba(255,255,255,0.14),inset_6px_0_10px_-6px_rgba(0,0,0,0.55)]';

/** 书架板：横滑 rail 底部那条细线。 */
export const BOOK_SHELF_BOARD = 'border-b border-border';

/** 横滑容器：隐藏滚动条，保留手势滚动。 */
export const BOOK_RAIL =
  'flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

/** rail 中每一项的宽度。 */
export const BOOK_RAIL_ITEM = 'w-24 shrink-0 snap-start sm:w-28';

/**
 * 封面右下角的书架开关（书墙与搜索结果共用）。
 *
 * 图标是 primary-foreground——必须有深底托着，所以底色由调用方跟着状态给：
 * 未收藏用半透明墨（和封面左上角的角标同一套），已收藏换前景实色。
 * inline-flex + items/justify-center 是让图标在圆里居中，别指望 button 的 UA 默认对齐。
 * 用 token 而不是 bg-white / text-white：后者会被管理端主题层的
 * [class*="bg-white"] !important 覆盖掉。
 */
export const SHELF_CHIP =
  'inline-flex h-8 w-8 items-center justify-center rounded-full border-transparent p-0 text-primary-foreground shadow-md backdrop-blur-sm transition-colors duration-200';

/** 书脊标签（书源 / 分类切换）：方角 + 选中时底部一道前景线。 */
export const SPINE_TAB =
  'relative shrink-0 whitespace-nowrap rounded-t-md px-3.5 pb-2.5 pt-2 text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

export const SPINE_TAB_ACTIVE =
  'bg-accent font-medium text-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:bg-foreground';

export const SPINE_TAB_IDLE =
  'text-muted-foreground hover:bg-accent/50 hover:text-foreground';

/** 阅读器：页面图像下方的衬底。 */
export const READER_CANVAS = 'bg-muted';

/** 同上，加载中的占位块。 */
export const READER_CANVAS_SKELETON = 'animate-pulse bg-muted';

/**
 * 阅读器里的浮层：设置面板、章节抽屉、章节读完弹窗。
 * 比书库面板多一层投影——这些浮层是压在翻页画布上的，需要和画布分开。
 */
export const READER_SHEET =
  'rounded-lg border border-border bg-card shadow-xl';

/**
 * 阅读器的分段选择（显示方式 / 缩放类型）。
 * 选中是实心，未选中也要有描边 + 底：两组选项都能点，
 * 只留纯文字的话，未选中那个看起来像说明文字而不像按钮。
 * 两种状态都保留 border（选中时与底色同色），切换时盒子尺寸不变、不跳动。
 */
export const READER_SEGMENT = cn(
  'cursor-pointer rounded-md border px-3 py-2 text-center text-sm transition-colors duration-200',
  LIBRARY_FOCUS
);
export const READER_SEGMENT_ACTIVE =
  'border-primary bg-primary font-medium text-primary-foreground';
export const READER_SEGMENT_IDLE =
  'border-border bg-background text-foreground hover:border-foreground hover:bg-accent';

/** 阅读器的滑块（图片间隔、字号、行距、语速），accent 跟着前景走。 */
export const READER_SLIDER = 'w-full cursor-pointer accent-foreground';

/**
 * 阅读器里的实心圆图标按钮（TTS 控制条那一排小键）。
 */
export const READER_ICON_BUTTON =
  'inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors duration-200 hover:bg-accent hover:text-foreground disabled:opacity-40';

/** 阅读器的圆形播放钮（TTS 主键）。尺寸由调用方给：h-10 w-10 / h-14 w-14。 */
export const READER_PLAY_BUTTON =
  'inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors duration-200 hover:bg-primary/90 disabled:opacity-50';

/** 压在图像上的读数胶囊（页码、进度提示）：前景半透 + 底色字。 */
export const READER_HUD = 'bg-foreground/75 text-background backdrop-blur-sm';

/** 章节读完之类的浮层提示气泡（悬停章节名）。 */
export const READER_TOOLTIP = 'bg-foreground text-background';
