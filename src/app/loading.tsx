import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className='mx-auto max-w-6xl space-y-6 p-6'>
      <Skeleton className='h-10 w-48' />
      <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4'>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className='space-y-2'>
            <Skeleton className='aspect-[2/3] w-full' />
            <Skeleton className='h-4 w-3/4' />
          </div>
        ))}
      </div>
    </div>
  );
}
