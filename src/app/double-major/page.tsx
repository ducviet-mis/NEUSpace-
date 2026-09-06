'use client';

import React, { useState, useMemo, useCallback } from 'react';
import curriculumData from '@/data/curriculum.json';
import { BookOpen, CheckCircle, AlertCircle, ArrowRight, Plus, Star, Info, Sparkles, HelpCircle, ChevronDown, ChevronUp, X } from 'lucide-react';
import { clsx } from 'clsx';

// ============================================================
// TYPES
// ============================================================

interface Subject {
  semester: number;
  required: boolean;
  knowledgeBlock: string;
  name: string;
  subjectCode: string;
  credits: number;
}

interface Major {
  url: string;
  majorName: string;
  subjects: Subject[];
}

type TabType = 'shared' | 'required_extra' | 'electives';

// ============================================================
// CONSTANTS

const FAQ_DATA = [
  { q: "Phòng ban/ thầy cô nào phụ trách các vấn để học cùng lúc 2 chương trình đào tạo", a: "Thầy Sơn - Phòng Quản lý đào tạo NEU (Phòng 211- tòa A1)" },
  { q: "Cách thức và quy định đổi điểm học phần tương đương giữa 2 ngành", a: "Sinh viên trùng học phần tương đương ở ngành 1 có thể đổi điểm học phần đó sang ngành thứ 2. Học phần đã học bằng tiếng anh có thể đổi sang học phần tương đương học bằng tiếng việt, Học phần đã học bằng tiếng việt KHÔNG được đổi điểm sang cho học phần tương đương học bằng Tiếng Anh" },
  { q: "Sinh viên hệ liên kết tại NEU có được học song bằng hay không", a: "Không được đăng ký" },
  { q: "Học song bằng trong trường thì ngành 2 sinh viên có phải thi lại hay thi thêm 1 cuộc thi khác không", a: "Không cần thi lại và không có cuộc thi thêm, chỉ cần đáp ứng đủ điều kiện đăng ký học" },
  { q: "Làm thế nào để được chuyển điểm các học phần tương đương", a: "Sinh viên đối chiếu giữa 2 chương trình đào tạo đang theo học để biết môn có thể đổi điểm, với những Thời gian đăng ký: từ ngày 1 đến ngày 8 hàng tháng.\nMỗi lần điền form tương ứng với 1 môn.\nhttps://forms.office.com/r/kTDujpnQKq" },
  { q: "Đăng ký học ngành thứ 2 như thế nào ? Cần những thủ tục gì", a: "Sinh viên làm thủ tục đăng ký online trên website daihocchinhquy, cần scan hoặc chụp những tài liệu sau:\n1. Đơn viết tay có chữ ký của sinh viên\n2. Bảng điểm đăng ký tại bộ phận 1 cửa có dấu đỏ" },
  { q: "Nếu muốn đổi cả điểm GDTC thì làm như thế nào?", a: "Sinh viên có thể yêu cầu thể hiện điểm GDTC trên bảng điểm khi đăng ký tại bộ phận một cửa\n- Sinh viên chính đăng ký tại quầy 10\n- Sinh viên AEP đăng ký tại quầy 01\nHoặc đăng ký tại Viện đối với các chương trình đặc thù học bằng tiếng anh." },
  { q: "Với sinh viên học cùng lúc hai chương trình mỗi kỳ được đăng ký tối đa bao nhiêu tín", a: "Tổng 25 tín cho cả 2 ngành học (Trừ kỳ hè)" },
  { q: "Điều kiện để đăng ký học song bằng tại NEU", a: "Sinh viên hoàn thành năm học thứ nhất và thỏa mãn 1 trong 2 điều kiện:\n• Có điểm trung bình chung tích lũy đạt từ 2,5 trở lên và đáp ứng ngưỡng đảm bảo chất lượng của chương trình thứ hai trong năm tuyển sinh\n• Có điểm trung bình chung tích lũy đạt từ 2,0 đến 2,49 và đáp ứng điều kiện trúng tuyển của chương trình thứ hai trong năm tuyển sinh" },
  { q: "Một năm có bao nhiêu đợt đăng ký học song bằng?", a: "4 đợt/ năm" },
  { q: "Sinh viên song ngành có được cấp thẻ sinh viên học ngành 2 không?", a: "Sinh viên có thể đăng ký giấy xác nhận sinh viên ngành 2 tại quầy 10 bộ phận một cửa" },
  { q: "Đối với sinh viên học song ngành, sẽ có 2 lễ tốt nghiệp cho 2 ngành hay chỉ 1 lễ tốt nghiệp (chọn 1 trong 2 ngành để tổ chức lễ) thôi?", a: "Tùy theo sinh viên đăng ký xét tốt nghiệp chung hay riêng (nếu riêng thì vẫn dự 2 lễ tốt nghiệp cho 2 ngành)" },
  { q: "Những học phần chung đã học ở ngành 1 rồi nhưng do điểm thấp và có nhu cầu cải thiện GPA ở ngành 2 thì liệu sinh viên có thể không đăng kí chuyển điểm 2 học phần đó và đăng kí học bình thường tính vào GPA ngành 2 được không?", a: "Được" },
  { q: "Sinh viên trường khác có được đăng ký học song ngành tại NEU không?", a: "Không được" },
  { q: "Nếu học song bằng và bị trùng lịch thi thì phải giải quyết như thế nào?", a: "Trong trường hợp này, sinh viên chủ động cân nhắc xin hoãn thi môn ngành 1 (hoặc ngành 2) và sẽ thi lại môn đó vào kỳ thi phụ." },
  { q: "Sinh viên học song ngành có mong muốn được đổi sang ngành khác thì làm như thế nào?", a: "Sinh viên song ngành sau khi đăng ký thành công, trong quá trình học được chuyển ngành 1 lần duy nhất, với tinh thần đảm bảo đủ thời gian hoàn thành CTĐT của ngành 2 (6 năm từ khi vào học ngành 1)\nSinh viên có nhu cầu chuyển ngành làm đơn theo form gửi qua email cho Cô Giang - Phòng đào tạo.\nEmail: giangln@neu.edu.vn" },
  { q: "Sinh viên học song ngành thì có cần nộp lại chứng chỉ GDQP và chứng chỉ tin học ở ngành 2 không?", a: "Không cần" },
  { q: "Ngành học 1 có 1 học phần F thì sinh viên học lại ở ngành 2 rồi chuyển điểm ngược lại cho ngành 1 được không?", a: "Được" },
  { q: "Làm thế nào để biết mình đã chuyển đổi tín chỉ từ ngành 1 sang ngành 2 thành công?", a: "Sinh viên vào tài khoản trên daihocchinhquy kiểm tra phần kết quả học tập" },
  { q: "Sinh viên song ngành có được xét học bổng khuyến khích học tập ở ngành 2 không?", a: "Chỉ xét khen thưởng đối với ngành trúng tuyển đầu vào nếu người học học song ngành." },
  { q: "Sinh viên đã tốt nghiệp ngành 1 có được đăng ký tham gia NCKH liên quan đến ngành 2 không?", a: "Được phép tham gia NCKH" }
];

