-- AlterTable
ALTER TABLE "public"."Comment" ADD COLUMN     "type" "public"."MessageType" NOT NULL DEFAULT 'TEXT';
