const fs = require('fs');
const path = 'C:/Users/Admin/.gemini/antigravity/scratch/neu-student-utility/src/app/double-major/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Update TabType
content = content.replace(
  "type TabType = 'shared' | 'required_extra' | 'electives' | 'faq';",
  "type TabType = 'shared' | 'required_extra' | 'electives';"
);

// 2. Add showFaqTab state
content = content.replace(
  "const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);",
  "const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);\n  const [showFaqTab, setShowFaqTab] = useState(false);"
);

// 3. Update the Header and add the FAQ section
const oldHeader = `<h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <BookOpen className="text-brand-cyan" />
          Kế hoạch Học Song Ngành
        </h1>
        <p className="opacity-70 mb-6 max-w-4xl text-sm leading-relaxed">
          So sánh chương trình đào tạo giữa 2 ngành, tìm các môn trùng nhau (được miễn) và tính toán
          số môn cần học thêm. Tick chọn các môn tự chọn ở Tab 3 để xem cập nhật <strong>real-time</strong>.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">`;

const faqSection = `
        {/* ===== FAQ PANEL ===== */}
        {showFaqTab && (
          <div className="mb-6 p-6 rounded-2xl border border-yellow-500/20 bg-background/80 shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
            <h3 className="text-lg font-bold mb-4 text-yellow-500 flex items-center gap-2 border-b border-foreground/10 pb-4">
              <HelpCircle size={20} />
              Những câu hỏi thường gặp
            </h3>
            <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-2">
              {FAQ_DATA.map((faq, idx) => (
                <div 
                  key={idx} 
                  className="bg-foreground/5 border border-foreground/10 rounded-xl overflow-hidden transition-all duration-300 hover:bg-foreground/10"
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
        )}`;

const newHeader = `<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
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

${faqSection}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">`;

content = content.replace(oldHeader, newHeader);

// 4. Remove FAQ button from Tabs
const faqTabButtonRegex = /<button\s+onClick=\{\(\) => setActiveTab\('faq'\)\}[\s\S]*?<\/button>/;
content = content.replace(faqTabButtonRegex, '');

// 5. Remove FAQ panel from bottom
const faqPanelRegex = /\{\/\* ===== TAB 4: FAQ ===== \*\/\}[\s\S]*?activeTab === 'faq' && \([\s\S]*?<h3[\s\S]*?<\/h3>[\s\S]*?<\/div>\s*?\)\s*?\}/;
// Because Regex can be tricky with deeply nested divs, let's locate the exact string block
// We can just use split since we know it's at the end of the file.

const tab4Start = "{/* ===== TAB 4: FAQ ===== */}";
const splitContent = content.split(tab4Start);
if (splitContent.length > 1) {
  // we know TAB 4 is the last tab before the closing </div></div></div>
  // Let's find the closing `)}` of `activeTab === 'faq'`
  const afterTab4 = splitContent[1];
  
  // A safe way to remove it is to replace everything from {/ * ===== TAB 4 to the end of the tabs wrapper
  // Let's just find `</div>\n      </div>\n    </div>\n  );\n}` and keep it
  const endMarker = '</div>\n      </div>\n    </div>\n  );\n}';
  content = splitContent[0] + endMarker;
}

fs.writeFileSync(path, content);
console.log("FAQ moved to header!");
