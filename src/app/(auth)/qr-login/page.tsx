'use client';

import { CheckCircle, Loader2, LogIn, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

import { getAuthInfoFromBrowserCookie } from '@/lib/auth';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

function QrLoginClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const authed = Boolean(getAuthInfoFromBrowserCookie());

  const confirm = async () => {
    setLoading(true);
    setMessage('');
    const res = await fetch('/api/auth/qr/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setMessage('确认成功，正在返回上一页...');
      window.setTimeout(() => {
        window.history.back();
      }, 700);
      return;
    }
    setMessage(data.error || '确认失败');
  };

  const cancel = async () => {
    await fetch('/api/auth/qr/cancel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
    setMessage('已取消本次电视登录，正在返回上一页...');
    window.setTimeout(() => {
      window.history.back();
    }, 500);
  };

  return (
    <Card className='relative z-10 w-full max-w-md'>
      <CardHeader className='space-y-1 text-center'>
        <CardTitle className='text-2xl font-bold tracking-tight text-foreground'>
          确认登录电视端
        </CardTitle>
        <CardDescription>请确认电视屏幕上的二维码来自你正在使用的设备。</CardDescription>
      </CardHeader>
      <CardContent>
        {!authed ? (
          <div className='rounded-lg border border-border bg-muted/50 p-5'>
            <LogIn className='h-10 w-10 text-foreground' />
            <p className='mt-4 font-semibold text-foreground'>
              当前手机未登录，请先登录后再确认电视登录。
            </p>
            <Button asChild size='lg' className='mt-5 w-full'>
              <Link href={`/login?redirect=${encodeURIComponent(`/qr-login?token=${token}`)}`}>
                去登录
              </Link>
            </Button>
          </div>
        ) : (
          <div className='grid gap-3'>
            <Button
              size='lg'
              className='w-full'
              onClick={confirm}
              disabled={loading || !token}
            >
              {loading ? (
                <Loader2 className='h-5 w-5 animate-spin' />
              ) : (
                <CheckCircle className='h-5 w-5' />
              )}
              确认登录
            </Button>
            <Button
              type='button'
              variant='outline'
              size='lg'
              className='w-full'
              onClick={cancel}
            >
              <XCircle className='h-5 w-5' />
              取消
            </Button>
          </div>
        )}
        {message && (
          <p className='mt-5 rounded-lg bg-muted p-4 text-center text-sm font-medium text-foreground'>
            {message}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function QrLoginPage() {
  return <Suspense fallback={null}><QrLoginClient /></Suspense>;
}
