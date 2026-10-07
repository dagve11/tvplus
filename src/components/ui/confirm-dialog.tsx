'use client';

// 兼容垫片：旧 ConfirmDialog API → shadcn AlertDialog，消费方迁移完成后删除

import { AlertTriangle } from 'lucide-react';

import { cn } from '@/lib/cn';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './alert-dialog';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = '确定',
  cancelText = '取消',
  onConfirm,
  onCancel,
  variant = 'warning',
}: ConfirmDialogProps) {
  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(open) => {
        // 遮罩点击 / Esc → 等价旧组件的 onCancel。
        // 确认/取消按钮的点击通过 e.preventDefault() 拦截了 Radix 的自动关闭，
        // 所以这里收到的 close 事件只可能来自遮罩或 Esc。
        if (!open) onCancel();
      }}
    >
      <AlertDialogContent className='max-w-md'>
        <AlertDialogHeader>
          <div className='flex items-center gap-3'>
            <AlertTriangle
              className={cn(
                'h-6 w-6 shrink-0',
                variant === 'danger'
                  ? 'text-destructive'
                  : 'text-muted-foreground'
              )}
            />
            <AlertDialogTitle>{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className='whitespace-pre-line'>
            {message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={(e) => {
              // 旧组件取消按钮不自行关闭，由消费方置 isOpen=false
              e.preventDefault();
              onCancel();
            }}
          >
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              // 旧组件确认按钮不自行关闭，由消费方置 isOpen=false；
              // 否则会重复触发 onOpenChange(false) → onCancel。
              e.preventDefault();
              onConfirm();
            }}
            className={cn(
              variant === 'danger'
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            )}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
