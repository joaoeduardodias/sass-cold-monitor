"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMissingDataItem = generateMissingDataItem;
exports.filterByInterval = filterByInterval;
const dayjs_1 = __importDefault(require("dayjs"));
const uuid_1 = require("uuid");
const prisma_1 = require("@/lib/prisma");
function generateMissingDataItem(timestamp, lastKnownValue, averageValue) {
    const base = averageValue ?? lastKnownValue ?? 2;
    const variation = 0.05;
    const generatedEditData = base * (1 + (Math.random() * 2 - 1) * variation);
    return {
        id: (0, uuid_1.v4)(),
        createdAt: timestamp,
        updatedAt: timestamp,
        editData: parseFloat(generatedEditData.toFixed(1)),
        userEditData: null,
    };
}
async function filterByInterval({ data, endDate, instrumentId, intervalMinutes, averageValue, }) {
    if (data.length === 0)
        return [];
    const result = [];
    const sortedData = [...data].sort((a, b) => (0, dayjs_1.default)(a.createdAt).valueOf() - (0, dayjs_1.default)(b.createdAt).valueOf());
    let currentIntervalStart = (0, dayjs_1.default)(sortedData[0].createdAt)
        .second(0)
        .millisecond(0);
    const endLimit = endDate
        ? (0, dayjs_1.default)(endDate)
        : (0, dayjs_1.default)(sortedData[sortedData.length - 1].createdAt);
    let dataIndex = 0;
    let lastKnownValue = null;
    while (currentIntervalStart.valueOf() <= endLimit.valueOf()) {
        const intervalEnd = currentIntervalStart.add(intervalMinutes, 'minute');
        let foundItemInInterval = false;
        let itemToPush = null;
        while (dataIndex < sortedData.length) {
            const currentItem = sortedData[dataIndex];
            const itemTime = (0, dayjs_1.default)(currentItem.createdAt);
            if (itemTime.valueOf() >= currentIntervalStart.valueOf() &&
                itemTime.valueOf() < intervalEnd.valueOf()) {
                itemToPush = currentItem;
                foundItemInInterval = true;
                dataIndex++;
                break;
            }
            else if (itemTime.valueOf() >= intervalEnd.valueOf()) {
                break;
            }
            dataIndex++;
        }
        if (foundItemInInterval && itemToPush) {
            result.push(itemToPush);
            lastKnownValue = itemToPush.editData;
        }
        else {
            const generatedItem = generateMissingDataItem(currentIntervalStart.toDate(), lastKnownValue, averageValue);
            result.push(generatedItem);
            lastKnownValue = generatedItem.editData;
        }
        currentIntervalStart = intervalEnd;
    }
    if (endDate) {
        const end = (0, dayjs_1.default)(endDate);
        const lastItem = result[result.length - 1];
        let finalItem = await prisma_1.prisma.instrumentData.findFirst({
            where: {
                instrumentId,
                createdAt: end.toDate(),
            },
        });
        let finalValue;
        if (finalItem) {
            finalValue = finalItem.editData;
        }
        else {
            const generatedItem = generateMissingDataItem(end.toDate(), lastKnownValue, averageValue);
            finalValue = generatedItem.editData;
            finalItem = await prisma_1.prisma.instrumentData.create({
                data: {
                    instrumentId,
                    editData: finalValue,
                    data: finalValue,
                    createdAt: generatedItem.createdAt,
                },
            });
        }
        if (!(0, dayjs_1.default)(lastItem.createdAt).isSame(end, 'second')) {
            result.push({
                id: finalItem.id,
                createdAt: finalItem.createdAt,
                updatedAt: finalItem.updatedAt,
                editData: finalItem.editData,
                userEditData: finalItem.userEditData,
            });
        }
        lastKnownValue = finalValue;
    }
    return result;
}
