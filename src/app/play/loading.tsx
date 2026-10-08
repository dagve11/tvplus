import { PAGE_WIDE } from '@/components/layout/shell';
import { Skeleton } from '@/components/ui/skeleton';

export default function PlayLoading() {
  return (
    <div className={`${PAGE_WIDE} flex flex-col gap-4 py-4 lg:flex-row`}>
      <div className='flex-1 space-y-3'>
        {/* 播放器 16:9 */}
        <Skeleton className='aspect-video w-full rounded-xl' />
        <Skeleton className='h-6 w-1/2' />
        <Skeleton className='h-4 w-3/4' />
      </div>
      <div className='w-full space-y-2 lg:w-80'>
        <Skeleton className='h-9 w-full' />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className='h-10 w-full' />
        ))}
      </div>
    </div>
  );
}
