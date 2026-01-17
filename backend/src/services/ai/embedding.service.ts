/**
 * Embedding Service
 * Handles text chunking, embedding generation, and vector similarity search
 */

import prisma from '../../config/database';
import { aiConfig } from '../../config/ai';
import { generateEmbedding, generateEmbeddings } from './openai.service';

/**
 * Chunk text into smaller pieces for embedding
 * Uses a simple sentence-based chunking approach
 */
export function chunkText(
  text: string,
  options?: {
    targetSize?: number;
    maxSize?: number;
    overlap?: number;
  }
): string[] {
  const targetSize = options?.targetSize || aiConfig.chunking.chunkSize;
  const maxSize = options?.maxSize || targetSize * 1.5;
  const overlap = options?.overlap || aiConfig.chunking.chunkOverlap;

  if (!text || text.trim().length === 0) {
    return [];
  }

  // Estimate tokens (roughly 4 characters per token for English)
  const estimateTokens = (s: string) => Math.ceil(s.length / 4);

  // Split text into sentences
  const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);

  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let currentTokens = 0;

  for (const sentence of sentences) {
    const sentenceTokens = estimateTokens(sentence);

    // If single sentence exceeds max, split it by words
    if (sentenceTokens > maxSize) {
      // Flush current chunk first
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.join(' '));
        currentChunk = [];
        currentTokens = 0;
      }

      // Split long sentence by words
      const words = sentence.split(/\s+/);
      let wordChunk: string[] = [];
      let wordTokens = 0;

      for (const word of words) {
        const wt = estimateTokens(word);
        if (wordTokens + wt > targetSize && wordChunk.length > 0) {
          chunks.push(wordChunk.join(' '));
          // Overlap: keep last few words
          const overlapWords = Math.ceil(overlap / 5); // ~5 chars per word avg
          wordChunk = wordChunk.slice(-overlapWords);
          wordTokens = estimateTokens(wordChunk.join(' '));
        }
        wordChunk.push(word);
        wordTokens += wt;
      }

      if (wordChunk.length > 0) {
        currentChunk = wordChunk;
        currentTokens = wordTokens;
      }
      continue;
    }

    // Would adding this sentence exceed target?
    if (currentTokens + sentenceTokens > targetSize && currentChunk.length > 0) {
      chunks.push(currentChunk.join(' '));

      // Overlap: keep last sentence(s) that fit within overlap
      const overlapChunk: string[] = [];
      let overlapTokens = 0;
      for (let i = currentChunk.length - 1; i >= 0 && overlapTokens < overlap; i--) {
        const st = estimateTokens(currentChunk[i]);
        if (overlapTokens + st <= overlap) {
          overlapChunk.unshift(currentChunk[i]);
          overlapTokens += st;
        } else {
          break;
        }
      }

      currentChunk = overlapChunk;
      currentTokens = overlapTokens;
    }

    currentChunk.push(sentence);
    currentTokens += sentenceTokens;
  }

  // Don't forget the last chunk
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(' '));
  }

  return chunks;
}

/**
 * Estimate token count for text
 */
export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Create chunks for a content item and generate embeddings
 */
export async function createContentChunks(
  contentItemId: string,
  text: string
): Promise<{ chunksCreated: number }> {
  // Delete existing chunks for this content item
  await prisma.contentChunk.deleteMany({
    where: { contentItemId },
  });

  // Chunk the text
  const chunks = chunkText(text);

  if (chunks.length === 0) {
    return { chunksCreated: 0 };
  }

  // Generate embeddings for all chunks
  const embeddings = await generateEmbeddings(chunks);

  // Create chunks with embeddings using raw SQL for vector type
  for (let i = 0; i < chunks.length; i++) {
    const chunkText = chunks[i];
    const embedding = embeddings[i];
    const tokenCount = estimateTokenCount(chunkText);

    // Create chunk without embedding first
    const chunk = await prisma.contentChunk.create({
      data: {
        contentItemId,
        chunkIndex: i,
        chunkText,
        tokenCount,
        metadata: {},
      },
    });

    // Update embedding using raw SQL
    const embeddingStr = `[${embedding.join(',')}]`;
    await prisma.$executeRawUnsafe(
      `UPDATE "ContentChunk" SET "embeddingVector" = $1::vector WHERE id = $2`,
      embeddingStr,
      chunk.id
    );
  }

  return { chunksCreated: chunks.length };
}

/**
 * Search for similar chunks using cosine similarity
 */
export async function searchSimilarChunks(
  queryText: string,
  options?: {
    projectId?: string;
    contentItemIds?: string[];
    topK?: number;
    minSimilarity?: number;
  }
): Promise<
  Array<{
    id: string;
    contentItemId: string;
    chunkText: string;
    chunkIndex: number;
    similarity: number;
    metadata: Record<string, unknown>;
  }>
