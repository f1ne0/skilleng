-- AlterEnum
ALTER TYPE "QuestionType" ADD VALUE 'SPEAKING_RESPONSE';

-- CreateEnum
CREATE TYPE "Skill" AS ENUM ('READING', 'LISTENING', 'SPEAKING', 'WRITING');

-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN "skillFocus" "Skill";
