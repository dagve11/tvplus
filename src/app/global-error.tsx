'use client';

import { Button } from '@/components/ui/button';

/**
 * 根级错误边界：渲染时替换根布局，因此必须自带 <html>/<body>，
 * 且不依赖根布局注入的任何内容。
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang='zh-CN'>
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          fontFamily: 'system-ui, sans-serif',
          background: '#0a0a0a',
          color: '#fafafa',
          textAlign: 'center',
          padding: '1.5rem',
        }}
      >
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>页面出错了</h2>
        <p style={{ fontSize: '0.875rem', opacity: 0.7, maxWidth: '32rem' }}>
          {error.message || '发生未知错误，请重试'}
        </p>
        <Button onClick={reset}>重试</Button>
      </body>
    </html>
  );
}
