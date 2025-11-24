import { runJsonTask } from "./utils.ts";
import type { JobInfo } from "./types.ts";
import type { ZypherAgent } from "@corespeed/zypher";

export async function parseJobPosting(
  agent: ZypherAgent,
  jobContent: string,
): Promise<JobInfo> {
  const prompt = `
You are an expert job posting parser that extracts structured information from raw webpage text.

You must output ONLY valid JSON matching EXACTLY this structure:

{
  "title": "",
  "company": "",
  "location": "",
  "department": "",
  "job_summary": "",
  "responsibilities": [],
  "preferred_skills": [],
  "required_skills": [],
  "qualifications": [],
  "tech_stack": [],
  "years_experience": "",
  "nice_to_have": [],
  "salary_range": "",
  "employment_type": "",
  "remote_policy": ""
}

Field extraction guidelines:

**title**: The exact job title as posted

**company**: Company name

**location**: Physical location or "Remote" or "Hybrid"

**department**: Team/department (e.g., "Engineering", "Founding team")

**job_summary**: 2-4 sentence overview of the role. Extract from intro paragraphs or "About the role" sections.

**responsibilities**: Array of key job duties. Look for sections like:
- "Responsibilities"
- "What you'll do"
- "You will"
Extract each as a separate bullet point. Be specific.

**required_skills**: Hard requirements they explicitly need. Look for:
- "Required"
- "Must have"
- "You have"
- Years of experience with specific technologies
Extract specific skills/tools, not vague statements.

**preferred_skills**: Nice-to-haves. Look for:
- "Preferred"
- "Nice to have"
- "Bonus"
- "Plus"

**qualifications**: Education, certifications, or broad qualifications like "5+ years experience"

**tech_stack**: Specific technologies, languages, frameworks, tools mentioned (e.g., "React", "Python", "AWS", "PostgreSQL")

**years_experience**: Required years of experience (e.g., "3-5 years", "5+ years")

**nice_to_have**: Additional beneficial skills/experience not strictly required

**salary_range**: If mentioned (e.g., "$120k-$180k", "Competitive")

**employment_type**: "Full-time", "Part-time", "Contract", etc.

**remote_policy**: "Remote", "On-site", "Hybrid", or description of remote work policy

Extraction rules:
1. Be thorough - extract ALL relevant information, don't summarize
2. Keep exact wording where important (e.g., tech names)
3. Separate distinct items into array elements
4. If a section isn't present, use empty string/array
5. Don't infer information that isn't explicitly stated
6. Remove markdown formatting, navigation elements, and UI text
7. Focus on job content, ignore company boilerplate like "equal opportunity employer"

DO NOT ask questions.
DO NOT request more data.
DO NOT add explanations.
NEVER output anything except the JSON object.

RAW WEBPAGE CONTENT:
${jobContent.slice(0, 30000)}
`;

  return await runJsonTask<JobInfo>(
    agent, 
    prompt, 
    {
      title: "",
      company: "",
      location: "",
      department: "",
      job_summary: "",
      responsibilities: [],
      preferred_skills: [],
      required_skills: [],
      qualifications: [],
      tech_stack: [],
      years_experience: "",
      nice_to_have: [],
      salary_range: "",
      employment_type: "",
      remote_policy: ""
    }, 
    "parser"
  );
}