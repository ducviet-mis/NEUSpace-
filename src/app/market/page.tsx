'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { BookOpen, ChevronLeft, ChevronRight, Lock, Package, PackageOpen, PlusCircle, Search, Shirt, ShoppingBag, Tag } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import BookListingCard, { BookListing } from '@/components/market/BookListingCard';
import MarketplacePausedBanner from '@/components/market/MarketplacePausedBanner';
import curriculumData from '@/data/curriculum.json';
import { MARKETPLACE_ENABLED } from '@/lib/marketplace';

type Category = 'textbook' | 'uniform' | 'other';

const CATEGORIES: Array<{ id: Category; label: string; icon: typeof BookOpen }> = [
  { id: 'textbook', label: 'Giáo trình', icon: BookOpen },
  { id: 'uniform', label: 'Đồng phục', icon: Shirt },
  { id: 'other', label: 'Đồ dùng khác', icon: Package },
];

const COURSE_PAGE_SIZE = 12;

const getUniqueSubjects = () => {
  const subjectsMap = new Map<string, { name: string; code: string }>();
  curriculumData.forEach((major: any) => {
    const majorCode = major.majorName.split(' - ').pop()?.trim() || '';
    if (!/^\d/.test(majorCode)) return;

    major.subjects?.forEach((subject: any) => {
      const code = (subject.subjectCode || '').toUpperCase();
      const name = (subject.name || '').toLowerCase();
      if (code.startsWith('EP') || code.startsWith('AEP') || code.startsWith('EBBA') || code.startsWith('POHE') || code.startsWith('BBAE') || code.startsWith('ESOM') || name.includes('khóa luận tốt nghiệp') || name.includes('khoá luận tốt nghiệp') || name.includes('chuyên đề thực tập') || name.includes('chuyên đề thực tế') || name.includes('thực tập tốt nghiệp')) return;
      if (!subjectsMap.has(code)) subjectsMap.set(code, { name: subject.name, code });
    });
  });
  return Array.from(subjectsMap.values());
};

const uniqueSubjects = getUniqueSubjects();

