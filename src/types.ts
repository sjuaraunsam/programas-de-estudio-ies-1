export interface Subject {
  id: string;
  name: string;
  career: string;
  field: string;
  modality: string;
  duration: string;
  shift: string;
  hours: string;
  professor: string;
  foundation: string;
  objectives: string[];
  units: { title: string; description: string }[];
  methodology: string;
  evaluation: string;
  bibliography: string[];
}

export interface UserProfile {
  email: string;
  name: string;
  createdAt: any;
  selectedSubjects?: string[];
}

export type SubjectState = 'pending' | 'in-progress' | 'signed' | 'passed';

export type SubjectCategory = 'core' | 'general' | 'practice' | 'complementary';

export interface SubjectMeta {
  year: number;
  semester: 1 | 2;
  prerequisites: string[];
  category: SubjectCategory;
  duration: 'cuatrimestral' | 'anual';
}

export interface CurriculumSubject {
  id: string;
  name: string;
  prof: string;
  career: string;
  year: number;
  semester: 1 | 2;
  prerequisites: string[];
  category: SubjectCategory;
  duration: 'cuatrimestral' | 'anual';
}

export const getYearFromCareer = (career: string): number => {
  const match = career.match(/(\d)/);
  return match ? parseInt(match[1]) : 1;
};

export const getSemesterFromTerm = (term: string): 1 | 2 => {
  if (term === '2º') return 2;
  return 1;
};

export const getDurationFromTerm = (term: string): 'cuatrimestral' | 'anual' => {
  if (term === 'AN.' || term === '1º y 2º') return 'anual';
  return 'cuatrimestral';
};
