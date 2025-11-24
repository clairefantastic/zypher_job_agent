import { runJsonTask } from "./utils.ts";
import type { ZypherAgent } from "@corespeed/zypher";
import type { GapAnalysis, JobInfo, ResumeProfile } from "./types.ts";

export async function analyzeGaps(
  agent: ZypherAgent,
  job: JobInfo,
  resume: ResumeProfile,
): Promise<GapAnalysis> {
  const prompt = `
You are a gap analysis engine that identifies what's missing between a job posting and a candidate's resume.

Return ONLY valid JSON in this EXACT structure:

{
  "technical_missing": [],
  "cloud_missing": [],
  "framework_missing": [],
  "experience_missing": [],
  "certifications_missing": [],
  "strengths": [],
  "addressable_gaps": [],
  "critical_gaps": [],
  "recommendations": []
}

Field definitions:
- "technical_missing": Technical skills/tools mentioned in job but not in resume
- "cloud_missing": Cloud platforms/services they want that you don't list
- "framework_missing": Frameworks/libraries they want that you don't have
- "experience_missing": Types of experience they want (e.g., "startup experience", "team leadership")
- "certifications_missing": Certifications or qualifications they mention
- "strengths": Your strongest matching points (what you DO have that they want)
- "addressable_gaps": Gaps you could address in cover letter or interview
- "critical_gaps": Major gaps that are hard to overcome
- "recommendations": Actionable advice for improving your application

Analysis rules:
1. Be specific - don't just say "AI" if they want "machine learning model deployment"
2. Only list truly MISSING items - if resume mentions React and job wants React, don't list it
3. Consider synonyms (Node.js ≈ Node, JavaScript ≈ JS)
4. Identify what you CAN emphasize vs what you truly lack
5. Distinguish between "nice to have" vs "required" based on job language

DO NOT ask questions.
DO NOT add explanations outside the JSON.

JOB POSTING:
${JSON.stringify(job, null, 2)}

CANDIDATE RESUME:
${JSON.stringify(resume, null, 2)}
`;

  return await runJsonTask<GapAnalysis>(
    agent, 
    prompt, 
    {
      technical_missing: [],
      cloud_missing: [],
      framework_missing: [],
      experience_missing: [],
      certifications_missing: [],
      strengths: [],
      addressable_gaps: [],
      critical_gaps: [],
      recommendations: []
    }, 
    "gap"
  );
}
