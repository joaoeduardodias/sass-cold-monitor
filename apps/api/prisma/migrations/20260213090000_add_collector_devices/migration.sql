-- CreateTable
CREATE TABLE "collector_devices" (
  "id" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "organization_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "collector_devices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "collector_devices_token_key" ON "collector_devices"("token");

-- CreateIndex
CREATE INDEX "collector_devices_organization_id_is_active_idx" ON "collector_devices"("organization_id", "is_active");

-- CreateIndex
CREATE INDEX "collector_devices_user_id_is_active_idx" ON "collector_devices"("user_id", "is_active");

-- AddForeignKey
ALTER TABLE "collector_devices"
ADD CONSTRAINT "collector_devices_organization_id_fkey"
FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collector_devices"
ADD CONSTRAINT "collector_devices_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
