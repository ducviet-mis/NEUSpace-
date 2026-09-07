'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Package, PackageOpen, PlusCircle, Search, Shirt, ShoppingBag, Tag } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import BookListingCard, { BookListing } from '@/components/market/BookListingCard';

type Category = 'all' | 'textbook' | 'uniform' | 'other';

const CATEGORIES: Array<{ id: Category; label: string; icon: typeof BookOpen }> = [
  { id: 'all', label: 'Tất cả', icon: ShoppingBag },
  { id: 'textbook', label: 'Giáo trình', icon: BookOpen },
  { id: 'uniform', label: 'Đồng phục', icon: Shirt },
  { id: 'other', label: 'Đồ dùng khác', icon: Package },
];

export default function MarketPage() {
  const [listings, setListings] = useState<BookListing[]>([]);
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isFreeOnly, setIsFreeOnly] = useState(false);
  const [loading, setLoading] = useState(true);

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
      if (activeCategory !== 'all' && category !== activeCategory) return false;
      if (isFreeOnly && listing.price !== 0) return false;
      if (!query) return true;
      return [listing.subject_name, listing.book_type, listing.notes]
        .some(value => value?.toLowerCase().includes(query));
    });
  }, [listings, activeCategory, isFreeOnly, searchTerm]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-in fade-in duration-500">
      <section className="glass-panel p-6 md:p-8 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-3"><ShoppingBag className="text-cyan-500" size={32} /> Chợ sinh viên</h1>
          <p className="opacity-70 text-sm leading-relaxed">Mua bán giáo trình, đồng phục và đồ dùng sinh viên. Giao dịch trực tiếp, chủ động trao đổi với người bán.</p>
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row md:flex-col gap-2 w-full md:w-auto">
          <Link href="/market/sell" className="min-h-11 px-5 py-3 bg-cyan-500 hover:bg-cyan-400 text-white rounded-xl font-semibold shadow-lg shadow-cyan-500/20 transition-colors flex items-center justify-center gap-2"><PlusCircle size={18} /> Đăng bán</Link>
          <Link href="/market/my-listings" className="min-h-11 px-5 py-3 bg-background/50 hover:bg-background/80 border border-border rounded-xl font-medium transition-colors text-sm text-center">Tin đăng của tôi</Link>
        </div>
      </section>

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

      {loading ? (
        <div className="flex justify-center items-center h-64"><div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : filteredListings.length === 0 ? (
        <div className="glass-panel p-12 flex flex-col items-center justify-center text-center">
          <PackageOpen size={48} className="text-foreground/20 mb-4" />
          <h2 className="text-xl font-bold mb-2">Chưa có tin phù hợp</h2>
          <p className="opacity-70 text-sm max-w-md mb-6">Hãy đổi từ khóa hoặc đăng món đồ đầu tiên trong danh mục này.</p>
          <Link href="/market/sell" className="min-h-11 px-5 py-3 bg-cyan-500 text-white rounded-xl font-semibold">Đăng bán ngay</Link>
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
