'use client';

import { useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

import { useSite } from '@/components/SiteProvider';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function OIDCRegisterPageClient() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [oidcInfo, setOidcInfo] = useState<any>(null);

  const { siteName } = useSite();

  // 检查OIDC session
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/oidc/session-info');
        if (res.ok) {
          const data = await res.json();
          setOidcInfo(data);
        } else {
          // session无效,跳转到登录页
          router.replace('/login?error=' + encodeURIComponent('OIDC会话已过期'));
        }
      } catch (error) {
        console.error('检查session失败:', error);
        router.replace('/login');
      }
    };

    checkSession();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!username) {
      setError('请输入用户名');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/auth/oidc/complete-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      if (res.ok) {
        // 注册成功，接口已写入认证 cookie，这里用整页跳转确保权限配置和登录态完全重建
        window.location.replace('/');
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || '注册失败');
      }
    } catch (error) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  if (!oidcInfo) {
    return <div className='relative z-10 text-sm text-muted-foreground'>加载中...</div>;
  }

  return (
    <Card className='relative z-10 w-full max-w-md'>
      <CardHeader className='space-y-1 text-center'>
        <CardTitle className='text-2xl font-bold tracking-tight text-foreground'>
          {siteName}
        </CardTitle>
        <CardDescription>完成OIDC注册</CardDescription>
      </CardHeader>
      <CardContent>
        {/* OIDC信息显示 */}
        {oidcInfo && (
          <div className='mb-6 rounded-lg border border-border bg-muted/50 p-4'>
            <p className='text-sm text-muted-foreground'>
              {oidcInfo.email && (
                <>
                  邮箱: <strong className='text-foreground'>{oidcInfo.email}</strong>
                  <br />
                </>
              )}
              {oidcInfo.name && (
                <>
                  名称: <strong className='text-foreground'>{oidcInfo.name}</strong>
                  <br />
                </>
              )}
              {oidcInfo.trust_level !== undefined && (
                <>
                  信任等级: <strong className='text-foreground'>{oidcInfo.trust_level}</strong>
                </>
              )}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className='space-y-5'>
          <div className='space-y-2'>
            <Label htmlFor='username'>选择用户名</Label>
            <Input
              id='username'
              type='text'
              autoComplete='username'
              placeholder='输入用户名（3-20位字母、数字、下划线）'
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <p className='text-xs text-muted-foreground'>
              用户名只能包含字母、数字、下划线，长度3-20位
            </p>
          </div>

          {error && (
            <p className='text-sm text-destructive'>{error}</p>
          )}

          <Button
            type='submit'
            className='w-full'
            size='lg'
            disabled={!username || loading}
          >
            {loading ? '注册中...' : '完成注册'}
          </Button>

          {/* 返回登录链接 */}
          <div className='text-center'>
            <button
              type='button'
              onClick={() => router.push('/login')}
              className='text-sm text-muted-foreground transition-colors hover:text-foreground'
            >
              返回登录
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default function OIDCRegisterPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OIDCRegisterPageClient />
    </Suspense>
  );
}
