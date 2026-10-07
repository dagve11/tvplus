import { Skeleton } from '@/components/ui/skeleton';

export default function AdminLoading() {
  return (
    <div className='mx-auto flex max-w-7xl gap-6 p-6'>
      {/* 侧边标签 */}
      <div className='hidden w-48 shrink-0 space-y-2 md:block'>
        <Skeleton className='h-8 w-full' />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className='h-8 w-full' />
        ))}
      </div>
      {/* 表单区 */}
      <div className='flex-1 space-y-4'>
        <Skeleton className='h-8 w-56' />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className='h-10 w-full' />
        ))}
        <Skeleton className='h-24 w-full' />
        <Skeleton className='h-9 w-32' />
      </div>
    </div>
  );
}
