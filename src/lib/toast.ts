// 兼容垫片：旧 Toast API → shadcn sonner，消费方迁移完成后删除

import { toast } from 'sonner';

export type ToastType = 'success' | 'error' | 'info';

const DEFAULT_DURATION = 4000;

/** 旧组件默认 3s 自动消失；sonner 侧统一 4s，图标由 sonner 内置 */
export function showToast(message: string, type: ToastType = 'info'): void {
  switch (type) {
    case 'success':
      toast.success(message, { duration: DEFAULT_DURATION });
      break;
    case 'error':
      toast.error(message, { duration: DEFAULT_DURATION });
      break;
    default:
      toast(message, { duration: DEFAULT_DURATION });
      break;
  }
}

export function showSuccess(message: string): void {
  showToast(message, 'success');
}

export function showError(message: string): void {
  showToast(message, 'error');
}
