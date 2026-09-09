'use client';

import React, { useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface AuthPageProps {
  onLogin: () => void;
  onContinueAsGuest?: () => void;
}

const INTERNAL_EMAIL_DOMAIN = 'accounts.neuos.tech';
const USERNAME_PATTERN = /^[a-z0-9][a-z0-9._-]{2,23}$/;

function usernameToInternalEmail(username: string) {
  return `${username}@${INTERNAL_EMAIL_DOMAIN}`;
}

export default function AuthPage({ onLogin, onContinueAsGuest }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleAuth = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const normalizedUsername = username.trim().toLowerCase();

      if (isLogin) {
        const loginEmail = normalizedUsername.includes('@')
          ? normalizedUsername
          : usernameToInternalEmail(normalizedUsername);
        const { error: loginError } = await supabase.auth.signInWithPassword({ email: loginEmail, password });
        if (loginError) throw new Error('Tên đăng nhập hoặc mật khẩu không đúng.');
        onLogin();
        return;
      }

      const trimmedFullName = fullName.trim();
      if (trimmedFullName.length < 2 || trimmedFullName.length > 80) {
        throw new Error('Họ và tên cần có từ 2 đến 80 ký tự.');
      }
      if (!USERNAME_PATTERN.test(normalizedUsername)) {
        throw new Error('Tên đăng nhập gồm 3–24 ký tự: chữ thường, số, dấu chấm, gạch dưới hoặc gạch ngang.');
      }
      if (password !== confirmPassword) {
        throw new Error('Mật khẩu xác nhận không khớp.');
      }
      if (password.length < 12) {
        throw new Error('Mật khẩu phải có ít nhất 12 ký tự.');
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: usernameToInternalEmail(normalizedUsername),
        password,
        options: {
          data: {
            full_name: trimmedFullName,
            username: normalizedUsername,
          },
        },
      });
      if (signUpError) {
        if (/already|registered|exists/i.test(signUpError.message)) {
          throw new Error('Tên đăng nhập này đã được sử dụng.');
        }
        throw signUpError;
      }
      if (!data.user || data.user.identities?.length === 0) {
        throw new Error('Tên đăng nhập này đã được sử dụng.');
      }
      if (!data.session) {
        setMessage('Tài khoản đã được tạo nhưng đang chờ xác thực. Quản trị viên cần tắt “Confirm email” trong Supabase trước khi dùng luồng đăng ký không email.');
        return;
      }

      onLogin();
    } catch (reason: unknown) {
      const rawMessage = reason instanceof Error ? reason.message : '';
      if (/email rate limit exceeded/i.test(rawMessage)) {
        setError('Đăng ký đang tạm bị giới hạn vì Supabase vẫn gửi email xác thực. Quản trị viên cần tắt “Confirm email” trong Authentication → Providers → Email, rồi thử lại sau ít phút.');
      } else {
        setError(rawMessage || 'Có lỗi xảy ra. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (login: boolean) => {
    setIsLogin(login);
    setError(null);
    setMessage(null);
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-background p-4 text-foreground">
      <div className="pointer-events-none absolute -left-[10%] -top-[10%] h-[40%] w-[40%] rounded-full bg-cyan-500/20 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-[10%] -right-[10%] h-[40%] w-[40%] rounded-full bg-violet-500/20 blur-[120px]" />

      <div className="glass-panel relative z-10 w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-500 sm:p-8">
        <div className="mb-8 flex flex-col items-center text-center">
          <img src="/neu-space-icon.png" alt="neuOS" className="mb-4 h-16 w-16 rounded-2xl shadow-lg shadow-cyan-500/20" />
          <h1 className="text-2xl font-bold tracking-[0.12em]">neuOS</h1>
          <p className="mt-2 text-xs uppercase tracking-wider opacity-60">Không gian học tập cá nhân</p>
          <h2 className="mt-2 text-lg font-bold uppercase tracking-wide text-cyan-600 dark:text-cyan-400">
            {isLogin ? 'Đăng nhập' : 'Đăng ký tài khoản'}
          </h2>
          <p className="mt-1 text-sm opacity-70">
            {isLogin ? 'Sẵn sàng cho một kỳ học hiệu quả' : 'Chọn tên đăng nhập riêng cho bạn'}
          </p>
        </div>

        {error && <div role="alert" className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-400">{error}</div>}
        {message && <div role="status" className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-300">{message}</div>}

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && <div>
            <label htmlFor="auth-full-name" className="mb-1 block text-sm font-medium opacity-80">Họ và tên</label>
            <input id="auth-full-name" type="text" required autoComplete="name" minLength={2} maxLength={80} value={fullName} onChange={event => setFullName(event.target.value)} className="w-full rounded-xl border border-border bg-background/50 p-3 outline-none transition-colors focus:border-cyan-500/50" placeholder="VD: Nguyễn Văn A" />
          </div>}

          <div>
            <label htmlFor="auth-username" className="mb-1 block text-sm font-medium opacity-80">Tên đăng nhập</label>
            <input id="auth-username" type="text" required autoComplete="username" minLength={3} maxLength={24} value={username} onChange={event => setUsername(event.target.value)} className="w-full rounded-xl border border-border bg-background/50 p-3 outline-none transition-colors focus:border-cyan-500/50" placeholder="VD: neuer_2004" aria-describedby={!isLogin ? 'auth-username-help' : undefined} />
            {!isLogin && <p id="auth-username-help" className="mt-1.5 text-xs leading-relaxed text-foreground/60">3–24 ký tự: chữ thường, số, dấu chấm, gạch dưới hoặc gạch ngang.</p>}
          </div>

          <div>
            <label htmlFor="auth-password" className="mb-1 block text-sm font-medium opacity-80">Mật khẩu</label>
            <input id="auth-password" type="password" required autoComplete={isLogin ? 'current-password' : 'new-password'} minLength={isLogin ? undefined : 12} value={password} onChange={event => setPassword(event.target.value)} className="w-full rounded-xl border border-border bg-background/50 p-3 outline-none transition-colors focus:border-cyan-500/50" placeholder="••••••••" />
          </div>

          {!isLogin && <div>
            <label htmlFor="auth-confirm-password" className="mb-1 block text-sm font-medium opacity-80">Xác nhận mật khẩu</label>
            <input id="auth-confirm-password" type="password" required autoComplete="new-password" minLength={12} value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} className="w-full rounded-xl border border-border bg-background/50 p-3 outline-none transition-colors focus:border-cyan-500/50" placeholder="••••••••" />
          </div>}

          <button type="submit" disabled={loading} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 py-3 font-semibold text-white shadow-lg shadow-cyan-500/20 transition-transform hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100">
            {loading && <Loader2 size={18} className="animate-spin" aria-hidden="true" />}
            {isLogin ? 'Đăng nhập' : 'Tạo tài khoản'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm opacity-70">
          {isLogin ? <p>Chưa có tài khoản? <button type="button" onClick={() => switchMode(false)} className="font-medium text-cyan-600 hover:underline dark:text-cyan-400">Đăng ký ngay</button></p> : <p>Đã có tài khoản? <button type="button" onClick={() => switchMode(true)} className="font-medium text-cyan-600 hover:underline dark:text-cyan-400">Quay lại đăng nhập</button></p>}
        </div>

        {onContinueAsGuest && <button type="button" onClick={onContinueAsGuest} className="mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-foreground/15 bg-foreground/[0.04] px-4 py-2.5 text-sm font-semibold text-foreground/80 transition-[background-color,color,transform] hover:bg-foreground/[0.08] hover:text-foreground active:scale-[0.99]">
          <ArrowLeft size={18} aria-hidden="true" />
          Tiếp tục xem không cần đăng nhập
        </button>}
      </div>
    </div>
  );
}
