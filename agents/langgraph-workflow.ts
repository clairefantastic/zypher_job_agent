import { StateGraph, END, Annotation } from "@langchain/langgraph";
import type { ZypherAgent } from "@corespeed/zypher";
import { scrapeJobPosting } from "./scraper.ts";
import { parseJobPosting } from "./parser.ts";
import { analyzeResume } from "./resume.ts";
import { analyzeGaps } from "./gap.ts";
import { getCompanyInsights } from "./company.ts";
import { scoreMatch } from "./scorer.ts";
import { writeCoverLetter } from "./writer.ts";
import { rewriteResume } from "./resumeRewrite.ts";
import { generateInterviewPrep } from "./interview-prep.ts";
import { generateCareerVisualizations } from "./visualizer.ts";

// Define state annotation
const StateAnnotation = Annotation.Root({
  jobUrl: Annotation<string>,
  resumeText: Annotation<string>,
  linkedinText: Annotation<string>,
  jobRaw: Annotation<string | null>,
  jobInfo: Annotation<any>,
  resumeProfile: Annotation<any>,
  gaps: Annotation<any>,
  company: Annotation<any>,
  score: Annotation<any>,
  coverLetter: Annotation<any>,
  rewrite: Annotation<any>,
  interviewPrep: Annotation<any>,
  visualizations: Annotation<any>,
});

type State = typeof StateAnnotation.State;

