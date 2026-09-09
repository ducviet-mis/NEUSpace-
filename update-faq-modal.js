const fs = require('fs');
const path = 'C:/Users/Admin/.gemini/antigravity/scratch/neu-student-utility/src/app/double-major/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Fix FAQ_DATA
const oldFaqDataRegex = /const FAQ_DATA = \[[\s\S]*?\];/;
const newFaqData = `const FAQ_DATA = [
  { q: "Phòng ban/ thầy cô nào phụ trách các vấn để học cùng lúc 2 chương trình đào tạo", a: "Thầy Sơn - Phòng Quản lý đào tạo NEU (Phòng 211- tòa A1)" },
  { q: "Cách thức và quy định đổi điểm học phần tương đương giữa 2 ngành", a: "Sinh viên trùng học phần tương đương ở ngành 1 có thể đổi điểm học phần đó sang ngành thứ 2. Học phần đã học bằng tiếng anh có thể đổi sang học phần tương đương học bằng tiếng việt, Học phần đã học bằng tiếng việt KHÔNG được đổi điểm sang cho học phần tương đương học bằng Tiếng Anh" },
  { q: "Sinh viên hệ liên kết tại NEU có được học song bằng hay không", a: "Không được đăng ký" },
  { q: "Học song bằng trong trường thì ngành 2 sinh viên có phải thi lại hay thi thêm 1 cuộc thi khác không", a: "Không cần thi lại và không có cuộc thi thêm, chỉ cần đáp ứng đủ điều kiện đăng ký học" },
  { q: "Làm thế nào để được chuyển điểm các học phần tương đương", a: "Sinh viên đối chiếu giữa 2 chương trình đào tạo đang theo học để biết môn có thể đổi điểm, với những Thời gian đăng ký: từ ngày 1 đến ngày 8 hàng tháng.\\nMỗi lần điền form tương ứng với 1 môn.\\nhttps://forms.office.com/r/kTDujpnQKq" },
  { q: "Đăng ký học ngành thứ 2 như thế nào ? Cần những thủ tục gì", a: "Sinh viên làm thủ tục đăng ký online trên website daihocchinhquy, cần scan hoặc chụp những tài liệu sau:\\n1. Đơn viết tay có chữ ký của sinh viên\\n2. Bảng điểm đăng ký tại bộ phận 1 cửa có dấu đỏ" },
  { q: "Nếu muốn đổi cả điểm GDTC thì làm như thế nào?", a: "Sinh viên có thể yêu cầu thể hiện điểm GDTC trên bảng điểm khi đăng ký tại bộ phận một cửa\\n- Sinh viên chính đăng ký tại quầy 10\\n- Sinh viên AEP đăng ký tại quầy 01\\nHoặc đăng ký tại Viện đối với các chương trình đặc thù học bằng tiếng anh." },
  { q: "Với sinh viên học cùng lúc hai chương trình mỗi kỳ được đăng ký tối đa bao nhiêu tín", a: "Tổng 25 tín cho cả 2 ngành học (Trừ kỳ hè)" },
  { q: "Điều kiện để đăng ký học song bằng tại NEU", a: "Sinh viên hoàn thành năm học thứ nhất và thỏa mãn 1 trong 2 điều kiện:\\n• Có điểm trung bình chung tích lũy đạt từ 2,5 trở lên và đáp ứng ngưỡng đảm bảo chất lượng của chương trình thứ hai trong năm tuyển sinh\\n• Có điểm trung bình chung tích lũy đạt từ 2,0 đến 2,49 và đáp ứng điều kiện trúng tuyển của chương trình thứ hai trong năm tuyển sinh" },
  { q: "Một năm có bao nhiêu đợt đăng ký học song bằng?", a: "4 đợt/ năm" },
  { q: "Sinh viên song ngành có được cấp thẻ sinh viên học ngành 2 không?", a: "Sinh viên có thể đăng ký giấy xác nhận sinh viên ngành 2 tại quầy 10 bộ phận một cửa" },
  { q: "Đối với sinh viên học song ngành, sẽ có 2 lễ tốt nghiệp cho 2 ngành hay chỉ 1 lễ tốt nghiệp (chọn 1 trong 2 ngành để tổ chức lễ) thôi?", a: "Tùy theo sinh viên đăng ký xét tốt nghiệp chung hay riêng (nếu riêng thì vẫn dự 2 lễ tốt nghiệp cho 2 ngành)" },
  { q: "Những học phần chung đã học ở ngành 1 rồi nhưng do điểm thấp và có nhu cầu cải thiện GPA ở ngành 2 thì liệu sinh viên có thể không đăng kí chuyển điểm 2 học phần đó và đăng kí học bình thường tính vào GPA ngành 2 được không?", a: "Được" },
  { q: "Sinh viên trường khác có được đăng ký học song ngành tại NEU không?", a: "Không được" },
  { q: "Nếu học song bằng và bị trùng lịch thi thì phải giải quyết như thế nào?", a: "Trong trường hợp này, sinh viên chủ động cân nhắc xin hoãn thi môn ngành 1 (hoặc ngành 2) và sẽ thi lại môn đó vào kỳ thi phụ." },
  { q: "Sinh viên học song ngành có mong muốn được đổi sang ngành khác thì làm như thế nào?", a: "Sinh viên song ngành sau khi đăng ký thành công, trong quá trình học được chuyển ngành 1 lần duy nhất, với tinh thần đảm bảo đủ thời gian hoàn thành CTĐT của ngành 2 (6 năm từ khi vào học ngành 1)\\nSinh viên có nhu cầu chuyển ngành làm đơn theo form gửi qua email cho Cô Giang - Phòng đào tạo.\\nEmail: giangln@neu.edu.vn" },
  { q: "Sinh viên học song ngành thì có cần nộp lại chứng chỉ GDQP và chứng chỉ tin học ở ngành 2 không?", a: "Không cần" },
  { q: "Ngành học 1 có 1 học phần F thì sinh viên học lại ở ngành 2 rồi chuyển điểm ngược lại cho ngành 1 được không?", a: "Được" },
  { q: "Làm thế nào để biết mình đã chuyển đổi tín chỉ từ ngành 1 sang ngành 2 thành công?", a: "Sinh viên vào tài khoản trên daihocchinhquy kiểm tra phần kết quả học tập" },
  { q: "Sinh viên song ngành có được xét học bổng khuyến khích học tập ở ngành 2 không?", a: "Chỉ xét khen thưởng đối với ngành trúng tuyển đầu vào nếu người học học song ngành." },
  { q: "Sinh viên đã tốt nghiệp ngành 1 có được đăng ký tham gia NCKH liên quan đến ngành 2 không?", a: "Được phép tham gia NCKH" }
];`;
content = content.replace(oldFaqDataRegex, newFaqData);

// 2. Import X from lucide-react
content = content.replace(
  "import { BookOpen, CheckCircle, AlertCircle, ArrowRight, Plus, Star, Info, Sparkles, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';",
  "import { BookOpen, CheckCircle, AlertCircle, ArrowRight, Plus, Star, Info, Sparkles, HelpCircle, ChevronDown, ChevronUp, X } from 'lucide-react';"
);

// 3. Replace the FAQ panel with Modal
const oldFaqPanelRegex = /\{\/\* ===== FAQ PANEL ===== \*\/\}[\s\S]*?\{showFaqTab && \([\s\S]*?<\/div>\s*?\)\s*?\}/;
const newFaqModal = `{/* ===== FAQ MODAL ===== */}
        {showFaqTab && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
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
        )}`;

content = content.replace(oldFaqPanelRegex, newFaqModal);

fs.writeFileSync(path, content);
console.log("FAQ updated to modal with fix text!");