> {
  const topK = options?.topK || aiConfig.rag.topK;
  const minSimilarity = options?.minSimilarity || aiConfig.rag.similarityThreshold;

  // Generate embedding for query
  const queryEmbedding = await generateEmbedding(queryText);
  const embeddingStr = `[${queryEmbedding.join(',')}]`;

  // Build WHERE clause
  let whereClause = '';
  const params: (string | number)[] = [embeddingStr, topK];

  if (options?.projectId) {
    whereClause += ` AND ci."projectId" = $${params.length + 1}`;
    params.push(options.projectId);
  }

  if (options?.contentItemIds && options.contentItemIds.length > 0) {
    const placeholders = options.contentItemIds.map((_, i) => `$${params.length + 1 + i}`).join(',');
    whereClause += ` AND cc."contentItemId" IN (${placeholders})`;
    params.push(...options.contentItemIds);
  }

  // Query similar chunks using cosine distance
  // Note: pgvector uses <=> for cosine distance (1 - cosine_similarity)
  const results = await prisma.$queryRawUnsafe<
    Array<{
      id: string;
      contentItemId: string;
      chunkText: string;
      chunkIndex: number;
      similarity: number;
      metadata: string;
    }>
  >(
    `
    SELECT
      cc.id,
      cc."contentItemId",
      cc."chunkText",
      cc."chunkIndex",
      1 - (cc."embeddingVector" <=> $1::vector) as similarity,
      cc.metadata::text
    FROM "ContentChunk" cc
    JOIN "ContentItem" ci ON cc."contentItemId" = ci.id
    WHERE cc."embeddingVector" IS NOT NULL
      AND ci."isActive" = true
      ${whereClause}
    ORDER BY cc."embeddingVector" <=> $1::vector
    LIMIT $2
    `,
    ...params
  );

  // Filter by minimum similarity and parse metadata
  return results
    .filter(r => r.similarity >= minSimilarity)
    .map(r => ({
      ...r,
      metadata: typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata,
    }));
}

/**
 * Search for similar chunks within a specific project
 */
export async function searchProjectChunks(
  projectId: string,
  queryText: string,
  options?: {
    topK?: number;
    minSimilarity?: number;
    startDate?: Date;
    endDate?: Date;
  }
): Promise<
  Array<{
    id: string;
    contentItemId: string;
    chunkText: string;
    chunkIndex: number;
    similarity: number;
    contentItem: {
      id: string;
      title: string;
      dateOccurred: Date;
      sourceType: string;
    };
  }>
> {
  const topK = options?.topK || aiConfig.rag.topK;
  const minSimilarity = options?.minSimilarity || aiConfig.rag.similarityThreshold;

  // Generate embedding for query
  const queryEmbedding = await generateEmbedding(queryText);
  const embeddingStr = `[${queryEmbedding.join(',')}]`;

  // Build date filter
  let dateFilter = '';
  const params: (string | number | Date)[] = [embeddingStr, projectId, topK];

  if (options?.startDate) {
    dateFilter += ` AND ci."dateOccurred" >= $${params.length + 1}`;
    params.push(options.startDate);
  }

  if (options?.endDate) {
    dateFilter += ` AND ci."dateOccurred" <= $${params.length + 1}`;
    params.push(options.endDate);
  }

  const results = await prisma.$queryRawUnsafe<
    Array<{
      id: string;
      contentItemId: string;
      chunkText: string;
      chunkIndex: number;
      similarity: number;
      contentItemTitle: string;
      dateOccurred: Date;
      sourceType: string;
    }>
  >(
    `
    SELECT
      cc.id,
      cc."contentItemId",
      cc."chunkText",
      cc."chunkIndex",
      1 - (cc."embeddingVector" <=> $1::vector) as similarity,
      ci.title as "contentItemTitle",
      ci."dateOccurred",
      ci."sourceType"
    FROM "ContentChunk" cc
    JOIN "ContentItem" ci ON cc."contentItemId" = ci.id
    WHERE cc."embeddingVector" IS NOT NULL
      AND ci."isActive" = true
      AND ci."projectId" = $2
      ${dateFilter}
    ORDER BY cc."embeddingVector" <=> $1::vector
    LIMIT $3
    `,
    ...params
  );

  return results
    .filter(r => r.similarity >= minSimilarity)
    .map(r => ({
      id: r.id,
      contentItemId: r.contentItemId,
      chunkText: r.chunkText,
      chunkIndex: r.chunkIndex,
      similarity: r.similarity,
      contentItem: {
        id: r.contentItemId,
        title: r.contentItemTitle,
        dateOccurred: r.dateOccurred,
        sourceType: r.sourceType,
      },
    }));
}

/**
 * Delete all chunks for a content item
 */
export async function deleteContentChunks(contentItemId: string): Promise<void> {
  await prisma.contentChunk.deleteMany({
    where: { contentItemId },
  });
}

export default {
  chunkText,
  estimateTokenCount,
  createContentChunks,
  searchSimilarChunks,
  searchProjectChunks,
  deleteContentChunks,
};
