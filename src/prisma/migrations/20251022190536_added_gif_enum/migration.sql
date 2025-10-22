-- CreateEnum
CREATE TYPE "public"."MessageType" AS ENUM ('TEXT', 'GIF');

-- AlterTable
ALTER TABLE "public"."Message" ADD COLUMN     "type" "public"."MessageType" NOT NULL DEFAULT 'TEXT';
