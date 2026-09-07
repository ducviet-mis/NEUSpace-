import React, { useState } from 'react';
import { Phone, BookOpen, Clock, Tag, ChevronLeft, ChevronRight, Package, Shirt } from 'lucide-react';

export interface BookListing {
  id: string;
  subject_name?: string;
  category?: 'textbook' | 'uniform' | 'other' | null;
  image_urls: string[];
  book_type: string;
  condition: string;
  price: number;
  contact_info: string;
  notes: string;
  created_at: string;
}

export default function BookListingCard({ listing }: { listing: BookListing }) {
  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  const formatPrice = (price: number) => {
    if (price === 0) return '0đ';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
  };

  const nextImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImgIndex((prev) => (prev + 1) % listing.image_urls.length);
  };

  const prevImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImgIndex((prev) => (prev - 1 + listing.image_urls.length) % listing.image_urls.length);
  };

  const isFree = listing.price === 0;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const categoryLabel = listing.category === 'uniform' ? 'Đồng phục' : listing.category === 'other' ? 'Đồ dùng khác' : 'Giáo trình';
  const CategoryIcon = listing.category === 'uniform' ? Shirt : listing.category === 'other' ? Package : BookOpen;

  return (
    <>
      {/* Thẻ hiển thị rút gọn (Clickable) */}
      <div 
        onClick={() => setIsModalOpen(true)}
        className="glass-panel overflow-hidden flex flex-col group cursor-pointer hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all"
      >
        {/* Image Carousel */}
        <div className="relative h-56 bg-background/50 flex items-center justify-center overflow-hidden">
          {listing.image_urls && listing.image_urls.length > 0 ? (
            <>
              <img 
                src={listing.image_urls[currentImgIndex]} 
                alt={listing.subject_name || categoryLabel}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              {listing.image_urls.length > 1 && (
                <>
                  <button onClick={prevImg} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80">
                    <ChevronLeft size={18} />
                  </button>
                  <button onClick={nextImg} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80">
                    <ChevronRight size={18} />
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {listing.image_urls.map((_, i) => (
                      <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === currentImgIndex ? 'bg-white' : 'bg-white/50'}`}></div>
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <BookOpen size={48} className="text-foreground/20" />
          )}
          
          {/* Price Badge */}
          <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-sm font-bold shadow-lg ${isFree ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white' : 'bg-cyan-500 text-white'}`}>
            {formatPrice(listing.price)}
          </div>
        </div>

        {/* Details */}
        <div className="p-5 flex-1 flex flex-col">
          <div className="flex items-center gap-2 text-xs font-medium mb-3">
            <span className="px-2 py-1 bg-foreground/5 rounded text-foreground/70 flex items-center gap-1.5">
              <CategoryIcon size={12} /> {categoryLabel}
            </span>
            <span className="px-2 py-1 bg-foreground/5 rounded text-foreground/70 flex items-center gap-1.5">
              <Tag size={12} /> {listing.condition}
            </span>
          </div>

          {listing.subject_name && <h3 className="font-semibold leading-snug mb-2 line-clamp-2">{listing.subject_name}</h3>}

          {listing.notes && (
            <p className="text-sm opacity-80 line-clamp-3 mb-4 leading-relaxed flex-1">
              {listing.notes}
            </p>
          )}

          <div className="border-t border-border/50 pt-4 mt-auto space-y-2 text-sm">
            <div className="flex items-center gap-2 opacity-80">
              <Phone size={14} className="text-green-500" />
              <span className="font-medium">{listing.contact_info}</span>
            </div>
            <div className="flex items-center gap-2 opacity-60 text-xs mt-2">
              <Clock size={12} />
              <span>Đăng ngày: {formatDate(listing.created_at)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Popup Chi tiết (Modal) */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="glass-panel w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row shadow-2xl relative animate-in zoom-in-95 duration-300"
            onClick={e => e.stopPropagation()}
          >
            {/* Nút đóng */}
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>

            {/* Cột trái: Ảnh lớn */}
            <div className="w-full md:w-1/2 bg-black/5 relative h-64 md:h-auto flex items-center justify-center">
              {listing.image_urls && listing.image_urls.length > 0 ? (
                <>
                  <img 
                    src={listing.image_urls[currentImgIndex]} 
                    alt={listing.subject_name || categoryLabel}
                    className="w-full h-full object-contain p-2"
                  />
                  {listing.image_urls.length > 1 && (
                    <>
                      <button onClick={prevImg} className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/80 transition-colors">
                        <ChevronLeft size={24} />
                      </button>
                      <button onClick={nextImg} className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/80 transition-colors">
                        <ChevronRight size={24} />
                      </button>
                    </>
                  )}
                  {/* Thumbnails */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {listing.image_urls.map((img, i) => (
                      <div 
                        key={i} 
                        onClick={() => setCurrentImgIndex(i)}
                        className={`w-12 h-12 rounded-md overflow-hidden cursor-pointer border-2 transition-colors ${i === currentImgIndex ? 'border-cyan-500' : 'border-transparent opacity-50 hover:opacity-100'}`}
                      >
                        <img src={img} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <BookOpen size={64} className="text-foreground/20" />
              )}
            </div>

            {/* Cột phải: Thông tin chi tiết */}
            <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col overflow-y-auto max-h-[50vh] md:max-h-none">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-3 pr-8">{listing.subject_name || 'Thông tin món đồ'}</h2>
                <div className={`inline-block px-4 py-1.5 rounded-full text-lg font-bold shadow-md mb-4 ${isFree ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white' : 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30'}`}>
                  {formatPrice(listing.price)}
                </div>
                
                <div className="flex flex-wrap gap-2 text-sm font-medium mb-4">
                  <span className="px-3 py-1.5 bg-foreground/5 rounded-lg text-foreground/80 flex items-center gap-2">
                    <CategoryIcon size={14} /> {categoryLabel}
                  </span>
                  <span className="px-3 py-1.5 bg-foreground/5 rounded-lg text-foreground/80 flex items-center gap-2">
                    <Tag size={14} /> {listing.book_type}
                  </span>
                  <span className="px-3 py-1.5 bg-foreground/5 rounded-lg text-foreground/80 flex items-center gap-2">
                    <Tag size={14} /> {listing.condition}
                  </span>
                </div>
              </div>

              {listing.notes && (
                <div className="mb-6">
                  <h3 className="text-sm font-bold opacity-70 mb-2 uppercase tracking-wider">Mô tả thêm</h3>
                  <div className="text-sm opacity-90 leading-relaxed bg-foreground/5 p-4 rounded-xl whitespace-pre-wrap">
                    {listing.notes}
                  </div>
                </div>
              )}

              <div className="mt-auto">
                <h3 className="text-sm font-bold opacity-70 mb-3 uppercase tracking-wider">Thông tin liên hệ</h3>
                <div className="space-y-3 bg-cyan-500/5 border border-cyan-500/20 p-4 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 shrink-0">
                      <Phone size={16} />
                    </div>
                    <span className="font-medium text-sm md:text-base font-mono text-cyan-600 dark:text-cyan-400">{listing.contact_info}</span>
                  </div>
                  <div className="flex items-center gap-3 opacity-60 text-xs mt-2 pt-2 border-t border-cyan-500/10">
                    <Clock size={12} />
                    <span>Đăng ngày: {formatDate(listing.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
