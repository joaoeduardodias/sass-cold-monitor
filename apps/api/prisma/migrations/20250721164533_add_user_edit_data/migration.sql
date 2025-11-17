/*
  Warnings:

  - You are about to drop the column `editData` on the `instrument_data` table. All the data in the column will be lost.
  - You are about to drop the column `generateData` on the `instrument_data` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "instrument_data" DROP COLUMN "editData",
DROP COLUMN "generateData",
ADD COLUMN     "edit_data" TEXT,
ADD COLUMN     "generate_data" TEXT,
ADD COLUMN     "user_edit_data" TEXT;