// Create workflow with agent and progressCallback as closures
export function createJobAnalysisWorkflow(
  agent: ZypherAgent,
  progressCallback: (data: any) => void
) {
  
  // Node 1: Scrape
  async function scrapeJobNode(state: State) {
    console.log(`Scraping: ${state.jobUrl}`);
    progressCallback({ step: 1, total: 10, message: "Scraping job posting...", status: "progress" });
    
    const jobRaw = await scrapeJobPosting(agent, state.jobUrl);
    console.log(`Scraped ${jobRaw?.length || 0} chars`);
    
    return { jobRaw };
  }

  // Node 2: Parse
  async function parseJobNode(state: State) {
    console.log(`Parsing job data...`);
    progressCallback({ step: 2, total: 10, message: "Parsing job details...", status: "progress" });
    
    const jobInfo = await parseJobPosting(agent, state.jobRaw);
    console.log(`Parsed job: ${jobInfo?.title || 'Unknown'}`);
    
    return { jobInfo };
  }

  // Node 3: Analyze Resume
  async function analyzeResumeNode(state: State) {
    console.log(`Analyzing resume...`);
    progressCallback({ step: 3, total: 10, message: "Analyzing your resume...", status: "progress" });
    
    const resumeProfile = await analyzeResume(agent, state.resumeText, state.linkedinText);
    console.log(`Resume analyzed: ${resumeProfile?.name || 'Candidate'}`);
    
    return { resumeProfile };
  }

  // Node 4: Compute Gaps
  async function computeGapsNode(state: State) {
    console.log(`Computing gaps...`);
    progressCallback({ step: 4, total: 10, message: "Computing skill gaps...", status: "progress" });
    
    const gaps = await analyzeGaps(agent, state.jobInfo, state.resumeProfile);
    console.log(`Found ${gaps?.technical_missing?.length || 0} missing skills`);
    
    return { gaps };
  }

  // Node 5: Research Company
  async function researchCompanyNode(state: State) {
    console.log(`🏢 Researching company...`);
    progressCallback({ step: 5, total: 10, message: "Researching company...", status: "progress" });
    
    const company = await getCompanyInsights(agent, state.jobUrl, state.jobInfo);
    console.log(`Company: ${company?.name || state.jobInfo?.company || 'Unknown'}`);
    
    return { company };
  }

  // Node 6: Score Match
  async function scoreMatchNode(state: State) {
    console.log(`📊 Scoring match...`);
    progressCallback({ step: 6, total: 10, message: "Scoring your match...", status: "progress" });
    
    const score = await scoreMatch(agent, state.jobInfo, state.resumeProfile, state.company, state.gaps);
    console.log(`Score: ${score?.overall_score || 0}%`);
    
    return { score };
  }

  // Node 7a: Full Analysis
  async function fullAnalysisNode(state: State) {
    console.log("Running FULL analysis (high score)");
    
    progressCallback({ step: 7, total: 10, message: "Writing cover letter...", status: "progress" });
    const coverLetter = await writeCoverLetter(agent, state.jobInfo, state.resumeProfile, state.company, state.score, state.gaps);
    
    progressCallback({ step: 8, total: 10, message: "Generating resume tips...", status: "progress" });
    const rewrite = await rewriteResume(agent, state.jobInfo, state.resumeProfile, state.gaps, state.score);
    
    progressCallback({ step: 9, total: 10, message: "Preparing interview questions (RAG)...", status: "progress" });
    let interviewPrep = null;
    try {
      interviewPrep = await generateInterviewPrep(agent, state.jobInfo, state.resumeText, state.jobInfo?.company || "Company");
    } catch (error) {
      console.error("Interview prep failed:", error.message);
    }
    
    progressCallback({ step: 10, total: 10, message: "Generating visualizations...", status: "progress" });
    let visualizations = null;
    try {
      visualizations = await generateCareerVisualizations(agent, state.resumeProfile, state.jobInfo, state.gaps);
    } catch (error) {
      console.error("Visualization failed:", error.message);
    }
    
    return { coverLetter, rewrite, interviewPrep, visualizations };
  }

  // Node 7b: Quick Feedback
  async function quickFeedbackNode(state: State) {
    console.log("Running QUICK feedback (low score)");
    
    progressCallback({ step: 7, total: 10, message: "Generating quick feedback (low match score)...", status: "progress" });
    const rewrite = await rewriteResume(agent, state.jobInfo, state.resumeProfile, state.gaps, state.score);
    
    progressCallback({ step: 10, total: 10, message: "Analysis complete (focused on improvements)", status: "progress" });
    return { 
      rewrite, 
      coverLetter: null, 
      interviewPrep: null, 
      visualizations: null 
    };
  }

  // Conditional routing
  function routeAfterScore(state: State): string {
    const score = state.score?.overall_score || 0;
    console.log(`🔀 Routing decision: Score = ${score}%`);
    
    if (score >= 60) {
      console.log("   High score → Full analysis path");
      return "fullAnalysis";
    } else {
      console.log("   Low score → Quick feedback path");
      return "quickFeedback";
    }
  }

  // Build the graph with proper entry point
  const workflow = new StateGraph(StateAnnotation)
    .addNode("scrapeJob", scrapeJobNode)
    .addNode("parseJob", parseJobNode)
    .addNode("analyzeResume", analyzeResumeNode)
    .addNode("computeGaps", computeGapsNode)
    .addNode("researchCompany", researchCompanyNode)
    .addNode("scoreMatch", scoreMatchNode)
    .addNode("fullAnalysis", fullAnalysisNode)
    .addNode("quickFeedback", quickFeedbackNode)
    .addEdge("scrapeJob", "parseJob")
    .addEdge("parseJob", "analyzeResume")
    .addEdge("analyzeResume", "computeGaps")
    .addEdge("computeGaps", "researchCompany")
    .addEdge("researchCompany", "scoreMatch")
    .addConditionalEdges("scoreMatch", routeAfterScore, {
      fullAnalysis: "fullAnalysis",
      quickFeedback: "quickFeedback"
    })
    .addEdge("fullAnalysis", END)
    .addEdge("quickFeedback", END)
    .setEntryPoint("scrapeJob");  
  
  return workflow.compile();
}

// Main function to run the workflow
export async function runJobAnalysisWorkflow(
  agent: ZypherAgent,
  jobUrl: string,
  resumeText: string,
  linkedinText: string,
  progressCallback: (data: any) => void
) {
  console.log("Starting LangGraph workflow...");
  console.log(`   Job URL: ${jobUrl}`);
  console.log(`   Resume length: ${resumeText.length} chars`);
  
  // Create workflow
  const workflow = createJobAnalysisWorkflow(agent, progressCallback);
  
  // Initial state
  const initialState = {
    jobUrl,
    resumeText,
    linkedinText,
    jobRaw: null,
    jobInfo: null,
    resumeProfile: null,
    gaps: null,
    company: null,
    score: null,
    coverLetter: null,
    rewrite: null,
    interviewPrep: null,
    visualizations: null,
  };
  
  const result = await workflow.invoke(initialState);
  
  console.log("LangGraph workflow complete!");
  console.log(`   Final score: ${result.score?.overall_score || 0}%`);
  
  return result;
}