-- Run this ONCE in the Supabase SQL Editor for an existing installation.
-- It is safe to re-run. Read the comments before running in production.

-- The UI already uses these profile fields, but the original schema omitted them.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS dob date,
  ADD COLUMN IF NOT EXISTS cohort text,
  ADD COLUMN IF NOT EXISTS major_name text,
  ADD COLUMN IF NOT EXISTS avatar_url text;

-- Do not expose account email addresses in the public marketplace API.
-- Contact information remains the explicit field the seller chose to publish.
ALTER TABLE public.book_listings DROP COLUMN IF EXISTS user_email;
ALTER TABLE public.book_watchlist DROP COLUMN IF EXISTS user_email;

-- Make ownership checks explicit for every write, including an UPDATE that
-- attempts to change a row's user_id.
DROP POLICY IF EXISTS "Users can manage own courses" ON public.user_courses;
CREATE POLICY "Users can manage own courses" ON public.user_courses
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can manage own timetable" ON public.timetable_events;
CREATE POLICY "Users can manage own timetable" ON public.timetable_events
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can manage own activities" ON public.activities;
CREATE POLICY "Users can manage own activities" ON public.activities
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can manage own grades" ON public.grades;
CREATE POLICY "Users can manage own grades" ON public.grades
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can manage own gpa records" ON public.gpa_records;
CREATE POLICY "Users can manage own gpa records" ON public.gpa_records
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can manage own double major plans" ON public.double_major_plans;
CREATE POLICY "Users can manage own double major plans" ON public.double_major_plans
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can manage their own notifications" ON public.notifications;
CREATE POLICY "Users can manage their own notifications" ON public.notifications
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own listings" ON public.book_listings;
CREATE POLICY "Users can update own listings" ON public.book_listings
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can manage watchlist" ON public.book_watchlist;
CREATE POLICY "Users can manage watchlist" ON public.book_watchlist
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- SECURITY DEFINER functions must use a fixed, empty search path and fully
-- qualified table names. This removes search_path hijacking opportunities.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id) VALUES (new.id);
  INSERT INTO public.user_settings (user_id) VALUES (new.id);
  RETURN new;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_watchlist()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, content, link)
  SELECT w.user_id,
         'Sách mới: ' || NEW.subject_name,
         'Có người vừa đăng bán sách/tài liệu cho môn học này. Vào xem ngay!',
         '/market/' || NEW.subject_name
  FROM public.book_watchlist AS w
  WHERE w.subject_name = NEW.subject_name
    AND w.user_id <> NEW.user_id;
  RETURN NEW;
END;
$$;

-- Public buckets are necessary for marketplace images, but write access is
-- narrowly scoped to each authenticated user's own folder.
INSERT INTO storage.buckets (id, name, public)
VALUES ('books', 'books', true), ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users upload own book images" ON storage.objects;
DROP POLICY IF EXISTS "Users read own book image metadata" ON storage.objects;
DROP POLICY IF EXISTS "Users update own book images" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own book images" ON storage.objects;
CREATE POLICY "Users upload own book images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'books'
    AND (storage.foldername(name))[1] = (select auth.uid()::text)
    AND lower(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp')
  );
-- Needed for Storage to return object metadata after an upload. Public bucket
-- access still serves the image itself without enabling object-listing access.
CREATE POLICY "Users read own book image metadata" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'books' AND owner_id = (select auth.uid()::text)
  );
CREATE POLICY "Users update own book images" ON storage.objects
  FOR UPDATE TO authenticated USING (
    bucket_id = 'books' AND owner_id = (select auth.uid()::text)
  ) WITH CHECK (
    bucket_id = 'books'
    AND (storage.foldername(name))[1] = (select auth.uid()::text)
    AND lower(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp')
  );
CREATE POLICY "Users delete own book images" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'books' AND owner_id = (select auth.uid()::text)
  );

DROP POLICY IF EXISTS "Users upload own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users read own avatar metadata" ON storage.objects;
DROP POLICY IF EXISTS "Users update own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own avatars" ON storage.objects;
CREATE POLICY "Users upload own avatars" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (select auth.uid()::text)
    AND lower(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp')
  );
CREATE POLICY "Users read own avatar metadata" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'avatars' AND owner_id = (select auth.uid()::text)
  );
CREATE POLICY "Users update own avatars" ON storage.objects
  FOR UPDATE TO authenticated USING (
    bucket_id = 'avatars' AND owner_id = (select auth.uid()::text)
  ) WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (select auth.uid()::text)
    AND lower(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp')
  );
CREATE POLICY "Users delete own avatars" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'avatars' AND owner_id = (select auth.uid()::text)
  );
