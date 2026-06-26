-- CreateEnum
CREATE TYPE "SnapshotLabel" AS ENUM ('PRE', 'POST', 'WEEKLY');

-- CreateTable
CREATE TABLE "ProgressSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" "SnapshotLabel" NOT NULL,
    "level" "CefrLevel",
    "totalXp" INTEGER NOT NULL,
    "accuracy" DOUBLE PRECISION NOT NULL,
    "skillBreakdown" JSONB NOT NULL,
    "takenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgressSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProgressSnapshot_userId_label_idx" ON "ProgressSnapshot"("userId", "label");

-- AddForeignKey
ALTER TABLE "ProgressSnapshot" ADD CONSTRAINT "ProgressSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
