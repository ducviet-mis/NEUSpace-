-- ==========================================
-- HỆ THỐNG CƠ SỞ DỮ LIỆU: TIỆN ÍCH SINH VIÊN NEU
-- ==========================================

-- 1. BẢNG DỮ LIỆU CHUNG (GLOBAL DATA)
-- Chứa thông tin về môn học, ngành học (Không gắn với user_id cụ thể)

CREATE TABLE public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_code TEXT UNIQUE NOT NULL, -- Mã học phần (VD: KHMI1101)
    course_name TEXT NOT NULL,
    credits INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.majors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    major_code TEXT UNIQUE NOT NULL, -- Mã ngành (VD: 7310101P1)
    major_name TEXT NOT NULL,
    total_required_credits INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.major_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    major_id UUID REFERENCES public.majors(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    course_type TEXT NOT NULL CHECK (course_type IN ('BAT_BUOC', 'TU_CHON')),
    elective_group TEXT, -- Tên khối tự chọn (nếu có)
    required_elective_count INTEGER, -- Yêu cầu chọn bao nhiêu môn trong khối này
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(major_id, course_id)
);

-- Bật RLS cho các bảng chung (Ai cũng đọc được, chỉ Admin mới được sửa)
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.majors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.major_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cho phép tất cả đọc courses" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Cho phép tất cả đọc majors" ON public.majors FOR SELECT USING (true);
CREATE POLICY "Cho phép tất cả đọc major_courses" ON public.major_courses FOR SELECT USING (true);


-- 2. BẢNG DỮ LIỆU CÁ NHÂN (USER DATA)
-- Tất cả các bảng này đều có user_id và RLS cực kỳ chặt chẽ

CREATE TABLE public.profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    student_code TEXT,
    dob DATE,
    cohort TEXT,
    major_name TEXT,
    avatar_url TEXT,
    current_major_id UUID REFERENCES public.majors(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.user_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    theme TEXT DEFAULT 'system',
    notifications_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.user_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
    custom_course_name TEXT, -- Dùng khi sinh viên tự nhập môn ngoài hệ thống
    credits INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('DA_HOC', 'CHUA_HOC', 'DANG_HOC')) DEFAULT 'CHUA_HOC',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.timetable_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
    custom_title TEXT, -- Dùng cho các môn tự nhập
    day_of_week INTEGER CHECK (day_of_week BETWEEN 2 AND 8), -- 2: Thứ 2, 8: Chủ nhật
    start_time TIME,
    end_time TIME,
    class_period TEXT, -- VD: "1-2", "3-4"
    room TEXT,
    lecturer TEXT,
    event_type TEXT DEFAULT 'HOC' CHECK (event_type IN ('HOC', 'THI')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    day_of_week INTEGER CHECK (day_of_week BETWEEN 2 AND 8),
    start_time TIME,
    end_time TIME,
    activity_type TEXT DEFAULT 'CA_NHAN' CHECK (activity_type IN ('CA_NHAN', 'DI_LAM', 'HOC_NHOM', 'CAU_LAC_BO', 'SU_KIEN')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
    custom_course_name TEXT,
    credits INTEGER NOT NULL DEFAULT 0,
    score_10 NUMERIC(4,2) CHECK (score_10 >= 0 AND score_10 <= 10),
    letter_grade TEXT, -- A+, A, B+, B, C+, C, D+, D, F
    score_4 NUMERIC(3,2) CHECK (score_4 >= 0 AND score_4 <= 4),
    semester INTEGER CHECK (semester IN (1, 2, 3)),
    academic_year TEXT, -- VD: "2023-2024"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.gpa_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    semester INTEGER CHECK (semester IN (1, 2, 3)),
    academic_year TEXT NOT NULL,
    gpa_10 NUMERIC(4,2),
    gpa_4 NUMERIC(3,2),
    total_credits INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, semester, academic_year)
);

CREATE TABLE public.double_major_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    primary_major_id UUID REFERENCES public.majors(id) ON DELETE CASCADE,
    secondary_major_id UUID REFERENCES public.majors(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'DANG_LAP_KE_HOACH',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, primary_major_id, secondary_major_id)
);

-- ==========================================
-- 3. CẤU HÌNH BẢO MẬT (ROW LEVEL SECURITY)
-- ==========================================

-- Hàm helper để tự động gắn updated_at khi update row
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Gắn trigger cho các bảng có updated_at
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.user_settings FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.user_courses FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.timetable_events FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.grades FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.gpa_records FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.double_major_plans FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Bật RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gpa_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.double_major_plans ENABLE ROW LEVEL SECURITY;

-- Tạo Policy chỉ cho phép người dùng CRUD trên dữ liệu của chính họ (dựa vào auth.uid())

-- 1. Profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 2. User Settings
CREATE POLICY "Users can view own settings" ON public.user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON public.user_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON public.user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. User Courses
CREATE POLICY "Users can manage own courses" ON public.user_courses FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. Timetable Events
CREATE POLICY "Users can manage own timetable" ON public.timetable_events FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. Activities
CREATE POLICY "Users can manage own activities" ON public.activities FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 6. Grades
CREATE POLICY "Users can manage own grades" ON public.grades FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 7. GPA Records
CREATE POLICY "Users can manage own gpa records" ON public.gpa_records FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 8. Double Major Plans
CREATE POLICY "Users can manage own double major plans" ON public.double_major_plans FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Trigger tạo profile tự động khi user đăng ký (Tuỳ chọn nhưng rất hữu ích)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (new.id);
  
  INSERT INTO public.user_settings (user_id)
  VALUES (new.id);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
