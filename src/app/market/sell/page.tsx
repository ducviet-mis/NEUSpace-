'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import curriculumData from '@/data/curriculum.json';
import { Upload, X, Loader2, ArrowLeft, Image as ImageIcon, BookOpen, Shirt, Package } from 'lucide-react';
import Link from 'next/link';
import { createUserScopedImagePath, validateImageSelection } from '@/lib/uploadValidation';

export default function SellPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<'textbook' | 'uniform' | 'other'>('textbook');
  const [bookType, setBookType] = useState('Giáo trình gốc');
  const [condition, setCondition] = useState('Khá mới');
  const [price, setPrice] = useState('');
  const [isFree, setIsFree] = useState(false);
  const [contactInfo, setContactInfo] = useState('');
  const [notes, setNotes] = useState('');
  
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Autocomplete logic
  const [subjectSearch, setSubjectSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const uniqueSubjects = React.useMemo(() => {
    const subjectsMap = new Map();
    curriculumData.forEach((major: any) => {
      const majorCode = major.majorName.split(' - ').pop()?.trim() || '';
      
      // Ngành tiêu chuẩn có mã bắt đầu bằng số (VD: 7220201). 
      // Ngành EP, CLC, POHE, TT, EBBA... có mã bắt đầu bằng chữ.
      if (!/^\d/.test(majorCode)) {
        return;
      }

      major.subjects?.forEach((sub: any) => {
        const code = (sub.subjectCode || '').toUpperCase();
        const name = (sub.name || '').toLowerCase();
        
        if (
          code.startsWith('EP') ||
          code.startsWith('AEP') ||
          code.startsWith('EBBA') ||
          code.startsWith('POHE') ||
          code.startsWith('BBAE') ||
          code.startsWith('ESOM') ||
          name.includes('khóa luận tốt nghiệp') ||
          name.includes('khoá luận tốt nghiệp') ||
          name.includes('chuyên đề thực tập') ||
          name.includes('chuyên đề thực tế') ||
          name.includes('thực tập tốt nghiệp')
        ) {
          return;
        }

        if (!subjectsMap.has(sub.subjectCode)) {
          subjectsMap.set(sub.subjectCode, sub.name);
        }
      });
    });
    return Array.from(subjectsMap.values());
  }, []);

  const filteredSuggestions = React.useMemo(() => {
    if (!subjectSearch.trim()) return [];
    return uniqueSubjects.filter(s => s.toLowerCase().includes(subjectSearch.toLowerCase())).slice(0, 5);
  }, [subjectSearch, uniqueSubjects]);

  const categoryOptions = [
    { id: 'textbook' as const, label: 'Giáo trình & tài liệu', icon: BookOpen },
    { id: 'uniform' as const, label: 'Đồng phục', icon: Shirt },
    { id: 'other' as const, label: 'Đồ dùng khác', icon: Package },
  ];

  const itemTypeOptions = {
    textbook: ['Giáo trình gốc', 'Bản photo', 'Tài liệu / đề cương khác'],
    uniform: ['Áo khoác đồng phục', 'Đồng phục thể chất', 'Áo khoa', 'Khác'],
    other: ['Đồ điện tử', 'Đồ học tập', 'Đồ sinh hoạt', 'Khác'],
  } as const;

  const changeCategory = (nextCategory: 'textbook' | 'uniform' | 'other') => {
    setCategory(nextCategory);
    setBookType(itemTypeOptions[nextCategory][0]);
    setSubject('');
    setSubjectSearch('');
    setShowSuggestions(false);
  };

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/settings'); // Redirect to login basically, since DashboardLayout handles it, this might just wait
      } else {
        setUser(session.user);
      }
    };
    getUser();

    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const newImages = [...images, ...filesArray];
      const validationError = validateImageSelection(newImages);
      if (validationError) {
        setError(validationError);
        e.target.value = '';
        return;
      }

      imagePreviews.forEach(URL.revokeObjectURL);
      setImages(newImages);
      const newPreviews = newImages.map(file => URL.createObjectURL(file));
      setImagePreviews(newPreviews);
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
    
    const newPreviews = [...imagePreviews];
    newPreviews.splice(index, 1);
    setImagePreviews(newPreviews);
  };

  const uploadImages = async (): Promise<string[]> => {
    if (!user) throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    const uploadedUrls: string[] = [];
    for (const image of images) {
      const filePath = createUserScopedImagePath(user.id, image);
      
      const { error: uploadError } = await supabase.storage
        .from('books')
        .upload(filePath, image);
        
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage.from('books').getPublicUrl(filePath);
      uploadedUrls.push(data.publicUrl);
    }
    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return setError(category === 'textbook' ? 'Vui lòng nhập tên giáo trình hoặc môn học' : 'Vui lòng nhập tên món đồ');
    if (!contactInfo) return setError('Vui lòng nhập thông tin liên hệ');
    if (images.length === 0) return setError('Vui lòng tải lên ít nhất 1 ảnh');
    if (!user) return setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    if (!isFree && (!Number.isFinite(Number(price)) || Number(price) < 0 || Number(price) > 100_000_000)) {
      return setError('Giá bán phải nằm trong khoảng từ 0 đến 100.000.000 VNĐ.');
    }
    
    setLoading(true);
    setError('');

    try {
      // 1. Upload images
      const imageUrls = await uploadImages();
      
      // 2. Insert DB record
      const { error: dbError } = await supabase.from('book_listings').insert({
        user_id: user.id,
        subject_name: subject.trim(),
        category,
        image_urls: imageUrls,
        book_type: bookType,
        condition: condition,
        price: isFree ? 0 : Number(price),
        contact_info: contactInfo,
        notes: notes
      });

      if (dbError) throw dbError;
      
      router.push('/market/my-listings');
    } catch (err: any) {
      console.error(err);
      setError('Đã có lỗi xảy ra. Hãy chắc chắn bạn đã tạo Storage Bucket "books" thành công trên Supabase.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-12 animate-in fade-in duration-500">
      <Link href="/market" className="inline-flex items-center gap-2 text-foreground/70 hover:text-cyan-500 transition-colors mb-6 text-sm font-medium">
        <ArrowLeft size={16} /> Quay lại chợ
      </Link>

      <div className="glass-panel p-8">
        <h1 className="text-2xl font-bold mb-2">Đăng bán trên Chợ sinh viên</h1>
        <p className="opacity-70 text-sm mb-8">Đăng giáo trình, đồng phục hoặc đồ dùng cá nhân. Người mua sẽ liên hệ trực tiếp với bạn.</p>
        
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2 opacity-80">Danh mục *</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {categoryOptions.map(option => {
                const Icon = option.icon;
                const selected = category === option.id;
                return (
                  <button key={option.id} type="button" onClick={() => changeCategory(option.id)} aria-pressed={selected}
                    className={`min-h-12 px-3 py-3 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition-colors ${selected ? 'bg-cyan-500/15 border-cyan-500 text-cyan-600 dark:text-cyan-300' : 'bg-background/50 border-border text-foreground/70 hover:bg-foreground/5'}`}>
                    <Icon size={18} /> {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tên giáo trình / món đồ */}
          <div className="relative" ref={suggestionsRef}>
            <label className="block text-sm font-medium mb-1.5 opacity-80">{category === 'textbook' ? 'Tên giáo trình hoặc môn học *' : 'Tên món đồ *'}</label>
            <input 
              type="text" 
              value={subjectSearch}
              onChange={(e) => {
                setSubjectSearch(e.target.value);
                setSubject(e.target.value);
                setShowSuggestions(category === 'textbook');
              }}
              onFocus={() => setShowSuggestions(category === 'textbook')}
              className="w-full bg-background/50 border border-border rounded-xl p-3 outline-none focus:border-cyan-500/50 transition-colors"
              placeholder={category === 'textbook' ? 'VD: Triết học Mác - Lênin hoặc Giáo trình khác' : category === 'uniform' ? 'VD: Áo khoác đồng phục size M' : 'VD: Máy tính cầm tay Casio FX-580VN X'}
              required
            />
            {category === 'textbook' && <p className="mt-1.5 text-xs text-foreground/55">Không có trong danh sách? Bạn có thể nhập tên giáo trình khác trực tiếp.</p>}
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div className="absolute z-20 w-full mt-1 bg-background border border-border rounded-xl shadow-xl max-h-60 overflow-y-auto">
                {filteredSuggestions.map((s, i) => (
                  <div 
                    key={i} 
                    className="p-3 hover:bg-foreground/5 cursor-pointer text-sm"
                    onClick={() => {
                      setSubjectSearch(s);
                      setSubject(s);
                      setShowSuggestions(false);
                    }}
                  >
                    {s}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Hình ảnh */}
          <div>
            <label className="block text-sm font-medium mb-1.5 opacity-80">Hình ảnh thực tế (1-3 ảnh) *</label>
            <div className="flex flex-wrap gap-4">
              {imagePreviews.map((src, idx) => (
                <div key={idx} className="relative w-24 h-32 rounded-xl overflow-hidden border border-border group">
                  <img src={src} alt="Preview" className="w-full h-full object-cover" />
                  <button 
                    type="button" 
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              
              {imagePreviews.length < 3 && (
                <label className="w-24 h-32 rounded-xl border-2 border-dashed border-border hover:border-cyan-500/50 flex flex-col items-center justify-center gap-2 cursor-pointer bg-background/30 transition-colors text-foreground/50 hover:text-cyan-500">
                  <ImageIcon size={24} />
                  <span className="text-xs font-medium">Thêm ảnh</span>
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handleImageChange} />
                </label>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Loại món đồ */}
            <div>
              <label className="block text-sm font-medium mb-1.5 opacity-80">Phân loại *</label>
              <select 
                value={bookType} 
                onChange={e => setBookType(e.target.value)}
                className="w-full bg-background/50 border border-border rounded-xl p-3 outline-none focus:border-cyan-500/50 transition-colors"
              >
                {itemTypeOptions[category].map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            
            {/* Tình trạng */}
            <div>
              <label className="block text-sm font-medium mb-1.5 opacity-80">Tình trạng *</label>
              <select 
                value={condition} 
                onChange={e => setCondition(e.target.value)}
                className="w-full bg-background/50 border border-border rounded-xl p-3 outline-none focus:border-cyan-500/50 transition-colors"
              >
                <option value="Như mới">Như mới (99%)</option>
                <option value="Khá mới">Khá mới (80-90%)</option>
                <option value="Đã sử dụng nhiều">Đã sử dụng nhiều (60-70%)</option>
              </select>
            </div>
          </div>

          {/* Giá & Liên hệ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1.5 opacity-80 flex justify-between">
                <span>Giá bán (VNĐ) *</span>
                <label className="flex items-center gap-2 text-cyan-500 cursor-pointer">
                  <input type="checkbox" checked={isFree} onChange={e => setIsFree(e.target.checked)} className="accent-cyan-500" />
                  <span className="text-xs font-semibold uppercase">Tặng miễn phí (0đ)</span>
                </label>
              </label>
              <input 
                type="number" 
                value={price}
                onChange={e => setPrice(e.target.value)}
                disabled={isFree}
                className="w-full bg-background/50 border border-border rounded-xl p-3 outline-none focus:border-cyan-500/50 transition-colors disabled:opacity-50"
                placeholder="VD: 50000"
                required={!isFree}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1.5 opacity-80">Số ĐT / Zalo liên hệ *</label>
              <input 
                type="text" 
                value={contactInfo}
                onChange={e => setContactInfo(e.target.value)}
                className="w-full bg-background/50 border border-border rounded-xl p-3 outline-none focus:border-cyan-500/50 transition-colors"
                placeholder="VD: 0987654321"
                required
              />
            </div>
          </div>

          {/* Ghi chú */}
          <div>
            <label className="block text-sm font-medium mb-1.5 opacity-80">Ghi chú bổ sung</label>
            <textarea 
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-background/50 border border-border rounded-xl p-3 outline-none focus:border-cyan-500/50 transition-colors min-h-[100px] resize-y"
              placeholder={category === 'uniform' ? 'Vui lòng ghi rõ size.' : category === 'other' ? 'Cụ thể tình trạng, mô tả chi tiết,...' : 'Có note chữ vào sách, bọc plastic cẩn thận...'}
            ></textarea>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 rounded-xl bg-cyan-500 text-white font-semibold shadow-lg shadow-cyan-500/20 hover:scale-[1.01] transition-transform disabled:opacity-70 disabled:hover:scale-100 flex justify-center items-center gap-2 mt-4"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
            Đăng bài bán
          </button>
        </form>
      </div>
    </div>
  );
}
