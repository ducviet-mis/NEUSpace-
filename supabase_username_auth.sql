-- ============================================================
-- neuOS: Đăng ký bằng Họ và tên + Tên đăng nhập + Mật khẩu
-- Chạy một lần trong Supabase Dashboard > SQL Editor.
-- ============================================================

alter table public.profiles add column if not exists username text;

-- Không để dữ liệu cũ rỗng làm migration thất bại khi thêm kiểm tra tên.
update public.profiles
set full_name = null
where full_name is not null and btrim(full_name) = '';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_username_format_check') then
    alter table public.profiles add constraint profiles_username_format_check
      check (username is null or username ~ '^[a-z0-9][a-z0-9._-]{2,23}$');
  end if;

  if not exists (select 1 from pg_constraint where conname = 'profiles_full_name_length_check') then
    alter table public.profiles add constraint profiles_full_name_length_check
      check (full_name is null or char_length(btrim(full_name)) between 2 and 80);
  end if;
end;
$$;

create unique index if not exists profiles_username_lower_unique
  on public.profiles (lower(username))
  where username is not null;

-- Khi Auth vừa tạo account, tạo profile bằng dữ liệu do form đăng ký gửi lên.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id, full_name, username)
  values (
    new.id,
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(lower(btrim(new.raw_user_meta_data ->> 'username')), '')
  );

  insert into public.user_settings (user_id)
  values (new.id);

  return new;
end;
$$;

-- Thay thế hook đang chọn trong Authentication > Hooks bằng cùng tên hàm này.
-- Chỉ chấp nhận email kỹ thuật được sinh từ username; gọi Auth bằng email tùy ý
-- sẽ bị chặn trước khi account được tạo.
create or replace function public.hook_allow_neu_student_email(event jsonb)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  supplied_email text := lower(coalesce(event -> 'user' ->> 'email', ''));
  supplied_username text := lower(btrim(coalesce(event -> 'user' -> 'user_metadata' ->> 'username', '')));
  supplied_full_name text := btrim(coalesce(event -> 'user' -> 'user_metadata' ->> 'full_name', ''));
begin
  if supplied_username !~ '^[a-z0-9][a-z0-9._-]{2,23}$' then
    return jsonb_build_object('error', jsonb_build_object(
      'http_code', 400,
      'message', 'Tên đăng nhập không hợp lệ.'
    ));
  end if;

  if char_length(supplied_full_name) not between 2 and 80 then
    return jsonb_build_object('error', jsonb_build_object(
      'http_code', 400,
      'message', 'Họ và tên không hợp lệ.'
    ));
  end if;

  if supplied_email <> supplied_username || '@accounts.neuos.invalid' then
    return jsonb_build_object('error', jsonb_build_object(
      'http_code', 400,
      'message', 'Chỉ đăng ký qua tên đăng nhập trên neuOS.'
    ));
  end if;

  return '{}'::jsonb;
end;
$$;

grant usage on schema public to supabase_auth_admin;
grant execute on function public.hook_allow_neu_student_email(jsonb) to supabase_auth_admin;
revoke execute on function public.hook_allow_neu_student_email(jsonb) from anon, authenticated, public;

-- Trigger on_auth_user_created đã có trong schema hiện tại sẽ tự dùng
-- phiên bản handle_new_user mới ở trên; không cần tạo trigger thứ hai.
