import 'https://deno.land/std@0.224.0/dotenv/load.ts';
import OpenAI from 'openai';

const openai = new OpenAI({ 
  apiKey: Deno.env.get('OPENAI_API_KEY') 
});

interface CacheEntry {
  queryHash: string;
  queryEmbedding: number[];
  jobUrl: string;
  resumeHash: string;
  result: any;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const SIMILARITY_THRESHOLD = 0.95;
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

async function embed(text: string): Promise<number[]> {
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

function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

function createQueryKey(jobUrl: string, resume: string): string {
  return `${jobUrl}::${resume.slice(0, 100)}`;
}

function createSemanticQuery(jobUrl: string, resume: string): string {
  return `Job: ${jobUrl}\nResume: ${resume.slice(0, 500)}`;
}

export async function getCachedAnalysis(
  jobUrl: string,
  resume: string
): Promise<any | null> {
  try {
    const queryKey = createQueryKey(jobUrl, resume);
    
    if (cache.has(queryKey)) {
      const entry = cache.get(queryKey)!;
      
      if (Date.now() - entry.timestamp > CACHE_TTL) {
        console.log("Cache entry expired, removing...");
        cache.delete(queryKey);
        return null;
      }
      
      console.log("CACHE HIT (exact match)");
      return entry.result;
    }
    
    const semanticQuery = createSemanticQuery(jobUrl, resume);
    const queryEmbedding = await embed(semanticQuery);
    
    let bestMatch: CacheEntry | null = null;
    let bestSimilarity = 0;
    
    for (const [key, entry] of cache.entries()) {
      if (Date.now() - entry.timestamp > CACHE_TTL) {
        cache.delete(key);
        continue;
      }
      
      const similarity = cosineSimilarity(queryEmbedding, entry.queryEmbedding);
      
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestMatch = entry;
      }
    }
    
    if (bestMatch && bestSimilarity >= SIMILARITY_THRESHOLD) {
      console.log(`CACHE HIT (semantic, similarity: ${(bestSimilarity * 100).toFixed(2)}%)`);
      return bestMatch.result;
    }
    
    console.log(`Cache miss (best similarity: ${(bestSimilarity * 100).toFixed(2)}%)`);
    return null;
    
  } catch (error) {
    console.error("Cache check failed:", error);
    return null;
  }
}

export async function cacheAnalysis(
  jobUrl: string,
  resume: string,
  result: any
): Promise<void> {
  try {
    const queryKey = createQueryKey(jobUrl, resume);
    const semanticQuery = createSemanticQuery(jobUrl, resume);
    const queryEmbedding = await embed(semanticQuery);
    
    const entry: CacheEntry = {
      queryHash: queryKey,
      queryEmbedding,
      jobUrl,
      resumeHash: resume.slice(0, 100),
      result,
      timestamp: Date.now()
    };
    
    cache.set(queryKey, entry);
    console.log(`Cached analysis result (total cache size: ${cache.size})`);
    
    if (cache.size > 100) {
      cleanupCache();
    }
    
  } catch (error) {
    console.error("Failed to cache result:", error);
  }
}

function cleanupCache(): void {
  const now = Date.now();
  let removed = 0;
  
  for (const [key, entry] of cache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      cache.delete(key);
      removed++;
    }
  }
  
  if (removed > 0) {
    console.log(`Cleaned up ${removed} expired cache entries`);
  }
}