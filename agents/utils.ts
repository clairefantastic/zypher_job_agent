import type { ZypherAgent } from "@corespeed/zypher";
import { eachValueFrom } from "rxjs-for-await";

/**
 * Collects ALL Zypher events including:
 * - tool_output
 * - content_block
 * - final
 */
export async function runZypherTask(
  agent: ZypherAgent,
  prompt: string,
): Promise<string> {

  let event$;

  try {
    event$ = agent.runTask(prompt, "claude-sonnet-4-20250514");
  } catch (_e) {
    event$ = agent.runTask(prompt, "claude-sonnet-4-20250514");
  }

  let finalOutput = "";

  for await (const event of eachValueFrom(event$)) {
    if (event.type === "tool_output") {
      if (typeof event.output === "string") finalOutput += event.output;
      else if (event.output?.content) finalOutput += JSON.stringify(event.output.content);
    }

    // Extract text from various event formats
    if (event.type === "text") {
      if (event.text) {
        finalOutput += event.text;
      } else if (event.delta?.text) {
        finalOutput += event.delta.text;
      } else if (event.content) {
        finalOutput += event.content;
      }
    }

    if (event.type === "content_block" && event.content?.type === "text") {
      finalOutput += event.content.text;
    }

    if (event.type === "final" && event.message?.content) {
      for (const block of event.message.content) {
        if (block.type === "text") finalOutput += block.text;
      }
    }

    if (event.type === "error") {
      console.error("   ❌ Error:", event.error || event);
    }
  }

  return finalOutput.trim();
}


/**
 * Extracts JSON from text that may contain markdown code blocks or surrounding text.
 */
function extractJSON(text: string): string {
  // Remove markdown code blocks first
  text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');
  
  // Find the actual JSON object by counting braces
  let depth = 0;
  let startIdx = -1;
  let endIdx = -1;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    
    if (char === '{') {
      if (depth === 0) startIdx = i;
      depth++;
    } else if (char === '}') {
      depth--;
      if (depth === 0 && startIdx !== -1) {
        endIdx = i;
        break; // Found complete JSON object
      }
    }
  }
  
  if (startIdx !== -1 && endIdx !== -1) {
    return text.slice(startIdx, endIdx + 1);
  }
  
  // Fallback to original logic
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1) {
    return text.slice(start, end + 1);
  }
  
  return text;
}


/**
 * JSON wrapper that extracts JSON reliably.
 */
export async function runJsonTask<T>(
  agent: ZypherAgent,
  prompt: string,
  fallback: T,
  label = "json-task"
): Promise<T> {
  // Enhanced prompt to force JSON-only output
  const enhancedPrompt = `${prompt}

CRITICAL: Return ONLY valid JSON. No explanations, no markdown, no text before or after.
Start your response with { and end with }. Nothing else.`;

  const raw = await runZypherTask(agent, enhancedPrompt);
  
  const extracted = extractJSON(raw.trim());

  try {
    return JSON.parse(extracted) as T;
  } catch (e) {
    console.error(`   ❌ JSON parse failed [${label}]:`, e.message);
    
    // Try one more time with more aggressive cleaning
    try {
      const cleaned = extracted
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
        .replace(/,(\s*[}\]])/g, '$1'); // Remove trailing commas
        
      return JSON.parse(cleaned) as T;
    } catch (e2) {
      console.error(`   ❌ Failed to parse JSON for ${label}. Using fallback.`);
      return fallback;
    }
  }
}