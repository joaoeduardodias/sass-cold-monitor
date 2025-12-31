/* eslint-disable prettier/prettier */
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod/v4'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { convertToUTC } from '@/utils/date-timezone-converter'
import { filterByInterval } from '@/utils/filter-by-interval'
import { getUserPermissions } from '@/utils/get-user-permissions'

import { BadRequestError } from '../_errors/bad-request-error'
import { UnauthorizedError } from '../_errors/unauthorized-error'

interface InstrumentData {
  id: string
  createdAt: Date
  updatedAt: Date
  editData: number
  userEditData: string | null
}

const ResponseType = {
  JOIN: 'JOIN',
  TEMPERATURE: 'TEMPERATURE',
  PRESSURE: 'PRESSURE',
} as const

function mapData(data: InstrumentData[]) {
  return data.map((item) => ({
    id: item.id,
    data: item.editData,
    updatedUserAt: item.userEditData,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }))
}

async function getFilteredData(params: {
  data: InstrumentData[]
  instrumentId: string
  interval: number
  endDate: Date
}) {
  return filterByInterval({
    data: params.data,
    instrumentId: params.instrumentId,
    intervalMinutes: params.interval,
    endDate: params.endDate,
  })
}

export async function getData(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/organizations/:orgSlug/instruments/:instrumentId/data',
      {
        schema: {
          tags: ['Instruments'],
          summary: 'Get instrument data',
          security: [{ bearerAuth: [] }],
          params: z.object({
            orgSlug: z.string(),
            instrumentId: z.uuid(),
          }),
          querystring: z.object({
            startDate: z.coerce.date(),
            endDate: z.coerce.date(),
            chartVariation: z.coerce.number(),
            tableVariation: z.coerce.number().nullish(),
          }),
          response: {
            200: z.object({
              data: z.object({
                id: z.uuid(),
                name: z.string(),
                dateOpen: z.date(),
                dateClose: z.date(),
                type: z.enum(['JOIN', 'TEMPERATURE', 'PRESSURE']),
                chartDataTemperature: z.array(z.any()),
                chartDataPressure: z.array(z.any()),
                tableDataTemperature: z.array(z.any()),
                tableDataPressure: z.array(z.any()),
              }),
            }),
          },
        },
      },
      async (request, reply) => {
        const { orgSlug, instrumentId } = request.params
        const { startDate, endDate, chartVariation, tableVariation } =
          request.query

        const userId = await request.getCurrentUserId()
        const { membership } = await request.getUserMembership(orgSlug)
        const { cannot } = getUserPermissions(userId, membership.role)

        if (cannot('get', 'InstrumentData')) {
          throw new UnauthorizedError(
            `You're not allowed to see this instrument data.`,
          )
        }

        const baseWhere = {
          createdAt: {
            gte: convertToUTC(startDate),
            lte: convertToUTC(endDate),
          },
        }

        const instrument = await prisma.instrument.findUnique({
          where: { id: instrumentId },
          select: {
            id: true,
            name: true,
            type: true,
            data: { where: baseWhere },
          },
        })

        if (instrument) {
          const chartData = await getFilteredData({
            data: instrument.data,
            instrumentId: instrument.id,
            interval: chartVariation,
            endDate,
          })

          const tableData = await getFilteredData({
            data: instrument.data,
            instrumentId: instrument.id,
            interval: tableVariation ?? chartVariation,
            endDate,
          })

          return reply.send({
            data: {
              id: instrument.id,
              name: instrument.name,
              dateOpen: startDate,
              dateClose: endDate,
              type:
                instrument.type === 'PRESSURE'
                  ? ResponseType.PRESSURE
                  : ResponseType.TEMPERATURE,
              chartDataTemperature:
                instrument.type === 'TEMPERATURE' ? mapData(chartData) : [],
              chartDataPressure:
                instrument.type === 'PRESSURE' ? mapData(chartData) : [],
              tableDataTemperature:
                instrument.type === 'TEMPERATURE' ? mapData(tableData) : [],
              tableDataPressure:
                instrument.type === 'PRESSURE' ? mapData(tableData) : [],
            },
          })
        }

        const joinInstrument = await prisma.joinInstrument.findUnique({
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
        })

        if (!joinInstrument) {
          throw new BadRequestError('Instrument not found.')
        }

        const instruments = [
          joinInstrument.firstInstrument,
          joinInstrument.secondInstrument,
        ]

        const temperatureInstrument = instruments.find(
          (i) => i.type === 'TEMPERATURE',
        )
        const pressureInstrument = instruments.find(
          (i) => i.type === 'PRESSURE',
        )

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
          : [[], []]

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
          : [[], []]

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
        })
      },
    )
}
