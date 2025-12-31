"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateInstrumentData = generateInstrumentData;
exports.saveInstrumentData = saveInstrumentData;
const client_1 = require("@prisma/client");
const prisma_1 = require("@/lib/prisma");
function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
}
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
function generateInstrumentData({ instrumentId, type, startDate, endDate, defrostDate, variation, initialTemp, averageTemp, }) {
    const intervalMinutes = 5;
    const result = [];
    let currentValue = initialTemp ??
        averageTemp ??
        (type === 'TEMPERATURE' ? randomBetween(-5, 5) : randomBetween(1, 3));
    const avg = averageTemp ?? currentValue;
    const maxVariation = variation;
    for (let current = new Date(startDate); current <= endDate; current = new Date(current.getTime() + intervalMinutes * 60_000)) {
        const isDefrost = defrostDate &&
            Math.abs(current.getTime() - defrostDate.getTime()) < 30 * 60_000; // 30 min
        let delta = randomBetween(-maxVariation, maxVariation);
        if (type === 'PRESSURE') {
            delta = delta * 0.3; // pressão varia menos
        }
        if (isDefrost && type === 'TEMPERATURE') {
            delta = randomBetween(0.5, 1.5); // pico positivo
        }
        currentValue += delta;
        // força retorno à média ao longo do tempo
        currentValue += (avg - currentValue) * 0.02;
        currentValue = clamp(currentValue, avg - maxVariation * 3, avg + maxVariation * 3);
        result.push({
            instrumentId,
            createdAt: new Date(current),
            data: Number(currentValue.toFixed(2)),
            editData: 0,
            generateData: 1,
            userEditData: null,
        });
    }
    return result;
}
async function saveInstrumentData(formatInstrumentDataResult) {
    if (formatInstrumentDataResult.length === 0)
        return;
    const batchSize = 5000;
    for (let i = 0; i < formatInstrumentDataResult.length; i += batchSize) {
        const batch = formatInstrumentDataResult.slice(i, i + batchSize);
        const values = client_1.Prisma.join(batch.map((d) => client_1.Prisma.sql `(
          gen_random_uuid(),
          ${d.createdAt},
          now(),
          ${d.instrumentId},
          ${d.data},
          ${d.editData},
          ${d.generateData ?? null},
          ${d.userEditData ?? null}
        )`));
        await prisma_1.prisma.$executeRaw `
    INSERT INTO "instrument_data" (
      id,
      created_at,
      updated_at,
      instrument_id,
      data,
      edit_data,
      generate_data,
      user_edit_data
    )
    VALUES ${values}
    ON CONFLICT ("instrument_id", "created_at")
    DO UPDATE SET "edit_data" = EXCLUDED."edit_data"
  `;
    }
}
