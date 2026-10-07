'use client';

import { Monitor, MonitorPlay, Users } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { showToast } from '@/lib/toast';
import { useWatchRoomContext } from '@/components/WatchRoomProvider';
import { screenShareQualityOptions, type ScreenShareQualityPreset, useScreenShare } from '@/hooks/useScreenShare';

const NEW_TAB_KEY_PREFIX = 'watch_room_screen_home_opened_';
const WATCH_ROOM_NO_CONNECT_KEY = 'watch_room_no_connect';
const WATCH_ROOM_NO_CONNECT_TIMESTAMP_KEY = 'watch_room_no_connect_timestamp';
const WATCH_ROOM_NO_CONNECT_TTL_MS = 10 * 60 * 1000;
const SCREEN_SHARE_QUALITY_KEY = 'watch_room_screen_quality';

function getScreenShareHostSupportError() {
  if (typeof window === 'undefined') return null;

  if (!window.isSecureContext) {
    return '当前环境不是安全上下文（HTTPS/localhost），不支持屏幕共享';
  }

  if (!navigator.mediaDevices?.getDisplayMedia) {
    return '当前浏览器不支持屏幕共享';
  }

  if (typeof window.RTCPeerConnection === 'undefined') {
    return '当前浏览器不支持实时屏幕传输';
  }

  return null;
}

function getScreenShareViewerSupportError() {
  if (typeof window === 'undefined') return null;

  if (typeof window.RTCPeerConnection === 'undefined') {
    return '当前浏览器不支持实时屏幕传输';
  }

  return null;
}

