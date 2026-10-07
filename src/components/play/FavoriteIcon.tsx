import { Heart } from 'lucide-react';

/** 收藏态图标：实心/空心，单色 token 化 */
export default function FavoriteIcon({ filled }: { filled: boolean }) {
  if (filled) {
    return <Heart className='h-7 w-7 fill-current text-foreground' />;
  }
  return <Heart className='h-7 w-7 stroke-[1] text-muted-foreground' />;
}
