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
import { generateInterviewPrep } from "../agents/interview-prep.ts";
import { getQuestionCount } from "../agents/rag-advanced.ts";
import { generateCareerVisualizations } from "../agents/visualizer.ts";
import { runJobAnalysisWorkflow } from "../agents/langgraph-workflow.ts";

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
  
  // Use LangGraph workflow instead of linear pipeline
  const result = await runJobAnalysisWorkflow(
    agent,
    jobUrl,
    resumeText,
    linkedinText,
    progressCallback
  );
  
  // Generate markdown from result
  const markdown = generateMarkdown(
    result.jobInfo,
    result.resumeProfile,
    result.gaps,
    result.score,
    result.coverLetter,
    result.rewrite,
    result.company,
    result.interviewPrep,
    result.visualizations,
  );
  
  progressCallback({ 
    step: 10, 
    total: 10, 
    message: "Complete!", 
    status: "complete",
    report: markdown,
    visualizations: result.visualizations
  });
  
  return markdown;
}

// HTTP Server
Deno.serve({ port: 3000 }, async (req) => {
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
  
  // API: RAG Status
  if (url.pathname === "/api/rag-status" && req.method === "GET") {
    try {
      const count = await getQuestionCount();
      return new Response(JSON.stringify({ 
        ready: count > 0,
        questionCount: count 
      }), {
        headers: { "content-type": "application/json" }
      });
    } catch (error) {
      return new Response(JSON.stringify({ 
        ready: false,
        error: error.message 
      }), {
        status: 500,
        headers: { "content-type": "application/json" }
      });
    }
  }

  // Serve static files
  return serveDir(req, {
    fsRoot: ".",
    urlRoot: "",
    quiet: true,
  });
});

console.log("🚀 Server running at http://localhost:3000");
console.log("📱 Open http://localhost:3000 in your browser");
