import type { ZypherAgent } from "@corespeed/zypher";
import { runZypherTask } from "./utils.ts";

/**
 * A scraper that forces a Firecrawl tool invocation.
 */
export async function scrapeJobPosting(agent: ZypherAgent, url: string): Promise<string> {
  const prompt = `
You MUST call the Firecrawl MCP tool.

Follow these rules exactly:
1. Use the MCP server "firecrawl".
2. Use the "crawl" tool.
3. Pass this JSON:
{
  "url": "${url}",
  "maxDepth": 1,
  "includeSelectors": ["body"]
}
4. After receiving tool_output, return ONLY the text from the result.
5. If "text" field exists, return that.
6. Otherwise return "markdown".
7. Otherwise return raw JSON.
8. DO NOT ask questions.
9. DO NOT output anything except the scraped text.
10. DO NOT describe the tool call.
`;

  const raw = await runZypherTask(agent, prompt);
  
  console.log("   📊 Scraper raw output length:", raw.length);
  console.log("   📊 First 500 chars:", raw.slice(0, 500));

  // Firecrawl returns its result as JSON inside a string. Let's parse safely.
  try {
    const obj = JSON.parse(raw);

    if (typeof obj === "string") return obj;

    if (obj?.text) return obj.text;
    if (obj?.markdown) return obj.markdown;
    if (obj?.html) return obj.html;

    return raw;
  } catch {
    return raw.trim();
  }
}
