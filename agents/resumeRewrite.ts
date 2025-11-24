import { runJsonTask } from "./utils.ts";
import type { ZypherAgent } from "@corespeed/zypher";
import type { JobInfo, ResumeProfile, GapAnalysis, MatchScore, ResumeRewrite } from "./types.ts";

export async function rewriteResume(
  agent: ZypherAgent,
  job: JobInfo,
  resume: ResumeProfile,
  gaps: GapAnalysis,
  score: MatchScore,
): Promise<ResumeRewrite> {
  const prompt = `
You are an expert resume writer specializing in ATS optimization and tailoring resumes to specific job postings.

Return ONLY valid JSON in this EXACT structure:

{
  "suggestions": [],
  "bullet_improvements": [],
  "keywords_to_add": [],
  "sections_to_emphasize": []
}

Field definitions:

**suggestions**: Array of high-level strategic suggestions (3-5 items) for improving the resume for this specific job. Examples:
- "Reorganize experience to lead with AI/ML projects"
- "Add a 'Technical Projects' section highlighting design tools"
- "Quantify team leadership impact with metrics"

**bullet_improvements**: Array of specific bullet point rewrites (5-10 items). Each object contains:
- section: Where this bullet appears (e.g., "Experience - Senior Frontend Engineer at XYZ")
- original: The current bullet point text from the resume
- improved: Rewritten version optimized for this job
- rationale: Why this change helps (1 sentence)

**keywords_to_add**: Array of important keywords from the job posting that should be naturally incorporated into the resume (focus on ATS optimization)

**sections_to_emphasize**: Array of resume sections/experiences that are most relevant to this role and should be highlighted or expanded

Rewriting principles:
1. Use the STAR method (Situation, Task, Action, Result)
2. Include quantifiable metrics whenever possible (%, $, time saved, scale)
3. Mirror keywords from the job posting naturally
4. Lead with action verbs (Built, Led, Optimized, Architected, etc.)
5. Emphasize impacts that align with job responsibilities
6. Address gaps by reframing existing experience
7. Make bullets specific and concrete, not vague
8. Keep bullets concise (1-2 lines max)

Analysis approach:
- Review the job's required_skills, tech_stack, and responsibilities
- Identify which resume bullets are most relevant
- Look for opportunities to add keywords from the job posting
- Focus on experiences that address the identified gaps
- Emphasize strengths identified in the match score

DO NOT ask questions.
DO NOT request more information.
DO NOT add explanations outside the JSON.
NEVER output anything except the JSON object.

JOB POSTING:
${JSON.stringify(job, null, 2)}

CANDIDATE RESUME:
${JSON.stringify(resume, null, 2)}

GAP ANALYSIS:
${JSON.stringify(gaps, null, 2)}

MATCH SCORE:
${JSON.stringify(score, null, 2)}
`;

  return await runJsonTask<ResumeRewrite>(
    agent, 
    prompt, 
    {
      suggestions: [],
      bullet_improvements: [],
      keywords_to_add: [],
      sections_to_emphasize: []
    }, 
    "rewrite"
  );
}