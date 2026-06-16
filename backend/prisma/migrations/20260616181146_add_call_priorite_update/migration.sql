/*
  Warnings:

  - The values [CRITICAL] on the enum `CallPriority` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "CallPriority_new" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
ALTER TABLE "public"."Call" ALTER COLUMN "priority" DROP DEFAULT;
ALTER TABLE "Call" ALTER COLUMN "priority" TYPE "CallPriority_new" USING ("priority"::text::"CallPriority_new");
ALTER TYPE "CallPriority" RENAME TO "CallPriority_old";
ALTER TYPE "CallPriority_new" RENAME TO "CallPriority";
DROP TYPE "public"."CallPriority_old";
ALTER TABLE "Call" ALTER COLUMN "priority" SET DEFAULT 'MEDIUM';
COMMIT;
