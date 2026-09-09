const fs = require('fs');
const path = 'C:/Users/Admin/.gemini/antigravity/scratch/neu-student-utility/src/components/layout/DashboardLayout.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/<div className="mt-auto flex flex-col gap-3 w-full px-4 pt-4 border-t border-glass-border">[\s\S]*?<\/aside>/, '</aside>');
content = content.replace('const [isMobileOpen, setIsMobileOpen] = useState(false);', 'const [isMobileOpen, setIsMobileOpen] = useState(false);\n  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);');

// The session is not defined in the scope of this file. We need to add session state or just use what we have.
// Wait, is `session` defined? In `DashboardLayout.tsx`, let me check if `session` exists. 
// If it doesn't exist, we will use `profile?.email` but `profile` doesn't have email by default. 
// Let's just use 'Sinh viên NEU'.

const avatarOld = `<div className="flex items-center gap-3">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="w-9 h-9 md:w-10 md:h-10 rounded-full border-2 border-glass-border object-cover shadow-lg" />
                  ) : (
                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold shadow-lg border border-white/20">
                      {profile?.full_name?.charAt(0) || 'U'}
                    </div>
                  )}
                </div>`;

const avatarNew = `<div className="relative">
                  <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}>
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="Avatar" className="w-9 h-9 md:w-10 md:h-10 rounded-full border-2 border-glass-border object-cover shadow-lg" />
                    ) : (
                      <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold shadow-lg border border-white/20">
                        {profile?.full_name?.charAt(0) || 'U'}
                      </div>
                    )}
                  </div>
                  
                  {isUserMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
                      <div className="absolute right-0 top-full mt-3 w-64 bg-glass-panel backdrop-blur-3xl border border-glass-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
                        <div className="p-4 border-b border-glass-border bg-foreground/5">
                          <p className="font-bold text-foreground text-sm truncate">{profile?.full_name || 'Sinh viên NEU'}</p>
                          <p className="text-xs text-foreground/60 mt-1 truncate">{profile?.student_code || 'Chưa cập nhật MSV'}</p>
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
                </div>`;

content = content.replace(avatarOld, avatarNew);
fs.writeFileSync(path, content);
