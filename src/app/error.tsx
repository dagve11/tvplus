'use client';

import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className='flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6 text-center'>
      <h2 className='text-xl font-semibold text-foreground'>页面出错了</h2>
      <p className='text-sm text-muted-foreground'>
        {error.message || '发生未知错误，请重试'}
      </p>
      <Button onClick={reset}>重试</Button>
    </div>
  );
}
