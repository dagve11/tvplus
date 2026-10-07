'use client';

import { ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { cn } from '@/lib/cn';

import { READER_TOOLTIP } from '@/components/media/library';

export interface TocItem {
  id?: string;
  label: string;
  href: string;
  subitems?: TocItem[];
}

/** 平铺模式的一项（Legado 章节源）。 */
export interface FlatChapterItem {
  key: string;
  title: string;
  active: boolean;
}

interface BaseProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TreeProps extends BaseProps {
  /** EPUB 树形目录。 */
  tocItems: TocItem[];
  currentHref: string;
  /**
   * 点击可跳转的叶子章节时回调（父组件负责持久化进度 + 跳转）。
   * 面板内部处理展开/收起与点击关闭。
   */
  onNavigate: (href: string) => void;
  chapters?: never;
  onSelectChapter?: never;
}

interface FlatProps extends BaseProps {
  /** Legado 章节源：平铺列表，无层级。 */
  chapters: FlatChapterItem[];
  onSelectChapter: (index: number) => void;
  tocItems?: never;
  currentHref?: never;
  onNavigate?: never;
}

export type ChapterListPanelProps = TreeProps | FlatProps;

function tocItemIsActive(item: TocItem, currentHref: string): boolean {
  return (
    isSameTocTarget(currentHref, item.href) ||
    (item.subitems || []).some((subitem) =>
      tocItemIsActive(subitem, currentHref)
    )
  );
}

/**
 * 章节 href 归一化：去锚点/查询串、反斜杠转正、剥掉开头的 ./ 与 /，
 * EPUB 各处的 href 写法不一致（toc、spine、cfi 各一套），比较前必须过一遍。
 */
export function normalizeHrefForMatch(href?: string) {
  if (!href) return '';
  try {
    const normalized = decodeURIComponent(href).replace(/\\/g, '/').trim();
    return normalized
      .split('#')[0]
      .split('?')[0]
      .replace(/^\.\//, '')
      .replace(/^\//, '');
  } catch {
    return href
      .split('#')[0]
      .split('?')[0]
      .replace(/^\.\//, '')
      .replace(/^\//, '')
      .trim();
  }
}

/** 两个 href 是否指向同一章节：归一化后相等或互为后缀（OPF 相对路径差一级也能命中）。 */
export function isSameTocTarget(currentHref?: string, tocHref?: string) {
  const current = normalizeHrefForMatch(currentHref);
  const target = normalizeHrefForMatch(tocHref);
  if (!current || !target) return false;
  return (
    current === target || current.endsWith(target) || target.endsWith(current)
  );
}

export function flattenToc(items: TocItem[]): TocItem[] {
  return items.flatMap((item) => [item, ...flattenToc(item.subitems || [])]);
}

/**
 * 章节抽屉（EPUB 树形目录 + Legado 平铺章节共用）。
 *
 * 树形模式自带：卷的展开/收起（默认收起，当前章所在卷自动摊开）、
 * 高亮自动滚动到可视区、悬停气泡。平铺模式就是一张按钮列表。
 * 两种模式共用同一层抽屉外壳（右侧滑出、遮罩点击关闭），只是内容渲染不同。
 */
export default function ChapterListPanel(props: ChapterListPanelProps) {
  const { open, onOpenChange } = props;
  // 判别联合按属性是否存在归一化成局部变量，TS 无法透过别名 boolean 做收窄。
  const isTree = Array.isArray(props.tocItems);
  const tocItems: TocItem[] = Array.isArray(props.tocItems)
    ? props.tocItems
    : [];
  const chapters: FlatChapterItem[] = Array.isArray(props.chapters)
    ? props.chapters
    : [];
  const currentHref: string =
    typeof props.currentHref === 'string' ? props.currentHref : '';
  const onNavigate = props.onNavigate;
  const onSelectChapter = props.onSelectChapter;

  // 树形模式独占：手动展开/收起的覆盖表，换章时清空（当前卷自动摊开）。
  const [tocExpandOverrides, setTocExpandOverrides] = useState<
    Record<string, boolean>
  >({});
  const tocScrollRef = useRef<HTMLDivElement | null>(null);
  const tocItemRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    if (!isTree) return;
    setTocExpandOverrides((prev) =>
      Object.keys(prev).length === 0 ? prev : {}
    );
  }, [isTree, currentHref]);

  const activeTocHref = isTree
    ? flattenToc(tocItems).find((item) =>
        isSameTocTarget(currentHref, item.href)
      )?.href || ''
    : '';

  useEffect(() => {
    if (!open || !activeTocHref) return;
    const activeNode = tocItemRefs.current[activeTocHref];
    if (!activeNode) return;
    activeNode.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [open, activeTocHref]);

  const renderTocItems = useCallback(
    (items: TocItem[], depth = 0): React.ReactNode =>
      items.map((item, index) => {
        const key = `${item.href || item.label}-${depth}-${index}`;
        const active = tocItemIsActive(item, currentHref);
        const children = item.subitems || [];
        const expandable = children.length > 0;
        // 卷默认收起来，只有当前章节所在的那一卷摊开；手动开合过的按手动的来。
        const expanded = expandable
          ? tocExpandOverrides[key] ?? active
          : false;
        const clickable = !!item.href;
        return (
          <div key={key} className='space-y-2'>
            <button
              ref={(node) => {
                if (!item.href) return;
                // 折叠会把子项卸载掉，别把已经不在页面上的节点留在表里。
                if (node) tocItemRefs.current[item.href] = node;
                else delete tocItemRefs.current[item.href];
              }}
              type='button'
              aria-expanded={expandable ? expanded : undefined}
              onClick={() => {
                if (expandable) {
                  setTocExpandOverrides((prev) => ({
                    ...prev,
                    [key]: !expanded,
                  }));
                  return;
                }
                if (!clickable) return;
                onNavigate?.(item.href);
                onOpenChange(false);
              }}
              disabled={!expandable && !clickable}
              className={`group relative flex w-full items-center gap-2 rounded-md border px-4 py-3 text-left text-sm transition-colors duration-200 ${
                expandable
                  ? `font-medium ${
                      active
                        ? 'border-foreground text-foreground'
                        : 'border-border text-foreground hover:bg-accent'
                    }`
                  : active
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border text-foreground hover:bg-accent hover:text-foreground'
              } ${!expandable && !clickable ? 'cursor-default opacity-80' : ''}`}
              style={{ paddingLeft: `${16 + depth * 14}px` }}
            >
              {expandable ? (
                <ChevronRight
                  className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                    expanded ? 'rotate-90' : ''
                  }`}
                />
              ) : null}
              <span className='min-w-0 flex-1 truncate'>{item.label}</span>
              <div
                className={cn(
                  'pointer-events-none absolute bottom-full left-1/2 z-sticky mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg px-3 py-2 text-sm opacity-0 invisible shadow-xl transition-all duration-200 ease-out group-hover:visible group-hover:opacity-100',
                  READER_TOOLTIP
                )}
              >
                <div className='text-sm'>{item.label}</div>
              </div>
            </button>
            {expandable && expanded ? (
              <div className='ml-2 space-y-2 border-l border-border pl-2'>
                {renderTocItems(children, depth + 1)}
              </div>
            ) : null}
          </div>
        );
      }),
    [currentHref, onNavigate, onOpenChange, tocExpandOverrides]
  );

  if (!open || typeof document === 'undefined') return null;

  const body = isTree ? (
    <div className='p-4'>
      <div className='space-y-2' ref={tocScrollRef}>
        {tocItems.length === 0 ? (
          <div className='p-3 text-sm text-muted-foreground'>
            当前 EPUB 未提供目录
          </div>
        ) : (
          renderTocItems(tocItems)
        )}
      </div>
    </div>
  ) : (
    <div className='space-y-2 p-4'>
      {chapters.map((item, index) => (
        <button
          key={item.key}
          type='button'
          onClick={() => {
            onSelectChapter?.(index);
            onOpenChange(false);
          }}
          className={`block w-full rounded-md border px-4 py-3 text-left text-sm transition-colors duration-200 ${
            item.active
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border text-foreground hover:bg-accent hover:text-foreground'
          }`}
          title={item.title}
        >
          {item.title}
        </button>
      ))}
    </div>
  );

  return createPortal(
    <div
      className='fixed inset-0 z-40 bg-black/30'
      onClick={() => onOpenChange(false)}
    >
      <div
        className='absolute right-0 top-0 h-screen w-[22rem] max-w-[88vw] overflow-y-auto border-l border-border bg-card shadow-xl'
        onClick={(event) => event.stopPropagation()}
      >
        {body}
      </div>
    </div>,
    document.body
  );
}
