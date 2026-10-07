'use client';

import { AlertCircle, CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

import { CURRENT_VERSION } from '@/lib/version';
import { checkForUpdates, UpdateStatus } from '@/lib/version_check';

/**
 * 认证页底部版本号 + 更新状态。
 * 从原 login/register 页内重复定义的 VersionDisplay 提取而来，
 * 逻辑保持一致，配色改为单色 token（无彩色强调）。
 */
export function AuthVersionDisplay() {
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkUpdate = async () => {
      try {
        const status = await checkForUpdates();
        setUpdateStatus(status);
      } catch (_) {
        // do nothing
      } finally {
        setIsChecking(false);
      }
    };

    checkUpdate();
  }, []);

  return (
    <button
      onClick={() =>
        window.open('https://github.com/mtvpls/MoonTVPlus', '_blank')
      }
      className='absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 cursor-pointer items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground'
    >
      <span className='font-mono'>v{CURRENT_VERSION}</span>
      {!isChecking && updateStatus !== UpdateStatus.FETCH_FAILED && (
        <span className='flex items-center gap-1.5'>
          {updateStatus === UpdateStatus.HAS_UPDATE && (
            <>
              <AlertCircle className='h-3.5 w-3.5' />
              <span className='text-xs font-semibold text-foreground'>
                有新版本
              </span>
            </>
          )}
          {updateStatus === UpdateStatus.NO_UPDATE && (
            <>
              <CheckCircle className='h-3.5 w-3.5' />
              <span className='text-xs font-semibold'>已是最新</span>
            </>
          )}
        </span>
      )}
    </button>
  );
}
