import "jsr:@std/dotenv/load";
import {
  AnthropicModelProvider,
  createZypherContext,
  ZypherAgent,
} from "@corespeed/zypher";
import { eachValueFrom } from "rxjs-for-await";

// Setup: Check if user provided a URL
const jobUrl = Deno.args[0];
if (!jobUrl) {
  console.error("Error: Please provide a Job URL.");
  console.log("Usage: deno run -A main.ts <JOB_URL>");
  Deno.exit(1);
}

// Initialize Zypher Context (silently)
const zypherContext = await createZypherContext(Deno.cwd());

// Create the Agent
const agent = new ZypherAgent(
  zypherContext,
  new AnthropicModelProvider({
    apiKey: Deno.env.get("ANTHROPIC_API_KEY"),
  }),
);

// Register Firecrawl MCP (silently)
try {
  await agent.mcp.registerServer({
    id: "firecrawl",
    type: "command",
    command: {
      command: "npx",
      args: ["-y", "firecrawl-mcp"],
      env: {
        FIRECRAWL_API_KEY: Deno.env.get("FIRECRAWL_API_KEY"),
      },
    },
  });
  
  // Wait for MCP server to initialize
  await new Promise(resolve => setTimeout(resolve, 2000));
} catch (error) {
  console.error("Failed to register Firecrawl MCP:", error);
  Deno.exit(1);
}

// Read local resume (silently)
let resumeContent = "";
try {
  resumeContent = await Deno.readTextFile("./resume.txt");
} catch (error) {
  console.error("Error: Could not find resume.txt in the root folder.");
  console.error("Details:", error.message);
  Deno.exit(1);
}

// Define the Goal
const taskPrompt = `
I am applying for a job. The job posting URL is: ${jobUrl}

Here is my current resume:
---
${resumeContent}
---

Please complete these tasks:

1. First, use the Firecrawl MCP tool to scrape the complete job description from the URL above. Make sure to extract all requirements, qualifications, and responsibilities.

2. After you have the job description, carefully analyze the gap between my resume and what the job requires.

3. Create a section titled "MISSING KEYWORDS" that lists:
   - Technical skills mentioned in the job that I don't have on my resume
   - Qualifications or certifications they want that I haven't mentioned
   - Experience areas they emphasize that I should highlight more

4. Create a section titled "DRAFT COVER LETTER" that:
   - Is specifically tailored to this company and role
   - Highlights how my experience matches their needs
   - Addresses any gaps positively
   - Is professional but personable
   - Is 3-4 paragraphs long

Please structure your response clearly with these section headers.
`;

// Run the Task
let event$;
try {
  event$ = agent.runTask(taskPrompt, "claude-sonnet-4-20250514");
} catch (e) {
  try {
    event$ = agent.runTask(taskPrompt, {
      model: "claude-sonnet-4-20250514",
    });
  } catch (e2) {
    console.error("Could not initialize task:", e2);
    Deno.exit(1);
  }
}

// Collect output silently
let fullOutput = "";
let hasContent = false;

try {
  for await (const event of eachValueFrom(event$)) {
    if (event.type === "content_block" && event.content.type === "text") {
      hasContent = true;
      fullOutput += event.content.text;
    } else if (event.type === "message" && event.message) {
      hasContent = true;
      const content = event.message.content;
      if (Array.isArray(content)) {
        for (const block of content) {
          if (block.type === "text") {
            fullOutput += block.text;
          }
        }
      }
    } else if (event.type === "error") {
      console.error("Error event:", JSON.stringify(event, null, 2));
    }
  }
} catch (error) {
  console.error("Error during task execution:", error);
  Deno.exit(1);
}

if (!hasContent) {
  console.log("Warning: No content was generated. Check your API keys and MCP setup.");
  Deno.exit(1);
}

console.log(fullOutput);