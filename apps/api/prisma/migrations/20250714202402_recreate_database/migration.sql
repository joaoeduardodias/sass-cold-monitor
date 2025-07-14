/*
  Warnings:

  - You are about to drop the column `owner_id` on the `organizations` table. All the data in the column will be lost.
  - You are about to drop the `Instruments` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `ownerId` to the `organizations` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Instruments" DROP CONSTRAINT "Instruments_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "instrument_data" DROP CONSTRAINT "instrument_data_instrument_id_fkey";

-- DropForeignKey
ALTER TABLE "organizations" DROP CONSTRAINT "organizations_owner_id_fkey";

-- DropForeignKey
ALTER TABLE "union_instruments" DROP CONSTRAINT "union_instruments_first_instrument_id_fkey";

-- DropForeignKey
ALTER TABLE "union_instruments" DROP CONSTRAINT "union_instruments_second_instrument_id_fkey";

-- AlterTable
ALTER TABLE "organizations" DROP COLUMN "owner_id",
ADD COLUMN     "ownerId" TEXT NOT NULL;

-- DropTable
DROP TABLE "Instruments";

-- CreateTable
CREATE TABLE "instruments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "InstrumentType" NOT NULL,
    "model" INTEGER NOT NULL,
    "order_display" SERIAL NOT NULL,
    "max_value" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "min_value" DOUBLE PRECISION NOT NULL DEFAULT -100,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "id_sitrad" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "organization_id" TEXT NOT NULL,

    CONSTRAINT "instruments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "instruments_slug_key" ON "instruments"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "instruments_organization_id_slug_key" ON "instruments"("organization_id", "slug");

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instruments" ADD CONSTRAINT "instruments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instrument_data" ADD CONSTRAINT "instrument_data_instrument_id_fkey" FOREIGN KEY ("instrument_id") REFERENCES "instruments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "union_instruments" ADD CONSTRAINT "union_instruments_first_instrument_id_fkey" FOREIGN KEY ("first_instrument_id") REFERENCES "instruments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "union_instruments" ADD CONSTRAINT "union_instruments_second_instrument_id_fkey" FOREIGN KEY ("second_instrument_id") REFERENCES "instruments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
