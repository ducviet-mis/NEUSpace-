-- ============================================================
-- neuOS: Form góp ý (khách và sinh viên đều gửi được)
-- Chạy một lần trong Supabase Dashboard > SQL Editor.
-- ============================================================

create table if not exists public.feedback_submissions (
  id uuid primary key default gen_random_uuid(),
  -- NULL khi gửi ở chế độ khách; tự gắn auth.uid() khi đã đăng nhập.
  user_id uuid references auth.users(id) on delete set null,
  rating smallint not null check (rating between 1 and 5),
  topics text[] not null
    check (cardinality(topics) between 1 and 4)
    check (topics <@ array['experience', 'feature', 'idea', 'issue']::text[]),
  feature_area text check (
    feature_area is null or feature_area = any (array[
      'Trang chủ', 'Tiến độ học tập', 'Tính GPA', 'Lịch học',
      'Lịch thi', 'Song ngành', 'Chợ sinh viên', 'Khác'
    ])
  ),
  message text not null check (char_length(btrim(message)) between 12 and 1200),
  allow_contact boolean not null default false,
  contact_email text,
  source_path text not null default '/feedback' check (char_length(source_path) <= 160),
  status text not null default 'new'
    check (status in ('new', 'in_review', 'planned', 'done', 'closed')),
  created_at timestamptz not null default now(),
  constraint feedback_contact_details_check check (
    (allow_contact = false and contact_email is null)
    or (
      allow_contact = true
      and contact_email is not null
      and contact_email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    )
  )
);

comment on table public.feedback_submissions is
  'Góp ý riêng tư gửi từ neuOS; không cấp quyền đọc cho anon/authenticated.';

-- Ghi đè user_id phía máy khách. Khách vẫn có thể gửi, và row sẽ có user_id = NULL.
create or replace function public.assign_feedback_owner()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.user_id := (select auth.uid());
  return new;
end;
$$;

drop trigger if exists set_feedback_owner on public.feedback_submissions;
create trigger set_feedback_owner
before insert on public.feedback_submissions
for each row execute function public.assign_feedback_owner();

alter table public.feedback_submissions enable row level security;

-- Chỉ cho phép INSERT vào đúng các cột cần thiết. Không ai từ web có quyền đọc,
-- sửa, xóa, đặt trạng thái hoặc giả mạo user_id / thời điểm gửi.
revoke all on table public.feedback_submissions from anon, authenticated;
grant insert (rating, topics, feature_area, message, allow_contact, contact_email, source_path)
on table public.feedback_submissions to anon, authenticated;

drop policy if exists "Guests and students can submit feedback" on public.feedback_submissions;
create policy "Guests and students can submit feedback"
on public.feedback_submissions
for insert
to anon, authenticated
with check (user_id is not distinct from (select auth.uid()));

-- Không tạo policy SELECT / UPDATE / DELETE.
-- Vì thế chỉ bạn (Dashboard SQL Editor hoặc service role an toàn phía server)
-- mới xem và quản lý được góp ý; người dùng không thể trích xuất góp ý của nhau.
