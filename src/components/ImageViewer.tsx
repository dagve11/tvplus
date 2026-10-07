'use client';

import { X } from 'lucide-react';
import React from 'react';

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';

import ProxyImage from '@/components/ProxyImage';

interface ImageViewerProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  alt?: string;
}

const ImageViewer: React.FC<ImageViewerProps> = ({
  isOpen,
  onClose,
  imageUrl,
  alt = '图片',
}) => {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      {/* 全屏看图：隐藏内置关闭按钮（用自带的高对比度按钮），去掉默认边框/背景/内边距 */}
      <DialogContent
        className='flex h-auto max-h-[100vh] w-auto max-w-[100vw] items-center justify-center gap-0 border-0 bg-transparent p-0 shadow-none sm:max-h-[90vh] sm:max-w-[90vw] [&>button]:hidden'
        aria-describedby={undefined}
      >
        <DialogTitle className='sr-only'>{alt}</DialogTitle>

        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className='absolute top-4 right-4 z-10 rounded-full bg-black/50 p-2 transition-colors duration-150 hover:bg-black/70'
          aria-label='关闭'
        >
          <X size={24} className='text-white' />
        </button>

        {/* 图片容器 */}
        <div className='relative h-full w-full'>
          <ProxyImage
            originalSrc={imageUrl}
            alt={alt}
            className='h-auto max-h-[100vh] w-auto max-w-[100vw] object-contain sm:max-h-[90vh] sm:max-w-[90vw]'
            style={{
              maxWidth: '100vw',
              maxHeight: '100vh',
            }}
            loading='eager'
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageViewer;
