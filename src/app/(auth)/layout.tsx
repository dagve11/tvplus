import { AuthShell } from './_components/auth-shell';

/**
 * 认证类页面的共享外壳（登录/注册/扫码确认/OIDC 补全/安全警告）。
 * 居中卡片布局，无侧边栏与底部导航；URL 不受路由组影响。
 */
export default function AuthGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthShell>{children}</AuthShell>;
}
