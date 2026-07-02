-- AlterTable: add order fields (idempotent-safe columns with defaults)
ALTER TABLE "Order" ADD COLUMN "customOrderId" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Order" ADD COLUMN "time" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Order" ADD COLUMN "endTime" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Order" ADD COLUMN "gewerk" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Customer" ADD COLUMN "gewerk" TEXT NOT NULL DEFAULT '';
