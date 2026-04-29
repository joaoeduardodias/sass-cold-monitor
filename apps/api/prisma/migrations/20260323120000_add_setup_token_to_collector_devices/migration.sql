-- AlterTable
ALTER TABLE "collector_devices"
ADD COLUMN "setup_token" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "collector_devices_setup_token_key" ON "collector_devices"("setup_token");
