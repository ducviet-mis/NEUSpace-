-- neuOS: mở rộng Chợ sinh viên
-- Chạy một lần trong Supabase SQL Editor, sau khi đã có bảng public.book_listings.

-- 1. Thêm danh mục. Toàn bộ tin cũ được xem là giáo trình để không mất dữ liệu.
ALTER TABLE public.book_listings
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'textbook';

UPDATE public.book_listings
SET category = 'textbook'
WHERE category IS NULL;

-- 2. Bỏ ràng buộc loại sách cũ để dùng được cho đồng phục và các đồ dùng khác.
ALTER TABLE public.book_listings
  DROP CONSTRAINT IF EXISTS book_listings_book_type_check;

-- 3. Chỉ cho phép ba danh mục mà ứng dụng hỗ trợ.
ALTER TABLE public.book_listings
  DROP CONSTRAINT IF EXISTS book_listings_category_check;

ALTER TABLE public.book_listings
  ADD CONSTRAINT book_listings_category_check
  CHECK (category IN ('textbook', 'uniform', 'other'));

-- 4. Kiểm tra dữ liệu cơ bản ở tầng database.
ALTER TABLE public.book_listings
  DROP CONSTRAINT IF EXISTS book_listings_price_range_check;

ALTER TABLE public.book_listings
  ADD CONSTRAINT book_listings_price_range_check
  CHECK (price >= 0 AND price <= 100000000);

-- 5. Tạo chỉ mục để lọc danh mục nhanh khi số tin đăng tăng lên.
CREATE INDEX IF NOT EXISTS book_listings_available_category_created_idx
  ON public.book_listings (category, created_at DESC)
  WHERE status = 'available';

-- Không thay đổi RLS: các chính sách hiện có vẫn đảm bảo người dùng chỉ sửa/xóa tin của chính họ.
