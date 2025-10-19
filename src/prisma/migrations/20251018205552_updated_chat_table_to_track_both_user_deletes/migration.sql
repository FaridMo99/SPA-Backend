/*
  Warnings:

  - You are about to drop the column `deleted` on the `Chat` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `Chat` table. All the data in the column will be lost.
  - You are about to drop the column `deletedById` on the `Chat` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Chat" DROP CONSTRAINT "Chat_deletedById_fkey";

-- AlterTable
ALTER TABLE "public"."Chat" DROP COLUMN "deleted",
DROP COLUMN "deletedAt",
DROP COLUMN "deletedById",
ADD COLUMN     "deletedAtUserOne" TIMESTAMP(3),
ADD COLUMN     "deletedAtUserTwo" TIMESTAMP(3),
ADD COLUMN     "deletedByUserOne" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "deletedByUserTwo" BOOLEAN NOT NULL DEFAULT false;
