export interface JobInfo {
  title: string;
  company: string;
  location: string;
  department: string;
  job_summary: string;
  responsibilities: string[];
  preferred_skills: string[];
  required_skills: string[];
  qualifications: string[];
  tech_stack: string[];
  years_experience: string;
  nice_to_have: string[];
  salary_range?: string;
  employment_type?: string;
  remote_policy?: string;
}

export interface ResumeProfile {
  name?: string;
  summary?: string;
  skills: string[];
  experience: Experience[];
  education: Education[];
  certifications?: string[];
  projects?: Project[];
  achievements?: string[];
  // Technical skill breakdowns
  technical_skills?: string[];
  languages?: string[];
  frameworks?: string[];
  cloud?: string[];
  database?: string[];
  years_experience?: string;
  roles?: string[];
}

export interface Experience {
  title: string;
  company: string;
  duration: string;
  responsibilities: string[];
  achievements?: string[];
}

export interface Education {
  degree: string;
  institution: string;
  year?: string;
}

export interface Project {
  name: string;
  description: string;
  technologies?: string[];
}

export interface GapAnalysis {
  technical_missing: string[];
  cloud_missing: string[];
  framework_missing: string[];
  experience_missing: string[];
  certifications_missing: string[];
  strengths?: string[];
  addressable_gaps?: string[];
  critical_gaps?: string[];
  recommendations?: string[];
  // Legacy fields for backwards compatibility
  missing_skills?: string[];
  weak_areas?: string[];
}

export interface MatchScore {
  overall_score: number;
  skills_match: number;
  experience_match: number;
  cultural_fit?: number;
  recommendation: string;
  strengths: string[];
  weaknesses: string[];
}

export interface CoverLetter {
  draft: string;
  key_points?: string[];
  tone?: string;
}

export interface ResumeRewrite {
  suggestions: string[];
  bullet_improvements: BulletImprovement[];
  keywords_to_add: string[];
  sections_to_emphasize?: string[];
}

export interface BulletImprovement {
  section: string;
  original: string;
  improved: string;
  rationale?: string;
}

// Legacy type alias for backwards compatibility
export type ResumeRewriteSuggestions = ResumeRewrite;

export interface CompanyInsights {
  name?: string;
  overview: string;
  culture: string;
  recent_news: string[];
  values?: string[];
  size?: string;
  industry?: string;
}