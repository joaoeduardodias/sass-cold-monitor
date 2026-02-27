-- CreateTable
CREATE TABLE "alert_read_logs" (
  "id" TEXT NOT NULL,
  "organization_id" TEXT NOT NULL,
  "instrument_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "alert_signature" TEXT NOT NULL,
  "severity" TEXT NOT NULL,
  "value" DOUBLE PRECISION NOT NULL,
  "min_threshold" DOUBLE PRECISION NOT NULL,
  "max_threshold" DOUBLE PRECISION NOT NULL,
  "threshold_type" TEXT NOT NULL,
  "alert_timestamp" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "alert_read_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "alert_read_logs_org_user_instrument_signature_key"
ON "alert_read_logs"("organization_id", "user_id", "instrument_id", "alert_signature");

-- CreateIndex
CREATE INDEX "alert_read_logs_org_user_created_idx"
ON "alert_read_logs"("organization_id", "user_id", "created_at");

-- AddForeignKey
ALTER TABLE "alert_read_logs"
ADD CONSTRAINT "alert_read_logs_organization_id_fkey"
FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_read_logs"
ADD CONSTRAINT "alert_read_logs_instrument_id_fkey"
FOREIGN KEY ("instrument_id") REFERENCES "instruments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_read_logs"
ADD CONSTRAINT "alert_read_logs_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
