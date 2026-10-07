import { Skeleton } from '@/components/ui/skeleton';

export default function BooksReadLoading() {
  return (
    <div className='mx-auto max-w-3xl space-y-3 p-6'>
      <Skeleton className='h-8 w-2/3' />
      <Skeleton className='h-4 w-1/3' />
      <div className='space-y-3 pt-4'>
        {Array.from({ length: 14 }).map((_, i) => (
          <Skeleton key={i} className='h-4 w-full' />
        ))}
      </div>
    </div>
  );
}
