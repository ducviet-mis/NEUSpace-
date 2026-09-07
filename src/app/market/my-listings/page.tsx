'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, CheckCircle, Trash2, PackageOpen } from 'lucide-react';
import Link from 'next/link';

export default function MyListingsPage() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const fetchMyListings = async (userId: string) => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('book_listings')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (data) setListings(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        fetchMyListings(session.user.id);
      } else {
        setLoading(false);
      }
    };
    getUser();
  }, []);

  const markAsSold = async (id: string) => {
    if (!confirm('Bạn chắc chắn đã bán món đồ này? Bài đăng sẽ bị ẩn đi.')) return;
    try {
      await supabase.from('book_listings').update({ status: 'sold' }).eq('id', id);
      setListings(listings.map(l => l.id === id ? { ...l, status: 'sold' } : l));
    } catch (e) {
      console.error(e);
      alert("Lỗi khi cập nhật");
    }
  };

  const deleteListing = async (id: string) => {
    if (!confirm('Bạn chắc chắn muốn xóa bài đăng này?')) return;
    try {
      await supabase.from('book_listings').delete().eq('id', id);
      setListings(listings.filter(l => l.id !== id));
    } catch (e) {
      console.error(e);
      alert("Lỗi khi xóa");
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-12 animate-in fade-in duration-500">
      <Link href="/market" className="inline-flex items-center gap-2 text-foreground/70 hover:text-cyan-500 transition-colors mb-6 text-sm font-medium">
        <ArrowLeft size={16} /> Quay lại chợ
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Quản lý Tin đăng của tôi</h1>
        <p className="opacity-70 text-sm">Xem và quản lý giáo trình, đồng phục và đồ dùng bạn đang bán.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : !user ? (
        <div className="glass-panel p-16 text-center">
          <p>Vui lòng đăng nhập để xem tin đăng của bạn.</p>
        </div>
      ) : listings.length === 0 ? (
        <div className="glass-panel p-16 flex flex-col items-center justify-center text-center">
          <PackageOpen size={48} className="text-foreground/20 mb-4" />
          <h3 className="text-xl font-bold mb-2">Bạn chưa có tin đăng nào</h3>
          <p className="opacity-70 text-sm mb-6">Bạn có thể đăng giáo trình, đồng phục hoặc đồ dùng không còn sử dụng.</p>
          <Link href="/market/sell" className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-white rounded-xl font-medium transition-colors">
            Đăng bán ngay
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {listings.map((listing) => (
            <div key={listing.id} className={`glass-panel p-4 flex flex-col md:flex-row gap-6 items-center ${listing.status !== 'available' ? 'opacity-60' : ''}`}>
              <div className="w-full md:w-32 h-32 bg-background/50 rounded-xl overflow-hidden flex-shrink-0">
                {listing.image_urls && listing.image_urls[0] ? (
                  <img src={listing.image_urls[0]} alt={listing.subject_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-foreground/20">No Image</div>
                )}
              </div>
              
              <div className="flex-1 w-full">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg leading-tight text-cyan-600 dark:text-cyan-400">{listing.subject_name}</h3>
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${
                    listing.status === 'available' ? 'border-green-500/50 bg-green-500/10 text-green-500' :
                    listing.status === 'sold' ? 'border-foreground/20 bg-foreground/5 text-foreground/50' :
                    'border-red-500/50 bg-red-500/10 text-red-500'
                  }`}>
                    {listing.status === 'available' ? 'Đang bán' : listing.status === 'sold' ? 'Đã bán' : 'Hết hạn'}
                  </span>
                </div>
                <p className="text-xs font-medium text-foreground/60 mb-2">{listing.category === 'uniform' ? 'Đồng phục' : listing.category === 'other' ? 'Đồ dùng khác' : 'Giáo trình'} · {listing.book_type}</p>
                
                <p className="text-sm opacity-70 mb-1">Giá: <strong className="text-foreground">{listing.price === 0 ? 'Tặng miễn phí' : new Intl.NumberFormat('vi-VN').format(listing.price) + 'đ'}</strong></p>
                <p className="text-sm opacity-70 mb-4">Ngày đăng: {new Date(listing.created_at).toLocaleDateString('vi-VN')}</p>
                
                <div className="flex gap-3">
                  {listing.status === 'available' && (
                    <button 
                      onClick={() => markAsSold(listing.id)}
                      className="px-4 py-2 bg-green-500/10 text-green-600 hover:bg-green-500 hover:text-white border border-green-500/20 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <CheckCircle size={16} /> Đánh dấu đã bán
                    </button>
                  )}
                  <button 
                    onClick={() => deleteListing(listing.id)}
                    className="px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <Trash2 size={16} /> Xóa bài
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
