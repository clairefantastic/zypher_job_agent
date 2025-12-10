import 'https://deno.land/std@0.224.0/dotenv/load.ts';
import { ChromaClient } from 'chromadb';
import OpenAI from 'openai';
import type { ZypherAgent } from "@corespeed/zypher";
import { runJsonTask } from './utils.ts';

const openai = new OpenAI({ 
  apiKey: Deno.env.get('OPENAI_API_KEY') 
});

let collection: any = null;
let initPromise: Promise<any> | null = null;

// Custom OpenAI Embedding Function for ChromaDB
class OpenAIEmbeddingFunction {
  constructor() {}
  
  async generate(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];
    
    for (const text of texts) {
      try {
        const response = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: text,
        });
        embeddings.push(response.data[0].embedding);
      } catch (error) {
        console.error("Embedding error:", error);
        throw error;
      }
    }
    
    return embeddings;
  }
}

// Initialize ChromaDB
async function initCollection() {
  if (collection) return collection;
  if (initPromise) return initPromise;
  
  initPromise = (async () => {
    console.log("🔌 Connecting to ChromaDB at http://localhost:8000...");
    
    const chroma = new ChromaClient({
      path: "http://localhost:8000"
    });
    
    // Test connection
    try {
      await chroma.heartbeat();
      console.log("ChromaDB server is running");
    } catch (error) {
      console.error("Cannot connect to ChromaDB server!");
      console.error("   Make sure it's running: chroma run --path ./chroma_data");
      throw error;
    }
    
    const embeddingFunction = new OpenAIEmbeddingFunction();
    
    try {
      collection = await chroma.getCollection({
        name: "interview_questions",
        embeddingFunction: embeddingFunction
      });
      console.log("Connected to existing collection");
    } catch {
      collection = await chroma.createCollection({
        name: "interview_questions",
        metadata: { "hnsw:space": "cosine" },
        embeddingFunction: embeddingFunction
      });
      console.log("Created new collection");
    }
    
    return collection;
  })();
  
  return initPromise;
}

// Generate embedding
async function embed(text: string): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    throw new Error("Cannot embed empty text");
  }
  
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text.trim(),
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error("Embedding failed:", error);
    throw error;
  }
}

// Cosine similarity between two vectors
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

// Simple BM25-like keyword scoring
function keywordScore(query: string, document: string): number {
  const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  const docTerms = document.toLowerCase().split(/\s+/);
  
  let score = 0;
  for (const term of queryTerms) {
    // Count occurrences
    const frequency = docTerms.filter(t => t.includes(term) || term.includes(t)).length;
    if (frequency > 0) {
      // TF-IDF inspired scoring
      score += Math.log(1 + frequency);
    }
  }
  
  return score;
}

// Query expansion using LLM
async function expandQuery(
  agent: ZypherAgent,
  query: string
): Promise<string[]> {
  // Limit query length for expansion
  const truncatedQuery = query.slice(0, 500);
  
  const prompt = `Given this job description snippet, generate 3 different search queries that capture different aspects:

Original query: "${truncatedQuery}"

Generate queries that focus on:
1. Technical skills and specific technologies mentioned
2. Experience level, years of experience, and seniority
3. Industry domain, company type, and role context

Return ONLY a JSON array of exactly 3 strings, nothing else. Each string should be 5-15 words.

Example output:
["senior python engineer machine learning", "5 years backend development microservices", "fintech trading systems distributed computing"]`;

  try {
    const result = await runJsonTask<string[]>(
      agent,
      prompt,
      [truncatedQuery],
      "query-expansion"
    );
    
    // Validate we got 3 queries
    if (!Array.isArray(result) || result.length === 0) {
      console.log("Query expansion returned invalid result, using original");
      return [truncatedQuery];
    }
    
    // Take up to 3 queries
    const queries = result.slice(0, 3).filter(q => q && q.trim().length > 0);
    
    console.log(`Expanded into ${queries.length} query variations`);
    return queries.length > 0 ? queries : [truncatedQuery];
  } catch (error) {
    console.log("Query expansion failed, using original query");
    return [truncatedQuery];
  }
}

// Vector search using embeddings
async function vectorSearch(
  query: string,
  topK: number,
  company?: string
): Promise<Array<{ id: string; question: string; metadata: any; score: number }>> {
  try {
    const coll = await initCollection();
    const queryEmbedding = await embed(query);
    
    // Filter by company if specified and known
    const knownCompanies = ['Google', 'Meta', 'Amazon', 'Microsoft', 'Startup'];
    const shouldFilter = company && knownCompanies.includes(company);
    const where = shouldFilter ? { company } : undefined;
    
    if (!shouldFilter && company) {
      console.log(`No specific questions for ${company}, searching across all companies`);
    }
    
    const results = await coll.query({
      queryEmbeddings: [queryEmbedding],
      nResults: topK,
      where
    });
    
    if (!results.documents?.[0]) return [];
    
    return results.documents[0].map((doc: string, idx: number) => ({
      id: results.ids[0][idx],
      question: doc,
      metadata: results.metadatas[0][idx],
      score: 1 - (results.distances?.[0]?.[idx] || 0)
    }));
  } catch (error) {
    console.error("Vector search failed:", error);
    return [];
  }
}

// Keyword search using BM25-like scoring
async function keywordSearch(
  query: string,
  topK: number
): Promise<Array<{ id: string; question: string; metadata: any; score: number }>> {
  try {
    const coll = await initCollection();
    
    // Get all documents for keyword matching
    const allResults = await coll.get({});
    
    if (!allResults.documents) return [];
    
    // Score each document
    const scored = allResults.documents.map((doc: string, idx: number) => ({
      id: allResults.ids[idx],
      question: doc,
      metadata: allResults.metadatas[idx],
      score: keywordScore(query, doc)
    }));
    
    // Filter out zero scores and sort
    return scored
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  } catch (error) {
    console.error("Keyword search failed:", error);
    return [];
  }
}

