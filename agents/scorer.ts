import { runJsonTask } from "./utils.ts";
import type { ZypherAgent } from "@corespeed/zypher";
import type { JobInfo, ResumeProfile, GapAnalysis, MatchScore, CompanyInsights } from "./types.ts";

export async function scoreMatch(
  agent: ZypherAgent,
  job: JobInfo,
  resume: ResumeProfile,
  company: CompanyInsights,
  gaps: GapAnalysis,
): Promise<MatchScore> {
  const prompt = `
You are an expert hiring matcher that scores how well a candidate fits a job posting.

Return ONLY valid JSON in this EXACT structure:

{
  "overall_score": 0,
  "skills_match": 0,
  "experience_match": 0,
  "cultural_fit": 0,
  "recommendation": "",
  "strengths": [],
  "weaknesses": []
}

Scoring guidelines:

**overall_score** (0-100): Weighted average calculated as:
- skills_match: 50% weight
- experience_match: 30% weight
- cultural_fit: 20% weight

**skills_match** (0-100): Technical alignment score based on:
- How many required skills the candidate has (heavily weighted)
- How many preferred/nice-to-have skills they have
- Depth of experience with key technologies in the tech stack
- Relevant frameworks, languages, cloud platforms, databases
- Consider: missing critical skills = major penalty, missing nice-to-haves = minor penalty

**experience_match** (0-100): Experience alignment based on:
- Years of experience vs requirements (under = penalty, over = slight bonus)
- Relevance of previous roles to this position
- Industry experience relevance
- Leadership/team experience if required
- Scale of previous work (startup vs enterprise, team size, user base)

**cultural_fit** (0-100): Cultural and soft skills alignment:
- Company values alignment based on company insights
- Work style fit (startup vs corporate, fast-paced vs methodical)
- Soft skills mentioned in job vs demonstrated in resume
- Remote work experience if remote role
- Autonomy/ownership if emphasized in job posting

**recommendation** (string): One of these exact phrases:
- "Strong Match - Highly Recommended" (overall_score >= 80)
- "Good Match - Recommended" (overall_score >= 65)
- "Moderate Match - Consider Applying" (overall_score >= 50)
- "Weak Match - Apply with Caution" (overall_score < 50)

**strengths** (array): 3-5 specific strengths that make this candidate competitive. Examples:
- "Strong React and TypeScript experience matches core tech stack"
- "3 years of e-commerce dashboard experience directly relevant"
- "Proven track record of performance optimization (40% improvement)"
- "Team leadership experience aligns with growing team needs"

**weaknesses** (array): 3-5 specific gaps or concerns. Examples:
- "No demonstrated experience with AI/ML integration"
- "Limited exposure to design tools or pixel-level UI work"
- "No startup experience, primarily enterprise background"
- "Missing required AWS certification"

Scoring calibration:
- 90-100: Exceptional fit, rare candidate
- 80-89: Strong fit, should definitely apply
- 65-79: Good fit, competitive applicant
- 50-64: Moderate fit, worth applying but expect competition
- 30-49: Weak fit, significant gaps to address
- 0-29: Poor fit, likely not qualified

Be realistic and honest. Don't inflate scores. Consider:
- Required vs preferred skills (required matters much more)
- Critical gaps vs addressable gaps
- Industry standards for the role level
- Company stage and needs

DO NOT ask questions.
DO NOT request more information.
DO NOT add explanations outside JSON.
NEVER output anything except the JSON object.

JOB POSTING:
${JSON.stringify(job, null, 2)}

CANDIDATE RESUME:
${JSON.stringify(resume, null, 2)}

COMPANY INSIGHTS:
${JSON.stringify(company, null, 2)}

GAP ANALYSIS:
${JSON.stringify(gaps, null, 2)}
`;

  return await runJsonTask<MatchScore>(
    agent, 
    prompt, 
    {
      overall_score: 0,
      skills_match: 0,
      experience_match: 0,
      cultural_fit: 0,
      recommendation: "Unable to assess",
      strengths: [],
      weaknesses: []
    }, 
    "score"
  );
}

