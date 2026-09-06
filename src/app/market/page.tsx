'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ShoppingBag, Search, PlusCircle, Tag, Filter, ChevronRight, ChevronLeft, PackageOpen } from 'lucide-react';
import curriculumData from '@/data/curriculum.json';
import { supabase } from '@/lib/supabase';

// Extract unique subjects from curriculum
const getUniqueSubjects = () => {
  const subjectsMap = new Map();
  curriculumData.forEach((major: any) => {
    const majorCode = major.majorName.split(' - ').pop()?.trim() || '';
    
    // Ngành tiêu chuẩn có mã bắt đầu bằng số (VD: 7220201). 
    // Ngành EP, CLC, POHE, TT, EBBA... có mã bắt đầu bằng chữ.
    if (!/^\d/.test(majorCode)) {
      return; // Bỏ qua toàn bộ các ngành không tiêu chuẩn
    }

    major.subjects?.forEach((sub: any) => {
      const code = (sub.subjectCode || '').toUpperCase();
      const name = (sub.name || '').toLowerCase();
      
      // Filter out specific thesis/internship subjects and non-standard subject codes
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
        subjectsMap.set(sub.subjectCode, {
          name: sub.name,
          code: sub.subjectCode
        });
      }
    });
  });
  return Array.from(subjectsMap.values());
};

const uniqueSubjects = getUniqueSubjects();
const ITEMS_PER_PAGE = 12;

export default function MarketPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isZeroDongOnly, setIsZeroDongOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [listingsCount, setListingsCount] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Fetch listing counts per subject
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        setLoading(true);
        // We do a simple aggregation if possible, or fetch all active and count
        const { data, error } = await supabase
          .from('book_listings')
          .select('subject_code, subject_name, price')
          .eq('status', 'available');

        if (data) {
          const counts: Record<string, number> = {};
          data.forEach(item => {
            if (isZeroDongOnly && item.price > 0) return;
            const key = item.subject_name;
            counts[key] = (counts[key] || 0) + 1;
          });
          setListingsCount(counts);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchCounts();
  }, [isZeroDongOnly]);

  const filteredSubjects = useMemo(() => {
    let filtered = uniqueSubjects;
    
    // Filter by search
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(lower) || 
        s.code.toLowerCase().includes(lower)
      );
    }
    
    // Sort by listing count descending
    filtered.sort((a, b) => {
      const countA = listingsCount[a.name] || 0;
      const countB = listingsCount[b.name] || 0;
      if (countA !== countB) return countB - countA;
      return a.name.localeCompare(b.name); // Then alphabetical
    });

    // If zero dong only, optionally filter out those with 0 counts
    if (isZeroDongOnly) {
       filtered = filtered.filter(a => (listingsCount[a.name] || 0) > 0);
    }

    return filtered;
  }, [searchTerm, listingsCount, isZeroDongOnly]);

  const totalPages = Math.ceil(filteredSubjects.length / ITEMS_PER_PAGE);
  const paginatedSubjects = filteredSubjects.slice(
    (currentPage - 1) * ITEMS_PER_PAGE, 
    currentPage * ITEMS_PER_PAGE
  );

  // Reset to page 1 on search or filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, isZeroDongOnly]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12 animate-in fade-in duration-500">
      {/* Header */}
      <div className="glass-panel p-8 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex-1">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <ShoppingBag className="text-cyan-500" size={32} />
            Góc Pass Giáo Trình
          </h1>
          <p className="opacity-70 max-w-2xl text-sm leading-relaxed">
            Nơi sinh viên mua bán, trao đổi giáo trình và tài liệu học tập. Dễ dàng tìm kiếm sách theo môn học và kết nối trực tiếp với người bán.
          </p>
        </div>
        <div className="flex flex-col gap-3 w-full md:w-auto relative z-10">
          <Link href="/market/sell" className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-white rounded-xl font-semibold shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2">
            <PlusCircle size={18} />
            Đăng bán sách
          </Link>
          <Link href="/market/my-listings" className="px-6 py-2.5 bg-background/50 hover:bg-background/80 border border-border rounded-xl font-medium transition-all text-sm flex items-center justify-center text-center">
            Quản lý tin đăng của tôi
          </Link>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50" size={18} />
          <input 
            type="text" 
            placeholder="Tìm theo tên môn hoặc mã học phần..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-background border border-border focus:border-cyan-500 outline-none transition-colors shadow-sm text-sm"
          />
        </div>

        <div className="flex items-center gap-2 bg-background p-1.5 rounded-xl border border-border w-full md:w-auto">
          <button 
            onClick={() => setIsZeroDongOnly(false)}
            className={`flex-1 md:px-6 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${!isZeroDongOnly ? 'bg-cyan-500 text-white shadow-md' : 'text-foreground/70 hover:text-foreground'}`}
          >
            Tất cả sách
          </button>
          <button 
            onClick={() => setIsZeroDongOnly(true)}
            className={`flex-1 md:px-6 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center justify-center gap-2 ${isZeroDongOnly ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-md shadow-red-500/20' : 'text-foreground/70 hover:text-foreground'}`}
          >
            <Tag size={16} />
            Sách 0đ
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {filteredSubjects.length === 0 ? (
            <div className="glass-panel p-12 flex flex-col items-center justify-center text-center">
              <PackageOpen size={48} className="text-foreground/20 mb-4" />
              <h3 className="text-xl font-bold mb-2">Không tìm thấy môn học nào</h3>
              <p className="opacity-70 text-sm max-w-md">Hãy thử tìm với tên môn học hoặc mã học phần khác.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {paginatedSubjects.map(subject => {
                const count = listingsCount[subject.name] || 0;
                return (
                  <Link href={`/market/${encodeURIComponent(subject.name)}`} key={subject.code + subject.name}>
                    <div className="glass-panel p-5 h-full flex flex-col hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all group cursor-pointer relative overflow-hidden">
                      {count > 0 && (
                        <div className="absolute -right-6 -top-6 w-16 h-16 bg-cyan-500/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                      )}
                      <div className="flex-1 relative z-10">
                        <span className="text-xs font-bold px-2 py-1 bg-foreground/5 rounded-md text-foreground/60 mb-3 inline-block">
                          {subject.code}
                        </span>
                        <h3 className="font-semibold text-[15px] leading-tight mb-2 group-hover:text-cyan-500 transition-colors line-clamp-2">
                          {subject.name}
                        </h3>
                      </div>
                      <div className="mt-4 flex items-center justify-between text-sm relative z-10 border-t border-border/50 pt-3">
                        {count > 0 ? (
                          <span className="text-cyan-500 font-bold bg-cyan-500/10 px-2.5 py-1 rounded-full text-xs flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
                            {count} bài đăng
                          </span>
                        ) : (
                          <span className="opacity-50 text-xs">Chưa có bài đăng</span>
                        )}
                        <ChevronRight size={16} className="text-foreground/40 group-hover:text-cyan-500 group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-background border border-border hover:bg-foreground/5 disabled:opacity-50 disabled:pointer-events-none transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                  // Simple sliding window for pagination
                  let pageNum = currentPage;
                  if (currentPage <= 3) pageNum = i + 1;
                  else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = currentPage - 2 + i;
                  
                  if (pageNum < 1 || pageNum > totalPages) return null;

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${currentPage === pageNum ? 'bg-cyan-500 text-white' : 'bg-background border border-border hover:bg-foreground/5'}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-background border border-border hover:bg-foreground/5 disabled:opacity-50 disabled:pointer-events-none transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
