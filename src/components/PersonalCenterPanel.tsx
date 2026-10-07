'use client';

import { Bell, KeyRound, Monitor, X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface PersonalCenterPanelProps {
  isOpen: boolean;
  mounted: boolean;
  onClose: () => void;
  username: string;
  roleText: string;
  showRoleBadge: boolean;
  avatarText: string;
  roleBadgeClassName: string;
  showDeviceManagement: boolean;
  showChangePassword: boolean;
  onOpenEmailSettings: () => void;
  onOpenDeviceManagement: () => void;
  onOpenChangePassword: () => void;
}

export function PersonalCenterPanel({
  isOpen,
  mounted,
  onClose,
  username,
  roleText,
  showRoleBadge,
  avatarText,
  roleBadgeClassName,
  showDeviceManagement,
  showChangePassword,
  onOpenEmailSettings,
  onOpenDeviceManagement,
  onOpenChangePassword,
}: PersonalCenterPanelProps) {
  if (!isOpen || !mounted) return null;

  return createPortal(
    <>
      <div
        className='fixed inset-0 bg-black/50 backdrop-blur-sm z-modal'
        onClick={onClose}
        onTouchMove={(e) => {
          e.preventDefault();
        }}
        onWheel={(e) => {
          e.preventDefault();
        }}
        style={{ touchAction: 'none' }}
      />

      <div className='fixed top-1/2 left-1/2 z-popover w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl bg-card shadow-xl'>
        <div
          className='p-6'
          data-panel-content
          onTouchMove={(e) => {
            e.stopPropagation();
          }}
          style={{ touchAction: 'auto' }}
        >
          <div className='relative mb-6 flex flex-col items-center text-center'>
            <button
              onClick={onClose}
              className='absolute right-0 top-0 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent'
              aria-label='Close'
            >
              <X className='w-5 h-5' />
            </button>
            <div className='mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-primary text-3xl font-semibold text-primary-foreground shadow-md'>
              {avatarText}
            </div>
            {showRoleBadge && (
              <span
                className={`mb-2 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${roleBadgeClassName}`}
              >
                {roleText}
              </span>
            )}
            <h3 className='text-xl font-bold text-foreground'>
              {username}
            </h3>
          </div>

          <div className='space-y-3'>
            <button
              onClick={onOpenEmailSettings}
              className='flex w-full items-center gap-3 rounded-2xl border border-border bg-muted px-4 py-4 text-left transition-colors hover:bg-accent'
            >
              <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-secondary-foreground'>
                <Bell className='w-6 h-6' />
              </div>
              <div>
                <div className='text-base font-semibold text-foreground'>
                  通知设置
                </div>
                <div className='mt-1 text-sm text-muted-foreground'>
                  管理邮件通知和浏览器系统通知
                </div>
              </div>
            </button>

            {showDeviceManagement && (
              <button
                onClick={onOpenDeviceManagement}
                className='flex w-full items-center gap-3 rounded-2xl border border-border bg-muted px-4 py-4 text-left transition-colors hover:bg-accent'
              >
                <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-secondary-foreground'>
                  <Monitor className='w-6 h-6' />
                </div>
                <div>
                  <div className='text-base font-semibold text-foreground'>
                    设备管理
                  </div>
                  <div className='mt-1 text-sm text-muted-foreground'>
                    查看并管理当前账号的登录设备
                  </div>
                </div>
              </button>
            )}

            {showChangePassword && (
              <button
                onClick={onOpenChangePassword}
                className='flex w-full items-center gap-3 rounded-2xl border border-border bg-muted px-4 py-4 text-left transition-colors hover:bg-accent'
              >
                <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-secondary-foreground'>
                  <KeyRound className='w-6 h-6' />
                </div>
                <div>
                  <div className='text-base font-semibold text-foreground'>
                    修改密码
                  </div>
                  <div className='mt-1 text-sm text-muted-foreground'>
                    修改当前账号密码
                  </div>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
