import type { JobInfo, ResumeProfile, GapAnalysis, MatchScore, CoverLetter, ResumeRewrite, CompanyInsights } from "./agents/types.ts";

export function generateMarkdown(
  jobInfo: JobInfo,
  resumeProfile: ResumeProfile,
  gaps: GapAnalysis,
  score: MatchScore,
  coverLetter: CoverLetter,
  rewrite: ResumeRewrite,
  company: CompanyInsights,
): string {
  const sections: string[] = [];

  // Header with match score
  sections.push(`# 🎯 Job Application Analysis\n`);
  sections.push(`**Position:** ${jobInfo.title || "N/A"}`);
  sections.push(`**Company:** ${jobInfo.company || "N/A"}`);
  sections.push(`**Location:** ${jobInfo.location || "N/A"}\n`);
  sections.push(`---\n`);

  // Match Score (prominent)
  sections.push(`## 📊 MATCH SCORE: ${score.overall_score}%\n`);
  sections.push(`### ${score.recommendation}\n`);
  sections.push(`**Skills:** ${score.skills_match}% | **Experience:** ${score.experience_match}% | **Culture:** ${score.cultural_fit}%\n`);

  if (score.strengths && score.strengths.length > 0) {
    sections.push(`#### ✅ Your Strengths`);
    score.strengths.forEach(s => sections.push(`- ${s}`));
    sections.push(``);
  }

  if (score.weaknesses && score.weaknesses.length > 0) {
    sections.push(`#### ⚠️ Areas of Concern`);
    score.weaknesses.forEach(w => sections.push(`- ${w}`));
    sections.push(``);
  }

  sections.push(`---\n`);

  // Job Overview
  sections.push(`## 🎯 Job Overview\n`);
  sections.push(`**Position:** ${jobInfo.title || "N/A"}`);
  sections.push(`**Company:** ${jobInfo.company || "N/A"}`);
  sections.push(`**Location:** ${jobInfo.location || "N/A"}`);
  sections.push(`**Department:** ${jobInfo.department || "N/A"}`);
  sections.push(`**Experience Required:** ${jobInfo.years_experience || "N/A"}`);
  if (jobInfo.employment_type) sections.push(`**Type:** ${jobInfo.employment_type}`);
  if (jobInfo.remote_policy) sections.push(`**Remote:** ${jobInfo.remote_policy}`);
  if (jobInfo.salary_range) sections.push(`**Salary:** ${jobInfo.salary_range}`);
  sections.push(``);

  if (jobInfo.job_summary) {
    sections.push(`### Summary`);
    sections.push(`${jobInfo.job_summary}\n`);
  }

  // Company Insights
  sections.push(`---\n`);
  sections.push(`## 🏢 Company Insights\n`);
  
  if (company.industry) sections.push(`**Industry:** ${company.industry}`);
  if (company.size) sections.push(`**Size:** ${company.size}\n`);

  if (company.overview) {
    sections.push(`### About ${company.name || jobInfo.company}`);
    sections.push(`${company.overview}\n`);
  }

  if (company.culture) {
    sections.push(`### Culture`);
    sections.push(`${company.culture}\n`);
  }

  if (company.values && company.values.length > 0) {
    sections.push(`### Values`);
    company.values.forEach(v => sections.push(`- ${v}`));
    sections.push(``);
  }

  if (company.recent_news && company.recent_news.length > 0) {
    sections.push(`### Recent News`);
    company.recent_news.forEach(n => sections.push(`- ${n}`));
    sections.push(``);
  }

  // Gap Analysis
  sections.push(`---\n`);
  sections.push(`## 🧩 Gap Analysis\n`);

  if (gaps.strengths && gaps.strengths.length > 0) {
    sections.push(`### ✅ Your Strengths`);
    gaps.strengths.forEach(s => sections.push(`- ${s}`));
    sections.push(``);
  }

  if (gaps.technical_missing && gaps.technical_missing.length > 0) {
    sections.push(`### Missing Technical Skills`);
    gaps.technical_missing.forEach(t => sections.push(`- ${t}`));
    sections.push(``);
  }

  if (gaps.experience_missing && gaps.experience_missing.length > 0) {
    sections.push(`### Experience Gaps`);
    gaps.experience_missing.forEach(e => sections.push(`- ${e}`));
    sections.push(``);
  }

  if (gaps.addressable_gaps && gaps.addressable_gaps.length > 0) {
    sections.push(`### 💡 Addressable Gaps`);
    gaps.addressable_gaps.forEach(g => sections.push(`- ${g}`));
    sections.push(``);
  }

  if (gaps.recommendations && gaps.recommendations.length > 0) {
    sections.push(`### 📋 Recommendations`);
    gaps.recommendations.forEach(r => sections.push(`- ${r}`));
    sections.push(``);
  }

  // Cover Letter
  sections.push(`---\n`);
  sections.push(`## ✉️ Draft Cover Letter\n`);
  sections.push(`\`\`\`\n${coverLetter.draft || coverLetter}\n\`\`\`\n`);

  if (coverLetter.key_points && coverLetter.key_points.length > 0) {
    sections.push(`### Key Selling Points`);
    coverLetter.key_points.forEach(p => sections.push(`- ${p}`));
    sections.push(``);
  }

  // Resume Optimization
  sections.push(`---\n`);
  sections.push(`## 🪄 Resume Optimization\n`);

  if (rewrite.suggestions && rewrite.suggestions.length > 0) {
    sections.push(`### Strategic Suggestions`);
    rewrite.suggestions.forEach(s => sections.push(`- ${s}`));
    sections.push(``);
  }

  if (rewrite.keywords_to_add && rewrite.keywords_to_add.length > 0) {
    sections.push(`### Keywords to Add (ATS)`);
    rewrite.keywords_to_add.forEach(k => sections.push(`- ${k}`));
    sections.push(``);
  }

  if (rewrite.bullet_improvements && rewrite.bullet_improvements.length > 0) {
    sections.push(`### Bullet Point Improvements\n`);
    rewrite.bullet_improvements.forEach(b => {
      sections.push(`**${b.section}**\n`);
      sections.push(`❌ Before: ${b.original}\n`);
      sections.push(`✅ After: ${b.improved}\n`);
      if (b.rationale) sections.push(`💡 Why: ${b.rationale}\n`);
    });
  }

  // Job Requirements
  sections.push(`---\n`);
  sections.push(`## 📋 Job Requirements\n`);

  if (jobInfo.required_skills && jobInfo.required_skills.length > 0) {
    sections.push(`### Required Skills`);
    jobInfo.required_skills.forEach(s => sections.push(`- ${s}`));
    sections.push(``);
  }

  if (jobInfo.tech_stack && jobInfo.tech_stack.length > 0) {
    sections.push(`### Tech Stack`);
    jobInfo.tech_stack.forEach(t => sections.push(`- ${t}`));
    sections.push(``);
  }

  if (jobInfo.responsibilities && jobInfo.responsibilities.length > 0) {
    sections.push(`### Key Responsibilities`);
    jobInfo.responsibilities.forEach(r => sections.push(`- ${r}`));
    sections.push(``);
  }

  sections.push(`---\n`);
  sections.push(`*Generated on ${new Date().toLocaleString()}*`);

  return sections.join('\n');
}