'use client';

import { AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { adminButtonStyles } from '@/components/admin/shared';

export interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'success' | 'error' | 'warning';
  title: string;
  message?: string;
  timer?: number;
  showConfirm?: boolean;
  onConfirm?: () => void;
}

export const AlertModal = ({
  isOpen,
  onClose,
  type,
  title,
  message,
  timer,
  showConfirm = false,
  onConfirm,
}: AlertModalProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      if (timer) {
        setTimeout(() => {
          onClose();
        }, timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [isOpen, timer, onClose]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className='w-8 h-8 text-foreground' />;
      case 'error':
        return <AlertCircle className='w-8 h-8 text-destructive' />;
      case 'warning':
        return <AlertTriangle className='w-8 h-8 text-muted-foreground' />;
      default:
        return null;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-muted border-border';
      case 'error':
        return 'bg-destructive/10 border-destructive/30';
      case 'warning':
        return 'bg-muted/50 border-border';
      default:
        return 'bg-muted border-border';
    }
  };

  return createPortal(
    <div
      className={`fixed inset-0 bg-black/50 z-modal flex items-center justify-center p-4 transition-opacity duration-200 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div
        className={`bg-card  rounded-lg shadow-xl max-w-sm w-full border ${getBgColor()} transition-all duration-200 ${
          isVisible ? 'scale-100' : 'scale-95'
        }`}
      >
        <div className='p-6 text-center'>
          <div className='flex justify-center mb-4'>{getIcon()}</div>

          <h3 className='text-lg font-semibold text-foreground mb-2'>
            {title}
          </h3>

          {message && (
            <p className='text-foreground mb-4'>{message}</p>
          )}

          {showConfirm ? (
            onConfirm ? (
              // 确认操作：显示取消和确定按钮
              <div className='flex gap-3 justify-center'>
                <button
                  onClick={() => {
                    onClose();
                  }}
                  className={adminButtonStyles.secondary}
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    if (onConfirm) onConfirm();
                    // 不要在这里调用onClose，让onConfirm自己决定何时关闭
                  }}
                  className={adminButtonStyles.danger}
                >
                  确定
                </button>
              </div>
            ) : (
              // 普通提示：只显示确定按钮
              <button onClick={onClose} className={adminButtonStyles.primary}>
                确定
              </button>
            )
          ) : timer ? null : (
            // 既没有确认框、也没有自动关闭定时器时兜底一个关闭按钮，
            // 否则这类提示弹窗没有任何关闭途径（点背景也不关）。
            <button onClick={onClose} className={adminButtonStyles.primary}>
              确定
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
