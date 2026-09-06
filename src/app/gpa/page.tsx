'use client';

import React, { useState, useMemo } from 'react';
import { Calculator, Plus, Trash2, Award, Info, BarChart2 } from 'lucide-react';
import { calculateGPA, convertScore, roundNeuFinalScore, roundNeuTestScore } from '@/utils/neuLogic';
import {
  LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

interface ScoreEntry {
  id: string;
  name: string;
  credits: number;
  score10: string; // Điểm chuyên cần (10%)
  score40: string; // Điểm giữa kỳ (40%)
  score50: string; // Điểm cuối kỳ (50%)
}

export default function GPACalculatorPage() {
  const [entries, setEntries] = useState<ScoreEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  React.useEffect(() => {
    const saved = localStorage.getItem('gpa_entries');
    if (saved) {
      try {
        setEntries(JSON.parse(saved));
      } catch(e) {}
    }
    setIsLoaded(true);
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

  // Tạo dữ liệu cho chart từ các môn học đã nhập
  const chartData = useMemo(() => {
    return entries.map(e => {
      const finalScore = calculateSubjectFinal(e);
      const converted = finalScore !== null ? convertScore(finalScore) : null;
      // Lấy tên viết tắt nếu tên môn quá dài để hiển thị biểu đồ đẹp hơn
      const shortName = e.name.length > 15 ? e.name.substring(0, 15) + '...' : (e.name || 'Môn học');
      return {
        name: shortName,
        fullName: e.name || 'Môn học chưa đặt tên',
        gpa10: finalScore !== null ? Number(finalScore.toFixed(2)) : 0,
        gpa4: converted !== null ? converted.score4 : 0
      };
    }).filter(e => e.gpa10 > 0 || e.gpa4 > 0);
  }, [entries]);

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
        <h3 className="font-semibold text-xl mb-6 flex items-center gap-2">
          <BarChart2 className="text-brand-violet" />
          Thống kê & Biểu đồ GPA
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Line Chart */}
          <div className="h-72 flex flex-col">
            <h4 className="text-sm font-medium opacity-70 mb-4 text-center">Điểm Hệ 4 các môn (Biểu đồ đường)</h4>
            <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" stroke="currentColor" opacity={0.5} fontSize={12} />
                  <YAxis stroke="currentColor" opacity={0.5} fontSize={12} domain={[0, 4]} />
                  <Tooltip 
                    labelFormatter={(value, payload) => payload?.[0]?.payload?.fullName || value}
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ color: '#06B6D4' }}
                  />
                  <Line type="monotone" dataKey="gpa4" stroke="#06B6D4" strokeWidth={3} dot={{ r: 4, fill: '#06B6D4' }} activeDot={{ r: 6 }} name="GPA Hệ 4" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="h-72 flex flex-col">
            <h4 className="text-sm font-medium opacity-70 mb-4 text-center">Điểm Hệ 10 các môn (Biểu đồ cột)</h4>
            <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                  <XAxis dataKey="name" stroke="currentColor" opacity={0.5} fontSize={12} />
                  <YAxis stroke="currentColor" opacity={0.5} fontSize={12} domain={[0, 10]} />
                  <Tooltip 
                    labelFormatter={(value, payload) => payload?.[0]?.payload?.fullName || value}
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ color: '#8B5CF6' }}
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  />
                  <Bar dataKey="gpa10" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="GPA Hệ 10" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Radar Chart */}
          <div className="h-72 flex flex-col">
            <h4 className="text-sm font-medium opacity-70 mb-4 text-center">Phổ điểm Hệ 4 (Biểu đồ mạng nhện)</h4>
            <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="name" stroke="currentColor" opacity={0.7} fontSize={10} />
                  <PolarRadiusAxis angle={30} domain={[0, 4]} opacity={0.5} tick={false} axisLine={false} />
                  <Radar name="GPA Hệ 4" dataKey="gpa4" stroke="#1D4ED8" fill="#3B82F6" fillOpacity={0.4} />
                  <Tooltip 
                    labelFormatter={(value, payload) => payload?.[0]?.payload?.fullName || value}
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }} 
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
