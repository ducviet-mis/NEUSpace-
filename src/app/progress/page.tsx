'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import curriculumData from '@/data/curriculum.json';
import { supabase } from '@/lib/supabase';
import { BookOpen, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { roundNeuFinalScore, roundNeuTestScore, convertScore } from '@/utils/neuLogic';

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

interface GradeRecord {
  id?: string;
  subject_code: string;
  credits: number;
  score_cc: number | null;
  score_gk: number | null;
  score_ck: number | null;
  score_10: number | null;
}

export default function ProgressPage() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Profile state
  const [currentMajor, setCurrentMajor] = useState<string>('');
  
  // All grades in DB
  const [grades, setGrades] = useState<Record<string, GradeRecord>>({});
  
  // Saving states per subject
  const [savingState, setSavingState] = useState<Record<string, boolean>>({});
  const [savedState, setSavedState] = useState<Record<string, boolean>>({});
  const [saveErrorState, setSaveErrorState] = useState<Record<string, boolean>>({});
  const autoSaveTimers = useRef<Record<string, number>>({});

  useEffect(() => () => {
    Object.values(autoSaveTimers.current).forEach(clearTimeout);
  }, []);

  const processedMajors = useMemo(() => {
    return (curriculumData as Major[]).map(m => {
      const parts = m.majorName.split(/[-–—]/);
      const code = parts[parts.length - 1]?.trim() || '';
      const isStandard = !/[A-Za-z]/.test(code);
      return { ...m, isStandard };
    }).sort((a, b) => {
      if (a.isStandard === b.isStandard) return a.majorName.localeCompare(b.majorName);
      return a.isStandard ? -1 : 1;
    });
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const uid = session.user.id;
        setUserId(uid);

        // Fetch Profile
        const { data: profile } = await supabase.from('profiles').select('major_name').eq('user_id', uid).single();
        if (profile?.major_name) {
          setCurrentMajor(profile.major_name);
        }

        // Fetch Grades
        const { data: gradesData } = await supabase.from('grades').select('*').eq('user_id', uid);
        if (gradesData) {
          const gradesMap: Record<string, GradeRecord> = {};
          gradesData.forEach((g: any) => {
            gradesMap[g.subject_code] = g;
          });
          setGrades(gradesMap);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const saveMajor = async (majorName: string) => {
    if (!userId) return;
    setCurrentMajor(majorName);
    
    // Check if profile exists, if not insert, else update
    const { data: profile } = await supabase.from('profiles').select('user_id').eq('user_id', userId).single();
    if (profile) {
      await supabase.from('profiles').update({ major_name: majorName }).eq('user_id', userId);
    } else {
      await supabase.from('profiles').insert({ user_id: userId, major_name: majorName });
    }
  };

  const saveGrade = async (subjectCode: string, gradeOverride?: GradeRecord) => {
    if (!userId) return;
    const grade = gradeOverride || grades[subjectCode];
    if (!grade) return;

    setSavingState(prev => ({ ...prev, [subjectCode]: true }));
    try {
      if (grade.id) {
        // Update
        await supabase.from('grades').update({
          score_cc: grade.score_cc,
          score_gk: grade.score_gk,
          score_ck: grade.score_ck,
          score_10: grade.score_10
        }).eq('id', grade.id);
      } else {
        // Insert
        const { data } = await supabase.from('grades').insert({
          user_id: userId,
          subject_code: grade.subject_code,
          credits: grade.credits,
          score_cc: grade.score_cc,
          score_gk: grade.score_gk,
          score_ck: grade.score_ck,
          score_10: grade.score_10
        }).select().single();
        
        if (data) {
          setGrades(prev => ({
            ...prev,
            [subjectCode]: { ...(prev[subjectCode] || grade), id: (data as GradeRecord).id },
          }));
        }
      }
      setSavedState(prev => ({ ...prev, [subjectCode]: true }));
      setSaveErrorState(prev => ({ ...prev, [subjectCode]: false }));
    } catch (err) {
      console.error(err);
      setSavedState(prev => ({ ...prev, [subjectCode]: false }));
      setSaveErrorState(prev => ({ ...prev, [subjectCode]: true }));
    } finally {
      setSavingState(prev => ({ ...prev, [subjectCode]: false }));
    }
  };

  const handleScoreChange = (subjectCode: string, credits: number, field: keyof GradeRecord, value: string) => {
    const parsedValue = value === '' ? null : Number(value);
    const numValue = parsedValue === null || !Number.isFinite(parsedValue)
      ? null
      : Math.min(10, Math.max(0, parsedValue));
    const current = grades[subjectCode] || { subject_code: subjectCode, credits, score_cc: null, score_gk: null, score_ck: null, score_10: null };
    const updated = { ...current, [field]: numValue };

    if (updated.score_cc !== null && updated.score_gk !== null && updated.score_ck !== null) {
      const ckRounded = roundNeuTestScore(updated.score_ck);
      const finalScore = updated.score_cc * 0.1 + updated.score_gk * 0.4 + ckRounded * 0.5;
      updated.score_10 = roundNeuFinalScore(finalScore);
    } else {
      updated.score_10 = null;
    }

    setGrades(prev => ({ ...prev, [subjectCode]: updated }));
    setSavedState(prev => ({ ...prev, [subjectCode]: false }));
    setSaveErrorState(prev => ({ ...prev, [subjectCode]: false }));
    window.clearTimeout(autoSaveTimers.current[subjectCode]);
    autoSaveTimers.current[subjectCode] = window.setTimeout(() => {
      saveGrade(subjectCode, updated);
    }, 800);
  };

  // Group current major's subjects by semester
  const selectedMajorData = useMemo(() => {
    if (!currentMajor) return null;
    const major = processedMajors.find(m => m.majorName === currentMajor);
    if (!major) return null;

    // Remove duplicates
    const uniqueSubjects = Array.from(new Map(major.subjects.map(s => [s.subjectCode, s])).values());
    
    // Group by semester
    const grouped: Record<number, Subject[]> = {};
    uniqueSubjects.forEach(s => {
      const sem = s.semester || 0;
      if (!grouped[sem]) grouped[sem] = [];
      grouped[sem].push(s);
    });

    return grouped;
  }, [currentMajor, processedMajors]);

  const renderSaveStatus = (subjectCode: string) => {
    const grade = grades[subjectCode];
    if (savingState[subjectCode]) {
      return <span className="inline-flex items-center gap-1.5 text-xs text-brand-cyan whitespace-nowrap"><Loader2 size={16} className="animate-spin" /> Đang lưu</span>;
    }
    if (savedState[subjectCode] || grade?.id) {
      return <span className="inline-flex items-center gap-1.5 text-xs text-green-500 whitespace-nowrap"><CheckCircle size={16} /> Đã lưu</span>;
    }
    if (saveErrorState[subjectCode]) {
      return <span className="text-xs text-red-500 whitespace-nowrap">Chưa lưu được</span>;
    }
    return <span className="text-xs opacity-50 whitespace-nowrap">Chưa nhập</span>;
  };

  if (loading) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="animate-spin text-brand-cyan w-8 h-8" /></div>;
  }

  return (
    <div className="space-y-5 md:space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="glass-panel p-5 md:p-6 border-b border-border">
        <h1 className="text-xl md:text-2xl font-bold mb-2 flex items-center gap-2">
          <BookOpen className="text-brand-violet" />
          Tiến độ Chương trình đào tạo
        </h1>
        <p className="opacity-70 text-sm max-w-3xl">
          Nhập điểm theo từng môn học. Sau khi bạn dừng nhập, điểm sẽ tự động lưu và đồng bộ với tổng tín chỉ, GPA trên Trang chủ.
        </p>

        <div className="mt-5 md:mt-6 p-4 rounded-2xl bg-background/50 border border-border">
          <label className="block text-sm font-medium mb-2 opacity-80">Ngành học của bạn</label>
          <select 
            className="w-full bg-background border border-border rounded-xl p-3 outline-none focus:border-brand-violet/50"
            value={currentMajor}
            onChange={e => saveMajor(e.target.value)}
          >
            <option value="">-- Chọn ngành học của bạn --</option>
            {processedMajors.map(m => (
              <option key={m.majorName} value={m.majorName}>
                {m.majorName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!currentMajor && (
        <div className="flex flex-col items-center justify-center p-12 opacity-60 text-center">
          <AlertCircle size={48} className="mb-4 opacity-50" />
          <p className="text-lg">Vui lòng chọn ngành học ở trên để bắt đầu cập nhật điểm.</p>
        </div>
      )}

      {selectedMajorData && (
        <div className="space-y-5 md:space-y-8">
          {Object.keys(selectedMajorData).sort((a, b) => Number(a) - Number(b)).map(sem => {
            const semesterNum = Number(sem);
            const subjects = selectedMajorData[semesterNum];
            
            return (
              <div key={sem} className="glass-panel p-4 sm:p-5 md:p-6">
                <h3 className="text-base md:text-lg font-bold mb-4 text-brand-cyan">
                  {semesterNum === 0 ? 'Môn Tự chọn / Không phân kỳ' : `Kỳ ${semesterNum}`}
                </h3>
                
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border/50 text-sm opacity-70">
                        <th className="pb-3 pl-2 font-medium w-1/3">Môn học</th>
                        <th className="pb-3 font-medium text-center">Tín chỉ</th>
                        <th className="pb-3 font-medium text-center">CC (10%)</th>
                        <th className="pb-3 font-medium text-center">GK (40%)</th>
                        <th className="pb-3 font-medium text-center">CK (50%)</th>
                        <th className="pb-3 font-medium text-center">Tổng (Hệ 10)</th>
                        <th className="pb-3 font-medium text-center">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subjects.map(s => {
                        const grade = grades[s.subjectCode];
                        const isCompleted = grade?.score_10 !== null && grade?.score_10 !== undefined;
                        
                        return (
                          <tr key={s.subjectCode} className="border-b border-border/30 hover:bg-black/5 dark:hover:bg-foreground/5 transition-colors">
                            <td className="py-4 pl-2">
                              <p className={`font-medium ${isCompleted ? 'text-green-500' : ''}`}>{s.name}</p>
                              <p className="text-xs opacity-60">{s.subjectCode} • {s.required ? 'Bắt buộc' : 'Tự chọn'}</p>
                            </td>
                            <td className="py-4 text-center font-medium opacity-80">{s.credits}</td>
                            
                            <td className="py-4 px-2 text-center">
                              <input 
                                type="number" 
                                step="0.1"
                                min="0" max="10"
                                className="w-16 p-2 rounded-lg bg-background border border-border text-center text-sm"
                                value={grade?.score_cc ?? ''}
                                onChange={(e) => handleScoreChange(s.subjectCode, s.credits, 'score_cc', e.target.value)}
                              />
                            </td>
                            <td className="py-4 px-2 text-center">
                              <input 
                                type="number" 
                                step="0.1"
                                min="0" max="10"
                                className="w-16 p-2 rounded-lg bg-background border border-border text-center text-sm"
                                value={grade?.score_gk ?? ''}
                                onChange={(e) => handleScoreChange(s.subjectCode, s.credits, 'score_gk', e.target.value)}
                              />
                            </td>
                            <td className="py-4 px-2 text-center">
                              <input 
                                type="number" 
                                step="0.1"
                                min="0" max="10"
                                className="w-16 p-2 rounded-lg bg-background border border-border text-center text-sm"
                                value={grade?.score_ck ?? ''}
                                onChange={(e) => handleScoreChange(s.subjectCode, s.credits, 'score_ck', e.target.value)}
                              />
                            </td>
                            
                            <td className="py-4 text-center">
                              {isCompleted ? (
                                <span className="font-bold text-lg text-brand-violet">{grade.score_10}</span>
                              ) : (
                                <span className="text-xs opacity-50 italic">Chưa học</span>
                              )}
                            </td>
                            
                            <td className="py-4 text-center">{renderSaveStatus(s.subjectCode)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="space-y-3 md:hidden">
                  {subjects.map(s => {
                    const grade = grades[s.subjectCode];
                    const isCompleted = grade?.score_10 !== null && grade?.score_10 !== undefined;

                    return (
                      <article key={s.subjectCode} className={`rounded-2xl border p-4 transition-colors ${isCompleted ? 'border-green-500/30 bg-green-500/5' : 'border-border bg-background/35'}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h4 className={`font-semibold leading-snug ${isCompleted ? 'text-green-500' : 'text-foreground'}`}>{s.name}</h4>
                            <p className="mt-1 text-xs text-foreground/60">{s.subjectCode} · {s.credits} tín chỉ · {s.required ? 'Bắt buộc' : 'Tự chọn'}</p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className={`text-2xl font-bold ${isCompleted ? 'text-brand-violet' : 'text-foreground/35'}`}>{isCompleted ? grade.score_10 : '—'}</p>
                            <p className="text-[10px] text-foreground/50">Hệ 10</p>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-3 gap-2">
                          {([
                            ['CC', 'score_cc', '10%'],
                            ['GK', 'score_gk', '40%'],
                            ['CK', 'score_ck', '50%'],
                          ] as const).map(([label, field, weight]) => (
                            <label key={field} className="min-w-0 rounded-xl bg-foreground/5 px-2 py-2 text-center">
                              <span className="block text-[11px] font-semibold text-foreground/65">{label} <span className="font-normal text-foreground/45">{weight}</span></span>
                              <input
                                type="number"
                                inputMode="decimal"
                                step="0.1"
                                min="0"
                                max="10"
                                aria-label={`${label} môn ${s.name}`}
                                className="mt-1 w-full min-w-0 border-0 bg-transparent p-0 text-center text-base font-semibold focus:ring-0"
                                value={grade?.[field] ?? ''}
                                onChange={(e) => handleScoreChange(s.subjectCode, s.credits, field, e.target.value)}
                              />
                            </label>
                          ))}
                        </div>

                        <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3">
                          <span className="text-xs text-foreground/55">Tự động lưu sau khi dừng nhập</span>
                          {renderSaveStatus(s.subjectCode)}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
