'use client';

import {
  CheckCircle2,
  Copy,
  Download,
  Keyboard,
  Loader2,
  Monitor,
  Router,
  Smartphone,
  Users,
  XCircle,
  Zap,
} from 'lucide-react';

type HlsMode = 'hlsjs' | 'native';

export interface PlayToolbarProps {
  /** 影片标题（MX Player intent 使用） */
  videoTitle: string;
  /** 打开下载选集面板 */
  onOpenDownload: () => void;
  /** 复制视频链接（含代理逻辑，由 page 处理剪贴板与提示） */
  onCopyLink: () => void;
  /** App 打开（moontvplus:// 协议） */
  onOpenApp: () => void;
  /** PC Client 打开（moontvpluspc:// 协议） */
  onOpenPcClient: () => void;
  /** 是否显示「创建观影室」按钮 */
  showCreateRoom: boolean;
  /** 观影室创建中 */
  isCreatingRoom: boolean;
  /** 一键创建观影室 */
  onCreateRoom: () => void;
  /** 是否显示「转码」按钮 */
  showTranscodeButton: boolean;
  /** 转码中 */
  isTranscoding: boolean;
  /** 发起转码会话 */
  onTranscode: () => void;
  /** 打开快捷键说明 */
  onOpenShortcuts: () => void;
  /** 去广告开关状态 */
  adBlockEnabled: boolean;
  /** 切换去广告 */
  onToggleAdBlock: () => void;
  /** 是否显示鸿蒙 HLS.js 开关 */
  showHarmonyHlsToggle: boolean;
  /** 鸿蒙 HLS 播放模式 */
  harmonyHlsMode: HlsMode;
  /** 切换鸿蒙 HLS 播放模式 */
  onToggleHarmonyHls: () => void;
  /** 是否显示网盘原生 HLS 开关 */
  showNetdiskHlsToggle: boolean;
  /** 网盘 HLS 播放模式 */
  netdiskHlsMode: HlsMode;
  /** 切换网盘 HLS 播放模式 */
  onToggleNetdiskHls: () => void;
  /** 惰性构建外播器代理 URL（点击时调用，避免 SSR 访问 window） */
  getExternalUrl: () => string;
}

const BTN =
  'group relative flex items-center justify-center gap-1 w-8 h-8 lg:w-auto lg:h-auto lg:px-2 lg:py-1.5 text-xs font-medium rounded-md transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer overflow-hidden border flex-shrink-0';
const PRIMARY = `${BTN} bg-primary text-primary-foreground hover:bg-primary/90 border-border`;
const MUTED = `${BTN} bg-muted hover:bg-muted/80 text-muted-foreground border-border`;
const TOGGLE =
  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer border flex-shrink-0';
const TOGGLE_PRIMARY = `${TOGGLE} bg-primary text-primary-foreground hover:bg-primary/90 border-border`;
const TOGGLE_MUTED = `${TOGGLE} bg-muted text-muted-foreground hover:bg-muted/80 border-border`;
const LABEL =
  'hidden lg:inline max-w-0 group-hover:max-w-[100px] overflow-hidden whitespace-nowrap transition-all duration-200 ease-in-out';

const EXTERNAL_PLAYERS: Array<{
  key: string;
  label: string;
  img: string;
  href: (url: string, videoTitle: string) => string;
}> = [
  {
    key: 'potplayer',
    label: 'PotPlayer',
    img: '/players/potplayer.png',
    href: (u) => `potplayer://${u}`,
  },
  {
    key: 'vlc',
    label: 'VLC',
    img: '/players/vlc.png',
    href: (u) => `vlc://${u}`,
  },
  {
    key: 'mpv',
    label: 'MPV',
    img: '/players/mpv.png',
    href: (u) => `mpv://${u}`,
  },
  {
    key: 'mxplayer',
    label: 'MX Player',
    img: '/players/mxplayer.png',
    href: (u, title) =>
      `intent://${u}#Intent;package=com.mxtech.videoplayer.ad;S.title=${encodeURIComponent(
        title
      )};end`,
  },
  {
    key: 'nplayer',
    label: 'nPlayer',
    img: '/players/nplayer.png',
    href: (u) => `nplayer-${u}`,
  },
  {
    key: 'iina',
    label: 'IINA',
    img: '/players/iina.png',
    href: (u) => `iina://weblink?url=${encodeURIComponent(u)}`,
  },
];

