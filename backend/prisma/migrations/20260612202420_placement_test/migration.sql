-- CreateEnum
CREATE TYPE "PlacementStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED');

-- CreateTable
CREATE TABLE "PlacementTest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "PlacementStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "ability" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "questionsAsked" INTEGER NOT NULL DEFAULT 0,
    "currentItemId" TEXT,
    "estimatedLevel" "CefrLevel",
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "PlacementTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlacementResponse" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "difficulty" DOUBLE PRECISION NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "abilityAfter" DOUBLE PRECISION NOT NULL,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlacementResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlacementItem" (
    "id" TEXT NOT NULL,
    "level" "CefrLevel" NOT NULL,
    "difficulty" DOUBLE PRECISION NOT NULL,
    "type" "QuestionType" NOT NULL,
    "prompt" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlacementItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlacementTest_userId_idx" ON "PlacementTest"("userId");

-- CreateIndex
CREATE INDEX "PlacementResponse_testId_idx" ON "PlacementResponse"("testId");

-- CreateIndex
CREATE INDEX "PlacementItem_difficulty_idx" ON "PlacementItem"("difficulty");

-- AddForeignKey
ALTER TABLE "PlacementTest" ADD CONSTRAINT "PlacementTest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlacementResponse" ADD CONSTRAINT "PlacementResponse_testId_fkey" FOREIGN KEY ("testId") REFERENCES "PlacementTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
