import React, { useState } from 'react';
import { X, CalendarPlus, Loader2 } from 'lucide-react';

interface ExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (examData: any) => Promise<void>;
}

export default function ExamModal({ isOpen, onClose, onSave }: ExamModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    subjectName: '',
    examDate: '',
    startTime: '',
    room: '',
    format: 'Trắc nghiệm máy tính',
    reminder: 'Trước 1 ngày',
    notes: ''
  });

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      console.error(err);
      alert('Có lỗi xảy ra khi lưu lịch thi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-panel bg-background/90 backdrop-blur-2xl border border-glass-border shadow-2xl p-6 w-full max-w-md relative overflow-hidden">
        {/* Glow Effects inside modal */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-red-500/10 dark:bg-red-500/20 blur-[60px] rounded-full pointer-events-none"></div>
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-cyan-500/10 dark:bg-cyan-500/20 blur-[60px] rounded-full pointer-events-none"></div>

        <div className="relative z-10 flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-foreground/10 flex items-center justify-center border border-foreground/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]">
              <CalendarPlus className="text-red-400" size={20} />
            </div>
            <h2 className="text-xl font-bold text-foreground tracking-wide">Tạo Lịch Thi Mới</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-foreground/50 hover:text-foreground p-2 rounded-full hover:bg-foreground/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="relative z-10 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-foreground/70 mb-1.5 uppercase tracking-wider">Tên môn thi</label>
            <input 
              required
              name="subjectName"
              value={formData.subjectName}
              onChange={handleChange}
              placeholder="VD: Kinh tế vi mô 1"
              className="w-full bg-foreground/5 border border-foreground/20 text-foreground rounded-xl p-3 focus:border-red-400 focus:ring-1 focus:ring-red-400 focus:outline-none transition-all placeholder:text-foreground/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-foreground/70 mb-1.5 uppercase tracking-wider">Ngày thi</label>
              <input 
                required
                type="date"
                name="examDate"
                value={formData.examDate}
                onChange={handleChange}
                className="w-full bg-foreground/5 border border-foreground/20 text-foreground rounded-xl p-3 focus:border-red-400 focus:ring-1 focus:ring-red-400 focus:outline-none transition-all dark:[color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground/70 mb-1.5 uppercase tracking-wider">Giờ bắt đầu</label>
              <input 
                required
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                className="w-full bg-foreground/5 border border-foreground/20 text-foreground rounded-xl p-3 focus:border-red-400 focus:ring-1 focus:ring-red-400 focus:outline-none transition-all dark:[color-scheme:dark]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground/70 mb-1.5 uppercase tracking-wider">Phòng thi</label>
            <input 
              required
              name="room"
              value={formData.room}
              onChange={handleChange}
              placeholder="VD: A2-701"
              className="w-full bg-foreground/5 border border-foreground/20 text-foreground rounded-xl p-3 focus:border-red-400 focus:ring-1 focus:ring-red-400 focus:outline-none transition-all placeholder:text-foreground/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-foreground/70 mb-1.5 uppercase tracking-wider">Hình thức thi</label>
              <select 
                name="format"
                value={formData.format}
                onChange={handleChange}
                className="w-full bg-foreground/5 border border-foreground/20 text-foreground rounded-xl p-3 focus:border-red-400 focus:ring-1 focus:ring-red-400 focus:outline-none transition-all appearance-none"
              >
                <option value="Trắc nghiệm máy tính">Trắc nghiệm máy tính</option>
                <option value="Tự luận">Tự luận</option>
                <option value="Tiểu luận / Đề án">Tiểu luận / Đề án</option>
                <option value="Vấn đáp / Thuyết trình">Vấn đáp / Thuyết trình</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground/70 mb-1.5 uppercase tracking-wider">Nhắc nhở trước</label>
              <select 
                name="reminder"
                value={formData.reminder}
                onChange={handleChange}
                className="w-full bg-foreground/5 border border-foreground/20 text-foreground rounded-xl p-3 focus:border-red-400 focus:ring-1 focus:ring-red-400 focus:outline-none transition-all appearance-none"
              >
                <option value="Trước 1 ngày">Trước 1 ngày</option>
                <option value="Trước 2 giờ">Trước 2 giờ</option>
                <option value="Trước 30 phút">Trước 30 phút</option>
                <option value="Không nhắc">Không nhắc</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground/70 mb-1.5 uppercase tracking-wider">Ghi chú</label>
            <textarea 
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={2}
              placeholder="VD: Mang thẻ sinh viên, bút chì 2B..."
              className="w-full bg-foreground/5 border border-foreground/20 text-foreground rounded-xl p-3 focus:border-red-400 focus:ring-1 focus:ring-red-400 focus:outline-none transition-all placeholder:text-foreground/30 resize-none"
            />
          </div>

          <div className="flex items-center gap-3 mt-4">
            <button 
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-foreground/10 hover:bg-foreground/20 text-foreground font-bold py-3 px-4 rounded-xl transition-all"
            >
              Hủy
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-red-500/30 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : 'Lưu lịch thi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
