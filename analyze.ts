import "jsr:@std/dotenv/load";
import { createZypherContext, ZypherAgent, AnthropicModelProvider } from "@corespeed/zypher";
import { scrapeJobPosting } from "./agents/scraper.ts";
import { parseJobPosting } from "./agents/parser.ts";
import { analyzeResume } from "./agents/resume.ts";
import { analyzeGaps } from "./agents/gap.ts";
import { writeCoverLetter } from "./agents/writer.ts";
import { getCompanyInsights } from "./agents/company.ts";
import { rewriteResume } from "./agents/resumeRewrite.ts";
import { scoreMatch } from "./agents/scorer.ts";

const jobUrl = Deno.args[0];
if (!jobUrl) {
  console.error("❌ Usage: deno run -A analyze.ts <JOB_URL>");
  Deno.exit(1);
}

// Setup
console.log("🧠 Initializing...");
const zypherContext = await createZypherContext(Deno.cwd());
const agent = new ZypherAgent(
  zypherContext,
  new AnthropicModelProvider({
    apiKey: Deno.env.get("ANTHROPIC_API_KEY") ?? "",
  }),
);

// Register MCP
console.log("🔌 Registering Firecrawl...");
await agent.mcp.registerServer({
  id: "firecrawl",
  type: "command",
  command: {
    command: "npx",
    args: ["-y", "firecrawl-mcp"],
    env: { FIRECRAWL_API_KEY: Deno.env.get("FIRECRAWL_API_KEY") ?? "" },
  },
});
await new Promise((resolve) => setTimeout(resolve, 2000));
console.log("✅ Ready!\n");

// Load resume
let resumeText = "";
try {
  resumeText = await Deno.readTextFile("./resume.txt");
} catch {
  console.error("❌ Missing resume.txt");
  Deno.exit(1);
}

// Run pipeline
console.log("📋 [1/8] Scraping job posting...");
const jobRaw = await scrapeJobPosting(agent, jobUrl);

console.log("📋 [2/8] Parsing job details...");
const jobInfo = await parseJobPosting(agent, jobRaw);

console.log("📋 [3/8] Analyzing resume...");
const resumeProfile = await analyzeResume(agent, resumeText, "");

console.log("📋 [4/8] Computing gaps...");
const gaps = await analyzeGaps(agent, jobInfo, resumeProfile);

console.log("📋 [5/8] Getting company insights...");
const company = await getCompanyInsights(agent, jobUrl, jobInfo);

console.log("📋 [6/8] Scoring match...");
const score = await scoreMatch(agent, jobInfo, resumeProfile, company, gaps);

console.log("📋 [7/8] Writing cover letter...");
const coverLetter = await writeCoverLetter(agent, jobInfo, resumeProfile, company, score, gaps);

console.log("📋 [8/8] Generating resume improvements...");
const rewrite = await rewriteResume(agent, jobInfo, resumeProfile, gaps, score);

// Generate readable output
console.log("\n📝 Generating report...\n");

const output = `# Job Application Analysis

**Position:** ${jobInfo.title || "N/A"}
**Company:** ${jobInfo.company || "N/A"}
**Location:** ${jobInfo.location || "N/A"}

---

## COMPANY INSIGHTS

**Industry:** ${company.industry || "Not specified"}
**Size:** ${company.size || "Not specified"}

### About ${company.name || jobInfo.company}
${company.overview || "No information available"}

### Company Culture
${company.culture || "No information available"}

${company.values && company.values.length > 0 ? `### Values\n${company.values.map(v => `- ${v}`).join('\n')}\n` : ''}

${company.recent_news && company.recent_news.length > 0 ? `### Recent News\n${company.recent_news.map(n => `- ${n}`).join('\n')}\n` : ''}

---

## MISSING KEYWORDS

${gaps.strengths && gaps.strengths.length > 0 ? `### ✅ Your Strengths (What You Have)\n${gaps.strengths.map(s => `- ${s}`).join('\n')}\n` : ''}

### Technical Skills Not on Resume:
${gaps.technical_missing?.map(s => `- ${s}`).join('\n') || gaps.missing_skills?.map(s => `- ${s}`).join('\n') || '- None identified'}

### Experience Gaps:
${gaps.experience_missing?.map(e => `- ${e}`).join('\n') || '- None identified'}

