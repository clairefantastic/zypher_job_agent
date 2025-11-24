import type { ZypherAgent } from "@corespeed/zypher";
import { runJsonTask } from "./utils.ts";
import type { ResumeProfile } from "./types.ts";

export async function analyzeResume(
  agent: ZypherAgent,
  resume: string,
  linkedin: string,
): Promise<ResumeProfile> {
  const prompt = `
You are an expert resume parser that extracts comprehensive structured information.

Return ONLY valid JSON in this EXACT structure:

{
  "name": "",
  "summary": "",
  "skills": [],
  "experience": [],
  "education": [],
  "certifications": [],
  "projects": [],
  "achievements": [],
  "technical_skills": [],
  "languages": [],
  "frameworks": [],
  "cloud": [],
  "database": [],
  "years_experience": "",
  "roles": []
}

Field extraction guidelines:

**name**: Candidate's full name

**summary**: Professional summary or headline (1-2 sentences about their career focus)

**skills**: All skills mentioned (technical and soft skills combined)

**experience**: Array of work experiences, each object containing:
  - title: Job title
  - company: Company name
  - duration: Time period (e.g., "Jan 2020 - Present", "2 years")
  - responsibilities: Array of key responsibilities/duties
  - achievements: Array of notable accomplishments/impacts

**education**: Array of education entries:
  - degree: Degree name (e.g., "BS Computer Science")
  - institution: School name
  - year: Graduation year or time period

**certifications**: Array of certifications/licenses (e.g., "AWS Solutions Architect", "PMP")

**projects**: Array of projects:
  - name: Project name
  - description: What it does/what they built
  - technologies: Array of technologies used

**achievements**: Notable career achievements, awards, or quantifiable impacts

**technical_skills**: All technical skills, tools, languages (comprehensive list)

**languages**: Programming languages specifically (e.g., "JavaScript", "Python", "Java")

**frameworks**: Frameworks and libraries (e.g., "React", "Django", "Spring Boot")

**cloud**: Cloud platforms and services (e.g., "AWS", "Azure", "GCP", "Docker", "Kubernetes")

**database**: Database technologies (e.g., "PostgreSQL", "MongoDB", "Redis")

**years_experience**: Total years of professional experience (e.g., "5 years", "3-5 years")

**roles**: Previous job titles held

Parsing rules:
1. Extract ALL relevant information - be comprehensive
2. For experience, capture both responsibilities AND achievements
3. Quantify whenever possible (percentages, numbers, scale)
4. Separate technical skills into appropriate categories
5. If LinkedIn data supplements resume data, merge them intelligently
6. Remove duplicates across categories
7. Maintain chronological order for experience (most recent first)
8. If information is missing, use empty strings/arrays

DO NOT ask questions.
DO NOT request clarification.
DO NOT add explanations.
NEVER output anything except the JSON object.

RESUME CONTENT:
${resume}

${linkedin ? `\nLINKEDIN PROFILE:\n${linkedin}` : ''}
`;

  return await runJsonTask<ResumeProfile>(
    agent, 
    prompt, 
    {
      name: "",
      summary: "",
      skills: [],
      experience: [],
      education: [],
      certifications: [],
      projects: [],
      achievements: [],
      technical_skills: [],
      languages: [],
      frameworks: [],
      cloud: [],
      database: [],
      years_experience: "",
      roles: []
    }, 
    "resume"
  );
}

