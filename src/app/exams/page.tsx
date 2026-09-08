'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, FileText, MapPin, Clock, CalendarDays, Trash2, Loader2 } from 'lucide-react';
import ExamModal from '@/components/modals/ExamModal';

export default function ExamsPage() {
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userId, setUserId] = useState('');

  const fetchExams = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setUserId(session.user.id);

      const { data } = await supabase.from('exams').select('*').eq('user_id', session.user.id).order('exam_date', { ascending: true });
      if (data) {
        setExams(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleSaveExam = async (examData: any) => {
    if (!userId) return;

    await supabase.from('exams').insert({
      user_id: userId,
      subject_name: examData.subjectName,
      exam_date: examData.examDate,
      start_time: `${examData.startTime}:00`,
      room: examData.room,
      format: examData.format,
      reminder: examData.reminder,
      notes: examData.notes
    });

    await fetchExams();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa lịch thi này?')) return;
    try {
      await supabase.from('exams').delete().eq('id', id);
      await fetchExams();
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  const getDayOfWeek = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const day = date.getDay();
    return day === 0 ? 'Chủ nhật' : `Thứ ${day + 1}`;
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center w-full">
        <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 h-full animate-in fade-in duration-700 max-w-4xl mx-auto w-full pb-12">
      <div className="glass-panel p-5 sm:p-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/12 text-cyan-600 dark:text-cyan-300">
              <FileText size={22} aria-hidden="true" />
            </span>
            Lịch Thi
          </h1>
          <p className="text-foreground/70 text-sm">Quản lý và theo dõi các lịch thi sắp tới của bạn.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="min-h-11 shrink-0 bg-gradient-to-r from-cyan-500 to-blue-500 hover:brightness-110 active:scale-[0.98] text-white font-bold py-3 px-4 sm:px-6 rounded-2xl shadow-[0_6px_18px_rgba(6,182,212,0.24)] transition-[filter,transform] duration-200 flex items-center gap-2"
        >
          <Plus size={20} />
          <span className="hidden sm:inline">Thêm lịch thi</span>
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {exams.length === 0 ? (
          <div className="glass-panel p-12 text-center text-foreground/50 flex flex-col items-center">
            <FileText size={48} className="opacity-20 mb-4" />
            <p>Bạn chưa có lịch thi nào.</p>
          </div>
        ) : (
          exams.map((ex) => (
            <div key={ex.id} className="glass-panel p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-6 relative group overflow-hidden border-l-4 border-l-cyan-500">
              {/* Date Block */}
              <div className="flex flex-row sm:flex-col items-center justify-start sm:justify-center gap-3 sm:gap-0 min-w-[100px] bg-cyan-500/8 rounded-2xl px-4 py-3 sm:p-4 border border-cyan-500/18">
                <CalendarDays size={23} className="text-cyan-600 dark:text-cyan-300 sm:mb-2" />
                <div className="text-lg font-bold text-foreground tabular-nums">{formatDate(ex.exam_date)}</div>
                <div className="text-xs text-foreground/60 tracking-wide font-semibold sm:mt-1">
                  {getDayOfWeek(ex.exam_date)}
                </div>
              </div>

              {/* Info Block */}
              <div className="flex-1 flex flex-col justify-center">
                <h3 className="text-lg sm:text-xl font-bold text-foreground mb-3 pr-10 sm:pr-0">
                  {ex.subject_name}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
                  <div className="flex items-center gap-2 text-sm text-foreground/80">
                    <Clock size={16} className="text-cyan-600 dark:text-cyan-300" />
                    Giờ thi: <span className="font-semibold text-foreground">{ex.start_time?.substring(0,5)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-foreground/80">
                    <MapPin size={16} className="text-blue-500 dark:text-blue-400" />
                    Phòng: <span className="font-semibold text-foreground">{ex.room}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-foreground/80">
                    <FileText size={16} className="text-cyan-600 dark:text-cyan-300" />
                    Hình thức: <span className="font-semibold text-foreground">{ex.format}</span>
                  </div>
                </div>
                {ex.notes && (
                  <div className="mt-4 text-sm text-foreground/70 bg-foreground/5 p-3 rounded-xl border border-foreground/10">
                    <span className="font-semibold text-foreground/80">Ghi chú:</span> {ex.notes}
                  </div>
                )}
              </div>

              {/* Actions */}
              <button 
                onClick={() => handleDelete(ex.id)}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 min-h-11 min-w-11 flex items-center justify-center text-foreground/45 hover:text-red-500 hover:bg-red-500/10 active:scale-95 rounded-xl transition-[color,background-color,transform,opacity] opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                title="Xóa lịch thi"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))
        )}
      </div>

      <ExamModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveExam} 
      />
    </div>
  );
}
