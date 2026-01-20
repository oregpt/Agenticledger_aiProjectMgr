/**
 * AI Configuration
 * OpenAI, Anthropic, and embedding settings for the AI Project Manager
 */

export type AIProvider = 'openai' | 'anthropic';

export const aiConfig = {
  // Active provider (can be switched via env var)
  provider: (process.env.AI_PROVIDER || 'openai') as AIProvider,

  // OpenAI API
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4o',
    embeddingModel: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
    embeddingDimensions: 1536,
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '4096', 10),
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
  },

  // Anthropic API
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
    maxTokens: parseInt(process.env.ANTHROPIC_MAX_TOKENS || '4096', 10),
    temperature: parseFloat(process.env.ANTHROPIC_TEMPERATURE || '0.7'),
  },

  // Chunking settings
  chunking: {
    chunkSize: parseInt(process.env.CHUNK_SIZE || '800', 10), // tokens
    chunkOverlap: parseInt(process.env.CHUNK_OVERLAP || '200', 10), // tokens
    minChunkSize: 100, // minimum tokens for a chunk
  },

  // RAG settings
  rag: {
    topK: parseInt(process.env.RAG_TOP_K || '10', 10), // number of chunks to retrieve
    similarityThreshold: parseFloat(process.env.RAG_SIMILARITY_THRESHOLD || '0.7'),
  },
};

export default aiConfig;
