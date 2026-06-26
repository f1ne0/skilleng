-- CreateEnum
CREATE TYPE "TopicSkill" AS ENUM ('READING', 'LISTENING', 'SPEAKING', 'WRITING', 'GRAMMAR', 'VOCABULARY');

-- CreateTable
CREATE TABLE "Topic" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "skill" "TopicSkill" NOT NULL,
    "level" "CefrLevel" NOT NULL,
    "theoryContent" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN "topicId" TEXT;

-- CreateIndex
CREATE INDEX "Topic_skill_level_idx" ON "Topic"("skill", "level");

-- CreateIndex
CREATE INDEX "Lesson_topicId_idx" ON "Lesson"("topicId");

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;
