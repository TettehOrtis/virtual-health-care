-- CreateEnum
CREATE TYPE "AppointmentType" AS ENUM ('IN_PERSON', 'ONLINE', 'VIDEO_CALL');

-- AlterEnum
ALTER TYPE "AppointmentStatus" ADD VALUE 'CANCELED';

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "time" TEXT,
ADD COLUMN     "type" "AppointmentType" NOT NULL DEFAULT 'IN_PERSON';
