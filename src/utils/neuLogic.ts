/**
 * Các hàm tiện ích xử lý logic đặc thù của NEU (Làm tròn điểm, tính GPA)
 */

// 1. Logic làm tròn điểm thi trắc nghiệm NEU
export function roundNeuTestScore(score: number): number {
  const integerPart = Math.floor(score);
  const decimalPart = score - integerPart;

  if (decimalPart < 0.25) return integerPart;
  if (decimalPart >= 0.25 && decimalPart < 0.75) return integerPart + 0.5;
  if (decimalPart >= 0.75) return integerPart + 1.0;
  return score;
}

// 2. Logic làm tròn điểm tổng kết học phần (mốc 0.05 làm tròn lên 0.1)
export function roundNeuFinalScore(score: number): number {
  // Tránh lỗi floating point của JS bằng cách nhân 100
  const scaled = Math.round(score * 100);
  const remainder = scaled % 10;
  
  if (remainder >= 5) {
    return (scaled - remainder + 10) / 100;
  }
  return (scaled - remainder) / 100;
}

// 3. Quy đổi điểm hệ 10 sang hệ chữ và hệ 4
export function convertScore(score10: number) {
  if (score10 >= 9.0) return { letter: 'A+', score4: 4.0 };
  if (score10 >= 8.5) return { letter: 'A', score4: 4.0 };
  if (score10 >= 8.0) return { letter: 'B+', score4: 3.5 };
  if (score10 >= 7.0) return { letter: 'B', score4: 3.0 };
  if (score10 >= 6.5) return { letter: 'C+', score4: 2.5 };
  if (score10 >= 5.5) return { letter: 'C', score4: 2.0 };
  if (score10 >= 5.0) return { letter: 'D+', score4: 1.5 };
  if (score10 >= 4.0) return { letter: 'D', score4: 1.0 };
  return { letter: 'F', score4: 0.0 };
}

// 4. Tính GPA tổng
export interface CourseGrade {
  credits: number;
  score10: number;
}

export function calculateGPA(courses: CourseGrade[]) {
  if (courses.length === 0) return { gpa10: 0, gpa4: 0, totalCredits: 0 };

  let totalCredits = 0;
  let totalScore10 = 0;
  let totalScore4 = 0;

  courses.forEach(c => {
    totalCredits += c.credits;
    totalScore10 += c.score10 * c.credits;
    const { score4 } = convertScore(c.score10);
    totalScore4 += score4 * c.credits;
  });

  return {
    gpa10: Number((totalScore10 / totalCredits).toFixed(2)),
    gpa4: Number((totalScore4 / totalCredits).toFixed(2)),
    totalCredits
  };
}

// 5. Phân loại học lực
export function classifyGPA(gpa4: number): string {
  if (gpa4 >= 3.6) return 'Xuất sắc';
  if (gpa4 >= 3.2) return 'Giỏi';
  if (gpa4 >= 2.5) return 'Khá';
  if (gpa4 >= 2.0) return 'Trung bình';
  if (gpa4 >= 1.0) return 'Yếu';
  return 'Kém';
}
