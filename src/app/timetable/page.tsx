'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, Plus, Clock, MapPin, Trash2, Loader2, BookOpen, Activity, Filter, FilterX, Download } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import ExportTimetableModal from '@/components/modals/ExportTimetableModal';

interface TimetableEvent {
  id: string;
  name: string;
  shift: string;
  startTime: string;
  endTime: string;
  dayOfWeek: number;
  room: string;
  type: 'HOC' | 'HOAT_DONG' | 'THI';
  dbTable: 'timetable_events' | 'activities';
}

const NEU_SHIFTS = [
  { id: '1-2', label: 'Ca 1-2', time: '06:45 - 09:25' },
  { id: '3-4', label: 'Ca 3-4', time: '09:35 - 12:15' },
  { id: '5-6', label: 'Ca 5-6', time: '13:00 - 15:40' },
  { id: '7-8', label: 'Ca 7-8', time: '15:50 - 18:30' },
  { id: 'Other', label: 'Khác/Tối', time: 'Tự chọn' }
];

const DAYS = [
  { id: 2, label: 'Thứ 2', short: 'T2' },
  { id: 3, label: 'Thứ 3', short: 'T3' },
  { id: 4, label: 'Thứ 4', short: 'T4' },
  { id: 5, label: 'Thứ 5', short: 'T5' },
  { id: 6, label: 'Thứ 6', short: 'T6' },
  { id: 7, label: 'Thứ 7', short: 'T7' },
  { id: 8, label: 'Chủ Nhật', short: 'CN' },
];

const EVENT_COLORS = [
  'from-cyan-500/20 to-blue-500/10 border-cyan-500/30 text-cyan-500',
  'from-violet-500/20 to-fuchsia-500/10 border-violet-500/30 text-violet-500',
  'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-500',
  'from-rose-500/20 to-pink-500/10 border-rose-500/30 text-rose-500',
  'from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-500',
  'from-indigo-500/20 to-blue-600/10 border-indigo-500/30 text-indigo-500',
  'from-lime-500/20 to-green-500/10 border-lime-500/30 text-lime-500'
];

