'use client';

import {
  Download,
  ExternalLink,
  Monitor,
  Puzzle,
  Router as RouterIcon,
  X,
} from 'lucide-react';
import { createPortal } from 'react-dom';

interface EcoAppsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenReport: () => void;
}

export const EcoAppsPanel = ({
  open,
  onOpenChange,
  onOpenReport,
}: EcoAppsPanelProps) => {
  if (!open) return null;
  return createPortal(
    <>
      {/* 背景遮罩 */}
      <div
        className='fixed inset-0 bg-black/50 backdrop-blur-sm z-modal'
        onClick={() => onOpenChange(false)}
        onTouchMove={(e) => {
          e.preventDefault();
        }}
        onWheel={(e) => {
          e.preventDefault();
        }}
        style={{
          touchAction: 'none',
        }}
      />

      {/* 生态应用面板 */}
      <div className='fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-card rounded-xl shadow-xl z-popover overflow-hidden'>
        <div
          className='h-full max-h-[85vh] flex flex-col'
          data-panel-content
          onTouchMove={(e) => {
            e.stopPropagation();
          }}
          style={{
            touchAction: 'auto',
          }}
        >
          {/* 标题栏 */}
          <div className='flex items-center justify-between p-6 border-b border-border'>
            <h3 className='text-xl font-bold text-foreground'>
              生态应用
            </h3>
            <div className='flex items-center gap-2'>
              {/* 举报按钮 */}
              <button
                onClick={() => onOpenReport()}
                className='w-8 h-8 p-1 rounded-full flex items-center justify-center text-muted-foreground hover:bg-accent transition-colors text-lg'
                aria-label='Report'
                title='举报抄袭'
              >
                🐶
              </button>
              {/* 关闭按钮 */}
              <button
                onClick={() => onOpenChange(false)}
                className='w-8 h-8 p-1 rounded-full flex items-center justify-center text-muted-foreground hover:bg-accent transition-colors'
                aria-label='Close'
              >
                <X className='w-full h-full' />
              </button>
            </div>
          </div>

          {/* 应用列表 */}
          <div className='flex-1 overflow-y-auto p-6'>
            <div className='grid gap-6 md:grid-cols-1'>
              {/* MoonTVPlus-PC 客户端 */}
              <div className='bg-muted rounded-lg p-5 border border-border'>
                <div className='flex items-start gap-4'>
                  <div className='flex-shrink-0 relative'>
                    <img
                      src='/logo.png'
                      alt='MoonTVPlus-PC'
                      className='w-16 h-16 rounded-xl object-cover'
                    />
                    <div className='absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg'>
                      <Monitor className='w-3.5 h-3.5 text-primary-foreground' />
                    </div>
                  </div>
                  <div className='flex-1 min-w-0'>
                    <h4 className='text-lg font-semibold text-foreground mb-2'>
                      MoonTVPlus-PC客户端
                    </h4>
                    <p className='text-sm text-muted-foreground mb-3'>
                      专为Windows开发的客户端，完美支持私人影库mkv视频
                    </p>
                    <a
                      href='https://github.com/mtvpls/MoonTVPlus-PC/releases'
                      target='_blank'
                      rel='noopener noreferrer'
                      className='inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg transition-colors'
                    >
                      <Download className='w-4 h-4' />
                      下载
                      <ExternalLink className='w-3 h-3' />
                    </a>
                  </div>
                </div>
              </div>

              {/* Selene 跨平台客户端 */}
              <div className='bg-muted rounded-lg p-5 border border-border'>
                <div className='flex items-start gap-4'>
                  <div className='flex-shrink-0 relative'>
                    <img
                      src='/icons/Selene.png'
                      alt='Selene'
                      className='w-16 h-16 rounded-xl object-cover'
                    />
                    <span className='absolute -top-1 -right-1 px-1.5 py-0.5 bg-secondary text-secondary-foreground text-[10px] font-bold rounded'>
                      二开
                    </span>
                  </div>
                  <div className='flex-1 min-w-0'>
                    <h4 className='text-lg font-semibold text-foreground mb-2'>
                      Selene 跨平台客户端
                    </h4>
                    <p className='text-sm text-muted-foreground mb-3'>
                      多平台客户端
                    </p>
                    <div className='flex flex-wrap gap-2'>
                      <a
                        href='https://github.com/mtvpls/Selene-Build/releases'
                        target='_blank'
                        rel='noopener noreferrer'
                        className='inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg transition-colors'
                      >
                        <Download className='w-4 h-4' />
                        下载
                        <ExternalLink className='w-3 h-3' />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* OrionTV TV专用客户端 */}
              <div className='bg-muted rounded-lg p-5 border border-border'>
                <div className='flex items-start gap-4'>
                  <div className='flex-shrink-0 relative'>
                    <img
                      src='/icons/OrionTV.png'
                      alt='OrionTV'
                      className='w-16 h-16 rounded-xl object-cover'
                    />
                    <span className='absolute -top-1 -right-1 px-1.5 py-0.5 bg-secondary text-secondary-foreground text-[10px] font-bold rounded'>
                      二开
                    </span>
                  </div>
                  <div className='flex-1 min-w-0'>
                    <h4 className='text-lg font-semibold text-foreground mb-2'>
                      OrionTV TV专用客户端
                    </h4>
                    <p className='text-sm text-muted-foreground mb-3'>
                      tv专用
                    </p>
                    <a
                      href='https://github.com/mtvpls/OrionTV_Build/tags'
                      target='_blank'
                      rel='noopener noreferrer'
                      className='inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg transition-colors'
                    >
                      <Download className='w-4 h-4' />
                      下载
                      <ExternalLink className='w-3 h-3' />
                    </a>
                  </div>
                </div>
              </div>

              {/* 私人影库转码器 */}
              <div className='bg-muted rounded-lg p-5 border border-border'>
                <div className='flex items-start gap-4'>
                  <div className='flex-shrink-0 relative'>
                    <div className='w-16 h-16 rounded-xl bg-muted flex items-center justify-center shadow-sm'>
                      <RouterIcon className='w-8 h-8 text-foreground' />
                    </div>
                    <span className='absolute -top-1 -right-1 px-1.5 py-0.5 bg-secondary text-secondary-foreground text-[10px] font-bold rounded'>
                      MKV转码
                    </span>
                  </div>
                  <div className='flex-1 min-w-0'>
                    <h4 className='text-lg font-semibold text-foreground mb-2'>
                      私人影库转码器
                    </h4>
                    <p className='text-sm text-muted-foreground mb-3'>
                      为私人影库中的 MKV
                      视频提供转码播放能力，可解析内封字幕并解决部分视频无音频问题，但通常需要较高的本机性能配置。
                    </p>
                    <a
                      href='https://github.com/mtvpls/moontvplus-transcoder/tags'
                      target='_blank'
                      rel='noopener noreferrer'
                      className='inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg transition-colors'
                    >
                      <Download className='w-4 h-4' />
                      下载
                      <ExternalLink className='w-3 h-3' />
                    </a>
                  </div>
                </div>
              </div>

              {/* MoonTVPlus 插件 */}
              <div className='bg-muted rounded-lg p-5 border border-border'>
                <div className='flex items-start gap-4'>
                  <div className='flex-shrink-0 relative'>
                    <div className='w-16 h-16 rounded-xl bg-muted flex items-center justify-center shadow-sm'>
                      <Puzzle className='w-8 h-8 text-foreground' />
                    </div>
                    <span className='absolute -top-1 -right-1 px-1.5 py-0.5 bg-secondary text-secondary-foreground text-[10px] font-bold rounded'>
                      插件
                    </span>
                  </div>
                  <div className='flex-1 min-w-0'>
                    <h4 className='text-lg font-semibold text-foreground mb-2'>
                      MoonTVPlus 插件
                    </h4>
                    <p className='text-sm text-muted-foreground mb-3'>
                      为 MoonTVPlus
                      提供增强性功能，目前拥有解决私人影库超分跨域能力
                    </p>
                    <a
                      href='https://github.com/mtvpls/moontvplus-extension/releases'
                      target='_blank'
                      rel='noopener noreferrer'
                      className='inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg transition-colors'
                    >
                      <Download className='w-4 h-4' />
                      下载
                      <ExternalLink className='w-3 h-3' />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 底部说明 */}
          <div className='p-6 pt-4 border-t border-border'>
            <p className='text-xs text-muted-foreground text-center'>
              选择适合您设备的客户端下载使用
            </p>
          </div>
        </div>
      </div>
    </>
, document.body
  );
};
