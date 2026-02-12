-- AlterTable
ALTER TABLE "notification_settings"
ADD COLUMN "email_recipients" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
