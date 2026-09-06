'use client';

import React, { useState, useEffect, useMemo } from 'react';
import curriculumData from '@/data/curriculum.json';
import { supabase } from '@/lib/supabase';
import { BookOpen, CheckCircle, Save, Loader2, AlertCircle } from 'lucide-react';
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

  const handleScoreChange = (subjectCode: string, credits: number, field: keyof GradeRecord, value: string) => {
    const numValue = value === '' ? null : parseFloat(value);
    
    setGrades(prev => {
      const current = prev[subjectCode] || { subject_code: subjectCode, credits, score_cc: null, score_gk: null, score_ck: null, score_10: null };
      const updated = { ...current, [field]: numValue };
      
      // Auto-calculate final score if all 3 are present
      if (updated.score_cc !== null && updated.score_gk !== null && updated.score_ck !== null) {
        // Assume default NEU weights: 10% CC, 40% GK, 50% CK
        // Also assume CK is multiple choice (roundNeuTestScore)
        const ckRounded = roundNeuTestScore(updated.score_ck);
        const finalScore = updated.score_cc * 0.1 + updated.score_gk * 0.4 + ckRounded * 0.5;
        updated.score_10 = roundNeuFinalScore(finalScore);
      } else {
        updated.score_10 = null;
      }

      return { ...prev, [subjectCode]: updated };
    });
  };

  const saveGrade = async (subjectCode: string) => {
    if (!userId) return;
    const grade = grades[subjectCode];
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
          setGrades(prev => ({ ...prev, [subjectCode]: data as GradeRecord }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingState(prev => ({ ...prev, [subjectCode]: false }));
    }
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

  if (loading) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="animate-spin text-brand-cyan w-8 h-8" /></div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="glass-panel p-6 border-b border-border">
        <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <BookOpen className="text-brand-violet" />
          Tiến độ Chương trình đào tạo
        </h1>
        <p className="opacity-70 text-sm max-w-3xl">
          Cập nhật điểm số theo từng môn học trong chương trình đào tạo của bạn. Những môn chưa nhập điểm sẽ được xem là "Chưa học". Dữ liệu sẽ tự động đồng bộ với tổng tín chỉ và GPA trên Trang chủ.
        </p>

        <div className="mt-6 p-4 rounded-xl bg-background/50 border border-border">
          <label className="block text-sm font-medium mb-2 opacity-80">Ngành học của bạn</label>
          <select 
            className="w-full bg-background border border-border rounded-lg p-3 outline-none focus:border-brand-violet/50"
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
        <div className="space-y-8">
          {Object.keys(selectedMajorData).sort((a, b) => Number(a) - Number(b)).map(sem => {
            const semesterNum = Number(sem);
            const subjects = selectedMajorData[semesterNum];
            
            return (
              <div key={sem} className="glass-panel p-6">
                <h3 className="text-lg font-bold mb-4 text-brand-cyan">
                  {semesterNum === 0 ? 'Môn Tự chọn / Không phân kỳ' : `Kỳ ${semesterNum}`}
                </h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border/50 text-sm opacity-70">
                        <th className="pb-3 pl-2 font-medium w-1/3">Môn học</th>
                        <th className="pb-3 font-medium text-center">Tín chỉ</th>
                        <th className="pb-3 font-medium text-center">CC (10%)</th>
                        <th className="pb-3 font-medium text-center">GK (40%)</th>
                        <th className="pb-3 font-medium text-center">CK (50%)</th>
                        <th className="pb-3 font-medium text-center">Tổng (Hệ 10)</th>
                        <th className="pb-3 font-medium text-center">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subjects.map(s => {
                        const grade = grades[s.subjectCode];
                        const isSaving = savingState[s.subjectCode];
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
                            
                            <td className="py-4 text-center">
                              <button 
                                onClick={() => saveGrade(s.subjectCode)}
                                disabled={isSaving}
                                className="p-2 bg-brand-cyan/10 text-brand-cyan rounded-lg hover:bg-brand-cyan hover:text-foreground transition-colors disabled:opacity-50"
                                title="Lưu điểm"
                              >
                                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
