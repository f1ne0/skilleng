-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "prerequisiteCourseId" TEXT;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_prerequisiteCourseId_fkey" FOREIGN KEY ("prerequisiteCourseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;
