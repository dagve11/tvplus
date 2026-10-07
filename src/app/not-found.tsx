import Link from 'next/link';

import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className='flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center'>
      <p className='text-5xl font-bold tracking-tight text-muted-foreground'>404</p>
      <p className='text-sm text-muted-foreground'>页面不存在或已被移除</p>
      <Button asChild>
        <Link href='/'>返回首页</Link>
      </Button>
    </div>
  );
}
