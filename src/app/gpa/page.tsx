'use client';

import React, { useState, useMemo } from 'react';
import { Calculator, Plus, Trash2, Award, Info, BarChart2, BookOpen } from 'lucide-react';
import { calculateGPA, convertScore, roundNeuFinalScore, roundNeuTestScore } from '@/utils/neuLogic';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import type { TooltipContentProps } from 'recharts';

interface ScoreEntry {
  id: string;
  name: string;
  credits: number;
  score10: string; // Điểm chuyên cần (10%)
  score40: string; // Điểm giữa kỳ (40%)
  score50: string; // Điểm cuối kỳ (50%)
}

type ChartMetric = 'gpa10' | 'gpa4';

type ScoreChartCourse = {
  fullName: string;
  letter: string;
  gpa10: number;
  gpa4: number;
};

export default function GPACalculatorPage() {
  const [entries, setEntries] = useState<ScoreEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [chartMetric, setChartMetric] = useState<ChartMetric>('gpa10');

  React.useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const saved = localStorage.getItem('gpa_entries');
      if (saved) {
        try {
          setEntries(JSON.parse(saved));
        } catch {}
      }
      setIsLoaded(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  React.useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('gpa_entries', JSON.stringify(entries));
    }
  }, [entries, isLoaded]);

  const addEntry = () => {
    setEntries([...entries, { 
      id: Date.now().toString(), name: '', credits: 3, score10: '', score40: '', score50: ''
    }]);
  };

  const removeEntry = (id: string) => {
    setEntries(entries.filter(e => e.id !== id));
  };

  const updateEntry = (id: string, field: keyof ScoreEntry, value: string | number) => {
    setEntries(entries.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  // Tính điểm tổng kết của 1 môn
  const calculateSubjectFinal = (entry: ScoreEntry) => {
    const s10 = Number(entry.score10);
    const s40 = Number(entry.score40);
    const s50Raw = Number(entry.score50);

    if (isNaN(s10) || isNaN(s40) || isNaN(s50Raw) || entry.score10 === '' || entry.score40 === '' || entry.score50 === '') {
      return null;
    }

    // Luôn áp dụng làm tròn trắc nghiệm cho điểm cuối kỳ
    const s50 = roundNeuTestScore(s50Raw);

    // Tính tổng: 10% + 40% + 50%
    const rawTotal = (s10 * 0.1) + (s40 * 0.4) + (s50 * 0.5);

    // Làm tròn tổng kết môn theo mốc 0.05
    return roundNeuFinalScore(rawTotal);
  };

  const results = useMemo(() => {
    const validCourses = entries
      .map(e => ({
        credits: e.credits,
        finalScore: calculateSubjectFinal(e)
      }))
      .filter(e => e.finalScore !== null && e.credits > 0)
      .map(e => ({
        credits: e.credits,
        score10: e.finalScore as number
      }));

    return calculateGPA(validCourses);
  }, [entries]);

  // Chỉ đưa các môn đã có đủ điểm vào phần thống kê.
  const chartData = useMemo(() => {
    return entries.flatMap(e => {
      const finalScore = calculateSubjectFinal(e);
      if (finalScore === null) return [];

      const converted = convertScore(finalScore);
      const fullName = e.name.trim() || 'Môn học chưa đặt tên';
      const shortName = fullName.length > 18 ? `${fullName.substring(0, 18)}…` : fullName;
      return [{
        name: shortName,
        fullName,
        letter: converted.letter,
        gpa10: Number(finalScore.toFixed(2)),
        gpa4: converted.score4,
      }];
    });
  }, [entries]);

  const bestCourse = useMemo(
    () => chartData.reduce<typeof chartData[number] | null>((best, course) => !best || course.gpa10 > best.gpa10 ? course : best, null),
    [chartData]
  );

  const scoreDistribution = useMemo(() => [
    { label: 'Xuất sắc', range: '≥ 8.5', count: chartData.filter(course => course.gpa10 >= 8.5).length, tone: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Khá / Giỏi', range: '7.0–8.4', count: chartData.filter(course => course.gpa10 >= 7 && course.gpa10 < 8.5).length, tone: 'text-cyan-700 dark:text-cyan-300' },
    { label: 'Đạt', range: '5.5–6.9', count: chartData.filter(course => course.gpa10 >= 5.5 && course.gpa10 < 7).length, tone: 'text-amber-700 dark:text-amber-300' },
    { label: 'Cần cải thiện', range: '< 5.5', count: chartData.filter(course => course.gpa10 < 5.5).length, tone: 'text-rose-700 dark:text-rose-300' },
  ], [chartData]);

  const chartConfig = chartMetric === 'gpa10'
    ? { key: 'gpa10' as const, label: 'Điểm hệ 10', domain: [0, 10] as [number, number], color: '#06b6d4', unit: '/10' }
    : { key: 'gpa4' as const, label: 'Điểm hệ 4', domain: [0, 4] as [number, number], color: '#8b5cf6', unit: '/4' };

  const renderScoreTooltip = ({ active, payload }: TooltipContentProps) => {
    if (!active || !payload?.length) return null;
    const course = payload[0].payload as ScoreChartCourse | undefined;
    if (!course) return null;
    return (
      <div className="rounded-xl border border-border bg-background/95 px-3 py-2.5 shadow-xl backdrop-blur">
        <p className="max-w-52 text-xs font-semibold text-foreground">{course.fullName}</p>
        <p className="mt-1 text-sm font-bold text-foreground">
          {course[chartConfig.key].toFixed(chartMetric === 'gpa10' ? 1 : 2)}{chartConfig.unit}
          <span className="ml-2 text-xs font-semibold text-foreground/60">{course.letter}</span>
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="glass-panel p-6">
        <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <Calculator className="text-brand-cyan" />
          Tính điểm trung bình (GPA) & Thống kê
        </h1>
        <p className="opacity-70 max-w-4xl text-sm">
          Nhập điểm thành phần <strong>10% - 40% - 50%</strong>. Hệ thống tự động làm tròn bài thi cuối kỳ và làm tròn điểm tổng kết môn (mốc 0.05).
        </p>
      </div>

      {/* TÍNH GPA KHU VỰC CHÍNH */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Bảng nhập điểm */}
        <div className="xl:col-span-3 glass-panel p-6 overflow-hidden flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg">Bảng điểm chi tiết</h3>
            <button 
              onClick={addEntry}
              className="flex items-center gap-2 px-3 py-1.5 bg-brand-cyan/10 text-brand-cyan hover:bg-brand-cyan/20 transition-colors rounded-lg text-sm font-medium"
            >
              <Plus size={16} /> Thêm môn
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-background/50 opacity-70">
                <tr>
                  <th className="px-3 py-3 min-w-[150px]">Tên môn học</th>
                  <th className="px-2 py-3 w-20 text-center">Tín chỉ</th>
                  <th className="px-2 py-3 w-24 text-center">10% (CC)</th>
                  <th className="px-2 py-3 w-24 text-center">40% (GK)</th>
                  <th className="px-2 py-3 w-24 text-center">50% (CK)</th>
                  <th className="px-3 py-3 w-24 text-center">Tổng kết</th>
                  <th className="px-3 py-3 w-20 text-center">Hệ chữ</th>
                  <th className="px-2 py-3 w-12 text-center"></th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, idx) => {
                  const finalScore = calculateSubjectFinal(entry);
                  const converted = finalScore !== null ? convertScore(finalScore) : null;

                  return (
                    <tr key={entry.id} className="border-b border-border/50 hover:bg-black/5 dark:hover:bg-foreground/5 transition-colors">
                      <td className="px-3 py-2">
                        <input 
                          type="text" 
                          value={entry.name}
                          onChange={e => updateEntry(entry.id, 'name', e.target.value)}
                          placeholder={`Môn học ${idx + 1}`}
                          className="w-full bg-transparent outline-none border-b border-transparent focus:border-brand-cyan/50 py-1"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input 
                          type="number" 
                          value={entry.credits}
                          onChange={e => updateEntry(entry.id, 'credits', Number(e.target.value))}
                          min="1" max="10"
                          className="w-full bg-background/50 border border-border rounded p-1.5 outline-none text-center"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input 
                          type="number" 
                          value={entry.score10}
                          onChange={e => updateEntry(entry.id, 'score10', e.target.value)}
                          placeholder="0-10" step="0.1" min="0" max="10"
                          className="w-full bg-background/50 border border-border rounded p-1.5 outline-none text-center focus:border-brand-cyan/50"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input 
                          type="number" 
                          value={entry.score40}
                          onChange={e => updateEntry(entry.id, 'score40', e.target.value)}
                          placeholder="0-10" step="0.1" min="0" max="10"
                          className="w-full bg-background/50 border border-border rounded p-1.5 outline-none text-center focus:border-brand-cyan/50"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input 
                          type="number" 
                          value={entry.score50}
                          onChange={e => updateEntry(entry.id, 'score50', e.target.value)}
                          placeholder="0-10" step="0.01" min="0" max="10"
                          className="w-full bg-background/50 border border-border rounded p-1.5 outline-none text-center focus:border-brand-cyan/50"
                        />
                      </td>
                      <td className="px-3 py-2 text-center font-bold text-brand-cyan">
                        {finalScore !== null ? finalScore.toFixed(1) : '-'}
                      </td>
                      <td className="px-3 py-2 text-center font-bold">
                        {converted ? (
                          <span className={converted.score4 >= 3.5 ? 'text-green-500' : converted.score4 >= 2.0 ? 'text-brand-cyan' : 'text-orange-500'}>
                            {converted.letter}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-2 py-2 text-center">
                        <button 
                          onClick={() => removeEntry(entry.id)}
                          className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 p-3 rounded-lg bg-brand-cyan/5 border border-brand-cyan/20 flex items-start gap-2 text-xs opacity-80">
            <Info size={14} className="mt-0.5 flex-shrink-0 text-brand-cyan" />
            <p><strong>Lưu ý làm tròn:</strong> Tất cả bài thi cuối kỳ (50%) được mặc định làm tròn theo barem trắc nghiệm NEU. Điểm tổng kết môn được làm tròn theo mốc 0.05.</p>
          </div>
        </div>

        {/* Bảng Kết quả */}
        <div className="xl:col-span-1 glass-panel p-6 flex flex-col justify-center items-center text-center relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-48 h-48 bg-brand-cyan/10 rounded-full blur-3xl"></div>
          
          <Award size={48} className="text-brand-violet mb-4 relative z-10" />
          <h3 className="text-lg font-semibold mb-1 relative z-10">Kết quả Học kỳ</h3>
          <p className="opacity-70 text-sm mb-6 relative z-10">Dựa trên {results.totalCredits} tín chỉ</p>

          <div className="w-full bg-background/50 rounded-2xl p-6 border border-border/50 relative z-10">
            <p className="text-sm font-medium opacity-70 mb-1">GPA HỆ 4</p>
            <p className="text-5xl font-bold text-brand-cyan mb-4">{results.gpa4.toFixed(2)}</p>
            
            <div className="h-px w-full bg-border/50 my-4"></div>
            
            <div className="flex justify-between items-center text-sm">
              <span className="opacity-70">GPA Hệ 10</span>
              <span className="font-bold">{results.gpa10.toFixed(2)}</span>
            </div>
            
            <div className="mt-4 pt-4 border-t border-border/50">
              <p className="text-xs opacity-70 mb-1">Xếp loại</p>
              <p className={`font-semibold ${results.gpa4 >= 3.2 ? 'text-green-500' : results.gpa4 >= 2.5 ? 'text-brand-cyan' : 'text-orange-500'}`}>
                {results.gpa4 >= 3.6 ? 'Xuất sắc' : 
                 results.gpa4 >= 3.2 ? 'Giỏi' : 
                 results.gpa4 >= 2.5 ? 'Khá' : 
                 results.gpa4 >= 2.0 ? 'Trung bình' : 'Yếu / Kém'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* THỐNG KÊ GPA KHU VỰC DƯỚI */}
      <div className="glass-panel p-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-xl font-semibold">
              <BarChart2 className="text-brand-violet" aria-hidden="true" />
              Thống kê kết quả
            </h3>
            <p className="mt-1 text-sm text-foreground/65">Chỉ hiển thị biểu đồ khi đã có đủ dữ liệu để so sánh.</p>
          </div>

          {chartData.length >= 2 && (
            <div className="inline-flex min-h-11 w-full rounded-xl border border-border/70 bg-background/45 p-1 sm:w-auto" aria-label="Chọn thang điểm biểu đồ">
              {(['gpa10', 'gpa4'] as ChartMetric[]).map(metric => {
                const isSelected = chartMetric === metric;
                return (
                  <button
                    key={metric}
                    type="button"
                    onClick={() => setChartMetric(metric)}
                    aria-pressed={isSelected}
                    className={`min-h-9 flex-1 rounded-lg px-3 text-xs font-semibold transition-[background-color,color,box-shadow] sm:flex-none ${isSelected ? 'bg-cyan-700 text-white shadow-sm dark:bg-cyan-500/25 dark:text-cyan-100' : 'text-foreground/60 hover:bg-foreground/8 hover:text-foreground'}`}
                  >
                    {metric === 'gpa10' ? 'Hệ 10' : 'Hệ 4'}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {chartData.length === 0 ? (
          <div className="flex min-h-52 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-background/35 px-5 text-center">
            <BookOpen size={30} className="mb-3 text-brand-cyan" aria-hidden="true" />
            <h4 className="font-semibold text-foreground">Chưa có điểm tổng kết</h4>
            <p className="mt-1 max-w-md text-sm leading-relaxed text-foreground/65">Nhập đủ điểm chuyên cần, giữa kỳ và cuối kỳ của một môn để xem kết quả học tập tại đây.</p>
          </div>
        ) : chartData.length === 1 ? (
          <div className="grid gap-4 rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/[0.09] to-blue-500/[0.05] p-5 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-700 dark:text-cyan-300">Môn đầu tiên</p>
              <h4 className="mt-2 truncate text-lg font-semibold text-foreground">{chartData[0].fullName}</h4>
              <p className="mt-1 text-sm text-foreground/65">Nhập thêm một môn để bắt đầu so sánh kết quả theo biểu đồ.</p>
            </div>
            <div className="flex items-end gap-2 sm:text-right">
              <span className="text-4xl font-bold tabular-nums text-cyan-700 dark:text-cyan-300">{chartData[0].gpa10.toFixed(1)}</span>
              <span className="mb-1 text-sm font-medium text-foreground/60">/10 · {chartData[0].letter}</span>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-border/70 bg-background/25 p-3 sm:p-5">
            <div className="mb-3 flex items-baseline justify-between gap-3 px-1">
              <h4 className="text-sm font-semibold text-foreground">So sánh điểm tổng kết theo môn</h4>
              <span className="text-xs font-medium text-foreground/55">{chartConfig.label}</span>
            </div>
            <div className="h-[260px] w-full sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 18, right: 4, left: -16, bottom: 4 }} barCategoryGap="28%">
                  <CartesianGrid strokeDasharray="3 5" stroke="rgba(100,116,139,0.28)" vertical={false} />
                  <XAxis dataKey="name" stroke="currentColor" opacity={0.62} fontSize={11} tickLine={false} axisLine={false} interval={0} />
                  <YAxis stroke="currentColor" opacity={0.62} fontSize={11} tickLine={false} axisLine={false} domain={chartConfig.domain} allowDecimals={chartMetric === 'gpa4'} />
                  <Tooltip content={renderScoreTooltip} cursor={{ fill: 'rgba(6,182,212,0.08)' }} />
                  <Bar dataKey={chartConfig.key} fill={chartConfig.color} radius={[8, 8, 2, 2]} maxBarSize={52} isAnimationActive={false} name={chartConfig.label} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {chartData.length >= 2 && (
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border/60 bg-background/35 p-4">
              <p className="text-xs font-medium text-foreground/60">Môn đã hoàn thành</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{chartData.length}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/35 p-4 sm:col-span-2">
              <p className="text-xs font-medium text-foreground/60">Điểm cao nhất hiện tại</p>
              <div className="mt-1 flex items-baseline gap-2">
                <p className="text-2xl font-bold tabular-nums text-foreground">{bestCourse?.gpa10.toFixed(1)}<span className="ml-1 text-sm font-medium text-foreground/55">/10</span></p>
                <p className="min-w-0 truncate text-sm text-foreground/65">{bestCourse?.fullName}</p>
              </div>
            </div>
          </div>
        )}

        {chartData.length >= 3 && (
          <div className="mt-5 border-t border-border/60 pt-5">
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h4 className="text-sm font-semibold text-foreground">Phân bố kết quả</h4>
              <span className="text-xs text-foreground/55">Theo điểm hệ 10</span>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {scoreDistribution.map(group => (
                <div key={group.label} className="rounded-xl border border-border/60 bg-background/35 p-3">
                  <p className={`text-sm font-semibold ${group.tone}`}>{group.label}</p>
                  <p className="mt-1 text-xs text-foreground/55">{group.range}</p>
                  <p className="mt-2 text-xl font-bold tabular-nums text-foreground">{group.count} <span className="text-xs font-medium text-foreground/55">môn</span></p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
