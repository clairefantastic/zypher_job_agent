import type { ZypherAgent } from "@corespeed/zypher";
import { runJsonTask } from "./utils.ts";
import type { JobInfo, ResumeProfile, CompanyInsights, MatchScore, GapAnalysis, CoverLetter } from "./types.ts";

export async function writeCoverLetter(
  agent: ZypherAgent,
  job: JobInfo,
  resume: ResumeProfile,
  company: CompanyInsights,
  score: MatchScore,
  gaps: GapAnalysis,
): Promise<CoverLetter> {
  const prompt = `
You are an expert cover letter writer specializing in technology roles.

Write a compelling, personalized cover letter and return ONLY valid JSON:

{
  "draft": "",
  "key_points": [],
  "tone": ""
}

**draft**: The complete 3-4 paragraph cover letter as a single string. Use \n\n for paragraph breaks.

**key_points**: 3-5 bullet points summarizing the main selling points in the letter

**tone**: Description of the tone used (e.g., "Professional and enthusiastic", "Confident and technical")

Cover letter structure:

**Paragraph 1 (Opening)**: 
- Express genuine interest in the specific role at this specific company
- Show you understand what the company does and their mission
- Hook with your most relevant credential or achievement
- Reference company insights if available

**Paragraph 2 (Your Relevant Experience)**:
- Highlight 2-3 most relevant experiences from your resume
- Connect them directly to job responsibilities
- Use specific examples with quantifiable results
- Demonstrate you can do the core job requirements
- Reference your strengths from the match score

**Paragraph 3 (Addressing Gaps & Cultural Fit)**:
- If there are addressable gaps, acknowledge and reframe them positively
- Show enthusiasm for learning or growth areas
- Demonstrate cultural fit using company values/culture insights
- Explain why this role/company excites you specifically
- Show soft skills that matter (ownership, collaboration, ambiguity handling)

**Paragraph 4 (Closing)**:
- Reiterate enthusiasm for the opportunity
- Call to action (looking forward to discussion)
- Professional sign-off

Writing guidelines:
1. Be specific - use actual company name, role title, technologies
2. Be genuine - avoid generic phrases like "dynamic team" or "exciting opportunity"
3. Show, don't tell - use concrete examples, not claims
4. Mirror their language - use terms from the job posting
5. Be concise - each paragraph should be 3-5 sentences
6. Professional but personable - match company culture
7. Focus on what you can do for THEM, not what they can do for you
8. Address the hiring manager generically ("Dear Hiring Team" or "Dear [Company] Team")

Use these insights to write the letter:
- Emphasize strengths: ${score.strengths?.join(", ") || "your relevant experience"}
- Address gaps tactfully: ${gaps.addressable_gaps?.join(", ") || "none"}
- Highlight cultural alignment with: ${company.culture || company.values?.join(", ") || "the company mission"}

DO NOT:
- Ask questions
- Request more information
- Use markdown formatting in the letter text
- Add explanations outside the JSON
- Be generic or use templates
- Exaggerate or lie

CANDIDATE INFO:
Name: ${resume.name || ""}
Years Experience: ${resume.years_experience || ""}
Top Skills: ${resume.technical_skills?.slice(0, 5).join(", ") || ""}
Recent Role: ${resume.experience?.[0]?.title || ""} at ${resume.experience?.[0]?.company || ""}

JOB INFO:
${JSON.stringify(job, null, 2)}

COMPANY:
${JSON.stringify(company, null, 2)}

MATCH SCORE:
${JSON.stringify(score, null, 2)}

GAPS:
${JSON.stringify(gaps, null, 2)}
`;

  return await runJsonTask<CoverLetter>(
    agent,
    prompt,
    {
      draft: "Unable to generate cover letter",
      key_points: [],
      tone: "Professional"
    },
    "cover-letter"
  );
}
