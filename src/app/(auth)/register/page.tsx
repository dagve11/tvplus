/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import {
  CheckCircle,
  Eye,
  EyeOff,
  Lock,
  Send,
  User,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
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

function RegisterPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileLoaded, setTurnstileLoaded] = useState(false);
  const [siteConfig, setSiteConfig] = useState<any>(null);
  const [turnstileWidgetId, setTurnstileWidgetId] = useState<string | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<string>('');
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [telegramBind, setTelegramBind] = useState<{ code: string; deepLink?: string } | null>(null);

  const { siteName } = useSite();

  // 在客户端挂载后设置配置
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const runtimeConfig = (window as any).RUNTIME_CONFIG;

      // 设置背景图（支持多张随机选择）
      const registerBg = runtimeConfig?.REGISTER_BACKGROUND_IMAGE;
      if (registerBg) {
        const urls = registerBg
          .split('\n')
          .map((url: string) => url.trim())
          .filter((url: string) => url !== '');

        if (urls.length > 0) {
          // 随机选择一张背景图
          const randomIndex = Math.floor(Math.random() * urls.length);
          setBackgroundImage(urls[randomIndex]);
        }
      }

      // 设置站点配置
      const config = {
        EnableRegistration: runtimeConfig?.ENABLE_REGISTRATION || false,
        RequireRegistrationInviteCode: runtimeConfig?.REQUIRE_REGISTRATION_INVITE_CODE || false,
        RegistrationRequireTurnstile: runtimeConfig?.REGISTRATION_REQUIRE_TURNSTILE || false,
        TurnstileSiteKey: runtimeConfig?.TURNSTILE_SITE_KEY || '',
      };
      setSiteConfig(config);

      // 如果未开启注册，重定向到登录页
      if (!config.EnableRegistration) {
        router.replace('/login');
      }
    }
  }, [router]);

  // 加载Cloudflare Turnstile脚本
  useEffect(() => {
    if (!siteConfig?.RegistrationRequireTurnstile || !siteConfig?.TurnstileSiteKey) {
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setTurnstileLoaded(true);
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [siteConfig]);

  // 渲染Turnstile组件
  useEffect(() => {
    if (!turnstileLoaded || !siteConfig?.TurnstileSiteKey) {
      return;
    }

    const container = document.getElementById('turnstile-container');
    if (container && (window as any).turnstile) {
      const widgetId = (window as any).turnstile.render('#turnstile-container', {
        sitekey: siteConfig.TurnstileSiteKey,
        callback: (token: string) => {
          setTurnstileToken(token);
        },
      });
      setTurnstileWidgetId(widgetId);
    }
  }, [turnstileLoaded, siteConfig]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!username || !password || !confirmPassword) {
      setError('请填写所有字段');
      return;
    }

    if (siteConfig?.RequireRegistrationInviteCode && !inviteCode.trim()) {
      setError('请输入邀请码');
      return;
    }

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (password.length < 6) {
      setError('密码长度至少为6位');
      return;
    }

    // 检查Turnstile验证
    if (siteConfig?.RegistrationRequireTurnstile && !turnstileToken) {
      setError('请完成人机验证');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          inviteCode: siteConfig?.RequireRegistrationInviteCode ? inviteCode.trim() : undefined,
          turnstileToken: siteConfig?.RegistrationRequireTurnstile ? turnstileToken : undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.telegramBind?.code) {
          setTelegramBind({
            code: data.telegramBind.code,
            deepLink: data.telegramBind.deepLink || '',
          });
          setRegisterSuccess(true);
          return;
        }

        // 注册成功，跳转到登录页
        const redirect = searchParams.get('redirect') || '/login';
        router.replace(redirect);
      } else {
        // 注册失败，重置Turnstile
        if (siteConfig?.RegistrationRequireTurnstile && turnstileWidgetId !== null && (window as any).turnstile) {
          (window as any).turnstile.reset(turnstileWidgetId);
          setTurnstileToken(null);
        }

        if (res.status === 400) {
          const data = await res.json().catch(() => ({}));
          setError(data.error || '注册失败');
        } else if (res.status === 409) {
          setError('用户名已存在');
        } else {
          const data = await res.json().catch(() => ({}));
          setError(data.error ?? '服务器错误');
        }
      }
    } catch (error) {
      // 网络错误，重置Turnstile
      if (siteConfig?.RegistrationRequireTurnstile && turnstileWidgetId !== null && (window as any).turnstile) {
        (window as any).turnstile.reset(turnstileWidgetId);
        setTurnstileToken(null);
      }
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 如果配置未加载或未开启注册，显示加载中
  if (!siteConfig) {
    return <div className='relative z-10 text-sm text-muted-foreground'>加载中...</div>;
  }

  return (
    <>
      {backgroundImage && (
        <div
          aria-hidden
          className='absolute inset-0 bg-cover bg-center bg-no-repeat'
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
      )}
      <Card className='relative z-10 w-full max-w-md border-border/60 bg-card/90 shadow-xl backdrop-blur-xl'>
        <CardHeader className='space-y-1 text-center'>
          <CardTitle className='text-2xl font-bold tracking-tight text-foreground'>
            {siteName}
          </CardTitle>
          <CardDescription>创建新账号</CardDescription>
        </CardHeader>
        <CardContent>
          {registerSuccess ? (
            <div className='space-y-5'>
              <div className='rounded-lg border border-border bg-muted/50 p-4'>
                <div className='mb-2 flex items-center gap-2 font-semibold text-foreground'>
                  <CheckCircle className='h-5 w-5' />
                  注册成功
                </div>
                <p className='text-sm text-muted-foreground'>账号已创建。你可以现在绑定 Telegram，用于接收通知和后续快捷登录。</p>
              </div>

              {telegramBind && (
                <div className='rounded-lg border border-border bg-muted/50 p-4'>
                  <div className='mb-3 flex items-center gap-2 font-semibold text-foreground'>
                    <Send className='h-5 w-5' />
                    Telegram 绑定
                  </div>
                  <p className='text-sm text-muted-foreground'>在 Bot 中发送：</p>
                  <div className='my-3 rounded-md bg-background px-3 py-2 font-mono text-lg font-bold tracking-widest text-foreground'>
                    /bind {telegramBind.code}
                  </div>
                  {telegramBind.deepLink && (
                    <Button
                      type='button'
                      variant='outline'
                      className='mb-3 w-full'
                      onClick={() => window.open(telegramBind.deepLink, '_blank', 'noopener,noreferrer')}
                    >
                      打开 Telegram
                    </Button>
                  )}
                  <p className='text-xs text-muted-foreground'>绑定码 10 分钟内有效，也可稍后登录后在通知设置中重新生成。</p>
                </div>
              )}

              <Button
                type='button'
                className='w-full'
                size='lg'
                onClick={() => router.replace(searchParams.get('redirect') || '/login')}
              >
                前往登录
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className='space-y-5'>
              <div className='space-y-2'>
                <Label htmlFor='username'>用户名</Label>
                <div className='relative'>
                  <User className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                  <Input
                    id='username'
                    type='text'
                    autoComplete='username'
                    className='pl-9'
                    placeholder='输入用户名'
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='password'>密码</Label>
                <div className='relative'>
                  <Lock className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                  <Input
                    id='password'
                    type={showPassword ? 'text' : 'password'}
                    autoComplete='new-password'
                    className='pl-9 pr-10'
                    placeholder='输入密码（至少6位）'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type='button'
                    className='absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground'
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className='h-4 w-4' />
                    ) : (
                      <Eye className='h-4 w-4' />
                    )}
                  </button>
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='confirmPassword'>确认密码</Label>
                <div className='relative'>
                  <Lock className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                  <Input
                    id='confirmPassword'
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete='new-password'
                    className='pl-9 pr-10'
                    placeholder='再次输入密码'
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type='button'
                    className='absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground'
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className='h-4 w-4' />
                    ) : (
                      <Eye className='h-4 w-4' />
                    )}
                  </button>
                </div>
              </div>

              {siteConfig?.RequireRegistrationInviteCode && (
                <div className='space-y-2'>
                  <Label htmlFor='inviteCode'>邀请码</Label>
                  <div className='relative'>
                    <User className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                    <Input
                      id='inviteCode'
                      type='text'
                      className='pl-9'
                      placeholder='输入邀请码'
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Cloudflare Turnstile */}
              {siteConfig?.RegistrationRequireTurnstile && siteConfig?.TurnstileSiteKey && (
                <div id='turnstile-container' className='flex justify-center'></div>
              )}

              {error && (
                <p className='text-sm text-destructive'>{error}</p>
              )}

              {/* 注册按钮 */}
              <Button
                type='submit'
                className='w-full'
                size='lg'
                disabled={
                  !username || !password || !confirmPassword || loading ||
                  (siteConfig?.RequireRegistrationInviteCode && !inviteCode.trim()) ||
                  (siteConfig?.RegistrationRequireTurnstile && !turnstileToken)
                }
              >
                {loading ? '注册中...' : '注册'}
              </Button>

              {/* 返回登录链接 */}
              <div className='text-center'>
                <button
                  type='button'
                  onClick={() => router.push('/login')}
                  className='text-sm text-muted-foreground transition-colors hover:text-foreground'
                >
                  已有账号？返回登录
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RegisterPageClient />
    </Suspense>
  );
}
