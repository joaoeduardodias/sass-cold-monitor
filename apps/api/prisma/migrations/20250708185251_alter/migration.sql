/*
  Warnings:

  - The values [OBSERVER] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'VIEWER', 'OPERATOR');
ALTER TABLE "members" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "members" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";
ALTER TABLE "members" ALTER COLUMN "role" SET DEFAULT 'VIEWER';
COMMIT;

-- AlterTable
ALTER TABLE "members" ALTER COLUMN "role" SET DEFAULT 'VIEWER';
