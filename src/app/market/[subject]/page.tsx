'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Bell, BellRing, BookOpen } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import BookListingCard, { BookListing } from '@/components/market/BookListingCard';

export default function SubjectMarketPage() {
  const params = useParams();
  const subjectName = decodeURIComponent(params.subject as string);

  const [listings, setListings] = useState<BookListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [watching, setWatching] = useState(false);
  const [watchLoading, setWatchLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) setUser(session.user);

        // Fetch listings
        const { data: listingsData } = await supabase
          .from('book_listings')
          .select('id, image_urls, book_type, condition, price, contact_info, notes, created_at')
          .eq('subject_name', subjectName)
          .eq('status', 'available')
          .order('created_at', { ascending: false });

        if (listingsData) {
          setListings(listingsData);
        }

        // Check watch status
        if (session) {
          const { data: watchData } = await supabase
            .from('book_watchlist')
            .select('id')
            .eq('user_id', session.user.id)
            .eq('subject_name', subjectName)
            .single();
            
          if (watchData) setWatching(true);
        }

      } catch (error) {
        console.error("Error fetching market subject data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [subjectName]);

  const toggleWatch = async () => {
    if (!user) return alert("Vui lòng đăng nhập để sử dụng tính năng này");
    
    setWatchLoading(true);
    try {
      if (watching) {
        await supabase
          .from('book_watchlist')
          .delete()
          .eq('user_id', user.id)
          .eq('subject_name', subjectName);
        setWatching(false);
      } else {
        await supabase
          .from('book_watchlist')
          .insert({
            user_id: user.id,
            subject_name: subjectName
          });
        setWatching(true);
      }
    } catch (e) {
      console.error(e);
      alert("Có lỗi xảy ra, vui lòng thử lại sau.");
    } finally {
      setWatchLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-12 animate-in fade-in duration-500">
      <Link href="/market" className="inline-flex items-center gap-2 text-foreground/70 hover:text-cyan-500 transition-colors mb-6 text-sm font-medium">
        <ArrowLeft size={16} /> Quay lại danh sách môn
      </Link>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-border/50">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2 text-cyan-600 dark:text-cyan-400">
            {subjectName}
          </h1>
          <p className="opacity-70 text-sm">
            Hiện có {listings.length} bài đăng bán sách / tài liệu cho môn này
          </p>
        </div>

        <button 
          onClick={toggleWatch}
          disabled={watchLoading}
          className={`px-5 py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
            watching 
              ? 'bg-foreground/5 text-foreground/70 border border-border hover:bg-foreground/10' 
              : 'bg-cyan-500 text-white hover:bg-cyan-400 shadow-cyan-500/20'
          }`}
        >
          {watching ? <BellRing size={16} className="text-cyan-500" /> : <Bell size={16} />}
          {watching ? 'Đang nhận thông báo' : 'Nhận thông báo khi có người đăng'}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : listings.length === 0 ? (
        <div className="glass-panel p-16 flex flex-col items-center justify-center text-center">
          <BookOpen size={48} className="text-foreground/20 mb-4" />
          <h3 className="text-xl font-bold mb-2">Chưa có ai bán sách môn này</h3>
          <p className="opacity-70 max-w-md text-sm mb-6">
            Hãy bấm "Nhận thông báo" để là người đầu tiên biết khi có bạn sinh viên khác đăng bán giáo trình môn {subjectName} nhé!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {listings.map(listing => (
            <BookListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
