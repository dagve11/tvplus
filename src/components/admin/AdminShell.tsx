'use client';

/**
 * AdminShell — admin 布局外壳（Phase 4 冻结件）。
 *
 * 桌面：竖排侧边栏（分组可折叠）+ 内容区；移动：Sheet 底部选择器。
 * navItems 注册表由 admin/page.tsx 注入（含 render() 闭包，捕获页级状态）。
 * ownerOnly 过滤在注册表注入前完成（page.tsx visibleNavItems）。
 */

import { useState } from 'react';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export type AdminNavItem = {
  key: string;
  title: string;
  icon: React.ReactNode;
  ownerOnly?: boolean;
  render?: () => React.ReactNode;
  children?: AdminNavItem[];
};

interface AdminShellProps {
  navItems: AdminNavItem[];
  activeKey: string;
  onSelect: (key: string) => void;
  expandedGroups: Record<string, boolean>;
  onToggleGroup: (key: string) => void;
  contentScrollRef?: React.MutableRefObject<HTMLDivElement | null>;
  renderActiveSection: () => React.ReactNode;
}

export function AdminShell({
  navItems,
  activeKey,
  onSelect,
  expandedGroups,
  onToggleGroup,
  contentScrollRef,
  renderActiveSection,
}: AdminShellProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  // 扁平化所有可选 section（含分组的子项），用于移动端选择器
  const flatItems: { key: string; label: string; icon: React.ReactNode }[] =
    [];
  for (const item of navItems) {
    if (item.children) {
      for (const child of item.children) {
        flatItems.push({
          key: child.key,
          label: `${item.title} / ${child.title}`,
          icon: child.icon,
        });
      }
    } else {
      flatItems.push({ key: item.key, label: item.title, icon: item.icon });
    }
  }
  const activeFlatItem = flatItems.find((it) => it.key === activeKey);

  const handleMobileSelect = (key: string) => {
    onSelect(key);
    setSheetOpen(false);
  };

  const renderNavButton = (item: AdminNavItem, isChild = false) => {
    const isActive = activeKey === item.key;
    const base =
      'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors';
    const childPad = isChild ? 'ml-3 pl-3 border-l border-border' : '';
    const cls = isActive
      ? `${base} bg-accent font-medium text-accent-foreground ${childPad}`
      : `${base} text-muted-foreground hover:bg-accent hover:text-accent-foreground ${childPad}`;
    return (
      <button key={item.key} onClick={() => onSelect(item.key)} className={cls}>
        {item.icon}
        <span className='min-w-0 flex-1 truncate text-left'>{item.title}</span>
        {isActive && <Check size={16} className='shrink-0' />}
      </button>
    );
  };

  return (
    <>
      {/* ===== 桌面：侧边栏 + 内容区 ===== */}
      <div className='hidden gap-6 lg:flex lg:h-[calc(100vh-7rem)]'>
        <nav className='h-full w-56 shrink-0 overflow-y-auto pr-1'>
          <div className='space-y-1'>
            {navItems.map((item) =>
              item.children ? (
                <div key={item.key}>
                  <button
                    onClick={() => onToggleGroup(item.key)}
                    className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent'
                  >
                    <span className='flex min-w-0 flex-1 items-center gap-2'>
                      {item.icon}
                      <span className='truncate'>{item.title}</span>
                    </span>
                    {expandedGroups[item.key] ? (
                      <ChevronUp size={16} className='shrink-0' />
                    ) : (
                      <ChevronDown size={16} className='shrink-0' />
                    )}
                  </button>
                  {expandedGroups[item.key] && (
                    <div className='mt-1 space-y-1'>
                      {item.children.map((child) => renderNavButton(child, true))}
                    </div>
                  )}
                </div>
              ) : (
                renderNavButton(item)
              )
            )}
          </div>
        </nav>

        <div
          ref={contentScrollRef}
          className='h-full min-w-0 flex-1 overflow-y-auto pr-1'
        >
          {renderActiveSection()}
        </div>
      </div>

      {/* ===== 移动端：Sheet 底部选择器 ===== */}
      <div className='lg:hidden'>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <button className='mb-4 flex w-full items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium text-foreground'>
              <span className='flex min-w-0 flex-1 items-center gap-2'>
                {activeFlatItem?.icon}
                <span className='truncate'>{activeFlatItem?.label}</span>
              </span>
              <ChevronDown size={16} className='shrink-0 text-muted-foreground' />
            </button>
          </SheetTrigger>
          <SheetContent side='bottom' className='max-h-[70vh] overflow-y-auto'>
            <SheetHeader>
              <SheetTitle>选择管理区块</SheetTitle>
            </SheetHeader>
            <div className='space-y-1 px-4 pb-6'>
              {flatItems.map((it) => {
                const isActive = it.key === activeKey;
                return (
                  <button
                    key={it.key}
                    onClick={() => handleMobileSelect(it.key)}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                      isActive
                        ? 'bg-accent font-medium text-accent-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    {it.icon}
                    <span className='min-w-0 flex-1 truncate text-left'>
                      {it.label}
                    </span>
                    {isActive && <Check size={16} className='shrink-0' />}
                  </button>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>

        {/* 当前选中的 section 内容 */}
        <div>{renderActiveSection()}</div>
      </div>
    </>
  );
}
