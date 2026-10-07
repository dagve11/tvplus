'use client';

import { useEffect, useState } from 'react';

import { getAuthInfoFromBrowserCookie } from '@/lib/auth';
import { UpdateStatus } from '@/lib/version_check';

import { useVersionCheck } from './VersionCheckProvider';
import { VersionPanel } from './VersionPanel';

export const UpdateNotification: React.FC = () => {
  const { updateStatus, isChecking } = useVersionCheck();
  const [isOwner, setIsOwner] = useState(false);
  const [isVersionPanelOpen, setIsVersionPanelOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // 检查认证信息
    const authInfo = getAuthInfoFromBrowserCookie();
    setIsOwner(authInfo?.role === 'owner');

    // 检查是否是移动设备
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 检查中、不是站长、是移动设备或没有更新时不渲染任何内容
  if (isChecking || !isOwner || isMobile || updateStatus !== UpdateStatus.HAS_UPDATE) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setIsVersionPanelOpen(true)}
        className='flex items-center px-3 py-1.5 bg-secondary border border-border rounded-full hover:bg-secondary/80 transition-colors cursor-pointer'
      >
        <span className='text-xs font-medium text-secondary-foreground'>
          有更新
        </span>
      </button>

      {/* 版本面板 */}
      <VersionPanel
        isOpen={isVersionPanelOpen}
        onClose={() => setIsVersionPanelOpen(false)}
      />
    </>
  );
};
