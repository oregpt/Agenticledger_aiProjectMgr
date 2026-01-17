-- Enable pgvector extension for embedding storage and similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateTable
CREATE TABLE "ContentChunk" (
    "id" TEXT NOT NULL,
    "contentItemId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL DEFAULT 0,
    "chunkText" TEXT NOT NULL,
    "tokenCount" INTEGER NOT NULL DEFAULT 0,
    "embeddingVector" vector(1536),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentChunk_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContentChunk_contentItemId_idx" ON "ContentChunk"("contentItemId");

-- CreateIndex
CREATE INDEX "ContentChunk_chunkIndex_idx" ON "ContentChunk"("chunkIndex");

-- AddForeignKey
ALTER TABLE "ContentChunk" ADD CONSTRAINT "ContentChunk_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create index for cosine similarity search using ivfflat (approximate nearest neighbor)
-- Note: IVFFlat requires data to build the index, so we use a partial index approach
-- For production with lots of data, consider adding lists parameter: WITH (lists = 100)
CREATE INDEX "ContentChunk_embedding_cosine_idx" ON "ContentChunk" USING ivfflat ("embeddingVector" vector_cosine_ops);
