import { PAGE_READ } from '@/components/layout/shell';
import { Skeleton } from '@/components/ui/skeleton';

export default function MusicLoading() {
  return (
    <div className={`${PAGE_READ} space-y-4 py-6`}>
      <Skeleton className='h-8 w-40' />
      <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className='space-y-2'>
            <Skeleton className='aspect-square w-full' />
            <Skeleton className='h-4 w-3/4' />
            <Skeleton className='h-3 w-1/2' />
          </div>
        ))}
      </div>
    </div>
  );
}
