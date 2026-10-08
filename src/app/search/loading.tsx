import { PAGE_WIDE } from '@/components/layout/shell';
import { Skeleton } from '@/components/ui/skeleton';

export default function SearchLoading() {
  return (
    <div className={`${PAGE_WIDE} space-y-4 py-4`}>
      {/* 筛选/搜索行 */}
      <div className='flex flex-wrap items-center gap-2'>
        <Skeleton className='h-10 w-full max-w-md' />
        <Skeleton className='h-10 w-20' />
        <Skeleton className='h-10 w-20' />
      </div>
      {/* 结果网格 */}
      <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className='space-y-2'>
            <Skeleton className='aspect-[2/3] w-full' />
            <Skeleton className='h-4 w-3/4' />
          </div>
        ))}
      </div>
    </div>
  );
}
