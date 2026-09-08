'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, Calendar, Calculator, BookOpen, Settings,
  Menu, X, Bell, User, LogOut, HelpCircle, FileText,
  Moon, Sun, ShoppingBag, MoreHorizontal
} from 'lucide-react';
import AuthPage from '@/components/auth/AuthPage';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { useTheme } from 'next-themes';

const NAV_ITEMS = [
  { name: 'Trang chủ', href: '/', icon: Home },
  { name: 'Tiến độ học tập', href: '/progress', icon: BookOpen },
  { name: 'Tính GPA', href: '/gpa', icon: Calculator },
  { name: 'Thời khóa biểu', href: '/timetable', icon: Calendar },
  { name: 'Lịch thi', href: '/exams', icon: FileText },
  { name: 'Chợ Giáo Trình', href: '/market', icon: ShoppingBag },
  { name: 'Song ngành', href: '/double-major', icon: BookOpen },
];

const MOBILE_NAV_ITEMS = [
  { name: 'Trang chủ', href: '/', icon: Home },
  { name: 'Tiến độ', href: '/progress', icon: BookOpen },
  { name: 'Tính GPA', href: '/gpa', icon: Calculator },
  { name: 'Lịch học', href: '/timetable', icon: Calendar },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isDesktopExpanded, setIsDesktopExpanded] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Notifications State
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('full_name, avatar_url, student_code').eq('user_id', userId).single();
    if (data) setProfile(data);
  };

  const fetchNotifications = async (userId: string) => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setNotifications(data);
  };

  useEffect(() => {
    setMounted(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsAuthChecking(false);
      if (session) {
        fetchProfile(session.user.id);
        fetchNotifications(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
        fetchNotifications(session.user.id);
      } else {
        setProfile(null);
        setNotifications([]);
      }
    });

    const handleProfileUpdate = () => {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session) fetchProfile(session.user.id);
        });
    };
    window.addEventListener('profile-updated', handleProfileUpdate);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('profile-updated', handleProfileUpdate);
    };
  }, []);

  // Realtime subscription for notifications
  useEffect(() => {
    if (!session) return;
    
    const channel = supabase
      .channel('realtime_notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${session.user.id}` },
        (payload) => {
          setNotifications(prev => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session) {
    return <AuthPage onLogin={() => {}} />;
  }

  const asideWidth = isDesktopExpanded ? 'w-64' : 'w-64 md:w-20';
  const textVisibilityClass = isDesktopExpanded 
    ? "opacity-100 max-w-[200px] ml-4" 
    : "opacity-100 max-w-[200px] ml-4 md:opacity-0 md:max-w-0 md:ml-0";
  const itemWrapperClass = isDesktopExpanded 
    ? "justify-start px-4" 
    : "justify-start px-4 md:justify-center md:px-0";
  const activeIndicatorClass = "absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.72)] rounded-r-full";

  return (
    <div className="min-h-dvh md:h-dvh w-screen overflow-x-hidden md:overflow-hidden flex bg-background">
      
      {/* Decorative Background Meshes for Liquid Glassmorphism */}
      <div className="fixed -top-36 left-[12%] h-[28rem] w-[28rem] rounded-full bg-cyan-500/[0.06] dark:bg-cyan-500/12 blur-[110px] pointer-events-none z-0"></div>
      <div className="fixed -bottom-44 right-[4%] h-[34rem] w-[34rem] rounded-full bg-blue-500/[0.055] dark:bg-indigo-500/14 blur-[130px] pointer-events-none z-0"></div>

      {/* Main Desktop App Window */}
      <div className="w-full min-h-dvh md:h-full flex overflow-visible md:overflow-hidden relative z-10">
        
        {/* Desktop sidebar. Mobile navigation is rendered separately at the root
            so it can never be affected by the document scroll container. */}
        <aside className={`hidden md:flex md:static ${asideWidth} border-r border-glass-border flex-col py-5 flex-shrink-0 overflow-hidden bg-glass-panel/65 backdrop-blur-2xl shadow-none transition-[width,background-color] duration-200`}>
            
            <div className={`flex items-center ${isDesktopExpanded ? 'justify-between px-6' : 'justify-center'} mb-6 w-full`}>
              <Menu 
                size={24} 
                className="text-foreground/70 cursor-pointer hover:text-foreground transition-colors hidden md:block" 
                onClick={() => setIsDesktopExpanded(!isDesktopExpanded)} 
              />
              {isDesktopExpanded && <span className="font-bold text-foreground/90 hidden md:block tracking-widest text-sm uppercase">Menu</span>}
              <div className="md:hidden flex items-center justify-between w-full px-6">
                <span className="font-bold text-foreground/90 tracking-widest text-sm uppercase">Menu</span>
                <button className="text-foreground/70 hover:text-foreground transition-colors" onClick={() => setIsMobileOpen(false)}>
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <nav className="flex-1 flex flex-col gap-2 w-full px-3 overflow-y-auto no-scrollbar">
              {NAV_ITEMS.map(item => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href} className="w-full relative group" onClick={() => setIsMobileOpen(false)} aria-current={isActive ? 'page' : undefined}>
                    {isActive && <div className={activeIndicatorClass} />}
                    <div className={`min-h-12 p-3 rounded-2xl transition-[background-color,color,box-shadow,transform] duration-200 flex items-center ${itemWrapperClass} ${isActive ? 'bg-gradient-to-r from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/20 text-white' : 'text-foreground/65 hover:bg-foreground/8 hover:text-foreground hover:translate-x-0.5'}`} title={!isDesktopExpanded ? item.name : undefined}>
                      <Icon size={24} strokeWidth={isActive ? 2.5 : 2} className="flex-shrink-0" />
                      <span className={`font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ${textVisibilityClass}`}>
                        {item.name}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </nav>

            </aside>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 min-h-dvh md:min-h-0 flex flex-col md:h-full md:overflow-hidden text-foreground relative">
            
            {/* Header */}
            <header className="app-chrome sticky top-0 z-30 h-[calc(4rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] md:static md:z-20 md:h-20 md:pt-0 border-b border-glass-border flex items-center justify-between px-3 sm:px-5 md:px-8 flex-shrink-0 backdrop-blur-2xl transition-colors duration-200">
              <div className="flex items-center gap-2.5 md:gap-4 min-w-0">
                <button className="md:hidden w-11 h-11 text-foreground/70 hover:text-foreground active:bg-foreground/10 rounded-xl transition-colors flex items-center justify-center" onClick={() => setIsMobileOpen(true)} aria-label="Mở menu">
                  <Menu size={24} />
                </button>
                <img
                  src="/neu-space-icon.png"
                  alt="neuOS"
                  className="w-10 h-10 md:w-12 md:h-12 rounded-2xl shadow-lg shadow-cyan-500/20"
                />
                <h1 className="text-lg md:text-2xl font-semibold tracking-[0.04em] drop-shadow-sm hidden sm:block mt-1 bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">
                  neuOS
                </h1>
              </div>

              <div className="flex items-center gap-1 md:gap-6">
                
                <button className="text-foreground/70 hover:text-foreground transition-colors hidden sm:block">
                  <HelpCircle size={22} />
                </button>

                {/* Theme Toggle Button - Minimalist Effect */}
                {mounted && (
                  <button 
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="w-11 h-11 text-foreground/70 hover:text-foreground active:bg-foreground/10 rounded-xl transition-colors flex items-center justify-center"
                    title={theme === 'dark' ? 'Chuyển sang nền sáng' : 'Chuyển sang nền tối'}
                    aria-label={theme === 'dark' ? 'Chuyển sang nền sáng' : 'Chuyển sang nền tối'}
                  >
                    {theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
                  </button>
                )}
                
                <div className="relative flex items-center">
                  <button 
                    className="w-11 h-11 text-foreground/70 hover:text-foreground active:bg-foreground/10 rounded-xl transition-colors relative flex items-center justify-center"
                    onClick={() => setShowNotifications(!showNotifications)}
                    aria-label={unreadCount > 0 ? `Thông báo, ${unreadCount} chưa đọc` : 'Thông báo'}
                  >
                    <Bell size={22} />
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-transparent shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
                    )}
                  </button>

                  {/* Notification Dropdown */}
                  {showNotifications && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)}></div>
                      <div className="absolute top-full right-0 mt-6 w-80 sm:w-96 bg-background dark:bg-slate-900 border border-border shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] rounded-2xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                        <div className="p-4 border-b border-border/50 flex justify-between items-center bg-foreground/5">
                          <h3 className="font-bold text-base">Thông báo</h3>
                          {unreadCount > 0 && (
                            <span className="text-xs font-medium text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-full">
                              {unreadCount} mới
                            </span>
                          )}
                        </div>
                        
                        <div className="max-h-[60vh] overflow-y-auto no-scrollbar">
                          {notifications.length === 0 ? (
                            <div className="p-8 text-center opacity-50 flex flex-col items-center">
                              <Bell size={32} className="mb-2 opacity-20" />
                              <p className="text-sm">Không có thông báo nào</p>
                            </div>
                          ) : (
                            <div className="flex flex-col">
                              {notifications.map(noti => (
                                <Link 
                                  key={noti.id} 
                                  href={noti.link || '#'}
                                  onClick={() => {
                                    markAsRead(noti.id);
                                    setShowNotifications(false);
                                  }}
                                  className={`p-4 border-b border-border/30 hover:bg-foreground/5 transition-colors flex gap-3 ${!noti.is_read ? 'bg-cyan-500/5' : ''}`}
                                >
                                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!noti.is_read ? 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]' : 'bg-transparent'}`}></div>
                                  <div className="flex-1">
                                    <h4 className={`text-sm ${!noti.is_read ? 'font-bold' : 'font-medium'}`}>{noti.title}</h4>
                                    <p className="text-xs opacity-70 mt-1 line-clamp-2 leading-relaxed">{noti.content}</p>
                                    <p className="text-[10px] opacity-40 mt-2">
                                      {new Date(noti.created_at).toLocaleString('vi-VN')}
                                    </p>
                                  </div>
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="h-8 w-px bg-foreground/20 hidden sm:block"></div>
                
                {/* Avatar */}
                <div className="relative">
                  <button className="w-11 h-11 flex items-center justify-center cursor-pointer hover:opacity-80 active:bg-foreground/10 rounded-xl transition-opacity" onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} aria-label="Mở menu tài khoản" aria-expanded={isUserMenuOpen}>
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="Avatar" className="w-9 h-9 md:w-10 md:h-10 rounded-full border-2 border-glass-border object-cover shadow-lg" />
                    ) : (
                      <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold shadow-lg border border-white/20">
                        {profile?.full_name?.charAt(0) || 'U'}
                      </div>
                    )}
                  </button>
                  
                  {isUserMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
                      <div className="absolute right-0 top-full mt-3 w-56 bg-background/95 backdrop-blur-3xl border border-glass-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
                        <div className="p-4 border-b border-glass-border bg-foreground/5">
                          <p className="font-bold text-foreground text-sm truncate">{profile?.full_name || 'Sinh viên'}</p>
                        </div>
                        <div className="p-2 flex flex-col gap-1">
                          <Link href="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground/80 hover:bg-foreground/10 hover:text-foreground transition-colors" onClick={() => setIsUserMenuOpen(false)}>
                            <Settings size={18} />
                            Cài đặt tài khoản
                          </Link>
                          <button onClick={async () => { 
                            setIsUserMenuOpen(false); 
                            localStorage.removeItem('gpa_entries');
                            await supabase.auth.signOut(); 
                          }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors text-left">
                            <LogOut size={18} />
                            Đăng xuất
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </header>

            {/* Scrollable Content */}
            <main className="w-full touch-pan-y p-4 pb-[calc(7rem+env(safe-area-inset-bottom))] sm:p-5 sm:pb-[calc(7rem+env(safe-area-inset-bottom))] md:flex-1 md:min-h-0 md:overflow-y-auto md:p-7 lg:p-8 xl:px-10 scroll-smooth no-scrollbar">
              {children}
            </main>
        </div>
      </div>
      <nav className="app-chrome fixed md:hidden inset-x-0 bottom-0 z-30 border-t border-glass-border backdrop-blur-2xl px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]" aria-label="Điều hướng chính">
        <div className="grid grid-cols-5 max-w-md mx-auto gap-1.5">
          {MOBILE_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} aria-current={isActive ? 'page' : undefined} className={`min-h-12 rounded-2xl flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-[background-color,color,transform,box-shadow] duration-200 ${isActive ? 'bg-cyan-800 text-white shadow-[0_4px_12px_rgba(14,116,144,0.20)] dark:bg-cyan-500/25 dark:text-cyan-200 dark:shadow-none' : 'text-foreground/60 active:scale-95 active:bg-foreground/10'}`}>
                <Icon size={21} strokeWidth={isActive ? 2.5 : 2} />
                <span className="leading-none">{item.name}</span>
              </Link>
            );
          })}
          <button type="button" onClick={() => setIsMobileOpen(true)} aria-label="Mở thêm chức năng" className="min-h-12 rounded-2xl flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold text-foreground/60 active:scale-95 active:bg-foreground/10 transition-[background-color,transform] duration-200">
            <MoreHorizontal size={22} />
            <span className="leading-none">Thêm</span>
          </button>
        </div>
      </nav>
      {isMobileOpen && (
        <div className="fixed inset-0 z-[70] md:hidden" role="presentation">
          <button
            type="button"
            className="absolute inset-0 w-full h-full cursor-default bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMobileOpen(false)}
            aria-label="Đóng menu"
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Menu điều hướng"
            className="absolute inset-y-0 left-0 z-[71] w-72 max-w-[calc(100vw-3rem)] flex flex-col overflow-hidden border-r border-glass-border bg-background/95 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl backdrop-blur-2xl animate-in slide-in-from-left-4 duration-200"
          >
            <div className="mb-6 flex items-center justify-between px-5">
              <span className="text-sm font-semibold tracking-[0.08em] text-foreground/90">Menu</span>
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-xl text-foreground/70 active:bg-foreground/10"
                onClick={() => setIsMobileOpen(false)}
                aria-label="Đóng menu"
              >
                <X size={24} />
              </button>
            </div>
            <nav className="flex-1 space-y-2 overflow-y-auto overscroll-contain px-4 pb-2 touch-pan-y no-scrollbar" aria-label="Các chức năng khác">
              {NAV_ITEMS.map(item => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex min-h-12 items-center gap-4 rounded-2xl px-4 py-3 text-sm font-semibold transition-[background-color,color,transform] duration-200 ${isActive ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/20' : 'text-foreground/75 active:scale-[0.99] active:bg-foreground/10'}`}
                  >
                    <Icon size={22} strokeWidth={isActive ? 2.5 : 2} aria-hidden="true" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}
      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
}