export default function TimetablePage() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<TimetableEvent[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hideEmptyDays, setHideEmptyDays] = useState(false);
  const [mobileView, setMobileView] = useState<'today' | 'week'>('today');
  const [draggedEventId, setDraggedEventId] = useState<string | null>(null);
  const [dragOverCell, setDragOverCell] = useState<{ day: number; shift: string } | null>(null);

  // Form state
  const [type, setType] = useState<'HOC' | 'HOAT_DONG'>('HOC');
  const [name, setName] = useState('');
  const [day, setDay] = useState(2);
  const [shift, setShift] = useState('1-2');
  const [startTime, setStartTime] = useState(NEU_SHIFTS[0].time.split(' - ')[0]);
  const [endTime, setEndTime] = useState(NEU_SHIFTS[0].time.split(' - ')[1]);
  const [room, setRoom] = useState('');

  const fetchEvents = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const uid = session.user.id;

      const [resHoc, resHD, resProfile] = await Promise.all([
        supabase.from('timetable_events').select('*').eq('user_id', uid),
        supabase.from('activities').select('*').eq('user_id', uid),
        supabase.from('profiles').select('*').eq('user_id', uid).single()
      ]);

      if (resProfile.data) {
        setProfile(resProfile.data);
      }

      const merged: TimetableEvent[] = [];
      
      if (resHoc.data) {
        resHoc.data.forEach((e: any) => merged.push({
          id: e.id,
          name: e.custom_title || 'Môn học',
          shift: e.class_period || 'Other',
          startTime: e.start_time ? e.start_time.substring(0, 5) : '',
          endTime: e.end_time ? e.end_time.substring(0, 5) : '',
          dayOfWeek: e.day_of_week,
          room: e.room || '',
          type: 'HOC',
          dbTable: 'timetable_events'
        }));
      }

      if (resHD.data) {
        resHD.data.forEach((e: any) => merged.push({
          id: e.id,
          name: e.title || 'Hoạt động',
          shift: 'Other',
          startTime: e.start_time ? e.start_time.substring(0, 5) : '',
          endTime: e.end_time ? e.end_time.substring(0, 5) : '',
          dayOfWeek: e.day_of_week,
          room: e.description || '',
          type: 'HOAT_DONG',
          dbTable: 'activities'
        }));
      }

      setEvents(merged);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchEvents();
  }, []);

  const handleShiftChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const s = e.target.value;
    setShift(s);
    const shiftData = NEU_SHIFTS.find(x => x.id === s);
    if (s !== 'Other' && shiftData) {
      setStartTime(shiftData.time.split(' - ')[0]);
      setEndTime(shiftData.time.split(' - ')[1]);
    }
  };

  const addEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const uid = session.user.id;

      if (type === 'HOC') {
        await supabase.from('timetable_events').insert({
          user_id: uid,
          custom_title: name,
          day_of_week: day,
          start_time: startTime ? `${startTime}:00` : null,
          end_time: endTime ? `${endTime}:00` : null,
          class_period: shift,
          room: room,
          event_type: 'HOC'
        });
      } else {
        await supabase.from('activities').insert({
          user_id: uid,
          title: name,
          day_of_week: day,
          start_time: startTime ? `${startTime}:00` : null,
          end_time: endTime ? `${endTime}:00` : null,
          description: room,
          activity_type: 'CA_NHAN'
        });
      }

      await fetchEvents();
      setIsModalOpen(false);
      setName(''); setRoom('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeEvent = async (id: string, dbTable: string) => {
    try {
      setEvents(events.filter(e => e.id !== id));
      await supabase.from(dbTable).delete().eq('id', id);
    } catch (err) {
      console.error(err);
      fetchEvents();
    }
  };

  // ---- Drag & Drop Handlers ----
  const handleDragStart = (e: React.DragEvent, eventId: string) => {
    setDraggedEventId(eventId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', eventId);
    // Make the drag ghost semi-transparent
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedEventId(null);
    setDragOverCell(null);
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
  };

  const handleDragOver = (e: React.DragEvent, dayId: number, shiftId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCell({ day: dayId, shift: shiftId });
  };

  const handleDragLeave = () => {
    setDragOverCell(null);
  };

  const handleDrop = async (e: React.DragEvent, newDayId: number, newShiftId: string) => {
    e.preventDefault();
    setDragOverCell(null);
    setDraggedEventId(null);

    const eventId = e.dataTransfer.getData('text/plain');
    const draggedEvent = events.find(ev => ev.id === eventId);
    if (!draggedEvent) return;

    // No change? Skip
    if (draggedEvent.dayOfWeek === newDayId && draggedEvent.shift === newShiftId) return;

    // Determine new times from shift
    const newShiftData = NEU_SHIFTS.find(s => s.id === newShiftId);
    const newStartTime = newShiftData && newShiftId !== 'Other'
      ? newShiftData.time.split(' - ')[0]
      : draggedEvent.startTime;
    const newEndTime = newShiftData && newShiftId !== 'Other'
      ? newShiftData.time.split(' - ')[1]
      : draggedEvent.endTime;

    // Optimistic update
    setEvents(prev => prev.map(ev =>
      ev.id === eventId
        ? { ...ev, dayOfWeek: newDayId, shift: newShiftId, startTime: newStartTime, endTime: newEndTime }
        : ev
    ));

    // Persist to Supabase
    try {
      if (draggedEvent.dbTable === 'timetable_events') {
        await supabase.from('timetable_events').update({
          day_of_week: newDayId,
          class_period: newShiftId,
          start_time: newStartTime ? `${newStartTime}:00` : null,
          end_time: newEndTime ? `${newEndTime}:00` : null,
        }).eq('id', eventId);
      } else {
        await supabase.from('activities').update({
          day_of_week: newDayId,
          start_time: newStartTime ? `${newStartTime}:00` : null,
          end_time: newEndTime ? `${newEndTime}:00` : null,
        }).eq('id', eventId);
      }
    } catch (err) {
      console.error('Failed to update event position:', err);
      fetchEvents(); // Rollback on error
    }
  };

  const uniqueEventNames = useMemo(() => Array.from(new Set(events.map(e => e.name))), [events]);
  
  const getEventColor = (name: string) => {
    const index = uniqueEventNames.indexOf(name);
    return EVENT_COLORS[index % EVENT_COLORS.length];
  };

  const visibleDays = useMemo(() => {
    if (!hideEmptyDays) return DAYS;
    const activeDays = new Set(events.map(e => e.dayOfWeek));
    const filtered = DAYS.filter(d => activeDays.has(d.id));
    return filtered.length > 0 ? filtered : [DAYS[0]];
  }, [hideEmptyDays, events]);

  const todayDayId = new Date().getDay() || 8;
  const today = DAYS.find((item) => item.id === todayDayId) ?? DAYS[0];
  const todayEvents = useMemo(
    () => events
      .filter((event) => event.dayOfWeek === todayDayId)
      .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [events, todayDayId]
  );

  if (loading) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="animate-spin text-cyan-400 w-8 h-8" /></div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarIcon className="text-cyan-400" />
            Thời khóa biểu
          </h1>
          <p className="opacity-70 mt-1">Lưới thời gian (Time Grid Calendar) chuẩn sinh viên.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setHideEmptyDays(!hideEmptyDays)}
            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors border ${hideEmptyDays ? 'bg-violet-500/10 text-violet-400 border-violet-500/30' : 'bg-foreground/5 border-foreground/10 opacity-70 hover:opacity-100'}`}
          >
            {hideEmptyDays ? <FilterX size={18} /> : <Filter size={18} />}
            <span className="hidden sm:inline">{hideEmptyDays ? 'Hiện đủ tuần' : 'Ẩn ngày trống'}</span>
          </button>
          
          <button 
            onClick={() => setIsExportOpen(true)}
            title="Xuất thời khóa biểu (Ảnh/Excel)"
            className="p-2.5 rounded-xl bg-foreground/[0.08] hover:bg-foreground/[0.15] border border-foreground/20 text-foreground backdrop-blur-xl shadow-lg transition-all"
          >
            <Download size={20} />
          </button>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-cyan-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-lg shadow-cyan-500/20 hover:scale-[1.02] transition-transform"
          >
            <Plus size={18} />
            Thêm Lịch
          </button>
        </div>
      </div>

      {/* Mobile-first schedule view: daily agenda is easier to scan than a wide weekly grid. */}
      <div className="md:hidden rounded-2xl border border-border/60 bg-foreground/[0.04] p-1.5">
        <div className="grid grid-cols-2 gap-1.5" role="tablist" aria-label="Chế độ xem thời khóa biểu">
          <button
            type="button"
            role="tab"
            aria-selected={mobileView === 'today'}
            onClick={() => setMobileView('today')}
            className={`min-h-11 rounded-xl px-3 text-sm font-semibold transition-all ${mobileView === 'today' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'text-foreground/65 hover:bg-foreground/[0.07]'}`}
          >
            Hôm nay · {today.short}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mobileView === 'week'}
            onClick={() => setMobileView('week')}
            className={`min-h-11 rounded-xl px-3 text-sm font-semibold transition-all ${mobileView === 'week' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'text-foreground/65 hover:bg-foreground/[0.07]'}`}
          >
            Cả tuần
          </button>
        </div>
      </div>

      {mobileView === 'today' && (
        <section className="md:hidden glass-panel overflow-hidden border-border/50 animate-in fade-in slide-in-from-bottom-2 duration-200" aria-label={`Lịch ${today.label}`}>
          <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">Lịch của bạn</p>
              <h2 className="mt-1 text-xl font-bold">{today.label}</h2>
            </div>
            <span className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1.5 text-xs font-semibold text-cyan-300">
              {todayEvents.length} lịch
            </span>
          </div>

          {todayEvents.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <CalendarIcon className="mx-auto mb-3 text-cyan-400/60" size={32} />
              <h3 className="font-semibold">Hôm nay chưa có lịch</h3>
              <p className="mt-1 text-sm text-foreground/60">Tận hưởng thời gian trống, hoặc thêm một lịch mới.</p>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="mt-5 min-h-11 rounded-xl bg-cyan-500 px-4 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20"
              >
                Thêm lịch
              </button>
            </div>
          ) : (
            <div className="space-y-3 p-4">
              {todayEvents.map((event) => {
                const colorClass = getEventColor(event.name);
                const shiftLabel = NEU_SHIFTS.find((item) => item.id === event.shift)?.label ?? 'Khác/Tối';

                return (
                  <article key={event.id} className={`rounded-2xl border bg-gradient-to-br p-4 shadow-sm ${colorClass}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-wide opacity-80">{shiftLabel}</p>
                        <h3 className="mt-1 break-words text-base font-bold leading-snug">{event.name}</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeEvent(event.id, event.dbTable)}
                        aria-label={`Xóa ${event.name}`}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-background/40 text-red-400 transition-colors hover:bg-red-500 hover:text-white"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm font-medium opacity-90">
                      <span className="flex items-center gap-1.5"><Clock size={15} />{event.startTime} - {event.endTime}</span>
                      {event.room && <span className="flex items-center gap-1.5"><MapPin size={15} />{event.room}</span>}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Lưới Thời Gian (Time Grid Calendar) */}
      <div className={`${mobileView === 'today' ? 'hidden md:block' : 'block'} glass-panel overflow-hidden border-border/50 animate-in fade-in duration-200`}>
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            
            {/* Table Header (Days) */}
            <div className="flex border-b border-border/50 bg-background/30 backdrop-blur-md">
              <div className="w-[100px] flex-shrink-0 p-4 border-r border-border/50 flex items-center justify-center">
                <Clock size={20} className="opacity-40" />
              </div>
              {visibleDays.map(d => (
                <div key={d.id} className="flex-1 p-4 text-center font-bold text-sm tracking-wide">
                  {d.label}
                </div>
              ))}
            </div>

            {/* Table Body (Shifts) */}
            <div className="flex flex-col bg-background/10">
              {NEU_SHIFTS.map((shift, idx) => (
                <div key={shift.id} className={`flex ${idx !== NEU_SHIFTS.length - 1 ? 'border-b border-border/30' : ''}`}>
                  
                  {/* Time Label Col */}
                  <div className="w-[100px] flex-shrink-0 p-3 border-r border-border/50 flex flex-col items-center justify-center text-center">
                    <span className="font-bold text-xs uppercase text-brand-cyan/80">{shift.label}</span>
                    <span className="text-[10px] opacity-60 mt-1">{shift.time}</span>
                  </div>

                  {/* Day Columns */}
                  {visibleDays.map(d => {
                    const cellEvents = events
                      .filter(e => e.dayOfWeek === d.id && e.shift === shift.id)
                      .sort((a, b) => a.startTime.localeCompare(b.startTime));

                    const isDragTarget = dragOverCell?.day === d.id && dragOverCell?.shift === shift.id;

                    return (
                      <div
                        key={d.id}
                        className={`flex-1 p-2 border-r border-border/20 last:border-0 min-h-[120px] relative transition-all ${isDragTarget ? 'bg-cyan-400/10 ring-2 ring-cyan-400/50 ring-dashed' : 'hover:bg-black/5 dark:hover:bg-foreground/5'}`}
                        onDragOver={(e) => handleDragOver(e, d.id, shift.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, d.id, shift.id)}
                      >
                        
                        {cellEvents.map(e => {
                          const colorClass = getEventColor(e.name);
                          const isDragging = draggedEventId === e.id;
                          
                          return (
                            <div 
                              key={e.id}
                              draggable
                              onDragStart={(ev) => handleDragStart(ev, e.id)}
                              onDragEnd={handleDragEnd}
                              className={`mb-2 p-3 rounded-xl border bg-gradient-to-br ${colorClass} relative group cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-all animate-in fade-in zoom-in-95 ${isDragging ? 'opacity-50 scale-95' : ''}`}
                            >
                              <button 
                                onClick={(ev) => { ev.stopPropagation(); removeEvent(e.id, e.dbTable); }}
                                className="absolute top-2 right-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 rounded-full p-1 hover:bg-red-500 hover:text-white"
                                title="Xóa lịch này"
                              >
                                <Trash2 size={12} />
                              </button>
                              
                              <h4 className="font-bold text-sm leading-tight mb-2 pr-5">
                                {e.name}
                              </h4>
                              
                              <div className="space-y-1.5 opacity-90 text-xs font-medium">
                                <div className="flex items-center gap-1.5">
                                  <Clock size={12} className="shrink-0" />
                                  <span>{e.startTime} - {e.endTime}</span>
                                </div>
                                {e.room && (
                                  <div className="flex items-start gap-1.5">
                                    <MapPin size={12} className="shrink-0 mt-0.5" />
                                    <span className="line-clamp-2">{e.room}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>

      {/* Modal Thêm Lịch */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-md p-6 relative border-brand-cyan/30 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold mb-6">Thêm lịch trình</h2>
            
            <form onSubmit={addEvent} className="space-y-4">
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setType('HOC')}
                  className={`py-2 px-4 flex items-center justify-center gap-2 rounded-lg border transition-all ${type === 'HOC' ? 'bg-brand-cyan/10 border-brand-cyan text-brand-cyan font-bold' : 'border-border opacity-70 hover:bg-black/5 dark:hover:bg-foreground/5'}`}
                >
                  <BookOpen size={16} /> Môn học
                </button>
                <button
                  type="button"
                  onClick={() => setType('HOAT_DONG')}
                  className={`py-2 px-4 flex items-center justify-center gap-2 rounded-lg border transition-all ${type === 'HOAT_DONG' ? 'bg-brand-violet/10 border-brand-violet text-brand-violet font-bold' : 'border-border opacity-70 hover:bg-black/5 dark:hover:bg-foreground/5'}`}
                >
                  <Activity size={16} /> Hoạt động
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 opacity-80">
                  {type === 'HOC' ? 'Tên môn học' : 'Tên hoạt động'}
                </label>
                <input 
                  required autoFocus
                  value={name} onChange={e => setName(e.target.value)}
                  className="w-full bg-background/50 border border-border rounded-lg p-2.5 outline-none focus:border-brand-cyan" 
                  placeholder={type === 'HOC' ? "VD: Kinh tế vĩ mô" : "VD: Đi làm thêm"} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 opacity-80">Thứ</label>
                  <select 
                    value={day} onChange={e => setDay(Number(e.target.value))}
                    className="w-full bg-background border border-border rounded-lg p-2.5 outline-none focus:border-brand-cyan"
                  >
                    {DAYS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 opacity-80">Phòng / Địa điểm</label>
                  <input 
                    value={room} onChange={e => setRoom(e.target.value)}
                    className="w-full bg-background/50 border border-border rounded-lg p-2.5 outline-none focus:border-brand-cyan" 
                    placeholder="VD: D2-304" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 opacity-80">Ca học (Chuẩn NEU)</label>
                <select 
                  value={shift} onChange={handleShiftChange}
                  className="w-full bg-background border border-border rounded-lg p-2.5 outline-none focus:border-brand-cyan"
                >
                  <option value="1-2">Ca 1-2 (06:45 - 09:25)</option>
                  <option value="3-4">Ca 3-4 (09:35 - 12:15)</option>
                  <option value="5-6">Ca 5-6 (13:00 - 15:40)</option>
                  <option value="7-8">Ca 7-8 (15:50 - 18:30)</option>
                  <option value="Other">Khác (Tự chọn giờ)</option>
                </select>
              </div>

              {(shift === 'Other' || type === 'HOAT_DONG') && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 opacity-80">Từ giờ</label>
                    <input 
                      type="time" required
                      value={startTime} onChange={e => setStartTime(e.target.value)}
                      className="w-full bg-background/50 border border-border rounded-lg p-2.5 outline-none focus:border-brand-cyan" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 opacity-80">Đến giờ</label>
                    <input 
                      type="time" required
                      value={endTime} onChange={e => setEndTime(e.target.value)}
                      className="w-full bg-background/50 border border-border rounded-lg p-2.5 outline-none focus:border-brand-cyan" 
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border/50">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg opacity-70 hover:bg-black/5 dark:hover:bg-foreground/5 transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-brand-cyan text-white rounded-lg font-medium shadow-lg hover:bg-brand-cyan/90 transition-colors disabled:opacity-70 flex items-center gap-2"
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Lưu lịch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <ExportTimetableModal 
        isOpen={isExportOpen} 
        onClose={() => setIsExportOpen(false)} 
        events={events} 
        profile={profile} 
      />
    </div>
  );
}
