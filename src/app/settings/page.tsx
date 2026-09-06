'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Settings, User, Mail, Lock, Shield, Loader2, LogOut, CheckCircle, AlertCircle, Camera, X } from 'lucide-react';
import curriculumData from '@/data/curriculum.json';
import { createUserScopedImagePath, validateImageFile } from '@/lib/uploadValidation';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  // Profile data
  const [userId, setUserId] = useState<string>('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [cohort, setCohort] = useState('');
  const [majorName, setMajorName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Password reset modal
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  
  // Majors list
  const majorsList = curriculumData.map((m: any) => m.majorName).sort();

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        setUserId(session.user.id);
        setEmail(session.user.email || '');

        const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', session.user.id).single();
        if (profile) {
          setFullName(profile.full_name || '');
          setDob(profile.dob || '');
          setCohort(profile.cohort || '');
          setMajorName(profile.major_name || '');
          setAvatarUrl(profile.avatar_url || '');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const { error } = await supabase.from('profiles').upsert({
        user_id: userId,
        full_name: fullName,
        dob,
        cohort,
        major_name: majorName,
        avatar_url: avatarUrl
      });
      if (error) throw error;
      setMessage({ text: 'Đã lưu thông tin cá nhân thành công!', type: 'success' });
      window.dispatchEvent(new Event('profile-updated'));
    } catch (err: any) {
      setMessage({ text: err.message || 'Có lỗi xảy ra khi lưu profile.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setAvatarUploading(true);
      setMessage(null);
      if (!e.target.files || e.target.files.length === 0) {
        throw new Error('Bạn chưa chọn ảnh.');
      }

      const file = e.target.files[0];
      const validationError = validateImageFile(file);
      if (validationError) throw new Error(validationError);
      if (!userId) throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      const filePath = createUserScopedImagePath(userId, file);

      // Upload to 'avatars' bucket
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw new Error('Không thể tải ảnh lên. Hãy chắc chắn bạn đã tạo bucket tên là "avatars" và set Public trên Supabase.');
      }

      // Get public URL
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      
      const newAvatarUrl = data.publicUrl;
      setAvatarUrl(newAvatarUrl);

      // Immediately save to profile
      await supabase.from('profiles').upsert({
        user_id: userId,
        avatar_url: newAvatarUrl
      });

      setMessage({ text: 'Cập nhật ảnh đại diện thành công!', type: 'success' });
      window.dispatchEvent(new Event('profile-updated'));
    } catch (error: any) {
      setMessage({ text: error.message, type: 'error' });
    } finally {
      setAvatarUploading(false);
    }
  };

  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (newPassword !== confirmPassword) {
      setPasswordError('Mật khẩu xác nhận không khớp.');
      return;
    }
    if (newPassword.length < 12) {
      setPasswordError('Mật khẩu mới phải có ít nhất 12 ký tự.');
      return;
    }

    setPasswordLoading(true);
    try {
      // 1. Verify current password
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: email,
        password: currentPassword
      });

      if (verifyError) {
        throw new Error('Mật khẩu hiện tại không chính xác.');
      }

      // 2. Update to new password
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;
      
      setMessage({ text: 'Đã cập nhật mật khẩu thành công!', type: 'success' });
      setIsPasswordModalOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.message || 'Lỗi khi cập nhật mật khẩu.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const updateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.updateUser({ email });
      if (error) throw error;
      setMessage({ text: 'Yêu cầu đổi email đã được gửi. Vui lòng kiểm tra hộp thư để xác nhận.', type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.message || 'Lỗi khi cập nhật email.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const signOutOtherDevices = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.signOut({ scope: 'others' });
      if (error) throw error;
      setMessage({ text: 'Đã đăng xuất khỏi các thiết bị khác thành công.', type: 'success' });
    } catch (err: any) {
      setMessage({ text: 'Tính năng này yêu cầu cập nhật phiên bản Supabase Server, hoặc bạn có thể đổi mật khẩu để buộc đăng xuất thiết bị khác.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="animate-spin text-brand-cyan w-8 h-8" /></div>;
  }

  const generatedAvatar = avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName || email || 'Student')}&background=0D9488&color=fff&size=128`;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-brand-cyan/10 text-brand-cyan rounded-xl">
          <Settings size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Cài đặt tài khoản</h1>
          <p className="opacity-70 text-sm">Quản lý thông tin cá nhân và bảo mật của bạn.</p>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Avatar & Basic Info */}
        <div className="space-y-6 md:col-span-1">
          <div className="glass-panel p-6 flex flex-col items-center text-center">
            
            {/* Avatar Upload */}
            <div className="relative group mb-4">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-background/50 shadow-xl relative bg-background">
                <img src={generatedAvatar} alt="Avatar" className={`w-full h-full object-cover transition-opacity ${avatarUploading ? 'opacity-50' : ''}`} />
                {avatarUploading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 size={24} className="animate-spin text-brand-cyan" />
                  </div>
                )}
              </div>
              <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer">
                <Camera size={24} className="text-foreground" />
                <input 
                  type="file" 
                  accept="image/jpeg,image/png,image/webp" 
                  className="hidden" 
                  onChange={handleAvatarUpload}
                  disabled={avatarUploading}
                />
              </label>
            </div>

            <h2 className="font-bold text-xl">{fullName || 'Sinh viên'}</h2>
            <p className="text-sm opacity-70 mt-1">{majorName || 'Chưa chọn ngành'}</p>
            <p className="text-xs bg-brand-cyan/10 text-brand-cyan px-3 py-1 rounded-full mt-3 font-semibold">
              Khóa: {cohort || '---'}
            </p>
          </div>

          <div className="glass-panel p-6">
            <h3 className="font-bold flex items-center gap-2 mb-4 text-red-500">
              <Shield size={18} />
              Bảo mật nâng cao
            </h3>
            <p className="text-xs opacity-70 mb-4 leading-relaxed">
              Các tùy chọn bảo vệ tài khoản và phiên đăng nhập của bạn.
            </p>
            
            <div className="space-y-3">
              <button 
                onClick={() => setIsPasswordModalOpen(true)}
                className="w-full py-2.5 bg-orange-500/10 text-orange-500 rounded-lg text-sm font-semibold hover:bg-orange-500 hover:text-foreground transition-colors flex items-center justify-center gap-2"
              >
                <Lock size={16} />
                Đổi mật khẩu
              </button>

              <button 
                onClick={signOutOtherDevices}
                disabled={saving}
                className="w-full py-2.5 bg-red-500/10 text-red-500 rounded-lg text-sm font-semibold hover:bg-red-500 hover:text-foreground transition-colors flex items-center justify-center gap-2"
              >
                <LogOut size={16} />
                Đăng xuất thiết bị khác
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Forms */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Form 1: Thông tin cá nhân */}
          <form onSubmit={saveProfile} className="glass-panel p-6">
            <h3 className="font-bold flex items-center gap-2 mb-6 border-b border-border/50 pb-3">
              <User size={18} className="text-brand-cyan" />
              Thông tin Hồ sơ
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1.5 opacity-80">Họ và tên</label>
                <input 
                  type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:border-brand-cyan outline-none transition-colors" 
                  placeholder="VD: Nguyễn Văn A"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1.5 opacity-80">Ngày sinh</label>
                <input 
                  type="date" value={dob} onChange={e => setDob(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:border-brand-cyan outline-none transition-colors" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1.5 opacity-80">Khóa (Cohort)</label>
                <input 
                  type="text" value={cohort} onChange={e => setCohort(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:border-brand-cyan outline-none transition-colors" 
                  placeholder="VD: K64"
                />
              </div>
              
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1.5 opacity-80">Ngành học</label>
                <select 
                  value={majorName} onChange={e => setMajorName(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:border-brand-cyan outline-none transition-colors"
                >
                  <option value="">-- Chưa chọn --</option>
                  {majorsList.map((m: string) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

            <div className="flex justify-end">
              <button 
                type="submit" disabled={saving}
                className="px-6 py-2.5 bg-brand-cyan text-foreground rounded-lg text-sm font-medium shadow-lg shadow-brand-cyan/20 hover:scale-[1.02] transition-transform disabled:opacity-70"
              >
                {saving ? 'Đang lưu...' : 'Lưu Thông Tin'}
              </button>
            </div>
          </form>

          {/* Form 2: Email */}
          <form onSubmit={updateEmail} className="glass-panel p-6">
            <h3 className="font-bold flex items-center gap-2 mb-6 border-b border-border/50 pb-3">
              <Mail size={18} className="text-brand-violet" />
              Email liên kết
            </h3>
            
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <label className="block text-sm font-medium mb-1.5 opacity-80">Địa chỉ Email</label>
                <input 
                  type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:border-brand-violet outline-none transition-colors" 
                />
              </div>
              <button 
                type="submit" disabled={saving}
                className="w-full sm:w-auto px-6 py-2.5 bg-brand-violet text-foreground rounded-lg text-sm font-medium shadow-lg shadow-brand-violet/20 hover:scale-[1.02] transition-transform disabled:opacity-70"
              >
                Cập nhật
              </button>
            </div>
          </form>

        </div>
      </div>

      {/* Modal Đổi Mật Khẩu */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-md p-6 relative border-orange-500/30 animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsPasswordModalOpen(false)}
              className="absolute top-4 right-4 p-2 opacity-50 hover:opacity-100 rounded-full hover:bg-black/10 dark:hover:bg-foreground/10"
            >
              <X size={20} />
            </button>
            
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
              <Lock className="text-orange-500" />
              Đổi mật khẩu
            </h2>
            <p className="text-sm opacity-70 mb-6">Vui lòng nhập mật khẩu hiện tại để xác thực.</p>
            
            {passwordError && (
              <div className="p-3 mb-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-sm flex items-start gap-2">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={updatePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 opacity-80">Mật khẩu hiện tại</label>
                <input 
                  type="password" required autoFocus value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
                  className="w-full bg-background/50 border border-border rounded-lg p-2.5 text-sm focus:border-orange-500 outline-none" 
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 opacity-80">Mật khẩu mới</label>
                <input 
                  type="password" required minLength={12} autoComplete="new-password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  className="w-full bg-background/50 border border-border rounded-lg p-2.5 text-sm focus:border-orange-500 outline-none" 
                  placeholder="Ít nhất 12 ký tự"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 opacity-80">Xác nhận mật khẩu mới</label>
                <input 
                  type="password" required minLength={12} autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full bg-background/50 border border-border rounded-lg p-2.5 text-sm focus:border-orange-500 outline-none" 
                  placeholder="Nhập lại mật khẩu mới"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border/50">
                <button 
                  type="button" 
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2.5 rounded-lg opacity-70 hover:bg-black/5 dark:hover:bg-foreground/5 transition-colors text-sm font-medium"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  disabled={passwordLoading}
                  className="px-6 py-2.5 bg-orange-500 text-foreground rounded-lg text-sm font-medium shadow-lg hover:bg-orange-500/90 transition-colors disabled:opacity-70 flex items-center gap-2"
                >
                  {passwordLoading && <Loader2 size={16} className="animate-spin" />}
                  Xác nhận đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