export default function WatchRoomScreenPage() {
  const router = useRouter();
  const watchRoom = useWatchRoomContext();
  const { currentRoom, members, leaveRoom } = watchRoom;
  const [qualityPreset, setQualityPreset] = useState<ScreenShareQualityPreset>('smooth');
  const {
    currentRoom: screenRoom,
    isOwner,
    isSharing,
    isStarting,
    error,
    captureSettings,
    localVideoRef,
    remoteVideoRef,
    startSharing,
    stopSharing,
  } = useScreenShare(qualityPreset);

  const openDetachedPage = useCallback(() => {
    window.open('/', '_blank', 'noopener,noreferrer');
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const saved = window.localStorage.getItem(SCREEN_SHARE_QUALITY_KEY);
    if (saved === 'smooth' || saved === 'hd' || saved === 'ultra') {
      setQualityPreset(saved);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(SCREEN_SHARE_QUALITY_KEY, qualityPreset);
  }, [qualityPreset]);

  useEffect(() => {
    if (!currentRoom) {
      router.replace('/watch-room');
      return;
    }

    if (currentRoom.roomType !== 'screen') {
      router.replace('/watch-room');
    }
  }, [currentRoom, router]);

  useEffect(() => {
    if (!screenRoom || screenRoom.roomType !== 'screen') return;

    const supportError = isOwner
      ? getScreenShareHostSupportError()
      : getScreenShareViewerSupportError();
    if (supportError) {
      showToast(`当前设备无法使用屏幕共享房间：${supportError}`, 'error');
      leaveRoom();
      router.replace('/watch-room');
    }
  }, [isOwner, leaveRoom, router, screenRoom?.id, screenRoom?.roomType]);

  useEffect(() => {
    if (!screenRoom || !isOwner) return;

    localStorage.setItem(WATCH_ROOM_NO_CONNECT_KEY, '1');
    localStorage.setItem(WATCH_ROOM_NO_CONNECT_TIMESTAMP_KEY, String(Date.now()));
    const heartbeat = window.setInterval(() => {
      localStorage.setItem(WATCH_ROOM_NO_CONNECT_TIMESTAMP_KEY, String(Date.now()));
    }, 30_000);
    const key = `${NEW_TAB_KEY_PREFIX}${screenRoom.id}`;
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, '1');
      openDetachedPage();
    }

    return () => {
      localStorage.removeItem(WATCH_ROOM_NO_CONNECT_KEY);
      localStorage.removeItem(WATCH_ROOM_NO_CONNECT_TIMESTAMP_KEY);
      window.clearInterval(heartbeat);
    };
  }, [isOwner, openDetachedPage, screenRoom?.id]);

  if (!screenRoom || screenRoom.roomType !== 'screen') {
    return null;
  }

  const handleLeave = () => {
    if (isOwner && isSharing) {
      stopSharing(true);
    }
    leaveRoom();
    router.push('/watch-room');
  };

  const captureSettingsText = captureSettings
    ? [
        captureSettings.width && captureSettings.height
          ? `${captureSettings.width}x${captureSettings.height}`
          : '分辨率未知',
        captureSettings.frameRate ? `${Math.round(captureSettings.frameRate)} fps` : '帧率未知',
      ].join(' / ')
    : '未开始';

  return (
    <div className='min-h-screen bg-background text-foreground'>
      <div className='mx-auto flex min-h-screen max-w-7xl flex-col gap-4 px-4 py-4 lg:px-8'>
        <div className='flex items-center justify-between gap-4 rounded-2xl border border-border bg-card px-5 py-4 shadow-sm'>
          <div>
            <h1 className='flex items-center gap-2 text-2xl font-semibold'>
              <Monitor className='h-6 w-6 text-primary' />
              屏幕共享观影室
            </h1>
            <p className='mt-1 text-sm text-muted-foreground'>
              房间：{screenRoom.name} · 房主：{screenRoom.ownerName}
            </p>
          </div>
          <div className='flex items-center gap-2'>
            {isOwner && (
              <Link
                href='/'
                target='_blank'
                rel='noreferrer'
                onClick={(event) => {
                  event.preventDefault();
                  openDetachedPage();
                }}
                className='rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90'
              >
                新开主页
              </Link>
            )}
            <button
              onClick={handleLeave}
              className='rounded-lg bg-muted px-4 py-2 text-foreground hover:bg-accent'
            >
              离开房间
            </button>
          </div>
        </div>

        <div className='grid flex-1 grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]'>
          <div className='relative flex min-h-[420px] items-center justify-center overflow-hidden rounded-2xl border border-border bg-black'>
            {isOwner ? (
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className='h-full w-full bg-black object-contain'
              />
            ) : (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                controls
                className='h-full w-full bg-black object-contain'
              />
            )}

            {!isSharing && (
              <div className='absolute px-6 text-center text-white'>
                <MonitorPlay className='mx-auto mb-3 h-12 w-12 text-white/70' />
                <p className='text-lg font-medium'>
                  {isOwner ? '点击开始共享，向房员推送浏览器画面' : '等待房主开始共享屏幕'}
                </p>
                {isOwner && (
                  <p className='mt-2 text-sm text-white/70'>
                    本页不要关闭；已尝试为你新开一个主页标签页方便继续浏览。
                  </p>
                )}
              </div>
            )}
          </div>

          <div className='space-y-4'>
            <div className='rounded-xl border border-border bg-card p-4'>
              <h2 className='mb-3 font-semibold'>共享状态</h2>
              <div className='space-y-2 text-sm text-muted-foreground'>
                <p>类型：屏幕共享</p>
                <p>状态：{isSharing ? '共享中' : '未开始'}</p>
                <p>成员：{members.length} 人</p>
              </div>

              {isOwner && (
                <div className='mt-2 text-sm text-muted-foreground'>
                  实际采集：{captureSettingsText}
                </div>
              )}

              {error && (
                <div className='mt-3 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive'>
                  {error}
                </div>
              )}

              {isOwner && (
                <div className='mt-4'>
                  <label className='mb-2 block text-sm font-medium text-foreground'>
                    共享画质
                  </label>
                  <select
                    value={qualityPreset}
                    onChange={(event) => setQualityPreset(event.target.value as ScreenShareQualityPreset)}
                    disabled={isStarting || isSharing}
                    className='w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground disabled:cursor-not-allowed disabled:bg-muted'
                  >
                    {screenShareQualityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className='mt-2 text-xs text-muted-foreground'>
                    画质越高越清晰，但更依赖网络和设备性能。共享开始后不可切换。
                  </p>
                </div>
              )}

              <div className='mt-4 flex gap-3'>
                {isOwner ? (
                  <>
                    <button
                      onClick={() => startSharing()}
                      disabled={isStarting || isSharing}
                      className='flex-1 rounded-lg bg-primary px-4 py-2 text-primary-foreground disabled:bg-muted disabled:text-muted-foreground'
                    >
                      {isStarting ? '启动中...' : isSharing ? '共享中' : '开始共享'}
                    </button>
                    <button
                      onClick={() => stopSharing(true)}
                      disabled={!isSharing}
                      className='rounded-lg bg-destructive px-4 py-2 text-destructive-foreground disabled:bg-muted disabled:text-muted-foreground'
                    >
                      停止
                    </button>
                  </>
                ) : (
                  <div className='rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground'>
                    房员无需操作，房主开始共享后会自动显示画面。
                  </div>
                )}
              </div>
            </div>

            <div className='rounded-xl border border-border bg-card p-4'>
              <h2 className='mb-3 flex items-center gap-2 font-semibold'>
                <Users className='h-4 w-4' />
                房间成员
              </h2>
              <div className='space-y-2'>
                {members.map((member) => (
                  <div
                    key={member.id}
                    className='flex items-center justify-between rounded-lg bg-muted px-3 py-2'
                  >
                    <span className='text-sm'>{member.name}</span>
                    {member.isOwner && (
                      <span className='rounded bg-primary/10 px-2 py-1 text-xs text-primary'>
                        房主
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className='rounded-xl border border-border bg-muted p-4 text-sm text-muted-foreground'>
              建议使用桌面版 Chrome / Edge，并优先共享标签页。
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
