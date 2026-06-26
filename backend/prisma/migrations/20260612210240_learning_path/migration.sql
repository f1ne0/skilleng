-- CreateEnum
CREATE TYPE "PathNodeType" AS ENUM ('LESSON', 'SKILL_BLOCK', 'CHECKPOINT', 'REVIEW');

-- CreateEnum
CREATE TYPE "PathNodeStatus" AS ENUM ('LOCKED', 'AVAILABLE', 'COMPLETED');

-- CreateTable
CREATE TABLE "LearningPath" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "basedOnLevel" "CefrLevel" NOT NULL,
    "goal" "LearningGoal",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningPath_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PathNode" (
    "id" TEXT NOT NULL,
    "pathId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "type" "PathNodeType" NOT NULL,
    "refId" TEXT,
    "skillFocus" "Skill",
    "status" "PathNodeStatus" NOT NULL DEFAULT 'LOCKED',
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "PathNode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LearningPath_userId_key" ON "LearningPath"("userId");

-- CreateIndex
CREATE INDEX "PathNode_pathId_order_idx" ON "PathNode"("pathId", "order");

-- AddForeignKey
ALTER TABLE "LearningPath" ADD CONSTRAINT "LearningPath_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PathNode" ADD CONSTRAINT "PathNode_pathId_fkey" FOREIGN KEY ("pathId") REFERENCES "LearningPath"("id") ON DELETE CASCADE ON UPDATE CASCADE;
