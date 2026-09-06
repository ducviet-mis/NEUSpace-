'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function AuthPage({ onLogin }: { onLogin: () => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
        if (error) throw error;
        onLogin();
      } else {
        // Chỉ cho phép đuôi mail sinh viên NEU
        if (!normalizedEmail.endsWith('@st.neu.edu.vn')) {
          throw new Error('Chỉ cho phép đăng ký bằng email sinh viên có đuôi @st.neu.edu.vn');
        }
        if (password !== confirmPassword) {
          throw new Error('Mật khẩu xác nhận không khớp!');
        }
        if (password.length < 12) {
          throw new Error('Mật khẩu phải có ít nhất 12 ký tự.');
        }

        const { error } = await supabase.auth.signUp({ email: normalizedEmail, password });
        if (error) throw error;
        setMessage('Đăng ký thành công! Vui lòng vào email để xác thực.');
      }
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020817] flex items-center justify-center p-4 relative overflow-hidden text-foreground">
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-500/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="glass-panel p-8 w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center mb-8 flex flex-col items-center">
          <img
            src="/neu-space-icon.png"
            alt="NEU SPACE"
            className="w-16 h-16 rounded-2xl shadow-lg shadow-cyan-500/20 mb-4"
          />
          <h1 className="text-2xl font-bold tracking-[0.16em]">NEU SPACE</h1>
          <p className="opacity-60 text-xs mt-2 uppercase tracking-wider">Không gian học tập cá nhân</p>
          <h2 className="text-lg font-bold text-cyan-600 dark:text-cyan-400 mt-2 uppercase tracking-wide">
            {isLogin ? 'Đăng nhập' : 'Đăng ký tài khoản'}
          </h2>
          <p className="opacity-70 text-sm mt-1">
            {isLogin ? 'Sẵn sàng cho một kỳ học hiệu quả' : 'Tạo tài khoản mới để bắt đầu sử dụng'}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-sm mb-4">
            {error}
          </div>
        )}

        {message && (
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-500 text-sm mb-4">
            {message}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 opacity-80">Email sinh viên (@st.neu.edu.vn)</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-background/50 border border-border rounded-xl p-3 outline-none focus:border-cyan-500/50 transition-colors"
              placeholder="12345678@st.neu.edu.vn"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 opacity-80">Mật khẩu</label>
            <input
              type="password"
              required
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              minLength={isLogin ? undefined : 12}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-background/50 border border-border rounded-xl p-3 outline-none focus:border-cyan-500/50 transition-colors"
              placeholder="••••••••"
            />
          </div>

          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1 opacity-80">Xác nhận mật khẩu</label>
                <input
              type="password"
              required
              autoComplete="new-password"
              minLength={12}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full bg-background/50 border border-border rounded-xl p-3 outline-none focus:border-cyan-500/50 transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-cyan-500 text-white font-semibold shadow-lg shadow-cyan-500/20 hover:scale-[1.02] transition-transform disabled:opacity-70 disabled:hover:scale-100 flex justify-center items-center gap-2"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {isLogin ? 'Đăng nhập' : 'Đăng ký tài khoản'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm opacity-70">
          {isLogin ? (
            <p>Chưa có tài khoản? <button type="button" onClick={() => setIsLogin(false)} className="text-cyan-600 dark:text-cyan-400 hover:underline font-medium">Đăng ký ngay</button></p>
          ) : (
            <p>Đã có tài khoản? <button type="button" onClick={() => setIsLogin(true)} className="text-cyan-600 dark:text-cyan-400 hover:underline font-medium">Quay lại đăng nhập</button></p>
          )}
        </div>
      </div>
    </div>
  );
}
