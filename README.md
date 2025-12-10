# 🎯 JobFit AI Analyzer

An intelligent job application analysis system powered by AI agents, RAG, and LangGraph. Automatically analyzes job postings against your resume to generate tailored cover letters, resume optimizations, interview preparation, and career visualizations.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Deno](https://img.shields.io/badge/deno-1.x-green.svg)
![Node](https://img.shields.io/badge/node-18+-green.svg)

---

## ✨ Features

### 🤖 AI-Powered Analysis
- **10-Step Pipeline** - Comprehensive job-resume matching analysis
- **LangGraph Workflow** - Intelligent routing based on match scores (≥60% full analysis, <60% quick feedback)
- **Multi-Agent System** - Specialized agents for scraping, parsing, analysis, and generation
- **Advanced RAG** - Retrieval Augmented Generation with ChromaDB for personalized interview prep

### 📊 Smart Outputs
- **Match Score** - Overall compatibility rating with detailed breakdown
- **Gap Analysis** - Missing skills, experience gaps, and actionable recommendations
- **Cover Letter** - AI-generated, tailored to job and company (high scores only)
- **Resume Optimization** - Strategic suggestions and ATS-friendly keyword additions
- **Interview Preparation** - RAG-powered questions with STAR templates from your actual experience
- **Career Visualizations** - Interactive skills radar chart and 12-month career timeline

### 💻 Dual Interface
- **Web Application** - Real-time progress tracking with interactive visualizations
- **CLI Tool** - Command-line analysis for automation and scripting

---

## 🏗️ Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                     JobFit AI Analyzer                      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   LangGraph State Machine                   │
│  (Intelligent routing based on match score)                 │
└─────────────────────────────────────────────────────────────┘
         ↓                                           ↓
┌──────────────────┐                    ┌──────────────────────┐
│ High Score Path  │                    │  Low Score Path      │
│    (≥60%)        │                    │     (<60%)           │
│                  │                    │                      │
│ • Cover Letter   │                    │ • Resume Tips Only   │
│ • Resume Tips    │                    │ • Focused Feedback   │
│ • Interview Prep │                    │                      │
│ • Visualizations │                    │                      │
└──────────────────┘                    └──────────────────────┘
         ↓                                           ↓
┌─────────────────────────────────────────────────────────────┐
│                      AI Agents Layer                        │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Scraper  │  │  Parser  │  │ Analyzer │  │  Writer  │   │
│  │  Agent   │→ │  Agent   │→ │  Agent   │→ │  Agent   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
         ↓                                           ↓
┌──────────────────┐                    ┌──────────────────────┐
│   Firecrawl MCP  │                    │   ChromaDB (RAG)     │
│  (Web Scraping)  │                    │  (Interview DB)      │
└──────────────────┘                    └──────────────────────┘
```

### Workflow Steps

1. **Scrape** - Extract job posting content via Firecrawl MCP
2. **Parse** - Structure job details (title, skills, requirements)
3. **Analyze Resume** - Extract candidate profile and experience
4. **Compute Gaps** - Identify missing skills and experience
5. **Research Company** - Gather company culture and insights
6. **Score Match** - Calculate overall compatibility (0-100%)
7. **Route Decision** - LangGraph conditionally routes based on score
   - **High (≥60%)**: Full analysis → Steps 7-10
   - **Low (<60%)**: Quick feedback → Resume tips only
8. **Generate Outputs** - Cover letter, resume tips, interview prep, visualizations

---

## 🚀 Quick Start

### Prerequisites

- **Deno** 1.40+ ([Install](https://deno.land/))
- **Node.js** 18+ ([Install](https://nodejs.org/))
- **Python** 3.8+ ([Install](https://www.python.org/))
- **API Keys**:
  - Anthropic API Key ([Get Key](https://console.anthropic.com/))
  - OpenAI API Key ([Get Key](https://platform.openai.com/))
  - Firecrawl API Key ([Get Key](https://www.firecrawl.dev/))

### Installation
```bash
# 1. Clone the repository
git clone https://github.com/clairefantastic/zypher_job_agent.git
cd zypher_job_agent

# 2. Install dependencies
npm install

# 3. Install ChromaDB (for RAG)
pip install chromadb --break-system-packages

# 4. Create .env file
cp .env.example .env

# 5. Add your API keys to .env
ANTHROPIC_API_KEY=your_anthropic_key_here
OPENAI_API_KEY=your_openai_key_here
FIRECRAWL_API_KEY=your_firecrawl_key_here
```

### Seed Interview Database
```bash
# Terminal 1: Start ChromaDB
chroma run --path ./chroma_data

# Terminal 2: Seed with sample questions
deno run -A --env agents/seed-questions.ts
```

Expected output:
```
🌱 Seeding interview questions database...
✅ Stored 10 questions for Google - Software Engineer
✅ Stored 5 questions for Google - Product Manager
...
✅ Seeding complete! Added 40 questions across 5 companies
```

---

## 💻 Usage

### Web Interface (Recommended)
```bash
# Terminal 1: Start ChromaDB (must be running)
chroma run --path ./chroma_data

# Terminal 2: Start web server
cd viewer
deno run -A --env server.ts
```

Open **http://localhost:3000** in your browser.

**Steps:**
1. Paste job posting URL
2. Paste your resume text
3. (Optional) Add LinkedIn profile
4. Click "Analyze Job Fit"
5. Watch real-time progress (10 steps)
6. View results with interactive visualizations
7. Download markdown report

### CLI Tool
```bash
# Add your resume
echo "Your resume text here..." > resume.txt

# Run analysis
deno run -A --env analyze.ts "https://company.com/jobs/12345"

# View results
cat ./output/analysis.md
open ./output/visualizations/skills-radar.html
```

---

## 📁 Project Structure
```
jobfit-ai-analyzer/
├── agents/                      # AI Agent modules
│   ├── langgraph-workflow.ts   # LangGraph state machine
│   ├── rag-advanced.ts         # Advanced RAG with hybrid search
│   ├── interview-prep.ts       # RAG-powered interview prep
│   ├── visualizer.ts           # Multi-modal visualization generator
│   ├── scraper.ts              # Job posting scraper (Firecrawl MCP)
│   ├── parser.ts               # Job detail parser
│   ├── resume.ts               # Resume analyzer
│   ├── gap.ts                  # Skill gap analyzer
│   ├── company.ts              # Company insights researcher
│   ├── scorer.ts               # Match scoring engine
│   ├── writer.ts               # Cover letter generator
│   ├── resumeRewrite.ts        # Resume optimization agent
│   ├── seed-questions.ts       # RAG database seeder
│   ├── types.ts                # TypeScript interfaces
│   └── utils.ts                # Helper functions
├── viewer/                      # Web interface
│   ├── server.ts               # Deno HTTP server
│   ├── index.html              # Frontend HTML
│   ├── app.js                  # Frontend JavaScript
│   └── style.css               # Responsive styles
├── output/                      # Generated reports
│   ├── analysis.md             # Full markdown report
│   └── visualizations/         # Generated visuals
│       ├── skills-radar.html   # Interactive radar chart
│       └── timeline.svg        # Career timeline
├── chroma_data/                 # ChromaDB vector database
├── analyze.ts                   # CLI entry point
├── markdown.ts                  # Report generator
├── resume.txt                   # Your resume (create this)
├── .env                         # API keys (create this)
├── deno.json                    # Deno configuration
├── package.json                 # Node dependencies
└── README.md                    # This file
```

---

## 🎓 Class Concepts Demonstrated

### 1. **Retrieval Augmented Generation (RAG)**
- **Vector Database**: ChromaDB for semantic search
- **Embeddings**: OpenAI text-embedding-3-small
- **Query Expansion**: LLM generates 3 query variations
- **Hybrid Search**: Combines vector similarity + keyword matching
- **Reciprocal Rank Fusion**: Merges multiple ranked results

**Location**: `agents/rag-advanced.ts`
```typescript
// Query Expansion
const queries = await expandQuery(agent, jobDescription);

// Hybrid Search
const vectorResults = await vectorSearch(query, topK);
const keywordResults = await keywordSearch(query, topK);

// RRF Fusion
const fused = reciprocalRankFusion([vectorResults, keywordResults]);
```

### 2. **Agentic Frameworks (LangGraph)**
- **State Machine**: Conditional workflow routing
- **Multi-Agent Coordination**: 10+ specialized agents
- **Dynamic Routing**: Path selection based on match score
- **State Management**: Serializable data flow

**Location**: `agents/langgraph-workflow.ts`
```typescript
// Conditional routing based on score
workflow.addConditionalEdges("scoreMatch", routeAfterScore, {
  fullAnalysis: "fullAnalysis",    // ≥60%
  quickFeedback: "quickFeedback"   // <60%
});
```

### 3. **Multi-Modal Generation**
- **Text**: Markdown reports, cover letters
- **Diagrams**: SVG career timelines
- **Interactive Visuals**: HTML/Canvas radar charts

**Location**: `agents/visualizer.ts`

### 4. **Model Comparison & Optimization**
- **Cost Optimization**: Skip expensive steps for low matches
- **Model Selection**: Claude Sonnet 4 for complex reasoning
- **Prompt Engineering**: Structured outputs with JSON

### 5. **Production Best Practices**
- **Error Handling**: Graceful fallbacks at each step
- **Progress Tracking**: Real-time SSE updates
- **Logging**: Detailed console output
- **Type Safety**: Full TypeScript definitions

---

## 🧪 Testing

### Test RAG System
```bash
# Verify database
deno run -A --env -e '
import { getQuestionCount } from "./agents/rag-advanced.ts";
console.log("Questions in DB:", await getQuestionCount());
'
```

Expected: `Questions in DB: 40`

### Test Advanced RAG
```bash
deno run -A --env test-advanced-rag.ts
```

### End-to-End Test
```bash
# High match example
deno run -A --env analyze.ts "https://jobs.ashbyhq.com/anthropic/..."

# Low match example (should trigger quick feedback)
deno run -A --env analyze.ts "https://jobs.example.com/senior-ml-engineer"
```

---

## 🛠️ Technology Stack

### AI & ML
- **LangGraph** - State machine orchestration
- **Claude Sonnet 4** - Advanced reasoning (Anthropic)
- **ChromaDB** - Vector database for RAG
- **OpenAI Embeddings** - Semantic search

### Backend
- **Deno** - Modern JavaScript runtime
- **Zypher Agents** - Multi-agent framework
- **Firecrawl MCP** - Web scraping via MCP protocol

### Frontend
- **Vanilla JavaScript** - No framework overhead
- **Server-Sent Events (SSE)** - Real-time progress
- **Canvas API** - Interactive visualizations
- **Marked.js** - Markdown rendering

---

## 📊 Sample Output

### High Match (75% Score)
```markdown
# 🎯 Job Application Analysis

**Position:** Senior Software Engineer
**Company:** Anthropic
**Location:** San Francisco, CA

---

## 📊 MATCH SCORE: 75%

### Strong Match - Recommended to Apply

**Skills:** 80% | **Experience:** 70% | **Culture:** 75%

#### ✅ Your Strengths
- 5 years Python experience matches requirement
- Strong background in distributed systems
- Proven track record with microservices

---

## ✉️ Draft Cover Letter

Dear Hiring Manager,

I am excited to apply for the Senior Software Engineer position...
[AI-generated, tailored content]

---

## 🎯 Interview Preparation (Advanced RAG)

*Retrieved using hybrid-rrfusion - 10 questions analyzed, avg relevance: 87.3%*

### Top Interview Questions

1. Tell me about a time you solved a complex technical problem...
   **💡 Suggested Answer Template:**
   [STAR format with your specific examples]
...
```

### Low Match (42% Score)
```markdown
## 📊 MATCH SCORE: 42%

### Consider Other Opportunities

**Skills:** 35% | **Experience:** 40% | **Culture:** 50%

#### ⚠️ Areas of Concern
- Missing required ML/AI experience
- No Python/Django background
- Entry-level experience for senior role

---

## ✉️ Cover Letter

⚠️ **Cover letter not generated** (match score below threshold)
Focus on improving skills and qualifications first.

---

## 🪄 Resume Optimization

### Strategic Suggestions
- Learn Python and Django to meet basic requirements
- Build portfolio projects demonstrating ML skills
- Consider bootcamp or online courses for ML fundamentals
...
```

---

## 📈 Performance Metrics

### Typical Analysis Time
- **High Match**: ~3 minutes (full pipeline)
- **Low Match**: ~1 minute (quick feedback)

### Cost per Analysis
- **High Match**: ~$0.40-0.60 (with all steps)
- **Low Match**: ~$0.15-0.25 (resume tips only)

### RAG Performance
- **Database**: 40 questions across 5 companies
- **Retrieval**: ~10 questions, 85%+ avg relevance
- **Query time**: <500ms

---

## 🙏 Acknowledgments

- **Anthropic** - Claude API and Zypher framework
- **OpenAI** - Embeddings API
- **Firecrawl** - MCP web scraping
- **LangChain** - LangGraph orchestration
- **ChromaDB** - Vector database

---
