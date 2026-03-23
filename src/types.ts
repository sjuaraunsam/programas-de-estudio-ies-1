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
