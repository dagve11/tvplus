/* eslint-disable no-console,@typescript-eslint/no-explicit-any */

'use client';

import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogout: () => Promise<void>;
}

export const ChangePasswordDialog = ({
  open,
  onOpenChange,
  onLogout,
}: ChangePasswordDialogProps) => {
  // 修改密码相关状态
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // 打开时重置表单（原 UserMenu handleChangePassword 行为）
  useEffect(() => {
    if (open) {
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError('');
    }
  }, [open]);

  const handleCloseInternal = () => {
    onOpenChange(false);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
  };
  const handleSubmitChangePassword = async () => {
    setPasswordError('');

    // 验证密码
    if (!newPassword) {
      setPasswordError('新密码不得为空');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('两次输入的密码不一致');
      return;
    }

    setPasswordLoading(true);

    try {
      const response = await fetch('/api/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setPasswordError(data.error || '修改密码失败');
        return;
      }

      // 修改成功，关闭弹窗并登出
      onOpenChange(false);
      await onLogout();
    } catch (error) {
      setPasswordError('网络错误，请稍后重试');
    } finally {
      setPasswordLoading(false);
    }
  };


  if (!open) return null;
  return createPortal(
    <>
      {/* 背景遮罩 */}
      <div
        className='fixed inset-0 bg-black/50 backdrop-blur-sm z-modal'
        onClick={handleCloseInternal}
        onTouchMove={(e) => {
          // 只阻止滚动，允许其他触摸事件
          e.preventDefault();
        }}
        onWheel={(e) => {
          // 阻止滚轮滚动
          e.preventDefault();
        }}
        style={{
          touchAction: 'none',
        }}
      />

      {/* 修改密码面板 */}
      <div className='fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card rounded-xl shadow-xl z-popover overflow-hidden'>
        {/* 内容容器 - 独立的滚动区域 */}
        <div
          className='h-full p-6'
          data-panel-content
          onTouchMove={(e) => {
            // 阻止事件冒泡到遮罩层，但允许内部滚动
            e.stopPropagation();
          }}
          style={{
            touchAction: 'auto', // 允许所有触摸操作
          }}
        >
          {/* 标题栏 */}
          <div className='flex items-center justify-between mb-6'>
            <h3 className='text-xl font-bold text-foreground'>
              修改密码
            </h3>
            <button
              onClick={handleCloseInternal}
              className='w-8 h-8 p-1 rounded-full flex items-center justify-center text-muted-foreground hover:bg-accent transition-colors'
              aria-label='Close'
            >
              <X className='w-full h-full' />
            </button>
          </div>

          {/* 表单 */}
          <div className='space-y-4'>
            {/* 新密码输入 */}
            <div>
              <label className='block text-sm font-medium text-foreground mb-2'>
                新密码
              </label>
              <input
                type='password'
                className='w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors bg-background text-foreground placeholder:text-muted-foreground'
                placeholder='请输入新密码'
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={passwordLoading}
              />
            </div>

            {/* 确认密码输入 */}
            <div>
              <label className='block text-sm font-medium text-foreground mb-2'>
                确认密码
              </label>
              <input
                type='password'
                className='w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors bg-background text-foreground placeholder:text-muted-foreground'
                placeholder='请再次输入新密码'
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={passwordLoading}
              />
            </div>

            {/* 错误信息 */}
            {passwordError && (
              <div className='text-destructive text-sm bg-destructive/10 p-3 rounded-md border border-destructive/30'>
                {passwordError}
              </div>
            )}
          </div>

          {/* 操作按钮 */}
          <div className='flex gap-3 mt-6 pt-4 border-t border-border'>
            <button
              onClick={handleCloseInternal}
              className='flex-1 px-4 py-2 text-sm font-medium text-secondary-foreground bg-secondary hover:bg-secondary/80 rounded-md transition-colors'
              disabled={passwordLoading}
            >
              取消
            </button>
            <button
              onClick={handleSubmitChangePassword}
              className='flex-1 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
              disabled={passwordLoading || !newPassword || !confirmPassword}
            >
              {passwordLoading ? '修改中...' : '确认修改'}
            </button>
          </div>

          {/* 底部说明 */}
          <div className='mt-4 pt-4 border-t border-border'>
            <p className='text-xs text-muted-foreground text-center'>
              修改密码后需要重新登录
            </p>
          </div>
        </div>
      </div>
    </>
, document.body
  );
};
