-- CreateTable
CREATE TABLE "notification_settings" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "email_enabled" BOOLEAN NOT NULL DEFAULT true,
    "push_enabled" BOOLEAN NOT NULL DEFAULT true,
    "critical_alerts" BOOLEAN NOT NULL DEFAULT true,
    "warning_alerts" BOOLEAN NOT NULL DEFAULT true,
    "info_alerts" BOOLEAN NOT NULL DEFAULT false,
    "alert_cooldown" INTEGER NOT NULL DEFAULT 300,
    "email_template" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "notification_settings_organization_id_key" ON "notification_settings"("organization_id");

-- AddForeignKey
ALTER TABLE "notification_settings" ADD CONSTRAINT "notification_settings_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
