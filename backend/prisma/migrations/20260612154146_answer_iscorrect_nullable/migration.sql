-- AlterTable
ALTER TABLE "AnswerSubmission" ALTER COLUMN "isCorrect" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "AnswerSubmission_firstCorrectAt_idx" ON "AnswerSubmission"("firstCorrectAt");

-- Данные: существующие SHORT_WRITING-сабмиты без AI-оценки были записаны как
-- isCorrect = false ("ещё не оценено"). Переводим их в NULL по новой семантике,
-- чтобы они не считались "неправильными" в статистике.
UPDATE "AnswerSubmission" AS s
SET "isCorrect" = NULL
FROM "Question" AS q
WHERE s."questionId" = q."id"
  AND q."type" = 'SHORT_WRITING'
  AND s."aiScore" IS NULL
  AND s."isCorrect" = false;