// ============================================================

// Default elective requirement — how many electives a student typically must pick per major
const DEFAULT_ELECTIVE_REQUIRED = 10;

// ============================================================
// PAGE COMPONENT
// ============================================================

export default function DoubleMajorPage() {
  const [major1, setMajor1] = useState<string>('');
  const [major2, setMajor2] = useState<string>('');
  const [activeTab, setActiveTab] = useState<TabType>('shared');

  // Track which elective subject codes the user has ticked (shared across both majors)
  const [selectedElectives, setSelectedElectives] = useState<Set<string>>(new Set());
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [showFaqTab, setShowFaqTab] = useState(false);

  // ---- Process major list: separate standard vs English programs ----
  const processedMajors = useMemo(() => {
    return (curriculumData as Major[])
      .filter(m => m.subjects && m.subjects.length > 0)
      .map(m => {
        const parts = m.majorName.split(/[-–—]/);
        const code = parts[parts.length - 1]?.trim() || '';
        const isStandard = !/[A-Za-z]/.test(code);
        return { ...m, isStandard };
      })
      .sort((a, b) => {
        if (a.isStandard === b.isStandard) return a.majorName.localeCompare(b.majorName);
        return a.isStandard ? -1 : 1;
      });
  }, []);

  // ---- Toggle elective selection ----
  const toggleElective = useCallback((code: string) => {
    setSelectedElectives(prev => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }, []);

  // ---- Reset selections when changing majors ----
  const handleMajor1Change = (val: string) => {
    setMajor1(val);
    setSelectedElectives(new Set());
    setActiveTab('shared');
  };
  const handleMajor2Change = (val: string) => {
    setMajor2(val);
    setSelectedElectives(new Set());
    setActiveTab('shared');
  };

  // ============================================================
  // CORE ANALYSIS: Compare 2 majors
  // ============================================================

  const analysis = useMemo(() => {
    if (!major1 || !major2 || major1 === major2) return null;

    const m1 = processedMajors.find(m => m.majorName === major1);
    const m2 = processedMajors.find(m => m.majorName === major2);
    if (!m1 || !m2) return null;

    // Deduplicate subjects by subjectCode
    const dedup = (subjects: Subject[]) =>
      Array.from(new Map(subjects.map(s => [s.subjectCode, s])).values());

    const m1AllSubjects = dedup(m1.subjects);
    const m2AllSubjects = dedup(m2.subjects);

    const m1Required = m1AllSubjects.filter(s => s.required);
    const m2Required = m2AllSubjects.filter(s => s.required);
    const m1Electives = m1AllSubjects.filter(s => !s.required);
    const m2Electives = m2AllSubjects.filter(s => !s.required);

    const m1ReqCodes = new Set(m1Required.map(s => s.subjectCode));
    const m2ReqCodes = new Set(m2Required.map(s => s.subjectCode));
    const m1ElecCodes = new Set(m1Electives.map(s => s.subjectCode));
    const m2ElecCodes = new Set(m2Electives.map(s => s.subjectCode));
    const m1AllCodes = new Set(m1AllSubjects.map(s => s.subjectCode));

    // --- Bắt buộc ---
    // Shared required: M2 required subjects that M1 also has as required
    const sharedRequired = m2Required.filter(s => m1ReqCodes.has(s.subjectCode));
    // Extra required: M2 required subjects that M1 does NOT have as required
    const extraRequired = m2Required.filter(s => !m1ReqCodes.has(s.subjectCode));

    // --- Tự chọn Ngành 2 ---
    // For each M2 elective, determine its "special" status:
    //   - isSharedElective: both M1 and M2 have it as elective
    //   - isM1Required: it's an elective in M2 but required in M1 (already learned!)
    const m2ElectivesAnnotated = m2Electives.map(s => ({
      ...s,
      isSharedElective: m1ElecCodes.has(s.subjectCode),
      isM1Required: m1ReqCodes.has(s.subjectCode),
      // "Special" = can be counted without extra effort
      isSpecial: m1ElecCodes.has(s.subjectCode) || m1ReqCodes.has(s.subjectCode),
    }));

    // --- Tự chọn Ngành 1 (for reference / tick) ---
    const m1ElectivesAnnotated = m1Electives.map(s => ({
      ...s,
      isSharedElective: m2ElecCodes.has(s.subjectCode),
      isM2Required: m2ReqCodes.has(s.subjectCode),
      isSpecial: m2ElecCodes.has(s.subjectCode) || m2ReqCodes.has(s.subjectCode),
    }));

    return {
      m1Name: m1.majorName,
      m2Name: m2.majorName,
      m1Required,
      m2Required,
      m1Electives: m1ElectivesAnnotated,
      m2Electives: m2ElectivesAnnotated,
      m1ReqCodes,
      m2ReqCodes,
      m1ElecCodes,
      m2ElecCodes,
      m1AllCodes,
      sharedRequired,
      extraRequired,
      totalM1Electives: m1Electives.length,
      totalM2Electives: m2Electives.length,
    };
  }, [major1, major2, processedMajors]);

  // ============================================================
  // DERIVED STATS: Depend on selectedElectives (real-time)
  // ============================================================

  const stats = useMemo(() => {
    if (!analysis) return null;

    // Count how many M2 electives the user has selected
    const selectedM2ElecCount = analysis.m2Electives.filter(
      s => selectedElectives.has(s.subjectCode)
    ).length;

    // How many M2 electives are "free" because they're M1 required (student already learned them)
    const m2ElecAlreadyKnown = analysis.m2Electives.filter(
      s => selectedElectives.has(s.subjectCode) && s.isM1Required
    ).length;

    // Extra electives = selected M2 electives that are NOT in M1's curriculum at all
    const extraElectiveCount = analysis.m2Electives.filter(
      s => selectedElectives.has(s.subjectCode) && !analysis.m1AllCodes.has(s.subjectCode)
    ).length;

    // M2 electives needed = min requirement. If user selected fewer, remaining are "needed"
    const m2ElecRequired = Math.min(DEFAULT_ELECTIVE_REQUIRED, analysis?.totalM2Electives || 0);
    const m2ElecStillNeeded = Math.max(0, extraElectiveCount);

    return {
      sharedReqCount: analysis.sharedRequired.length,
      sharedReqCredits: analysis.sharedRequired.reduce((s, c) => s + c.credits, 0),
      extraReqCount: analysis.extraRequired.length,
      extraReqCredits: analysis.extraRequired.reduce((s, c) => s + c.credits, 0),
      selectedM2ElecCount,
      extraElectiveCount,
      totalExtra: analysis.extraRequired.length + extraElectiveCount,
    };
  }, [analysis, selectedElectives]);

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <>
      {/* ===== FAQ MODAL ===== */}
        {showFaqTab && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative w-full max-w-3xl max-h-[85vh] bg-background border border-foreground/10 rounded-2xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-300">
              <div className="flex items-center justify-between p-6 border-b border-foreground/10">
                <h3 className="text-xl font-bold text-yellow-500 flex items-center gap-2">
                  <HelpCircle size={24} />
                  Những câu hỏi thường gặp
                </h3>
                <button 
                  onClick={() => setShowFaqTab(false)}
                  className="p-2 rounded-full hover:bg-foreground/10 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-3">
                {FAQ_DATA.map((faq, idx) => (
                  <div 
                    key={idx} 
                    className="flex-shrink-0 bg-foreground/5 border border-foreground/10 rounded-xl overflow-hidden transition-all duration-300 hover:bg-foreground/10"
                  >
                    <button 
                      className="w-full text-left p-4 flex justify-between items-center gap-4 focus:outline-none"
                      onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                    >
                      <span className="font-medium text-foreground/90 leading-snug pr-4">{idx + 1}. {faq.q}</span>
                      <span className="flex-shrink-0 text-foreground/50 transition-transform duration-300">
                        {openFaqIndex === idx ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </span>
                    </button>
                    
                    <div 
                      className={clsx(
                        "overflow-hidden transition-all duration-300 ease-in-out",
                        openFaqIndex === idx ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
                      )}
                    >
                      <div className="p-4 pt-0 text-foreground/70 text-sm whitespace-pre-wrap mt-2">
                        <div className="pt-3 border-t border-foreground/10">
                          {faq.a}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      {/* ===== HEADER: Chọn ngành ===== */}
      <div className="glass-panel p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="text-brand-cyan" />
            Kế hoạch Học Song Ngành
          </h1>
          <button
            onClick={() => setShowFaqTab(!showFaqTab)}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-medium text-sm border",
              showFaqTab 
                ? "bg-yellow-500/20 text-yellow-500 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.2)]" 
                : "bg-yellow-500/5 text-yellow-500/80 border-yellow-500/20 hover:bg-yellow-500/10 hover:text-yellow-500"
            )}
          >
            <HelpCircle size={18} />
            FAQ - Giải đáp
          </button>
        </div>
        <p className="opacity-70 mb-6 max-w-4xl text-sm leading-relaxed">
          So sánh chương trình đào tạo giữa 2 ngành, tìm các môn trùng nhau (được miễn) và tính toán
          số môn cần học thêm. Tick chọn các môn tự chọn ở Tab 3 để xem cập nhật <strong>real-time</strong>.
        </p>


        

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2 opacity-80">
              Ngành 1 <span className="text-brand-cyan">(Ngành đang học)</span>
            </label>
            <select
              className="w-full bg-background/50 border border-border rounded-xl p-3 outline-none focus:border-brand-cyan/50"
              value={major1}
              onChange={e => handleMajor1Change(e.target.value)}
            >
              <option value="">-- Chọn ngành chính --</option>
              {processedMajors.map(m => (
                <option key={m.majorName} value={m.majorName} disabled={!m.isStandard}>
                  {m.majorName} {!m.isStandard ? '(Hệ Tiếng Anh — Sắp cập nhật)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 opacity-80">
              Ngành 2 <span className="text-brand-violet">(Ngành muốn học thêm)</span>
            </label>
            <select
              className="w-full bg-background/50 border border-border rounded-xl p-3 outline-none focus:border-brand-violet/50"
              value={major2}
              onChange={e => handleMajor2Change(e.target.value)}
            >
              <option value="">-- Chọn ngành học thêm --</option>
              {processedMajors.map(m => (
                <option key={m.majorName} value={m.majorName} disabled={!m.isStandard}>
                  {m.majorName} {!m.isStandard ? '(Hệ Tiếng Anh — Sắp cập nhật)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Warning: same major */}
      {major1 && major2 && major1 === major2 && (
        <div className="glass-panel p-4 border-orange-500/30 bg-orange-500/10 text-orange-500 flex items-center gap-3">
          <AlertCircle />
          <span>Vui lòng chọn 2 ngành khác nhau để phân tích!</span>
        </div>
      )}

      {/* ===== ANALYSIS RESULTS ===== */}
      {analysis && stats && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* ===== KHU VỰC TỔNG QUAN: 3 ô + dòng tổng ===== */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Ô 1: Môn bắt buộc trùng */}
            <div className="glass-card p-6 border-green-500/20 bg-green-500/5 relative overflow-hidden">
              <CheckCircle className="absolute right-[-16px] bottom-[-16px] w-28 h-28 text-green-500/10" />
              <p className="text-sm opacity-80 mb-1 font-medium">Bắt buộc trùng nhau</p>
              <p className="text-xs opacity-60 mb-3">Được miễn học</p>
              <div className="flex items-end gap-2">
                <p className="text-5xl font-bold text-green-500">{stats?.sharedReqCount || 0}</p>
                <p className="text-lg opacity-70 mb-1">môn</p>
              </div>
              <p className="text-sm opacity-60 mt-2">{stats.sharedReqCredits} tín chỉ</p>
            </div>

            {/* Ô 2: Bắt buộc cần học thêm */}
            <div className="glass-card p-6 border-brand-cyan/20 bg-brand-cyan/5 relative overflow-hidden">
              <ArrowRight className="absolute right-[-16px] bottom-[-16px] w-28 h-28 text-brand-cyan/10" />
              <p className="text-sm opacity-80 mb-1 font-medium">Bắt buộc cần học thêm</p>
              <p className="text-xs opacity-60 mb-3">Môn bắt buộc của Ngành 2</p>
              <div className="flex items-end gap-2">
                <p className="text-5xl font-bold text-brand-cyan">{stats?.extraReqCount || 0}</p>
                <p className="text-lg opacity-70 mb-1">môn</p>
              </div>
              <p className="text-sm opacity-60 mt-2">{stats.extraReqCredits} tín chỉ</p>
            </div>

            {/* Ô 3: Tự chọn cần học thêm (real-time) */}
            <div className="glass-card p-6 border-brand-violet/20 bg-brand-violet/5 relative overflow-hidden">
              <Plus className="absolute right-[-16px] bottom-[-16px] w-28 h-28 text-brand-violet/10" />
              <p className="text-sm opacity-80 mb-1 font-medium">Tự chọn cần học thêm</p>
              <p className="text-xs opacity-60 mb-3">Tick chọn ở Tab 3 để cập nhật</p>
              <div className="flex items-end gap-2">
                <p className="text-5xl font-bold text-brand-violet transition-all duration-300">
                  {stats?.extraElectiveCount || 0}
                </p>
                <p className="text-lg opacity-70 mb-1">môn</p>
              </div>
              <p className="text-sm opacity-60 mt-2">
                Đã chọn {stats.selectedM2ElecCount}/{analysis?.totalM2Electives || 0} tự chọn Ngành 2
              </p>
            </div>
          </div>

          {/* Dòng tổng kết nổi bật */}
          <div className="glass-panel p-5 flex flex-col sm:flex-row items-center justify-between gap-4 border-foreground/30">
            <div className="flex items-center gap-3">
              <Sparkles className="text-amber-400" size={28} />
              <div>
                <p className="text-sm text-foreground/70">Tổng số môn cần học thêm cho Ngành 2</p>
                <p className="text-xs text-foreground/50">(Bắt buộc + Tự chọn mới)</p>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan to-brand-violet transition-all duration-300">
                {stats.totalExtra}
              </span>
              <span className="text-xl text-foreground/60 font-medium">môn</span>
            </div>
          </div>

        </div>
      )}


      {/* ===== KHU VỰC CHI TIẾT: 4 Tabs ===== */}
      <div className="glass-panel overflow-hidden mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Tab Headers */}
        <div className="flex border-b border-border/50 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('shared')}
            className={clsx(
              'flex items-center gap-2 px-6 py-4 font-medium transition-colors border-b-2 whitespace-nowrap text-sm',
              activeTab === 'shared'
                ? 'border-green-500 text-green-500 bg-green-500/5'
                : 'border-transparent opacity-70 hover:opacity-100 hover:bg-foreground/5'
            )}
          >
            Tab 1: Bắt buộc trùng nhau
            <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-500 text-xs font-bold">
              {stats?.sharedReqCount || 0}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('required_extra')}
            className={clsx(
              'flex items-center gap-2 px-6 py-4 font-medium transition-colors border-b-2 whitespace-nowrap text-sm',
              activeTab === 'required_extra'
                ? 'border-brand-cyan text-brand-cyan bg-brand-cyan/5'
                : 'border-transparent opacity-70 hover:opacity-100 hover:bg-foreground/5'
            )}
          >
            Tab 2: Bắt buộc học thêm
            <span className="px-2 py-0.5 rounded-full bg-brand-cyan/20 text-brand-cyan text-xs font-bold">
              {stats?.extraReqCount || 0}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('electives')}
            className={clsx(
              'flex items-center gap-2 px-6 py-4 font-medium transition-colors border-b-2 whitespace-nowrap text-sm',
              activeTab === 'electives'
                ? 'border-brand-violet text-brand-violet bg-brand-violet/5'
                : 'border-transparent opacity-70 hover:opacity-100 hover:bg-foreground/5'
            )}
          >
            Tab 3: Chọn môn tự chọn
            <span className="px-2 py-0.5 rounded-full bg-brand-violet/20 text-brand-violet text-xs font-bold">
              {stats?.extraElectiveCount || 0} thêm
            </span>
          </button>
          
        </div>

        {/* Tab Contents */}
        <div className="p-6">

          {/* ===== TAB 1: BẮT BUỘC TRÙNG NHAU ===== */}
          {activeTab === 'shared' && (
            <div className="animate-in fade-in duration-300">
              {!analysis ? (
                <div className="py-12 text-center flex flex-col items-center opacity-60">
                  <Info size={40} className="mb-4 text-foreground/50" />
                  <p>Vui lòng chọn đủ 2 ngành học để xem danh sách môn.</p>
                </div>
              ) : (
                <div className="tab-inner-content">
                  <h3 className="text-lg font-semibold mb-1 text-green-500">
                    Môn bắt buộc trùng nhau giữa 2 ngành
                  </h3>
                  <p className="text-sm opacity-70 mb-4">
                    Các môn <strong>bắt buộc</strong> này bạn chỉ cần học 1 lần ở Ngành 1 là được tính cho cả Ngành 2. Không bao gồm môn tự chọn.
                  </p>

                  {analysis.sharedRequired.length === 0 ? (
                    <p className="opacity-50 text-sm py-8 text-center">Không có môn bắt buộc nào trùng nhau giữa 2 ngành.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-2">
                      {analysis.sharedRequired.map((s, i) => (
                        <div key={`shared-${i}`} className="p-3 bg-background/50 rounded-lg border border-green-500/20 text-sm flex justify-between items-center">
                          <div>
                            <p className="font-medium text-green-500">{s.name}</p>
                            <p className="opacity-60 text-xs">{s.subjectCode} • {s.knowledgeBlock}</p>
                          </div>
                          <span className="font-bold opacity-70 whitespace-nowrap">{s.credits} TC</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ===== TAB 2: BẮT BUỘC HỌC THÊM ===== */}
          {activeTab === 'required_extra' && (
            <div className="animate-in fade-in duration-300">
              {!analysis ? (
                <div className="py-12 text-center flex flex-col items-center opacity-60">
                  <Info size={40} className="mb-4 text-foreground/50" />
                  <p>Vui lòng chọn đủ 2 ngành học để xem danh sách môn.</p>
                </div>
              ) : (
                <div className="tab-inner-content">
                  <h3 className="text-lg font-semibold mb-1 text-brand-cyan">
                    Môn bắt buộc cần học thêm ở Ngành 2
                  </h3>
                  <p className="text-sm opacity-70 mb-4">
                    Đây là các môn bắt buộc của Ngành 2 mà Ngành 1 <strong>không có</strong>. Bạn bắt buộc phải học tất cả các môn này.
                  </p>

                  {analysis.extraRequired.length === 0 ? (
                    <p className="opacity-50 text-sm py-8 text-center">Không có môn bắt buộc nào phải học thêm.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-2">
                      {analysis.extraRequired.map((s, i) => (
                        <div key={`extra-${i}`} className="p-3 bg-background/50 rounded-lg border border-border/50 text-sm flex justify-between items-center">
                          <div>
                            <p className="font-medium">{s.name}</p>
                            <p className="opacity-60 text-xs">{s.subjectCode} • {s.knowledgeBlock}</p>
                          </div>
                          <span className="font-bold opacity-70 whitespace-nowrap">{s.credits} TC</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ===== TAB 3: CHỌN MÔN TỰ CHỌN ===== */}
          {activeTab === 'electives' && (
            <div className="animate-in fade-in duration-300">
              {!analysis ? (
                <div className="py-12 text-center flex flex-col items-center opacity-60">
                  <Info size={40} className="mb-4 text-foreground/50" />
                  <p>Vui lòng chọn đủ 2 ngành học để xem danh sách môn.</p>
                </div>
              ) : (
                <div className="tab-inner-content">
                  {/* Hướng dẫn */}
                  <div className="mb-6 p-4 rounded-xl bg-brand-violet/5 border border-brand-violet/20">
                    <div className="flex items-start gap-2">
                      <Info size={16} className="mt-0.5 flex-shrink-0 text-brand-violet" />
                      <div className="text-sm text-foreground/80 space-y-1">
                        <p>
                          <strong>Hướng dẫn:</strong> Tick chọn các môn tự chọn bạn muốn học cho <strong>mỗi ngành</strong>.
                          Các con số ở khu vực Tổng quan sẽ cập nhật <strong>real-time</strong>.
                        </p>
                        <div className="flex flex-wrap gap-3 mt-2 text-xs">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            <Star size={12} /> Trùng tự chọn 2 ngành
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                            <CheckCircle size={12} /> Tự chọn ngành này = Bắt buộc ngành kia
                          </span>
                          <span className="text-foreground/50"> Ưu tiên tick các môn này để tối ưu!</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Cột Ngành 1 */}
                    <div>
                      <h4 className="font-semibold mb-4 flex items-center justify-between">
                        <span className="text-green-500">Tự chọn Ngành 1</span>
                        <span className="text-xs font-normal opacity-60 bg-foreground/5 px-2 py-1 rounded-full">
                          Đã tick {analysis?.m1Electives.filter(s => selectedElectives.has(s.subjectCode)).length || 0}/{analysis?.totalM1Electives || 0}
                        </span>
                      </h4>
                      <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto pr-2">
                        {analysis.m1Electives.map((s, i) => {
                          const isSelected = selectedElectives.has(s.subjectCode);
                          const isSharedElec = s.isSharedElective;
                          const isM2Req = s.isM2Required;
                          const isHighlighted = isSharedElec || isM2Req;

                          return (
                            <label
                              key={`m1e-${i}`}
                              className={clsx(
                                'p-3 rounded-lg border text-sm flex items-center gap-3 transition-all cursor-pointer',
                                isSelected && isHighlighted && 'bg-amber-500/15 border-amber-500/40',
                                isSelected && !isHighlighted && 'bg-brand-violet/10 border-brand-violet/30',
                                !isSelected && isHighlighted && 'bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10',
                                !isSelected && !isHighlighted && 'bg-background/50 border-border/50 hover:bg-foreground/5',
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleElective(s.subjectCode)}
                                className="w-4 h-4 rounded accent-brand-violet flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className={clsx(
                                    'font-medium',
                                    isHighlighted && 'text-amber-400',
                                  )}>
                                    {s.name}
                                  </p>
                                  {isSharedElec && (
                                    <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 whitespace-nowrap">
                                      <Star size={10} /> Trùng TC
                                    </span>
                                  )}
                                  {isM2Req && (
                                    <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 whitespace-nowrap">
                                      <CheckCircle size={10} /> BB Ngành 2
                                    </span>
                                  )}
                                </div>
                                <p className="opacity-60 text-xs">{s.subjectCode}</p>
                              </div>
                              <span className="font-bold opacity-70 whitespace-nowrap">{s.credits} TC</span>
                            </label>
                          );
                        })}
                        {analysis.m1Electives.length === 0 && (
                          <p className="text-sm opacity-50 text-center py-8">Ngành 1 không có môn tự chọn.</p>
                        )}
                      </div>
                    </div>

                    {/* Cột Ngành 2 */}
                    <div>
                      <h4 className="font-semibold mb-4 flex items-center justify-between">
                        <span className="text-brand-violet">Tự chọn Ngành 2</span>
                        <span className="text-xs font-normal opacity-60 bg-foreground/5 px-2 py-1 rounded-full">
                          Đã tick {stats?.selectedM2ElecCount || 0}/{analysis?.totalM2Electives || 0}
                        </span>
                      </h4>
                      <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto pr-2">
                        {analysis.m2Electives.map((s, i) => {
                          const isSelected = selectedElectives.has(s.subjectCode);
                          const isSharedElec = s.isSharedElective;
                          const isM1Req = s.isM1Required;
                          const isHighlighted = isSharedElec || isM1Req;

                          return (
                            <label
                              key={`m2e-${i}`}
                              className={clsx(
                                'p-3 rounded-lg border text-sm flex items-center gap-3 transition-all cursor-pointer',
                                isSelected && isHighlighted && 'bg-amber-500/15 border-amber-500/40',
                                isSelected && !isHighlighted && 'bg-brand-violet/10 border-brand-violet/30',
                                !isSelected && isHighlighted && 'bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10',
                                !isSelected && !isHighlighted && 'bg-background/50 border-border/50 hover:bg-foreground/5',
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleElective(s.subjectCode)}
                                className="w-4 h-4 rounded accent-brand-violet flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className={clsx(
                                    'font-medium',
                                    isHighlighted && 'text-amber-400',
                                  )}>
                                    {s.name}
                                  </p>
                                  {isSharedElec && (
                                    <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 whitespace-nowrap">
                                      <Star size={10} /> Trùng TC
                                    </span>
                                  )}
                                  {isM1Req && (
                                    <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 whitespace-nowrap">
                                      <CheckCircle size={10} /> BB Ngành 1
                                    </span>
                                  )}
                                </div>
                                <p className="opacity-60 text-xs">{s.subjectCode}</p>
                              </div>
                              <span className="font-bold opacity-70 whitespace-nowrap">{s.credits} TC</span>
                            </label>
                          );
                        })}
                        {analysis.m2Electives.length === 0 && (
                          <p className="text-sm opacity-50 text-center py-8">Ngành 2 không có môn tự chọn.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          </div>
      </div>
    </div>
    </>
  );
}