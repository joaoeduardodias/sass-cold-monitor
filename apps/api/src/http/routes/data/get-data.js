"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getData = getData;
const v4_1 = require("zod/v4");
const auth_1 = require("@/http/middlewares/auth");
const prisma_1 = require("@/lib/prisma");
const date_timezone_converter_1 = require("@/utils/date-timezone-converter");
const filter_by_interval_1 = require("@/utils/filter-by-interval");
const get_user_permissions_1 = require("@/utils/get-user-permissions");
const bad_request_error_1 = require("../_errors/bad-request-error");
const unauthorized_error_1 = require("../_errors/unauthorized-error");
const ResponseType = {
    JOIN: 'JOIN',
    TEMPERATURE: 'TEMPERATURE',
    PRESSURE: 'PRESSURE',
};
function mapData(data) {
    return data.map((item) => ({
        id: item.id,
        data: item.editData,
        updatedUserAt: item.userEditData,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
    }));
}
async function getFilteredData(params) {
    return (0, filter_by_interval_1.filterByInterval)({
        data: params.data,
        instrumentId: params.instrumentId,
        intervalMinutes: params.interval,
        endDate: params.endDate,
    });
}
async function getData(app) {
    app
        .withTypeProvider()
        .register(auth_1.auth)
        .get('/organizations/:orgSlug/instruments/:instrumentId/data', {
        schema: {
            tags: ['Instruments'],
            summary: 'Get instrument data',
            security: [{ bearerAuth: [] }],
            params: v4_1.z.object({
                orgSlug: v4_1.z.string(),
                instrumentId: v4_1.z.uuid(),
            }),
            querystring: v4_1.z.object({
                startDate: v4_1.z.coerce.date(),
                endDate: v4_1.z.coerce.date(),
                chartVariation: v4_1.z.coerce.number(),
                tableVariation: v4_1.z.coerce.number().nullish(),
            }),
            response: {
                200: v4_1.z.object({
                    data: v4_1.z.object({
                        id: v4_1.z.uuid(),
                        name: v4_1.z.string(),
                        dateOpen: v4_1.z.date(),
                        dateClose: v4_1.z.date(),
                        type: v4_1.z.enum(['JOIN', 'TEMPERATURE', 'PRESSURE']),
                        chartDataTemperature: v4_1.z.array(v4_1.z.any()),
                        chartDataPressure: v4_1.z.array(v4_1.z.any()),
                        tableDataTemperature: v4_1.z.array(v4_1.z.any()),
                        tableDataPressure: v4_1.z.array(v4_1.z.any()),
                    }),
                }),
            },
        },
    }, async (request, reply) => {
        const { orgSlug, instrumentId } = request.params;
        const { startDate, endDate, chartVariation, tableVariation } = request.query;
        const userId = await request.getCurrentUserId();
        const { membership } = await request.getUserMembership(orgSlug);
        const { cannot } = (0, get_user_permissions_1.getUserPermissions)(userId, membership.role);
        if (cannot('get', 'InstrumentData')) {
            throw new unauthorized_error_1.UnauthorizedError(`You're not allowed to see this instrument data.`);
        }
        const baseWhere = {
            createdAt: {
                gte: (0, date_timezone_converter_1.convertToUTC)(startDate),
                lte: (0, date_timezone_converter_1.convertToUTC)(endDate),
            },
        };
        const instrument = await prisma_1.prisma.instrument.findUnique({
            where: { id: instrumentId },
            select: {
                id: true,
                name: true,
                type: true,
                data: { where: baseWhere },
            },
        });
        if (instrument) {
            const chartData = await getFilteredData({
                data: instrument.data,
                instrumentId: instrument.id,
                interval: chartVariation,
                endDate,
            });
            const tableData = await getFilteredData({
                data: instrument.data,
                instrumentId: instrument.id,
                interval: tableVariation ?? chartVariation,
                endDate,
            });
            return reply.send({
                data: {
                    id: instrument.id,
                    name: instrument.name,
                    dateOpen: startDate,
                    dateClose: endDate,
                    type: instrument.type === 'PRESSURE'
                        ? ResponseType.PRESSURE
                        : ResponseType.TEMPERATURE,
                    chartDataTemperature: instrument.type === 'TEMPERATURE' ? mapData(chartData) : [],
                    chartDataPressure: instrument.type === 'PRESSURE' ? mapData(chartData) : [],
                    tableDataTemperature: instrument.type === 'TEMPERATURE' ? mapData(tableData) : [],
                    tableDataPressure: instrument.type === 'PRESSURE' ? mapData(tableData) : [],
                },
            });
        }
        const joinInstrument = await prisma_1.prisma.joinInstrument.findUnique({
            where: { id: instrumentId },
            select: {
                id: true,
                name: true,
                firstInstrument: {
                    select: {
                        id: true,
                        type: true,
                        data: { where: baseWhere },
                    },
                },
                secondInstrument: {
                    select: {
                        id: true,
                        type: true,
                        data: { where: baseWhere },
                    },
                },
            },
        });
        if (!joinInstrument) {
            throw new bad_request_error_1.BadRequestError('Instrument not found.');
        }
        const instruments = [
            joinInstrument.firstInstrument,
            joinInstrument.secondInstrument,
        ];
        const temperatureInstrument = instruments.find((i) => i.type === 'TEMPERATURE');
        const pressureInstrument = instruments.find((i) => i.type === 'PRESSURE');
        const [chartTemp, tableTemp] = temperatureInstrument
            ? await Promise.all([
                getFilteredData({
                    data: temperatureInstrument.data,
                    instrumentId: temperatureInstrument.id,
                    interval: chartVariation,
                    endDate,
                }),
                getFilteredData({
                    data: temperatureInstrument.data,
                    instrumentId: temperatureInstrument.id,
                    interval: tableVariation ?? chartVariation,
                    endDate,
                }),
            ])
            : [[], []];
        const [chartPress, tablePress] = pressureInstrument
            ? await Promise.all([
                getFilteredData({
                    data: pressureInstrument.data,
                    instrumentId: pressureInstrument.id,
                    interval: chartVariation,
                    endDate,
                }),
                getFilteredData({
                    data: pressureInstrument.data,
                    instrumentId: pressureInstrument.id,
                    interval: tableVariation ?? chartVariation,
                    endDate,
                }),
            ])
            : [[], []];
        return reply.send({
            data: {
                id: joinInstrument.id,
                name: joinInstrument.name,
                dateOpen: startDate,
                dateClose: endDate,
                type: ResponseType.JOIN,
                chartDataTemperature: mapData(chartTemp),
                chartDataPressure: mapData(chartPress),
                tableDataTemperature: mapData(tableTemp),
                tableDataPressure: mapData(tablePress),
            },
        });
    });
}
