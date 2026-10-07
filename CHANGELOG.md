# Changelog

本项目所有重要变更记录于此。格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased] — UI 全量重构（refactor/ui 分支）

彻底抛弃旧 UI 体系，基于 shadcn/ui 原生组件 + 纯黑白单色设计全量重构。覆盖主站前台、admin 后台、TV 模式、观影室与全部信息架构。**所有 URL 不变**（android-tv webview、middleware、浏览器扩展指纹均依赖现有路由）。后端 API（`src/app/api/**`）与业务逻辑（`src/lib/**`）零改动。

### 技术栈

- Tailwind v3 + Next.js 14 保持不变
- shadcn/ui（new-york、zinc baseColor、CSS 变量驱动），CLI 锁定 2.10.0
- 30+ shadcn 原语：button/input/select/switch/slider/dialog/sheet/popover/dropdown-menu/tabs/card/badge/skeleton/tooltip/alert-dialog/toggle-group/sonner 等
- 兼容垫片：`ui/confirm-dialog.tsx`、`ui/app-sheet.tsx`、`ui/action-sheet.tsx`、`src/lib/toast.ts`（showToast/showSuccess/showError 包 sonner），旧 API 调用点懒迁移后垫片保留

### 设计系统 — 黑白单色

- **纯灰阶 token**：`bg-background` / `text-foreground` / `bg-card` / `border-border` / `bg-muted` / `text-muted-foreground` / `bg-primary`（暗色近白、亮色近黑的反色主按钮）/ `bg-accent`
- **零色相强调色**；唯一彩色例外是 `destructive`（语义必需的低饱和红，用于删除/错误/危险操作）
- focus ring 统一 `ring-ring`（zinc 档）
- z-index 语义刻度：`z-sticky(20)` / `z-header(30)` / `z-nav(30)` / `z-drawer(40)` / `z-modal(50)` / `z-popover(60)` / `z-toast(70)`，全库 `z-[9999]` 类字面值清零（冻结件除外）
- 书库/漫画/音乐区统一并入单色系统（区域气质靠衬线字体、字重、排版保留）
- 7 套运行时内置主题由暴力类名覆盖（`[class*="bg-white"] !important`）移植为纯 CSS 变量驱动，`/api/theme/css` 输出纯变量 CSS

### 拆分与重构

- **admin**：19,977 行单文件 → 989 行注册表 + `src/components/admin/sections/` 23 个独立节组件；`AdminShell`（桌面侧边栏分组折叠 + 移动 Sheet 选择器）单一 navItems 注册表，消灭双份硬编码导航；`shared.tsx` 冻结地基（adminButtonStyles/useAdminAlert/useLoadingState/AdminField/adminTableStyles）
- **play**：12,416 行单文件 → 页面注册表 + `src/components/play/`（`use-art-player.ts` 纯配置函数 64KB 管 ArtPlayer 生命周期、`VideoHeader`/`PlayToolbar`（6 外部播放器数据驱动）/`MediaInfoSection`/`DanmakuSourceSelector`/`ShortcutDialog`），面板/引擎/chrome 分四子步抽离
- **UserMenu**：6,338 行 → DropdownMenu 宿主 + `src/components/user-panels/` 12 个面板懒加载
- **导航**：navItems 构建器单一消费 RUNTIME_CONFIG 特性开关，重建 Sidebar/MobileBottomNav/MobileHeader/PageLayout

### 清理

- 删除死依赖：`@headlessui/react`、`framer-motion`、`swiper`、`@vidstack/react`、`vidstack`、`media-icons`、`react-icons`、`@heroicons/react`（零运行时引用，全量 grep 验证）
- tailwind.config 删除 library.*/music 材质色板与 sky/dark 色标（零引用）；保留 `music.theme` 运行时主题桥
- 删除旧文件：`CapsuleSwitch.tsx`、`Drawer.tsx`、`MobileActionSheet.tsx`、旧 `Toast` 体系
- 下拉/弹层（pansou 云筛选、private-library 排序等）从手写定位 createPortal 迁移 shadcn Popover

### 兼容性

- TV 模式焦点契约零变更（`data-tv-focus-*` 属性计数不变、`focusableSelector` 语义化标签天然兼容）；`TVVirtualRemote.tsx` / `TVNativeVideo.tsx` 逻辑冻结未触碰
- ArtPlayer 引擎及插件生态（jassub/libass-wasm、anime4k、hls.js/flv.js、弹幕 canvas）原样保留
- @dnd-kit 拖拽排序（admin 视频源/音乐歌单）原样保留
- 移动端触摸行为（长按/滑动/安全区 viewport-fit=cover）保留

### 已知事项

- 构建期 tsc 类型检查临时关闭（`next.config.js` `typescript.ignoreBuildErrors`），合入主线前需恢复（900MB 内存环境全量 tsc OOM 所致，scoped tsc 逐包验证中）
- `RUNTIME_CONFIG` 全局类型声明集中化、`FileSystemDirectoryHandle.values`、`opencc-js` 类型为存量类型债，不在本次范围
- 约 20 个手写 overlay（EpisodeSelector/CorrectDialog/UserConfig/各 user-panels 等）仍用 createPortal + 自管 backdrop/scroll-lock：视觉已全部单色化、z 已语义化，但**结构未迁移 shadcn Dialog/Sheet**。focus-trap/滚动锁定/动画一致性迁移为后续专项（Phase 6 级，回归成本高，刻意拆分）。下拉类（pansou/排序/高级筛选）已迁 Popover
