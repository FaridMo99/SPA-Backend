-- CreateEnum
CREATE TYPE "public"."PostType" AS ENUM ('TEXT', 'IMAGE');

-- AlterTable
ALTER TABLE "public"."Post" ADD COLUMN     "type" "public"."PostType" NOT NULL DEFAULT 'TEXT';