// Combine multiple ranked lists using Reciprocal Rank Fusion
function reciprocalRankFusion(
  results: Array<{ id: string; score: number; source: string }>[]
): Array<{ id: string; score: number }> {
  const scoreMap = new Map<string, { score: number; sources: Set<string> }>();
  const k = 60; // RRF constant (typical value)
  
  // Apply RRF formula: score = sum(1 / (k + rank))
  results.forEach(resultSet => {
    resultSet.forEach((item, rank) => {
      const current = scoreMap.get(item.id) || { score: 0, sources: new Set() };
      current.score += 1 / (k + rank + 1);
      current.sources.add(item.source);
      scoreMap.set(item.id, current);
    });
  });
  
  // Convert to array and sort by fused score
  return Array.from(scoreMap.entries())
    .map(([id, data]) => ({ 
      id, 
      score: data.score,
      sources: Array.from(data.sources).join('+')
    }))
    .sort((a, b) => b.score - a.score);
}

// Store questions
export async function storeQuestions(
  company: string, 
  role: string,
  questions: Array<{question: string, category: string}>
) {
  const coll = await initCollection();
  
  const ids: string[] = [];
  const documents: string[] = [];
  const metadatas: any[] = [];
  
  for (let i = 0; i < questions.length; i++) {
    const id = `${company}-${role}-${i}-${Date.now()}`;
    const questionText = questions[i].question;
    
    ids.push(id);
    documents.push(questionText);
    metadatas.push({
      company,
      role,
      category: questions[i].category,
      timestamp: new Date().toISOString()
    });
  }
  
  await coll.add({
    ids,
    documents,
    metadatas
  });
  
  console.log(`Stored ${questions.length} questions for ${company} - ${role}`);
}

// Main retrieval function
export async function getRelevantQuestionsAdvanced(
  agent: ZypherAgent,
  jobDescription: string,
  company?: string,
  topK: number = 10
): Promise<Array<{
  question: string;
  company: string;
  category: string;
  relevance: number;
  retrieval_method: string;
}>> {
  try {
    console.log("Running RAG pipeline...");
    const startTime = Date.now();
    
    // Step 1: Query expansion
    const queries = await expandQuery(agent, jobDescription);
    console.log(`   Expanded to ${queries.length} queries`);
    
    // Step 2: Hybrid search for each expanded query
    const searchResults: Array<{ id: string; score: number; source: string }>[] = [];
    
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      console.log(`   Searching with query ${i + 1}/${queries.length}...`);
      
      // Vector search
      const vectorResults = await vectorSearch(query, topK * 2, company);
      if (vectorResults.length > 0) {
        searchResults.push(vectorResults.map(r => ({ 
          id: r.id, 
          score: r.score,
          source: `vector-q${i+1}` 
        })));
      }
      
      // Keyword search
      const keywordResults = await keywordSearch(query, topK * 2);
      if (keywordResults.length > 0) {
        searchResults.push(keywordResults.map(r => ({ 
          id: r.id, 
          score: r.score,
          source: `keyword-q${i+1}` 
        })));
      }
    }
    
    console.log(`   Collected ${searchResults.length} result sets`);
    
    if (searchResults.length === 0) {
      console.log("No results from any search method");
      return [];
    }
    
    // Step 3: Reciprocal Rank Fusion
    const fused = reciprocalRankFusion(searchResults);
    console.log(`   Fused into ${fused.length} unique results`);
    
    // Step 4: Retrieve full documents for top results
    const coll = await initCollection();
    const topIds = fused.slice(0, topK).map(r => r.id);
    
    const finalResults = await coll.get({
      ids: topIds
    });
    
    if (!finalResults.documents) {
      console.log("Failed to retrieve final documents");
      return [];
    }
    
    // Step 5: Format results
    const questions = finalResults.documents.map((doc: string, idx: number) => ({
      question: doc,
      company: finalResults.metadatas[idx].company,
      category: finalResults.metadatas[idx].category,
      relevance: fused[idx].score,
      retrieval_method: 'hybrid-rrfusion'
    }));
    
    const duration = Date.now() - startTime;
    console.log(`RAG completed in ${duration}ms: ${questions.length} questions retrieved`);
    
    return questions;
    
  } catch (error) {
    console.error("RAG pipeline failed:", error);
    console.log("   Falling back to simple vector search...");
    
    // Fallback to simple vector search
    try {
      const simple = await vectorSearch(jobDescription.slice(0, 500), topK, company);
      return simple.map(r => ({
        question: r.question,
        company: r.metadata.company,
        category: r.metadata.category,
        relevance: r.score,
        retrieval_method: 'vector-fallback'
      }));
    } catch (fallbackError) {
      console.error("Fallback also failed:", fallbackError);
      return [];
    }
  }
}

// Check if collection has data
export async function getQuestionCount(): Promise<number> {
  try {
    const coll = await initCollection();
    const count = await coll.count();
    return count;
  } catch (error) {
    console.error("Failed to get count:", error);
    return 0;
  }
}

// Clear all data
export async function clearAllQuestions() {
  try {
    const chroma = new ChromaClient({
      path: "http://localhost:8000"
    });
    await chroma.deleteCollection({ name: "interview_questions" });
    collection = null;
    initPromise = null;
    console.log("Cleared all questions");
  } catch (error) {
    console.error("Failed to clear:", error);
  }
}

export { 
  embed, 
  vectorSearch, 
  keywordSearch, 
  expandQuery,
  reciprocalRankFusion,
  cosineSimilarity 
};