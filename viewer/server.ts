import "jsr:@std/dotenv/load";
import { serveDir } from "https://deno.land/std@0.224.0/http/file_server.ts";
import { createZypherContext, ZypherAgent, AnthropicModelProvider } from "@corespeed/zypher";
import { scrapeJobPosting } from "../agents/scraper.ts";
import { parseJobPosting } from "../agents/parser.ts";
import { analyzeResume } from "../agents/resume.ts";
import { analyzeGaps } from "../agents/gap.ts";
import { getCompanyInsights } from "../agents/company.ts";
import { scoreMatch } from "../agents/scorer.ts";
import { writeCoverLetter } from "../agents/writer.ts";
import { rewriteResume } from "../agents/resumeRewrite.ts";
import { generateMarkdown } from "../markdown.ts";

// Initialize Zypher agent once
let agent: ZypherAgent | null = null;

async function initializeAgent() {
  if (agent) return agent;
  
  console.log("🧠 Initializing Zypher Agent...");
  const zypherContext = await createZypherContext(Deno.cwd());
  
  agent = new ZypherAgent(
    zypherContext,
    new AnthropicModelProvider({
      apiKey: Deno.env.get("ANTHROPIC_API_KEY") ?? "",
    }),
  );

  // Register Firecrawl MCP
  console.log("🔌 Registering Firecrawl MCP...");
  await agent.mcp.registerServer({
    id: "firecrawl",
    type: "command",
    command: {
      command: "npx",
      args: ["-y", "firecrawl-mcp"],
      env: {
        FIRECRAWL_API_KEY: Deno.env.get("FIRECRAWL_API_KEY") ?? "",
      },
    },
  });

  await new Promise((resolve) => setTimeout(resolve, 2000));
  console.log("✅ Agent ready!");
  
  return agent;
}

// Run analysis pipeline
async function runAnalysis(
  jobUrl: string,
  resumeText: string,
  linkedinText: string,
  progressCallback: (data: any) => void
) {
  const agent = await initializeAgent();
  
  // Step 1: Scrape
  progressCallback({ step: 1, total: 8, message: "Scraping job posting...", status: "progress" });
  const jobRaw = await scrapeJobPosting(agent, jobUrl);
  
  // Step 2: Parse
  progressCallback({ step: 2, total: 8, message: "Parsing job details...", status: "progress" });
  const jobInfo = await parseJobPosting(agent, jobRaw);
  
  // Step 3: Resume
  progressCallback({ step: 3, total: 8, message: "Analyzing your resume...", status: "progress" });
  const resumeProfile = await analyzeResume(agent, resumeText, linkedinText);
  
  // Step 4: Gaps
  progressCallback({ step: 4, total: 8, message: "Computing skill gaps...", status: "progress" });
  const gaps = await analyzeGaps(agent, jobInfo, resumeProfile);
  
  // Step 5: Company
  progressCallback({ step: 5, total: 8, message: "Researching company...", status: "progress" });
  const company = await getCompanyInsights(agent, jobUrl, jobInfo);
  
  // Step 6: Score
  progressCallback({ step: 6, total: 8, message: "Scoring your match...", status: "progress" });
  const score = await scoreMatch(agent, jobInfo, resumeProfile, company, gaps);
  
  // Step 7: Cover Letter
  progressCallback({ step: 7, total: 8, message: "Writing cover letter...", status: "progress" });
  const coverLetter = await writeCoverLetter(agent, jobInfo, resumeProfile, company, score, gaps);
  
  // Step 8: Resume Tips
  progressCallback({ step: 8, total: 8, message: "Generating resume tips...", status: "progress" });
  const rewrite = await rewriteResume(agent, jobInfo, resumeProfile, gaps, score);
  
  // Generate final report
  const markdown = generateMarkdown(
    jobInfo,
    resumeProfile,
    gaps,
    score,
    coverLetter,
    rewrite,
    company,
  );
  
  progressCallback({ 
    step: 8, 
    total: 8, 
    message: "Analysis complete!", 
    status: "complete",
    report: markdown
  });
  
  return markdown;
}

// HTTP Server
Deno.serve(async (req) => {
  const url = new URL(req.url);

  // API: Start Analysis
  if (url.pathname === "/api/analyze" && req.method === "POST") {
    try {
      const { jobUrl, resume, linkedin } = await req.json();

      if (!jobUrl || !resume) {
        return new Response(JSON.stringify({ error: "Missing required fields" }), {
          status: 400,
          headers: { "content-type": "application/json" },
        });
      }

      // Create SSE stream for progress updates
      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          
          const sendProgress = (data: any) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          };

          try {
            await runAnalysis(jobUrl, resume, linkedin || "", sendProgress);
            controller.close();
          } catch (error) {
            console.error("Analysis error:", error);
            sendProgress({ 
              status: "error", 
              message: "Analysis failed: " + error.message 
            });
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          "content-type": "text/event-stream",
          "cache-control": "no-cache",
          "connection": "keep-alive",
        },
      });

    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }
  }

  // Serve static files
  return serveDir(req, {
    fsRoot: "./viewer",
    urlRoot: "",
    quiet: true,
  });
});

console.log("🚀 Server running at http://localhost:8000");
console.log("📱 Open http://localhost:8000 in your browser");
