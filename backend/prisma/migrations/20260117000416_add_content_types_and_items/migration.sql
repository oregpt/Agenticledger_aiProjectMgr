-- CreateTable
CREATE TABLE "ContentType" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "organizationId" INTEGER,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityItemType" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "organizationId" INTEGER,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActivityItemType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentItem" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "planItemIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "contentTypeIds" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "activityTypeIds" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "sourceType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dateOccurred" DATE NOT NULL,
    "projectWeek" INTEGER,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "rawContent" TEXT,
    "fileReference" TEXT,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "aiSummary" TEXT,
    "aiExtractedEntities" JSONB NOT NULL DEFAULT '{}',
    "processingStatus" TEXT NOT NULL DEFAULT 'pending',
    "parentItemId" TEXT,
    "createdBy" TEXT NOT NULL DEFAULT 'user',
    "createdByUserId" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ContentType_uuid_key" ON "ContentType"("uuid");

-- CreateIndex
CREATE INDEX "ContentType_isActive_idx" ON "ContentType"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ContentType_slug_organizationId_key" ON "ContentType"("slug", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityItemType_uuid_key" ON "ActivityItemType"("uuid");

-- CreateIndex
CREATE INDEX "ActivityItemType_isActive_idx" ON "ActivityItemType"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityItemType_slug_organizationId_key" ON "ActivityItemType"("slug", "organizationId");

-- CreateIndex
CREATE INDEX "ContentItem_projectId_idx" ON "ContentItem"("projectId");

-- CreateIndex
CREATE INDEX "ContentItem_dateOccurred_idx" ON "ContentItem"("dateOccurred");

-- CreateIndex
CREATE INDEX "ContentItem_projectWeek_idx" ON "ContentItem"("projectWeek");

-- CreateIndex
CREATE INDEX "ContentItem_processingStatus_idx" ON "ContentItem"("processingStatus");

-- CreateIndex
CREATE INDEX "ContentItem_isActive_idx" ON "ContentItem"("isActive");

-- AddForeignKey
ALTER TABLE "ContentType" ADD CONSTRAINT "ContentType_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityItemType" ADD CONSTRAINT "ActivityItemType_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_parentItemId_fkey" FOREIGN KEY ("parentItemId") REFERENCES "ContentItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
