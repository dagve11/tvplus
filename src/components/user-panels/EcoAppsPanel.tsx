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
        className='fixed inset-0 bg-black/50 backdrop-blur-sm z-[1000]'
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
      <div className='fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white dark:bg-gray-900 rounded-xl shadow-xl z-[1001] overflow-hidden'>
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
          <div className='flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700'>
            <h3 className='text-xl font-bold text-gray-800 dark:text-gray-200'>
              生态应用
            </h3>
            <div className='flex items-center gap-2'>
              {/* 举报按钮 */}
              <button
                onClick={() => onOpenReport()}
                className='w-8 h-8 p-1 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-lg'
                aria-label='Report'
                title='举报抄袭'
              >
                🐶
              </button>
              {/* 关闭按钮 */}
              <button
                onClick={() => onOpenChange(false)}
                className='w-8 h-8 p-1 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors'
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
              <div className='bg-gray-50 dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700'>
                <div className='flex items-start gap-4'>
                  <div className='flex-shrink-0 relative'>
                    <img
                      src='/logo.png'
                      alt='MoonTVPlus-PC'
                      className='w-16 h-16 rounded-xl object-cover'
                    />
                    <div className='absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg'>
                      <Monitor className='w-3.5 h-3.5 text-white' />
                    </div>
                  </div>
                  <div className='flex-1 min-w-0'>
                    <h4 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2'>
                      MoonTVPlus-PC客户端
                    </h4>
                    <p className='text-sm text-gray-600 dark:text-gray-400 mb-3'>
                      专为Windows开发的客户端，完美支持私人影库mkv视频
                    </p>
                    <a
                      href='https://github.com/mtvpls/MoonTVPlus-PC/releases'
                      target='_blank'
                      rel='noopener noreferrer'
                      className='inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors'
                    >
                      <Download className='w-4 h-4' />
                      下载
                      <ExternalLink className='w-3 h-3' />
                    </a>
                  </div>
                </div>
              </div>

              {/* Selene 跨平台客户端 */}
              <div className='bg-gray-50 dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700'>
                <div className='flex items-start gap-4'>
                  <div className='flex-shrink-0 relative'>
                    <img
                      src='/icons/Selene.png'
                      alt='Selene'
                      className='w-16 h-16 rounded-xl object-cover'
                    />
                    <span className='absolute -top-1 -right-1 px-1.5 py-0.5 bg-orange-500 text-white text-[10px] font-bold rounded'>
                      二开
                    </span>
                  </div>
                  <div className='flex-1 min-w-0'>
                    <h4 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2'>
                      Selene 跨平台客户端
                    </h4>
                    <p className='text-sm text-gray-600 dark:text-gray-400 mb-3'>
                      多平台客户端
                    </p>
                    <div className='flex flex-wrap gap-2'>
                      <a
                        href='https://github.com/mtvpls/Selene-Build/releases'
                        target='_blank'
                        rel='noopener noreferrer'
                        className='inline-flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors'
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
              <div className='bg-gray-50 dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700'>
                <div className='flex items-start gap-4'>
                  <div className='flex-shrink-0 relative'>
                    <img
                      src='/icons/OrionTV.png'
                      alt='OrionTV'
                      className='w-16 h-16 rounded-xl object-cover'
                    />
                    <span className='absolute -top-1 -right-1 px-1.5 py-0.5 bg-orange-500 text-white text-[10px] font-bold rounded'>
                      二开
                    </span>
                  </div>
                  <div className='flex-1 min-w-0'>
                    <h4 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2'>
                      OrionTV TV专用客户端
                    </h4>
                    <p className='text-sm text-gray-600 dark:text-gray-400 mb-3'>
                      tv专用
                    </p>
                    <a
                      href='https://github.com/mtvpls/OrionTV_Build/tags'
                      target='_blank'
                      rel='noopener noreferrer'
                      className='inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition-colors'
                    >
                      <Download className='w-4 h-4' />
                      下载
                      <ExternalLink className='w-3 h-3' />
                    </a>
                  </div>
                </div>
              </div>

              {/* 私人影库转码器 */}
              <div className='bg-gray-50 dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700'>
                <div className='flex items-start gap-4'>
                  <div className='flex-shrink-0 relative'>
                    <div className='w-16 h-16 rounded-xl bg-amber-500 flex items-center justify-center shadow-sm'>
                      <RouterIcon className='w-8 h-8 text-white' />
                    </div>
                    <span className='absolute -top-1 -right-1 px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded'>
                      MKV转码
                    </span>
                  </div>
                  <div className='flex-1 min-w-0'>
                    <h4 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2'>
                      私人影库转码器
                    </h4>
                    <p className='text-sm text-gray-600 dark:text-gray-400 mb-3'>
                      为私人影库中的 MKV
                      视频提供转码播放能力，可解析内封字幕并解决部分视频无音频问题，但通常需要较高的本机性能配置。
                    </p>
                    <a
                      href='https://github.com/mtvpls/moontvplus-transcoder/tags'
                      target='_blank'
                      rel='noopener noreferrer'
                      className='inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors'
                    >
                      <Download className='w-4 h-4' />
                      下载
                      <ExternalLink className='w-3 h-3' />
                    </a>
                  </div>
                </div>
              </div>

              {/* MoonTVPlus 插件 */}
              <div className='bg-gray-50 dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700'>
                <div className='flex items-start gap-4'>
                  <div className='flex-shrink-0 relative'>
                    <div className='w-16 h-16 rounded-xl bg-purple-500 flex items-center justify-center shadow-sm'>
                      <Puzzle className='w-8 h-8 text-white' />
                    </div>
                    <span className='absolute -top-1 -right-1 px-1.5 py-0.5 bg-purple-600 text-white text-[10px] font-bold rounded'>
                      插件
                    </span>
                  </div>
                  <div className='flex-1 min-w-0'>
                    <h4 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2'>
                      MoonTVPlus 插件
                    </h4>
                    <p className='text-sm text-gray-600 dark:text-gray-400 mb-3'>
                      为 MoonTVPlus
                      提供增强性功能，目前拥有解决私人影库超分跨域能力
                    </p>
                    <a
                      href='https://github.com/mtvpls/moontvplus-extension/releases'
                      target='_blank'
                      rel='noopener noreferrer'
                      className='inline-flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium rounded-lg transition-colors'
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
          <div className='p-6 pt-4 border-t border-gray-200 dark:border-gray-700'>
            <p className='text-xs text-gray-500 dark:text-gray-400 text-center'>
              选择适合您设备的客户端下载使用
            </p>
          </div>
        </div>
      </div>
    </>
, document.body
  );
};
