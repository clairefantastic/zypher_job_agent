import type { ZypherAgent } from "@corespeed/zypher";
import { runJsonTask, runZypherTask } from "./utils.ts";
import type { CompanyInsights, JobInfo } from "./types.ts";

/**
 * Gets company insights by scraping their website and analyzing the content
 */
export async function getCompanyInsights(
  agent: ZypherAgent,
  jobUrl: string,
  job: JobInfo,
): Promise<CompanyInsights> {
  
  // Step 1: Try to extract company homepage from job URL
  let companyDomain = "";
  try {
    const url = new URL(jobUrl);
    // Extract base domain 
    const pathParts = url.pathname.split('/').filter(p => p);
    if (pathParts.length > 0) {
      companyDomain = pathParts[0];
    }
  } catch {
    companyDomain = job.company?.toLowerCase().replace(/\s+/g, '') || "";
  }

  // Guess common homepage patterns
  const possibleUrls = [
    `https://${companyDomain}.com`,
    `https://www.${companyDomain}.com`,
    `https://${companyDomain}.io`,
  ];

  console.log(`Attempting to scrape: ${possibleUrls[0]}`);

  // Step 2: Scrape the company homepage
  const scrapePrompt = `
Use the Firecrawl MCP tool to scrape the company homepage.

CRITICAL: You MUST call the "crawl" tool from "firecrawl" MCP server.

Try scraping: ${possibleUrls[0]}

Parameters:
{
  "url": "${possibleUrls[0]}",
  "maxDepth": 1,
  "includeSelectors": ["body"]
}

After receiving the result, return ONLY the scraped text content.
DO NOT explain what you're doing.
DO NOT ask questions.
`;

  let companyPageContent = "";
  try {
    companyPageContent = await runZypherTask(agent, scrapePrompt);
    
    // Try to parse if it's JSON
    try {
      const parsed = JSON.parse(companyPageContent);
      companyPageContent = parsed.text || parsed.markdown || companyPageContent;
    } catch {
      // Already plain text
    }
    
    console.log(`Scraped ${companyPageContent.length} chars from company site`);
  } catch (e) {
    console.log(`Could not scrape company site:`, e.message);
    companyPageContent = `Company: ${job.company}\nNo additional information available.`;
  }

  // Step 3: Extract structured insights from the scraped content
  const extractPrompt = `
You are analyzing a company's website content.

Extract ONLY valid JSON in this exact structure:

{
  "name": "",
  "overview": "",
  "culture": "",
  "recent_news": [],
  "values": [],
  "size": "",
  "industry": ""
}

Rules:
- "overview": 2-3 sentence summary of what the company does
- "culture": Description of company culture, work environment, values
- "recent_news": Array of recent company news/announcements (max 3)
- "values": Array of company values/principles
- "size": Company size if mentioned (e.g., "Early stage", "50-100 employees")
- "industry": Primary industry/sector

If information is not available, use empty strings or empty arrays.
DO NOT ask questions.
DO NOT add explanations.

COMPANY NAME: ${job.company || "Unknown"}

COMPANY WEBSITE CONTENT:
${companyPageContent.slice(0, 15000)}
`;

  const insights = await runJsonTask<CompanyInsights>(
    agent,
    extractPrompt,
    {
      name: job.company || "",
      overview: "No information available",
      culture: "No information available", 
      recent_news: [],
      values: [],
      size: "",
      industry: ""
    },
    "company-extract"
  );

  return insights;
}

