'use client';

/**
 * Admin 共享视觉/交互地基（Phase 4 冻结件）。
 *
 * 拆 admin/page.tsx（19,977 行）时所有 section 统一从这里取：
 * - adminButtonStyles：buttonStyles 的 drop-in 字符串映射（key 不变，
 *   值换 token 类）。彩色键按单色规则收敛：success/warning 并入
 *   primary/secondary，danger 保留 destructive（唯一允许的彩色）。
 * - useAdminAlert：替换旧 useAlertModal（admin/page.tsx:278），
 *   基于 AlertDialog，showAlert 调用签名保持完全一致。
 * - showError/showSuccess：从 @/lib/toast 转口。
 * - AdminField：Label + 控件 + 提示行的标准排布。
 * - adminTableStyles：表格骨架 token 类（thead 吸顶、行 hover 等）。
 */

import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { useCallback, useState } from 'react';

import { cn } from '@/lib/cn';
import { showError, showSuccess, showToast } from '@/lib/toast';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';

export { showError, showSuccess, showToast };

/* ----------------------------- 按钮样式 ----------------------------- */

const BTN_BASE =
  'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors';
const BTN_SMALL =
  'px-2 py-1 text-xs font-medium rounded-md transition-colors';
const BTN_ROUNDED =
  'inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-colors';

export const adminButtonStyles = {
  // 主要操作
  primary: `${BTN_BASE} bg-primary text-primary-foreground hover:bg-primary/90`,
  // 原绿色（添加/启用/保存）→ 单色化后并入 primary
  success: `${BTN_BASE} bg-primary text-primary-foreground hover:bg-primary/90`,
  // 危险操作（唯一允许的彩色）
  danger: `${BTN_BASE} bg-destructive text-destructive-foreground hover:bg-destructive/90`,
  // 次要操作
  secondary: `${BTN_BASE} bg-secondary text-secondary-foreground hover:bg-secondary/80`,
  // 原黄色（批量禁用）→ 并入 secondary
  warning: `${BTN_BASE} bg-secondary text-secondary-foreground hover:bg-secondary/80`,
  primarySmall: `${BTN_SMALL} bg-primary text-primary-foreground hover:bg-primary/90`,
  successSmall: `${BTN_SMALL} bg-primary text-primary-foreground hover:bg-primary/90`,
  dangerSmall: `${BTN_SMALL} bg-destructive text-destructive-foreground hover:bg-destructive/90`,
  secondarySmall: `${BTN_SMALL} bg-secondary text-secondary-foreground hover:bg-secondary/80`,
  warningSmall: `${BTN_SMALL} bg-secondary text-secondary-foreground hover:bg-secondary/80`,
  // 表格操作小胶囊
  roundedPrimary: `${BTN_ROUNDED} bg-muted text-foreground hover:bg-accent`,
  roundedSuccess: `${BTN_ROUNDED} bg-muted text-foreground hover:bg-accent`,
  roundedDanger: `${BTN_ROUNDED} bg-destructive/10 text-destructive hover:bg-destructive/20`,
  roundedSecondary: `${BTN_ROUNDED} bg-muted text-muted-foreground hover:bg-accent hover:text-foreground`,
  roundedWarning: `${BTN_ROUNDED} bg-muted text-muted-foreground hover:bg-accent hover:text-foreground`,
  roundedPurple: `${BTN_ROUNDED} bg-muted text-foreground hover:bg-accent`,
  // 禁用态
  disabled: `${BTN_BASE} bg-muted text-muted-foreground cursor-not-allowed`,
  disabledSmall: `${BTN_SMALL} bg-muted text-muted-foreground cursor-not-allowed`,
  // 开关（滑动式，非 Switch 组件的存量调用点）
  toggleOn: 'bg-primary',
  toggleOff: 'bg-input',
  toggleThumb: 'bg-background',
  toggleThumbOn: 'translate-x-6',
  toggleThumbOff: 'translate-x-1',
  // 快速操作
  quickAction: `${BTN_SMALL} border border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground`,
};

/* ----------------------------- 告警弹窗 ----------------------------- */

export interface AdminAlertConfig {
  type: 'success' | 'error' | 'warning';
  title: string;
  message?: string;
  timer?: number;
  showConfirm?: boolean;
  onConfirm?: () => void;
}

/**
 * 旧 useAlertModal 的等价物。调用方渲染返回的 `alertElement`（一次即可），
 * 用 showAlert({type,title,message,...}) 触发——签名与旧版逐字段一致。
 */
export const useAdminAlert = () => {
  const [alert, setAlert] = useState<AdminAlertConfig & { isOpen: boolean }>({
    isOpen: false,
    type: 'success',
    title: '',
  });

  const showAlert = useCallback((config: AdminAlertConfig) => {
    setAlert({ ...config, isOpen: true });
  }, []);

  const hideAlert = useCallback(() => {
    setAlert((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const alertElement = (
    <AlertDialog
      open={alert.isOpen}
      onOpenChange={(open) => {
        if (!open) hideAlert();
      }}
    >
      <AlertDialogContent className='max-w-md'>
        <AlertDialogHeader>
          <div className='flex items-center gap-3'>
            {alert.type === 'error' ? (
              <AlertTriangle className='h-6 w-6 shrink-0 text-destructive' />
            ) : alert.type === 'success' ? (
              <CheckCircle2 className='h-6 w-6 shrink-0 text-foreground' />
            ) : (
              <Info className='h-6 w-6 shrink-0 text-muted-foreground' />
            )}
            <AlertDialogTitle>{alert.title}</AlertDialogTitle>
          </div>
          {alert.message && (
            <AlertDialogDescription className='whitespace-pre-line'>
              {alert.message}
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction
            className={cn(
              adminButtonStyles.primary,
              alert.type === 'error' && adminButtonStyles.danger
            )}
            onClick={() => {
              alert.onConfirm?.();
              hideAlert();
            }}
          >
            确定
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return { alertModal: alert, showAlert, hideAlert, alertElement };
};

/* ----------------------------- 表单字段 ----------------------------- */

/** Label + 控件 + 说明行的标准排布。 */
export const AdminField = ({
  label,
  hint,
  children,
  htmlFor,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  htmlFor?: string;
}) => (
  <div className='space-y-2'>
    <Label htmlFor={htmlFor}>{label}</Label>
    {children}
    {hint && <p className='text-xs text-muted-foreground'>{hint}</p>}
  </div>
);

/* ----------------------------- 表格样式 ----------------------------- */

export const adminTableStyles = {
  table: 'min-w-full divide-y divide-border',
  thead: 'bg-muted/50 sticky top-0 z-10',
  th: 'px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider',
  thRight:
    'px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider',
  td: 'px-6 py-4 whitespace-nowrap text-sm text-foreground',
  tdMuted: 'px-6 py-4 whitespace-nowrap text-sm text-muted-foreground',
  row: 'hover:bg-accent/50 transition-colors',
};