export default function PlayToolbar({
  videoTitle,
  onOpenDownload,
  onCopyLink,
  onOpenApp,
  onOpenPcClient,
  showCreateRoom,
  isCreatingRoom,
  onCreateRoom,
  showTranscodeButton,
  isTranscoding,
  onTranscode,
  onOpenShortcuts,
  adBlockEnabled,
  onToggleAdBlock,
  showHarmonyHlsToggle,
  harmonyHlsMode,
  onToggleHarmonyHls,
  showNetdiskHlsToggle,
  netdiskHlsMode,
  onToggleNetdiskHls,
  getExternalUrl,
}: PlayToolbarProps) {
  return (
    <div className='mt-3 px-2 lg:flex-shrink-0'>
      <div className='bg-muted/50 backdrop-blur-sm rounded-lg p-2 border border-border w-full lg:w-auto overflow-x-auto'>
        <div className='flex gap-1.5 flex-nowrap lg:flex-wrap items-center'>
          <div className='flex gap-1.5 flex-nowrap lg:flex-wrap lg:justify-end lg:flex-1'>
            {/* 下载按钮 */}
            <button
              onClick={(e) => {
                e.preventDefault();
                onOpenDownload();
              }}
              className={PRIMARY}
              title='下载视频'
            >
              <Download className='w-4 h-4 flex-shrink-0 text-primary-foreground' />
              <span className={`${LABEL} text-primary-foreground`}>下载</span>
            </button>

            {/* 复制视频链接按钮 */}
            <button
              onClick={(e) => {
                e.preventDefault();
                onCopyLink();
              }}
              className={PRIMARY}
              title='复制视频链接'
            >
              <Copy className='w-4 h-4 flex-shrink-0 text-primary-foreground' />
              <span className={`${LABEL} text-primary-foreground`}>复制链接</span>
            </button>

            {/* App打开 */}
            <button
              onClick={(e) => {
                e.preventDefault();
                onOpenApp();
              }}
              className={PRIMARY}
              title='App打开'
            >
              <Smartphone className='w-4 h-4 flex-shrink-0 text-primary-foreground' />
              <span className={`${LABEL} text-primary-foreground`}>App打开</span>
            </button>

            {/* PC Client 打开 */}
            <button
              onClick={(e) => {
                e.preventDefault();
                onOpenPcClient();
              }}
              className={PRIMARY}
              title='PC Client打开'
            >
              <Monitor className='w-4 h-4 flex-shrink-0 text-primary-foreground' />
              <span className='hidden lg:inline max-w-0 group-hover:max-w-[120px] overflow-hidden whitespace-nowrap transition-all duration-200 ease-in-out text-primary-foreground'>
                PC Client打开
              </span>
            </button>

            {/* 创建观影室（观影室开启且未加入房间时显示） */}
            {showCreateRoom && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onCreateRoom();
                }}
                disabled={isCreatingRoom}
                className={`${PRIMARY} disabled:opacity-60 disabled:cursor-wait`}
                title='创建观影室'
              >
                {isCreatingRoom ? (
                  <Loader2 className='w-4 h-4 flex-shrink-0 text-primary-foreground animate-spin' />
                ) : (
                  <Users className='w-4 h-4 flex-shrink-0 text-primary-foreground' />
                )}
                <span className='hidden lg:inline max-w-0 group-hover:max-w-[120px] overflow-hidden whitespace-nowrap transition-all duration-200 ease-in-out text-primary-foreground'>
                  {isCreatingRoom ? '创建中' : '创建观影室'}
                </span>
              </button>
            )}

            {showTranscodeButton && (
              <button
                onClick={async (e) => {
                  e.preventDefault();
                  await onTranscode();
                }}
                disabled={isTranscoding}
                className={`${PRIMARY} ${isTranscoding ? 'cursor-wait' : ''}`}
                title='转码播放'
              >
                {isTranscoding ? (
                  <Loader2 className='w-4 h-4 flex-shrink-0 text-primary-foreground animate-spin' />
                ) : (
                  <Router className='w-4 h-4 flex-shrink-0 text-primary-foreground' />
                )}
                <span className={`${LABEL} text-primary-foreground`}>
                  {isTranscoding ? '转码中' : '转码'}
                </span>
              </button>
            )}

            {/* 快捷键说明 */}
            <button
              onClick={(e) => {
                e.preventDefault();
                onOpenShortcuts();
              }}
              className={`${MUTED} focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background`}
              title='快捷键说明'
              aria-label='查看播放快捷键说明'
            >
              <Keyboard className='w-4 h-4 flex-shrink-0 text-muted-foreground' />
              <span className={`${LABEL} text-muted-foreground`}>快捷键</span>
            </button>

            {/* 外部播放器 */}
            {EXTERNAL_PLAYERS.map((player) => (
              <button
                key={player.key}
                onClick={(e) => {
                  e.preventDefault();
                  window.open(player.href(getExternalUrl(), videoTitle), '_blank');
                }}
                className={MUTED}
                title={player.label}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={player.img}
                  alt={player.label}
                  className='w-4 h-4 flex-shrink-0'
                />
                <span className={`${LABEL} text-muted-foreground`}>
                  {player.label}
                </span>
              </button>
            ))}
          </div>

          {/* 去广告开关 */}
          <button
            onClick={onToggleAdBlock}
            className={adBlockEnabled ? TOGGLE_PRIMARY : TOGGLE_MUTED}
            title={adBlockEnabled ? '去广告已开启' : '去广告已关闭'}
          >
            {adBlockEnabled ? (
              <CheckCircle2 className='w-4 h-4 flex-shrink-0' />
            ) : (
              <XCircle className='w-4 h-4 flex-shrink-0' />
            )}
            <span className='whitespace-nowrap'>去广告</span>
          </button>

          {/* 鸿蒙 HLS.js 开关：关闭后使用原生 HLS，便于浏览器投屏 */}
          {showHarmonyHlsToggle && (
            <button
              type='button'
              onClick={() => onToggleHarmonyHls()}
              aria-pressed={harmonyHlsMode === 'hlsjs'}
              className={
                harmonyHlsMode === 'hlsjs' ? TOGGLE_PRIMARY : TOGGLE_MUTED
              }
              title={
                harmonyHlsMode === 'hlsjs'
                  ? 'HLS.js 已开启，点击切换为原生 HLS'
                  : 'HLS.js 已关闭，当前使用原生 HLS'
              }
            >
              {harmonyHlsMode === 'hlsjs' ? (
                <CheckCircle2 className='w-4 h-4 flex-shrink-0' />
              ) : (
                <XCircle className='w-4 h-4 flex-shrink-0' />
              )}
              <span className='whitespace-nowrap'>HLS.js</span>
            </button>
          )}

          {/* 网盘挂载原生 HLS 开关：关闭 HLS.js 使用浏览器原生 HLS 直连，更快且无需代理/去广告 */}
          {showNetdiskHlsToggle && (
            <button
              type='button'
              onClick={() => onToggleNetdiskHls()}
              aria-pressed={netdiskHlsMode === 'native'}
              className={
                netdiskHlsMode === 'native' ? TOGGLE_PRIMARY : TOGGLE_MUTED
              }
              title={
                netdiskHlsMode === 'native'
                  ? '原生 HLS 已开启（直连网盘，最快），点击切换为 HLS.js'
                  : '原生 HLS 已关闭（当前使用 HLS.js），点击切换为原生直连'
              }
            >
              {netdiskHlsMode === 'native' ? (
                <Zap className='w-4 h-4 flex-shrink-0' />
              ) : (
                <XCircle className='w-4 h-4 flex-shrink-0' />
              )}
              <span className='whitespace-nowrap'>原生HLS</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
