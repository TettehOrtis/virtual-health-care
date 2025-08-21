-- AlterTable
ALTER TABLE "Doctor" ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "DoctorDocument" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'PENDING',
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DoctorDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DoctorDocument_doctorId_idx" ON "DoctorDocument"("doctorId");

-- AddForeignKey
ALTER TABLE "DoctorDocument" ADD CONSTRAINT "DoctorDocument_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
