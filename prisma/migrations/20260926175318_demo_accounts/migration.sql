-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isDemo" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastDemoResetAt" TIMESTAMP(3);
