-- AlterTable
ALTER TABLE "IssueStatusEvent" ADD COLUMN     "note" TEXT;

-- AlterTable
ALTER TABLE "Schedule" ADD COLUMN     "status" "IssueStatus" NOT NULL DEFAULT 'OPEN';

-- CreateTable
CREATE TABLE "ScheduleStatusEvent" (
    "id" UUID NOT NULL,
    "scheduleId" UUID NOT NULL,
    "status" "IssueStatus" NOT NULL,
    "note" TEXT,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScheduleStatusEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScheduleStatusEvent_scheduleId_idx" ON "ScheduleStatusEvent"("scheduleId");

-- AddForeignKey
ALTER TABLE "ScheduleStatusEvent" ADD CONSTRAINT "ScheduleStatusEvent_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
