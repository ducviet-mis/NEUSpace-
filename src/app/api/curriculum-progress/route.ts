import curriculumData from '@/data/curriculum.json';

interface CurriculumSubject {
  required: boolean;
  subjectCode: string;
  credits: number;
}

interface CurriculumMajor {
  majorName: string;
  subjects: CurriculumSubject[];
}

const DEFAULT_GRADUATION_CREDITS = 130;

export async function GET(request: Request) {
  const majorName = new URL(request.url).searchParams.get('major')?.trim();

  if (!majorName) {
    return Response.json({ error: 'Thiếu tên ngành học.' }, { status: 400 });
  }

  const major = (curriculumData as CurriculumMajor[]).find(item => item.majorName === majorName);

  if (!major) {
    return Response.json({ error: 'Không tìm thấy chương trình đào tạo.' }, { status: 404 });
  }

  const subjects = Array.from(
    new Map(major.subjects.map(subject => [subject.subjectCode, subject])).values(),
  );
  const requiredSubjects = subjects.filter(subject => subject.required);
  const electiveSubjects = subjects.filter(subject => !subject.required);
  const requiredCredits = requiredSubjects.reduce((total, subject) => total + subject.credits, 0);
  const totalCredits = Math.max(DEFAULT_GRADUATION_CREDITS, requiredCredits);
  const electiveCreditsNeeded = Math.max(0, totalCredits - requiredCredits);
  const averageElectiveCredits = electiveSubjects.length
    ? electiveSubjects.reduce((total, subject) => total + subject.credits, 0) / electiveSubjects.length
    : 0;
  const electiveSubjectTarget = averageElectiveCredits
    ? Math.min(electiveSubjects.length, Math.ceil(electiveCreditsNeeded / averageElectiveCredits))
    : 0;

  return Response.json({
    majorName: major.majorName,
    totalCredits,
    totalSubjects: requiredSubjects.length + electiveSubjectTarget,
    subjectCredits: Object.fromEntries(
      subjects.map(subject => [subject.subjectCode, subject.credits]),
    ),
  });
}
