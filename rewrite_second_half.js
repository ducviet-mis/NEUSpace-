const fs = require('fs');
const path = 'C:/Users/Admin/.gemini/antigravity/scratch/neu-student-utility/src/app/double-major/page.tsx';
let firstHalf = fs.readFileSync('C:/Users/Admin/.gemini/antigravity/scratch/neu-student-utility/page_first_half.txt', 'utf8');

const secondHalf = `
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
          <button
            onClick={() => setActiveTab('faq')}
            className={clsx(
              'flex items-center gap-2 px-6 py-4 font-medium transition-colors border-b-2 whitespace-nowrap text-sm',
              activeTab === 'faq'
                ? 'border-yellow-500 text-yellow-500 bg-yellow-500/5'
                : 'border-transparent opacity-70 hover:opacity-100 hover:bg-foreground/5'
            )}
          >
            <HelpCircle size={18} />
            FAQ - Giải đáp song ngành
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
                        <div key={\`shared-\${i}\`} className="p-3 bg-background/50 rounded-lg border border-green-500/20 text-sm flex justify-between items-center">
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
                        <div key={\`extra-\${i}\`} className="p-3 bg-background/50 rounded-lg border border-border/50 text-sm flex justify-between items-center">
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
                          Đã tick {stats?.selectedM1ElecCount || 0}/{analysis?.totalM1Electives || 0}
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
                              key={\`m1e-\${i}\`}
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
                              key={\`m2e-\${i}\`}
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

          {/* ===== TAB 4: FAQ ===== */}
          {activeTab === 'faq' && (
            <div className="animate-in fade-in duration-300">
              <h3 className="text-xl font-bold mb-6 text-yellow-500 flex items-center gap-2">
                <HelpCircle size={24} />
                Những câu hỏi thường gặp về Học Song Bằng / Song Ngành
              </h3>
              <div className="flex flex-col gap-3">
                {FAQ_DATA.map((faq, idx) => (
                  <div 
                    key={idx} 
                    className="bg-foreground/5 border border-foreground/10 rounded-2xl overflow-hidden transition-all duration-300 hover:bg-foreground/10"
                  >
                    <button 
                      className="w-full text-left p-4 flex justify-between items-center gap-4 focus:outline-none"
                      onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                    >
                      <span className="font-semibold text-foreground/90 leading-tight pr-4">{idx + 1}. {faq.q}</span>
                      <span className="flex-shrink-0 text-foreground/50 transition-transform duration-300">
                        {openFaqIndex === idx ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </span>
                    </button>
                    
                    <div 
                      className={clsx(
                        "overflow-hidden transition-all duration-300 ease-in-out",
                        openFaqIndex === idx ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
                      )}
                    >
                      <div className="p-4 pt-0 text-foreground/70 text-sm whitespace-pre-wrap mt-2">
                        <div className="pt-4 border-t border-foreground/10">
                          {faq.a}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
`;

fs.writeFileSync(path, firstHalf + '\n' + secondHalf);
console.log("Written successfully!");
