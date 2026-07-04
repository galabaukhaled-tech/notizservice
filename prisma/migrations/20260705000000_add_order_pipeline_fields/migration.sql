-- AlterTable: Priorität, Pipeline-Phase, Auftragswert und Wiedervorlage
ALTER TABLE "Order" ADD COLUMN "priority" TEXT NOT NULL DEFAULT 'normal';
ALTER TABLE "Order" ADD COLUMN "phase" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Order" ADD COLUMN "value" REAL NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "followUpDate" TEXT NOT NULL DEFAULT '';
