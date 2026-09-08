'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { 
  ChevronLeft, ChevronRight, MoreHorizontal, Calendar as CalendarIcon, Clock, BookOpen, Award, ChevronDown, Calculator, Eye, EyeOff
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { calculateGPA } from '@/utils/neuLogic';
import Link from 'next/link';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface GradeRecord {
  subject_code: string;
  credits: number;
  score_cc: number;
  score_gk: number;
  score_ck: number;
  score_10: number;
}

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [grades, setGrades] = useState<GradeRecord[]>([]);
  
  // Timetable & Calendar state
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [examEvents, setExamEvents] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [showGpa, setShowGpa] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const userId = session.user.id;

      let { data: profileData } = await supabase.from('profiles').select('*').eq('user_id', userId).single();
      if (!profileData) {
        profileData = { full_name: session.user.email?.split('@')[0] || 'Sinh viên' };
      }
      setProfile(profileData);

      const { data: gradesData } = await supabase.from('grades').select('*').eq('user_id', userId);
      if (gradesData) setGrades(gradesData as any);

      // Classes
      const { data: tbData } = await supabase.from('timetable_events')
        .select('*')
        .eq('user_id', userId)
        .order('start_time', { ascending: true });
      if (tbData) setAllEvents(tbData);

      // Exams
      const { data: examData } = await supabase.from('exams').select('*').eq('user_id', userId);
      if (examData) {
        setExamEvents(examData);
      }

    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const overallStats = useMemo(() => {
    const validGrades = grades
      .filter(g => g.score_10 !== null && g.score_10 !== undefined)
      .map(g => ({ credits: g.credits || 3, score10: Number(g.score_10) }));
    return calculateGPA(validGrades);
  }, [grades]);

  const graduationProgress = useMemo(() => {
    let required = 130;
    const percent = Math.min((overallStats.totalCredits / required) * 100, 100);
    return { current: overallStats.totalCredits, required, percent };
  }, [overallStats]);

  // Derived active weekdays (2-8) for classes
  const activeWeekdays = useMemo(() => {
    return new Set(allEvents.map(e => e.day_of_week));
  }, [allEvents]);

  // Lấy các lớp học cho ngày đã chọn
  const displayTimetableClasses = useMemo(() => {
    const neuDay = selectedDate.getDay() === 0 ? 8 : selectedDate.getDay() + 1;
    return allEvents.filter(e => e.day_of_week === neuDay).sort((a, b) => {
      if (!a.start_time) return 1;
      if (!b.start_time) return -1;
      return a.start_time.localeCompare(b.start_time);
    });
  }, [selectedDate, allEvents]);

  // Lấy các bài thi cho ngày đã chọn
  const todaysExams = useMemo(() => {
    const selectedDateString = `${selectedDate.getFullYear()}-${(selectedDate.getMonth()+1).toString().padStart(2,'0')}-${selectedDate.getDate().toString().padStart(2,'0')}`;
    return examEvents.filter(e => e.exam_date === selectedDateString);
  }, [selectedDate, examEvents]);

  const isTodaySelected = selectedDate.toDateString() === new Date().toDateString();
  const scheduleTitle = isTodaySelected 
    ? "Lịch học & Thi hôm nay" 
    : `Lịch ngày ${selectedDate.getDate().toString().padStart(2, '0')}/${(selectedDate.getMonth() + 1).toString().padStart(2, '0')}`;

  const handlePrevMonth = () => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1));
  const handleNextMonth = () => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1));

  const renderMiniCalendar = () => {
    const today = new Date();
    const currentMonth = calendarMonth.getMonth();
    const currentYear = calendarMonth.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const startIdx = (firstDayIndex + 6) % 7; 
    
    const days = [];
    for(let i = 0; i < startIdx; i++) days.push(null);
    for(let i = 1; i <= daysInMonth; i++) days.push(i);

    return (
      <div className="flex flex-col h-full relative">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold tracking-wide text-foreground">Tháng {currentMonth + 1}/{currentYear}</h3>
          <div className="flex gap-2 text-foreground/50">
            <ChevronLeft size={20} className="cursor-pointer hover:text-foreground transition-colors" onClick={handlePrevMonth} />
            <ChevronRight size={20} className="cursor-pointer hover:text-foreground transition-colors" onClick={handleNextMonth} />
          </div>
        </div>
        
        <div className="grid grid-cols-7 text-center bg-red-500 text-foreground rounded-full py-2.5 mb-4 text-[11px] sm:text-sm font-bold shadow-[0_4px_15px_rgba(239,68,68,0.4)]">
          <span>T2</span><span>T3</span><span>T4</span><span>T5</span><span>T6</span><span>T7</span><span>CN</span>
        </div>
        
        <div className="grid grid-cols-7 gap-y-3 text-center text-sm font-medium flex-1 content-start">
          {days.map((d, i) => {
            if (!d) return <div key={i}></div>;
            
            const cellDate = new Date(currentYear, currentMonth, d);
            const isToday = cellDate.toDateString() === today.toDateString();
            const isSelected = cellDate.toDateString() === selectedDate.toDateString();
            
            const cellNeuDay = cellDate.getDay() === 0 ? 8 : cellDate.getDay() + 1;
            const cellDateString = `${currentYear}-${(currentMonth+1).toString().padStart(2,'0')}-${d.toString().padStart(2,'0')}`;
            
            const hasClass = activeWeekdays.has(cellNeuDay);
            const hasExam = examEvents.some(ex => ex.exam_date === cellDateString);
            
            let wrapperClass = "w-8 h-8 sm:w-10 sm:h-10 mx-auto flex flex-col items-center justify-center rounded-full cursor-pointer transition-all relative ";
            
            if (isToday) {
              wrapperClass += "bg-red-500 text-foreground font-bold shadow-md shadow-red-500/40";
            } else if (isSelected) {
              wrapperClass += "border border-cyan-400 bg-foreground/10 text-foreground font-bold";
            } else {
              wrapperClass += "text-foreground/70 hover:bg-foreground/10 hover:text-foreground";
            }

            return (
              <div key={i} className={wrapperClass} onClick={() => setSelectedDate(cellDate)}>
                <span className="leading-none">{d}</span>
                <div className="flex gap-0.5 mt-1">
                  {hasClass && !isToday && (
                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_5px_rgba(6,182,212,0.8)]"></div>
                  )}
                  {hasClass && isToday && (
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  )}
                  {hasExam && (
                    <div className={`w-1.5 h-1.5 rounded-full shadow-[0_0_5px_rgba(249,115,22,0.8)] ${isToday ? 'bg-white' : 'bg-orange-500'}`}></div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center w-full">
        <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const todayNeuDay = new Date().getDay() === 0 ? 8 : new Date().getDay() + 1;
  const todaysClassesCount = allEvents.filter(e => e.day_of_week === todayNeuDay).length;

  return (
    <div className="flex flex-col gap-6 w-full max-w-full lg:h-full animate-in fade-in duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-shrink-0">
        <div className="lg:col-span-5 xl:col-span-4 glass-panel p-6 relative overflow-hidden flex flex-col justify-center min-h-[160px]">
          <div className="absolute right-4 top-4 text-foreground/30 text-3xl font-serif pointer-events-none">✦</div>
          
          <h3 className="text-xl md:text-2xl font-semibold mb-1 text-foreground drop-shadow-md tracking-wide">
            Xin chào, <span className="text-foreground">{profile?.full_name?.split(' ').pop() || 'Sinh viên'}</span> 👋
          </h3>
          <p className="text-sm text-red-400 mb-5 font-medium hover:underline cursor-pointer">
            {profile?.major_name || 'Chưa cập nhật chuyên ngành'}
          </p>
          <div>
            <Link href="/settings" className="inline-block bg-gradient-to-r from-red-500 to-rose-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-[0_4px_15px_rgba(239,68,68,0.4)] hover:scale-105 transition-transform relative z-10">
              Hồ sơ sinh viên
            </Link>
          </div>
        </div>

        <div className="lg:col-span-7 xl:col-span-8 grid grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
          {[
            { label: 'GPA Hệ 4', value: overallStats.gpa4.toFixed(2), unit: '/4.00', icon: Award, color: 'text-cyan-400', isGpa: true },
            { label: 'GPA Hệ 10', value: overallStats.gpa10.toFixed(2), unit: '/10.0', icon: Calculator, color: 'text-blue-400', isGpa: true },
            { label: 'Tín chỉ', value: overallStats.totalCredits, unit: '/130 TC', icon: BookOpen, color: 'text-purple-400', isGpa: false },
            { label: 'Hoạt động hôm nay', value: todaysClassesCount, unit: 'Ca học', icon: Clock, color: 'text-red-400', isGpa: false },
          ].map((stat, idx) => (
            <div key={idx} className="glass-card p-5 flex flex-col justify-center relative overflow-hidden group">
               <div className="absolute -right-6 -top-6 opacity-10 group-hover:opacity-20 transition-opacity">
                 <stat.icon size={80} />
               </div>
               
               {stat.isGpa && (
                 <button 
                   onClick={() => setShowGpa(!showGpa)} 
                   className="absolute top-4 left-4 text-foreground/40 hover:text-foreground/80 transition-colors z-20 p-1"
                   title={showGpa ? "Ẩn GPA" : "Hiện GPA"}
                 >
                   {showGpa ? <EyeOff size={16} /> : <Eye size={16} />}
                 </button>
               )}

               <div className="text-xs text-foreground/70 mb-2 uppercase tracking-wider font-bold z-10 pt-2">{stat.label}</div>
               <div className="flex items-baseline gap-1 z-10">
                 <span className={`text-3xl font-bold ${stat.color} transition-all duration-300 ${stat.isGpa && !showGpa ? 'blur-[8px] select-none opacity-40' : 'blur-0 opacity-100'}`}>
                   {stat.value}
                 </span>
                 <span className={`text-sm text-foreground/50 font-medium transition-all duration-300 ${stat.isGpa && !showGpa ? 'opacity-0' : 'opacity-100'}`}>{stat.unit}</span>
               </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:flex-1 lg:min-h-[400px]">
        <div className="glass-panel min-h-[440px] p-6 flex flex-col relative overflow-hidden lg:min-h-0">
           {renderMiniCalendar()}
        </div>

        <div className="glass-panel min-h-[440px] p-6 flex flex-col relative overflow-hidden lg:min-h-0">
          <div className="flex justify-between items-center mb-4 relative z-10">
            <h3 className="text-xl font-semibold tracking-wide text-foreground">Tiến độ tốt nghiệp</h3>
          </div>
          
          <div className="flex justify-between text-sm mb-2 font-medium text-foreground/80 relative z-10">
            <span>Đã hoàn thành</span>
            <span>{graduationProgress.percent.toFixed(1)}%</span>
          </div>
          
          <div className="w-full h-4 bg-foreground/10 rounded-full mb-4 overflow-hidden relative z-10 shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full shadow-[0_0_12px_rgba(6,182,212,0.6)] transition-all duration-1000 ease-out relative" 
              style={{ width: `${Math.max(graduationProgress.percent, 1.5)}%` }}
            >
              <div className="absolute right-0 top-0 h-full w-3 bg-white/40 rounded-full blur-[2px]"></div>
            </div>
          </div>

          {/* Donut Chart — Số môn đã học vs còn lại */}
          <div className="flex-1 flex items-center justify-center relative z-10 my-2">
            <div className="relative w-[160px] h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Đã học', value: grades.length || 0 },
                      { name: 'Còn lại', value: Math.max(0, 45 - (grades.length || 0)) },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={72}
                    startAngle={90}
                    endAngle={-270}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    <Cell fill="#06b6d4" />
                    <Cell fill="rgba(128,128,128,0.2)" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              {/* Center Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-black text-foreground leading-none">{grades.length}</span>
                <span className="text-[10px] text-foreground/50 font-medium mt-1">/ ~45 môn</span>
              </div>
            </div>

            {/* Legend */}
            <div className="ml-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.5)]"></div>
                <div>
                  <div className="text-xs font-semibold text-foreground">{grades.length} môn</div>
                  <div className="text-[10px] text-foreground/50">Đã có điểm</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-foreground/15"></div>
                <div>
                  <div className="text-xs font-semibold text-foreground">{Math.max(0, 45 - grades.length)} môn</div>
                  <div className="text-[10px] text-foreground/50">Còn lại</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-auto relative z-10">
             <div className="bg-foreground/5 border border-foreground/10 p-4 rounded-2xl">
               <div className="text-xs text-foreground/50 mb-1">Tín chỉ tích lũy</div>
               <div className="text-xl font-bold text-foreground">{graduationProgress.current} <span className="text-sm font-normal text-foreground/50">/ {graduationProgress.required}</span></div>
             </div>
             <div className="bg-foreground/5 border border-foreground/10 p-4 rounded-2xl">
               <div className="text-xs text-foreground/50 mb-1">Tín chỉ còn lại</div>
               <div className="text-xl font-bold text-foreground">{Math.max(0, graduationProgress.required - graduationProgress.current)} <span className="text-sm font-normal text-foreground/50">TC</span></div>
             </div>
          </div>
        </div>

        <div className="glass-panel min-h-[360px] p-6 flex flex-col relative overflow-hidden lg:min-h-0">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold tracking-wide text-foreground">{scheduleTitle}</h3>
          </div>
          
          <div className="w-full flex flex-col gap-4 lg:flex-1 lg:overflow-y-auto lg:pr-2">
            
            {/* Danh sách các môn học */}
            {displayTimetableClasses.length > 0 && (
              <table className="w-full text-sm text-left">
                <thead className="text-[11px] text-foreground/50 border-b border-foreground/10 uppercase tracking-wider font-bold">
                  <tr>
                    <th className="pb-3 w-10">Ca</th>
                    <th className="pb-3">Tên môn</th>
                    <th className="pb-3 text-center">Giờ</th>
                    <th className="pb-3 text-right">Phòng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {displayTimetableClasses.map((e, idx) => (
                    <tr key={idx} className="group hover:bg-foreground/5 transition-colors cursor-pointer">
                      <td className="py-4 font-bold text-foreground/80 pl-1">0{e.class_period || (idx+1)}</td>
                      <td className="py-4 font-medium max-w-[120px] pr-2 leading-tight text-foreground">{e.custom_title}</td>
                      <td className="py-4 text-xs text-foreground/70 text-center">{e.start_time?.substring(0,5)}{e.end_time && <><br/><span className="opacity-50">{e.end_time.substring(0,5)}</span></>}</td>
                      <td className="py-4 text-xs text-right pr-1 font-medium text-red-400">{e.room}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Danh sách các bài thi hiển thị theo dạng ô riêng (Cards) */}
            {todaysExams.map(ex => (
              <div key={ex.id} className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 flex flex-col gap-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 px-2 py-1 bg-orange-500/20 text-orange-400 text-[10px] font-bold rounded-bl-lg">THI</div>
                <h4 className="font-bold text-orange-400 text-base">{ex.subject_name}</h4>
                <div className="flex items-center justify-between text-xs text-foreground/70">
                   <div className="flex items-center gap-1"><Clock size={14} className="text-cyan-400"/> {ex.start_time?.substring(0,5)}</div>
                   <div className="flex items-center gap-1 text-red-300 font-medium">Phòng: {ex.room}</div>
                </div>
              </div>
            ))}

            {displayTimetableClasses.length === 0 && todaysExams.length === 0 && (
               <div className="py-12 text-center text-foreground/40 italic text-sm">Ngày này bạn trống lịch</div>
            )}
          </div>

          <div className="flex justify-center mt-4 pt-4 border-t border-foreground/10">
            <Link href="/timetable" className="bg-gradient-to-r from-red-500 to-rose-500 text-white px-8 py-2.5 rounded-full text-sm font-bold shadow-[0_4px_15px_rgba(239,68,68,0.4)] hover:scale-105 transition-transform">
              Xem toàn bộ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
