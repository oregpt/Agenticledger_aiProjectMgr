-- CreateTable
CREATE TABLE "PlanItemType" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "organizationId" INTEGER,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "icon" TEXT,
    "color" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanItemType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanItem" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "parentId" TEXT,
    "itemTypeId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "owner" TEXT,
    "status" TEXT NOT NULL DEFAULT 'not_started',
    "startDate" DATE,
    "targetEndDate" DATE,
    "actualStartDate" DATE,
    "actualEndDate" DATE,
    "notes" TEXT,
    "references" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "path" TEXT NOT NULL DEFAULT '',
    "depth" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanItemHistory" (
    "id" SERIAL NOT NULL,
    "planItemId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "changedByUserId" INTEGER,
    "changedByEmail" TEXT,
    "changeReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanItemHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlanItemType_uuid_key" ON "PlanItemType"("uuid");

-- CreateIndex
CREATE INDEX "PlanItemType_level_idx" ON "PlanItemType"("level");

-- CreateIndex
CREATE INDEX "PlanItemType_isActive_idx" ON "PlanItemType"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "PlanItemType_slug_organizationId_key" ON "PlanItemType"("slug", "organizationId");

-- CreateIndex
CREATE INDEX "PlanItem_projectId_idx" ON "PlanItem"("projectId");

-- CreateIndex
CREATE INDEX "PlanItem_parentId_idx" ON "PlanItem"("parentId");

-- CreateIndex
CREATE INDEX "PlanItem_itemTypeId_idx" ON "PlanItem"("itemTypeId");

-- CreateIndex
CREATE INDEX "PlanItem_status_idx" ON "PlanItem"("status");

-- CreateIndex
CREATE INDEX "PlanItem_path_idx" ON "PlanItem"("path");

-- CreateIndex
CREATE INDEX "PlanItem_isActive_idx" ON "PlanItem"("isActive");

-- CreateIndex
CREATE INDEX "PlanItemHistory_planItemId_idx" ON "PlanItemHistory"("planItemId");

-- CreateIndex
CREATE INDEX "PlanItemHistory_createdAt_idx" ON "PlanItemHistory"("createdAt");

-- AddForeignKey
ALTER TABLE "PlanItemType" ADD CONSTRAINT "PlanItemType_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanItem" ADD CONSTRAINT "PlanItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanItem" ADD CONSTRAINT "PlanItem_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "PlanItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanItem" ADD CONSTRAINT "PlanItem_itemTypeId_fkey" FOREIGN KEY ("itemTypeId") REFERENCES "PlanItemType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanItemHistory" ADD CONSTRAINT "PlanItemHistory_planItemId_fkey" FOREIGN KEY ("planItemId") REFERENCES "PlanItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
