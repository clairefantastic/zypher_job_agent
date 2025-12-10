import type { JobInfo, ResumeProfile, GapAnalysis, MatchScore, CoverLetter, ResumeRewrite, CompanyInsights } from "./agents/types.ts";

export function generateMarkdown(
  jobInfo: JobInfo,
  resumeProfile: ResumeProfile,
  gaps: GapAnalysis,
  score: MatchScore,
  coverLetter: CoverLetter | null,  // ← Can be null
  rewrite: ResumeRewrite,
  company: CompanyInsights,
  interviewPrep?: any,  // ← Can be undefined/null
  visualizations?: any,  // ← Can be undefined/null
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

  // Cover Letter (HANDLE NULL)
  sections.push(`---\n`);
  if (coverLetter) {
    sections.push(`## ✉️ Draft Cover Letter\n`);
    sections.push(`\`\`\`\n${coverLetter.draft || coverLetter}\n\`\`\`\n`);

    if (coverLetter.key_points && coverLetter.key_points.length > 0) {
      sections.push(`### Key Selling Points`);
      coverLetter.key_points.forEach(p => sections.push(`- ${p}`));
      sections.push(``);
    }
  } else {
    sections.push(`## ✉️ Cover Letter\n`);
    sections.push(`⚠️ **Cover letter not generated** (match score below threshold)\n`);
    sections.push(`Focus on improving skills and qualifications first.\n`);
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

  // Interview Preparation (HANDLE NULL/UNDEFINED)
  if (interviewPrep && interviewPrep.questions && interviewPrep.questions.length > 0) {
    sections.push(`---\n`);
    sections.push(`## 🎯 Interview Preparation (Advanced RAG)\n`);
    
    if (interviewPrep.rag_stats) {
      sections.push(`*Retrieved using ${interviewPrep.rag_stats.retrieval_method} - ${interviewPrep.rag_stats.total_retrieved} questions analyzed, avg relevance: ${(interviewPrep.rag_stats.avg_relevance * 100).toFixed(1)}%*\n`);
    } else {
      sections.push(`*Questions retrieved from ${jobInfo.company || 'company'} interview knowledge base*\n`);
    }
    
    sections.push(`### Top Interview Questions\n`);
    interviewPrep.questions.forEach((q: any, i: number) => {
      sections.push(`#### ${i + 1}. ${q.question}\n`);
      sections.push(`**Category:** ${q.category}`);
      sections.push(`**Why likely:** ${q.why_likely}\n`);
      
      sections.push(`**💡 Suggested Answer Template:**`);
      sections.push(`${q.answer_template}\n`);
      
      if (q.resume_examples && q.resume_examples.length > 0) {
        sections.push(`**📌 Use These Examples from Your Resume:**`);
        q.resume_examples.forEach((ex: string) => sections.push(`- ${ex}`));
        sections.push(``);
      }
    });

    if (interviewPrep.emphasis_points && interviewPrep.emphasis_points.length > 0) {
      sections.push(`### 🌟 What to Emphasize from Your Background\n`);
      interviewPrep.emphasis_points.forEach((p: string) => sections.push(`- ${p}`));
      sections.push(``);
    }

    if (interviewPrep.preparation_tips && interviewPrep.preparation_tips.length > 0) {
      sections.push(`### 📚 Preparation Tips\n`);
      interviewPrep.preparation_tips.forEach((t: string) => sections.push(`- ${t}`));
      sections.push(``);
    }
    
    sections.push(`*Questions retrieved using advanced RAG with hybrid search and query expansion*\n`);
  } else {
    sections.push(`---\n`);
    sections.push(`## 🎯 Interview Preparation\n`);
    sections.push(`⚠️ **Interview prep not available** (match score below threshold or RAG database not seeded)\n`);
  }

  // Career Visualizations (HANDLE NULL/UNDEFINED)
  if (visualizations) {
    sections.push(`---\n`);
    sections.push(`## 🎨 Career Path Visualization\n`);
    
    sections.push(`### Interactive Visualizations\n`);
    sections.push(`The following visualizations have been generated for you:\n`);
    sections.push(`- **Skills Radar Chart**: Interactive comparison of your skills vs. job requirements`);
    sections.push(`- **Career Timeline**: Visual roadmap showing your path over 12 months\n`);
    sections.push(`📂 View files in: \`./output/visualizations/\`\n`);
    sections.push(`**To view:**`);
    sections.push(`\`\`\`bash`);
    sections.push(`# Skills radar (interactive HTML)`);
    sections.push(`open ./output/visualizations/skills-radar.html\n`);
    sections.push(`# Career timeline (SVG)`);
    sections.push(`open ./output/visualizations/timeline.svg`);
    sections.push(`\`\`\`\n`);
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