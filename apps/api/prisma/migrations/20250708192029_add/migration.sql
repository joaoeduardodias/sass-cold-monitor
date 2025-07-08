/*
  Warnings:

  - A unique constraint covering the columns `[first_instrument_id,second_instrument_id]` on the table `union_instruments` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "union_instruments_first_instrument_id_second_instrument_id_key" ON "union_instruments"("first_instrument_id", "second_instrument_id");
