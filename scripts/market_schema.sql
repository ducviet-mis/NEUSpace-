-- 1. Create the book_listings table
CREATE TABLE public.book_listings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    subject_code text,
    subject_name text NOT NULL,
    image_urls text[] DEFAULT '{}'::text[],
    book_type text CHECK (book_type IN ('Chính thống', 'Photo')) NOT NULL,
    condition text CHECK (condition IN ('Như mới', 'Khá mới', 'Đã sử dụng nhiều')) NOT NULL,
    price numeric DEFAULT 0,
    contact_info text NOT NULL,
    notes text,
    status text DEFAULT 'available' CHECK (status IN ('available', 'sold', 'expired')),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Turn on RLS
ALTER TABLE public.book_listings ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read available book listings
CREATE POLICY "Anyone can view available listings" ON public.book_listings
    FOR SELECT USING (status = 'available');

-- Policy: Users can view their own listings regardless of status
CREATE POLICY "Users can view own listings" ON public.book_listings
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own listings
CREATE POLICY "Users can insert own listings" ON public.book_listings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own listings
CREATE POLICY "Users can update own listings" ON public.book_listings
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own listings
CREATE POLICY "Users can delete own listings" ON public.book_listings
    FOR DELETE USING (auth.uid() = user_id);


-- 2. Create the book_watchlist table
CREATE TABLE public.book_watchlist (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    subject_name text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, subject_name)
);

ALTER TABLE public.book_watchlist ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage their own watchlist
CREATE POLICY "Users can manage watchlist" ON public.book_watchlist
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- 3. Cron Job for Auto-cleanup (requires pg_cron extension enabled in Supabase)
-- Note: In Supabase, you can enable pg_cron in Database -> Extensions
-- Then run this to schedule expiration of posts older than 30 days
SELECT cron.schedule(
    'expire_old_book_listings',
    '0 0 * * *', -- Run daily at midnight
    $$
    UPDATE public.book_listings 
    SET status = 'expired' 
    WHERE status = 'available' 
    AND created_at < NOW() - INTERVAL '30 days';
    $$
);

-- ==========================================
-- BƯỚC TIẾP THEO DÀNH CHO BẠN (TRÊN SUPABASE)
-- ==========================================
-- 1. Chạy đoạn SQL này trong SQL Editor của Supabase.
-- 2. Vào phần Storage, tạo một bucket mới tên là `books`.
-- 3. Đặt Bucket `books` thành Public (Public Bucket).
-- 4. Chạy scripts/security_hardening.sql thay cho các policy "authenticated users"
--    chung chung. Script đó giới hạn quyền ghi/xóa theo thư mục user ID.
