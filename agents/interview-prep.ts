import type { ZypherAgent } from "@corespeed/zypher";
import { getRelevantQuestionsAdvanced } from './rag-advanced.ts'; 
import { runJsonTask } from './utils.ts';

export interface InterviewPrep {
  questions: Array<{
    question: string;
    category: string;
    why_likely: string;
    answer_template: string;
    resume_examples: string[];
    retrieval_source?: string;  
  }>;
  emphasis_points: string[];
  preparation_tips: string[];
  rag_stats?: {  
    total_retrieved: number;
    retrieval_method: string;
    avg_relevance: number;
  };
}

export async function generateInterviewPrep(
  agent: ZypherAgent,
  jobPosting: any,
  resume: string,
  companyName: string
): Promise<InterviewPrep> {
  console.log(`Generating interview prep for ${companyName}...`);
  
  // Build search text
  const searchText = [
    jobPosting.title,
    jobPosting.job_summary,
    jobPosting.description,
    jobPosting.responsibilities?.join(' '),
    jobPosting.required_skills?.join(' '),
  ].filter(Boolean).join(' ').slice(0, 2000);
  
  if (!searchText || searchText.trim().length === 0) {
    console.log("No job description for RAG search");
    return generateFallbackPrep(companyName);
  }
  
  // Use RAG
  const ragQuestions = await getRelevantQuestionsAdvanced(
    agent,
    searchText,
    companyName,
    15
  );
  
  console.log(`RAG retrieved ${ragQuestions.length} questions`);
  
  // Calculate stats
  const avgRelevance = ragQuestions.length > 0
    ? ragQuestions.reduce((sum, q) => sum + q.relevance, 0) / ragQuestions.length
    : 0;
  
  // Generate personalized prep
  const prompt = `
You are an expert interview coach.

**Job Details:**
- Title: ${jobPosting.title}
- Company: ${companyName}
- Summary: ${jobPosting.job_summary || 'Not provided'}
- Required Skills: ${jobPosting.required_skills?.join(', ') || 'Not specified'}

**Candidate's Resume:**
${resume}

**Relevant Interview Questions (from RAG with hybrid search):**
${ragQuestions.length > 0 
  ? ragQuestions.map((q, i) => `${i+1}. ${q.question} [${q.category}] (relevance: ${(q.relevance * 100).toFixed(0)}%)`).join('\n') 
  : 'No specific company questions - generate relevant questions'}

**Task:**
Generate TOP 5 MOST LIKELY questions with:
- WHY each is likely
- STAR format answer template using candidate's experiences
- Specific resume examples

Also provide:
- 3-4 emphasis points
- 3-4 preparation tips

Return JSON:
{
  "questions": [{
    "question": "...",
    "category": "behavioral|technical|system-design|product|leadership",
    "why_likely": "...",
    "answer_template": "...",
    "resume_examples": ["..."]
  }],
  "emphasis_points": ["..."],
  "preparation_tips": ["..."]
}
`;

  const fallback = generateFallbackPrep(companyName, ragQuestions);

  try {
    const result = await runJsonTask<InterviewPrep>(
      agent,
      prompt,
      fallback,
      "interview-prep"
    );
    
    // Add RAG stats
    result.rag_stats = {
      total_retrieved: ragQuestions.length,
      retrieval_method: ragQuestions[0]?.retrieval_method || 'unknown',
      avg_relevance: avgRelevance
    };
    
    // Tag questions with retrieval source
    result.questions = result.questions.map(q => ({
      ...q,
      retrieval_source: 'hybrid-rag'
    }));
    
    console.log(`Generated prep with ${result.questions.length} questions (avg relevance: ${(avgRelevance * 100).toFixed(1)}%)`);
    return result;
    
  } catch (error) {
    console.error("Error generating interview prep:", error);
    return fallback;
  }
}

function generateFallbackPrep(companyName: string, ragQuestions: any[] = []): InterviewPrep {
  return {
    questions: ragQuestions.slice(0, 5).map(q => ({
      question: q.question,
      category: q.category,
      why_likely: `Common question for ${q.category} interviews at ${companyName}`,
      answer_template: "Use STAR format: Situation, Task, Action, Result",
      resume_examples: ["Review your resume for relevant examples"],
      retrieval_source: 'rag-fallback'
    })),
    emphasis_points: [
      "Review the job description carefully",
      "Prepare specific examples from your experience",
      "Research the company culture"
    ],
    preparation_tips: [
      "Practice STAR format answers",
      "Prepare questions to ask the interviewer",
      "Review your resume thoroughly",
      "Research recent company news"
    ],
    rag_stats: {
      total_retrieved: ragQuestions.length,
      retrieval_method: 'fallback',
      avg_relevance: 0
    }
  };
}