### Cloud/Infrastructure:
${gaps.cloud_missing?.map(c => `- ${c}`).join('\n') || '- None identified'}

### Frameworks/Tools:
${gaps.framework_missing?.map(f => `- ${f}`).join('\n') || '- None identified'}

### Certifications:
${gaps.certifications_missing?.map(c => `- ${c}`).join('\n') || '- None identified'}

${gaps.addressable_gaps && gaps.addressable_gaps.length > 0 ? `### 💡 Addressable Gaps (Can Highlight in Interview)\n${gaps.addressable_gaps.map(g => `- ${g}`).join('\n')}\n` : ''}

${gaps.critical_gaps && gaps.critical_gaps.length > 0 ? `### ⚠️ Critical Gaps\n${gaps.critical_gaps.map(g => `- ${g}`).join('\n')}\n` : ''}

${gaps.recommendations && gaps.recommendations.length > 0 ? `### 📋 Recommendations\n${gaps.recommendations.map(r => `- ${r}`).join('\n')}\n` : ''}

---

## REQUIRED SKILLS

### Must Have:
${jobInfo.required_skills?.map(s => `- ${s}`).join('\n') || '- Not specified'}

### Nice to Have:
${jobInfo.preferred_skills?.map(s => `- ${s}`).join('\n') || '- Not specified'}

### Tech Stack:
${jobInfo.tech_stack?.map(t => `- ${t}`).join('\n') || '- Not specified'}

---

## DRAFT COVER LETTER

${coverLetter.draft || coverLetter}

${coverLetter.key_points && coverLetter.key_points.length > 0 ? `\n### Key Selling Points\n${coverLetter.key_points.map(p => `- ${p}`).join('\n')}\n` : ''}

${coverLetter.tone ? `*Tone: ${coverLetter.tone}*\n` : ''}

---

## RESUME OPTIMIZATION

${rewrite.suggestions && rewrite.suggestions.length > 0 ? `### Strategic Suggestions\n${rewrite.suggestions.map(s => `- ${s}`).join('\n')}\n` : ''}

${rewrite.keywords_to_add && rewrite.keywords_to_add.length > 0 ? `### Keywords to Add (ATS Optimization)\n${rewrite.keywords_to_add.map(k => `- ${k}`).join('\n')}\n` : ''}

${rewrite.sections_to_emphasize && rewrite.sections_to_emphasize.length > 0 ? `### Sections to Emphasize\n${rewrite.sections_to_emphasize.map(s => `- ${s}`).join('\n')}\n` : ''}

${rewrite.bullet_improvements && rewrite.bullet_improvements.length > 0 ? `### Bullet Point Improvements\n\n${rewrite.bullet_improvements.map(b => `**${b.section}**\n\n❌ Before:\n> ${b.original}\n\n✅ After:\n> ${b.improved}\n\n💡 Why: ${b.rationale || 'Improves clarity and impact'}\n`).join('\n')}\n` : ''}

---

## JOB DETAILS

### Summary
${jobInfo.job_summary || 'Not available'}

### Key Responsibilities
${jobInfo.responsibilities?.map(r => `- ${r}`).join('\n') || '- Not specified'}

### Qualifications
${jobInfo.qualifications?.map(q => `- ${q}`).join('\n') || '- Not specified'}

---

## YOUR PROFILE

**Name:** ${resumeProfile.name || "Not specified"}
**Total Experience:** ${resumeProfile.years_experience || "Not specified"}

${resumeProfile.summary ? `### Professional Summary\n${resumeProfile.summary}\n` : ''}

### Technical Skills
${resumeProfile.technical_skills?.slice(0, 15).join(', ') || 'Not specified'}

${resumeProfile.experience && resumeProfile.experience.length > 0 ? `### Recent Experience\n${resumeProfile.experience.slice(0, 2).map(exp => `**${exp.title}** at ${exp.company} (${exp.duration || 'Duration not specified'})`).join('\n')}\n` : ''}

---

*Generated on ${new Date().toLocaleString()}*
`;

// Save
await Deno.mkdir("./output", { recursive: true });
await Deno.writeTextFile("./output/analysis.md", output);

console.log("✅ DONE!\n");
console.log("📄 Saved to: ./output/analysis.md");
console.log("\nView with:");
console.log("  cat ./output/analysis.md");
console.log("  code ./output/analysis.md");