export default function MarketPage() {
  const [listings, setListings] = useState<BookListing[]>([]);
  const [activeCategory, setActiveCategory] = useState<Category>('textbook');
  const [searchTerm, setSearchTerm] = useState('');
  const [isFreeOnly, setIsFreeOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subjectPage, setSubjectPage] = useState(1);

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('book_listings')
        .select('id, subject_name, category, image_urls, book_type, condition, price, contact_info, notes, created_at')
        .eq('status', 'available')
        .order('created_at', { ascending: false });

      if (error) console.error('Không thể tải các bài đăng:', error);
      else setListings((data ?? []) as BookListing[]);
      setLoading(false);
    };
    fetchListings();
  }, []);

  const filteredListings = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return listings.filter(listing => {
      const category = listing.category ?? 'textbook';
      if (category !== activeCategory) return false;
      if (isFreeOnly && listing.price !== 0) return false;
      if (!query) return true;
      return [listing.subject_name, listing.book_type, listing.notes]
        .some(value => value?.toLowerCase().includes(query));
    });
  }, [listings, activeCategory, isFreeOnly, searchTerm]);

  const filteredSubjects = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const subjectCounts = listings.reduce<Record<string, number>>((counts, listing) => {
      if ((listing.category ?? 'textbook') !== 'textbook' || (isFreeOnly && listing.price !== 0)) return counts;
      counts[listing.subject_name ?? ''] = (counts[listing.subject_name ?? ''] || 0) + 1;
      return counts;
    }, {});
    return uniqueSubjects
      .filter(subject => !query || subject.name.toLowerCase().includes(query) || subject.code.toLowerCase().includes(query))
      .sort((a, b) => (subjectCounts[b.name] ?? 0) - (subjectCounts[a.name] ?? 0) || a.name.localeCompare(b.name));
  }, [listings, isFreeOnly, searchTerm]);

  const subjectCounts = useMemo(() => listings.reduce<Record<string, number>>((counts, listing) => {
    if ((listing.category ?? 'textbook') !== 'textbook' || (isFreeOnly && listing.price !== 0)) return counts;
    counts[listing.subject_name ?? ''] = (counts[listing.subject_name ?? ''] || 0) + 1;
    return counts;
  }, {}), [listings, isFreeOnly]);

  const totalSubjectPages = Math.ceil(filteredSubjects.length / COURSE_PAGE_SIZE);
  const paginatedSubjects = filteredSubjects.slice((subjectPage - 1) * COURSE_PAGE_SIZE, subjectPage * COURSE_PAGE_SIZE);

  useEffect(() => {
    setSubjectPage(1);
  }, [searchTerm, isFreeOnly]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-in fade-in duration-500">
      <section className="glass-panel p-6 md:p-8 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-3"><ShoppingBag className="text-cyan-500" size={32} /> Chợ sinh viên</h1>
          <p className="opacity-70 text-sm leading-relaxed">Mua bán giáo trình, đồng phục và đồ dùng sinh viên. Giao dịch trực tiếp, chủ động trao đổi với người bán.</p>
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row md:flex-col gap-2 w-full md:w-auto">
          {MARKETPLACE_ENABLED ? (
            <Link href="/market/sell" className="min-h-11 px-5 py-3 bg-cyan-500 hover:bg-cyan-400 text-white rounded-xl font-semibold shadow-lg shadow-cyan-500/20 transition-colors flex items-center justify-center gap-2"><PlusCircle size={18} /> Đăng bán</Link>
          ) : (
            <button type="button" disabled className="min-h-11 px-5 py-3 bg-foreground/10 border border-foreground/15 text-foreground/55 rounded-xl font-semibold cursor-not-allowed flex items-center justify-center gap-2"><Lock size={18} /> Đăng bán đang tạm khóa</button>
          )}
          <Link href="/market/my-listings" className="min-h-11 px-5 py-3 bg-background/50 hover:bg-background/80 border border-border rounded-xl font-medium transition-colors text-sm text-center">Tin đăng của tôi</Link>
        </div>
      </section>

      {!MARKETPLACE_ENABLED && <MarketplacePausedBanner />}

      <section className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" aria-label="Danh mục chợ sinh viên">
          {CATEGORIES.map(({ id, label, icon: Icon }) => {
            const selected = activeCategory === id;
            return <button key={id} onClick={() => setActiveCategory(id)} aria-pressed={selected} className={`min-h-11 px-3 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition-colors ${selected ? 'bg-cyan-500 text-white border-cyan-500 shadow-md shadow-cyan-500/20' : 'bg-background border-border text-foreground/70 hover:bg-foreground/5'}`}><Icon size={17} /> {label}</button>;
          })}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50" size={18} />
            <input type="search" value={searchTerm} onChange={event => setSearchTerm(event.target.value)} placeholder="Tìm giáo trình, đồng phục, đồ dùng..." className="w-full min-h-11 pl-10 pr-4 rounded-xl bg-background border border-border focus:border-cyan-500 outline-none transition-colors text-sm" />
          </div>
          <button onClick={() => setIsFreeOnly(value => !value)} aria-pressed={isFreeOnly} className={`min-h-11 px-4 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition-colors ${isFreeOnly ? 'bg-rose-500 text-white border-rose-500' : 'bg-background border-border text-foreground/70 hover:bg-foreground/5'}`}><Tag size={16} /> Chỉ xem 0đ</button>
        </div>
      </section>

      {activeCategory === 'textbook' && (
        <section className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2"><BookOpen size={21} className="text-cyan-500" /> Duyệt giáo trình theo môn học</h2>
              <p className="text-sm opacity-65 mt-1">Chọn môn học để xem các giáo trình đang được đăng bán.</p>
            </div>
            <span className="text-xs font-medium opacity-60 whitespace-nowrap">{filteredSubjects.length} môn</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {paginatedSubjects.map(subject => {
              const count = subjectCounts[subject.name] ?? 0;
              return (
                <Link href={`/market/${encodeURIComponent(subject.name)}`} key={subject.code} className="glass-panel min-h-28 p-4 flex flex-col justify-between hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.12)] transition-all group">
                  <div>
                    <span className="inline-block px-2 py-1 rounded-md bg-foreground/5 text-xs font-bold text-foreground/60 mb-2">{subject.code}</span>
                    <h3 className="font-semibold text-sm leading-snug group-hover:text-cyan-500 transition-colors line-clamp-2">{subject.name}</h3>
                  </div>
                  <div className="mt-3 text-xs">{count > 0 ? <span className="text-cyan-500 font-semibold">{count} tin đang bán</span> : <span className="opacity-50">Chưa có tin đăng</span>}</div>
                </Link>
              );
            })}
          </div>

          {totalSubjectPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => setSubjectPage(page => Math.max(1, page - 1))} disabled={subjectPage === 1} aria-label="Trang môn học trước" className="w-11 h-11 rounded-xl bg-background border border-border disabled:opacity-40 flex items-center justify-center hover:bg-foreground/5"><ChevronLeft size={19} /></button>
              <span className="text-sm opacity-70">Trang {subjectPage}/{totalSubjectPages}</span>
              <button onClick={() => setSubjectPage(page => Math.min(totalSubjectPages, page + 1))} disabled={subjectPage === totalSubjectPages} aria-label="Trang môn học tiếp" className="w-11 h-11 rounded-xl bg-background border border-border disabled:opacity-40 flex items-center justify-center hover:bg-foreground/5"><ChevronRight size={19} /></button>
            </div>
          )}
        </section>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64"><div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : filteredListings.length === 0 ? (
        <div className="glass-panel p-12 flex flex-col items-center justify-center text-center">
          <PackageOpen size={48} className="text-foreground/20 mb-4" />
          <h2 className="text-xl font-bold mb-2">Chưa có tin phù hợp</h2>
          <p className="opacity-70 text-sm max-w-md mb-6">Hãy đổi từ khóa hoặc đăng món đồ đầu tiên trong danh mục này.</p>
          {MARKETPLACE_ENABLED ? (
            <Link href="/market/sell" className="min-h-11 px-5 py-3 bg-cyan-500 text-white rounded-xl font-semibold">Đăng bán ngay</Link>
          ) : (
            <button type="button" disabled className="min-h-11 px-5 py-3 bg-foreground/10 border border-foreground/15 text-foreground/55 rounded-xl font-semibold cursor-not-allowed">Đăng bán đang tạm khóa</button>
          )}
        </div>
      ) : (
        <>
          <p className="text-sm opacity-70">Có <strong className="text-foreground">{filteredListings.length}</strong> tin đang bán</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{filteredListings.map(listing => <BookListingCard key={listing.id} listing={listing} />)}</div>
        </>
      )}
    </div>
  );
}
