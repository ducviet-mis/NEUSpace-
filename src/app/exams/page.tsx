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
    return day === 0 ? 'CN' : `T${day + 1}`;
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
      <div className="glass-panel p-6 sm:p-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-3">
            <FileText className="text-orange-400" size={28} />
            Lịch Thi
          </h1>
          <p className="text-foreground/70 text-sm">Quản lý và theo dõi các lịch thi sắp tới của bạn.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-foreground font-bold py-3 px-6 rounded-2xl shadow-[0_4px_15px_rgba(249,115,22,0.4)] transition-all flex items-center gap-2"
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
            <div key={ex.id} className="glass-panel p-6 flex flex-col sm:flex-row gap-6 relative group overflow-hidden border-l-4 border-l-orange-500">
              {/* Date Block */}
              <div className="flex flex-col items-center justify-center min-w-[100px] bg-foreground/5 rounded-xl p-4 border border-foreground/10">
                <CalendarDays size={24} className="text-orange-400 mb-2" />
                <div className="text-lg font-bold text-foreground">{formatDate(ex.exam_date)}</div>
                <div className="text-xs text-foreground/50 uppercase tracking-wider font-semibold mt-1">
                  Thứ {getDayOfWeek(ex.exam_date)}
                </div>
              </div>

              {/* Info Block */}
              <div className="flex-1 flex flex-col justify-center">
                <h3 className="text-xl font-bold text-foreground mb-3">
                  {ex.subject_name}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
                  <div className="flex items-center gap-2 text-sm text-foreground/80">
                    <Clock size={16} className="text-cyan-400" />
                    Giờ thi: <span className="font-semibold text-foreground">{ex.start_time?.substring(0,5)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-foreground/80">
                    <MapPin size={16} className="text-red-400" />
                    Phòng: <span className="font-semibold text-foreground">{ex.room}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-foreground/80">
                    <FileText size={16} className="text-purple-400" />
                    Hình thức: <span className="font-semibold text-foreground">{ex.format}</span>
                  </div>
                </div>
                {ex.notes && (
                  <div className="mt-4 text-sm text-foreground/60 bg-foreground/5 p-3 rounded-xl border border-foreground/5">
                    <span className="font-semibold text-foreground/80">Ghi chú:</span> {ex.notes}
                  </div>
                )}
              </div>

              {/* Actions */}
              <button 
                onClick={() => handleDelete(ex.id)}
                className="absolute top-4 right-4 text-foreground/30 hover:text-red-500 hover:bg-foreground/10 p-2 rounded-full transition-all opacity-0 group-hover:opacity-100"
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
