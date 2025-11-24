# 🎯 JobFit AI Analyzer

AI-powered job application analysis with real-time web interface. Analyzes job postings, compares with your resume, and generates tailored cover letters and optimization suggestions.

## ✨ Features

- 🔍 **Auto-scrapes job postings** using Firecrawl MCP
- 📊 **Match scoring** - See how well you fit (0-100%)
- 🏢 **Company research** - Automatic insights from company websites
- 🧩 **Gap analysis** - Identifies missing skills and addressable gaps
- ✉️ **Cover letter generation** - Personalized, company-specific
- 🪄 **Resume optimization** - ATS keywords and bullet improvements
- 🌐 **Real-time web UI** - Watch the analysis happen live

## 🚀 Quick Start

### 1. Prerequisites

- [Deno](https://deno.land/) installed
- Anthropic API key
- Firecrawl API key

### 2. Setup

```bash
# Clone/download the project
cd zypher_job_agent

# Create .env file
cat > .env << EOF
ANTHROPIC_API_KEY=your_anthropic_key_here
FIRECRAWL_API_KEY=your_firecrawl_key_here
EOF

```

### 3. File Structure

```
zypher_job_agent/
├── .env
├── server.ts              # Web server with API
├── markdown.ts            # Report generator
├── resume.txt             # Your resume (for CLI)
├── viewer/
│   ├── server.ts          # Web server
│   ├── index.html         # Web interface
│   ├── style.css          # Styles
│   └── app.js             # Frontend logic
└── agents/
    ├── scraper.ts
    ├── parser.ts
    ├── resume.ts
    ├── gap.ts
    ├── company.ts
    ├── scorer.ts
    ├── writer.ts
    ├── resumeRewrite.ts
    ├── utils.ts
    └── types.ts
```

### 4. Run the Web App

```bash
# Start the web server
cd viewer
deno run -A server.ts
```

Open http://localhost:8000 in your browser!

### 5. Alternative: CLI Mode

```bash
# Create analyze.ts (simplified CLI script)
deno run -A analyze.ts "https://job-url-here"
```

## 📖 How to Use

### Web Interface

1. **Enter Job URL** - Paste the job posting link
2. **Paste Resume** - Add your resume text
3. **Optional LinkedIn** - Add LinkedIn profile text
4. **Click Analyze** - Watch the 8-step process run live!
5. **Review Results** - Get match score, gaps, cover letter, tips
6. **Download Report** - Save as Markdown file

### What You'll Get

#### 📊 Match Score (0-100%)
- Overall fit percentage
- Skills, Experience, and Culture breakdowns
- Your strengths vs areas of concern
- Clear recommendation (Apply/Don't Apply)

#### 🏢 Company Insights
- What the company does
- Company culture and values
- Recent news and developments
- Industry and size

#### 🧩 Gap Analysis
- Missing technical skills
- Experience gaps
- Addressable vs critical gaps
- Actionable recommendations

#### ✉️ Cover Letter
- Tailored 3-4 paragraphs
- Company-specific references
- Addresses your gaps positively
- Professional but personable

#### 🪄 Resume Optimization
- Strategic suggestions (structure, emphasis)
- ATS keywords to add
- Before/after bullet improvements
- Rationale for each change

## 🔧 Configuration

### Adjust Model Settings

In `utils.ts` and agent files, change:
```typescript
agent.runTask(prompt, "claude-sonnet-4-20250514");
```

### Customize Styling

Edit `viewer/style.css` to change colors, fonts, layouts.

### Modify Analysis Steps

Edit agents in `agents/` folder:
- `scraper.ts` - How jobs are scraped
- `parser.ts` - What fields are extracted
- `scorer.ts` - Match scoring algorithm
- `writer.ts` - Cover letter style

## 🐛 Troubleshooting

### "MCP not ready" error
- Wait 3-5 seconds after starting
- Check FIRECRAWL_API_KEY is valid

### "Failed to parse JSON"
- Prompts might need tweaking
- Check console for raw output
- Falls back to defaults automatically

### Slow analysis
- Each step takes 5-15 seconds (LLM processing)
- Total time: 1-3 minutes
- Web scraping adds extra time

### Empty company insights
- Company website might be inaccessible
- Falls back to job info only
- Non-critical for analysis

## 💡 Tips

1. **Better resumes = better results**
   - Include metrics (%, $, time)
   - List technologies explicitly
   - Mention team sizes, project scale

2. **Paste full job postings**
   - More details = better analysis
   - Don't just use URL if scraping fails

3. **Review all sections**
   - Match score is a guide, not absolute
   - Gap analysis shows what to emphasize
   - Resume tips are optional improvements

4. **Iterate**
   - Run multiple times as you update resume
   - Try different job URLs
   - Compare scores across roles

## 📝 Example Resume Format

```
Name: Jane Doe
Role: Senior Software Engineer

Skills: Python, React, AWS, Docker, PostgreSQL, Redis

Experience:
- 5 years at TechCorp building microservices (Node.js, AWS)
- Led team of 6 engineers, increased deployment frequency 3x
- Reduced API latency by 60% through caching optimization
- Built real-time analytics dashboard serving 10K+ users

Education:
BS Computer Science, Stanford University, 2018

Projects:
- Open source contributor to React ecosystem (5K+ stars)
- Built personal finance app with 2K+ users
```

## 🤝 Contributing

Want to improve the analyzer?

1. Fork the repo
2. Make changes
3. Test with real job postings
4. Submit improvements!

## 📄 License

MIT - Use freely for personal job hunting!

---

**Happy job hunting!** 🎯✨