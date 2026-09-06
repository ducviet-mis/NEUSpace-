-- 1. Create the notifications table
CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    link text,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Turn on RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage their own notifications
CREATE POLICY "Users can manage their own notifications" ON public.notifications
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Enable Realtime for notifications so the web app can update live
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- 2. Create the Trigger to auto-generate notifications
CREATE OR REPLACE FUNCTION public.notify_watchlist()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert a notification for every user (except the seller) who is watching the new listing's subject
    INSERT INTO public.notifications (user_id, title, content, link)
    SELECT 
        w.user_id,
        'Sách mới: ' || NEW.subject_name,
        'Có người vừa đăng bán sách/tài liệu cho môn học này. Vào xem ngay!',
        '/market/' || NEW.subject_name
    FROM public.book_watchlist w
    WHERE w.subject_name = NEW.subject_name
      AND w.user_id != NEW.user_id;
      
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Bind trigger to book_listings
DROP TRIGGER IF EXISTS on_book_listing_inserted ON public.book_listings;
CREATE TRIGGER on_book_listing_inserted
    AFTER INSERT ON public.book_listings
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_watchlist();
