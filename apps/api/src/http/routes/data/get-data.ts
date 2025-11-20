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

export async function getData(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/organizations/:orgSlug/instruments/:instrumentId/data',
      {
        schema: {
          tags: ['Instruments'],
          summary: 'Get instrument data.',
          security: [{ bearerAuth: [] }],
          params: z.object({
            orgSlug: z.string(),
            instrumentId: z.uuid(),
          }),
          body: z.object({
            startDate: z.string(),
            endDate: z.string(),
            tableVariation: z.number().nullable(),
            chartVariation: z.number(),
          }),
          response: {
            200: z.object({
              data: z.object({
                id: z.uuid(),
                name: z.string(),
                dateClose: z.string(),
                dateOpen: z.string(),
                type: z.enum(ResponseType),
                chartDataTemperature: z.array(
                  z.object({
                    id: z.uuid(),
                    data: z.number(),
                    updatedUserAt: z.string().nullable(),
                    createdAt: z.string(),
                    updatedAt: z.string(),
                  }),
                ),
                chartDataPressure: z.array(
                  z.object({
                    id: z.uuid(),
                    data: z.number(),
                    updatedUserAt: z.string().nullable(),
                    createdAt: z.string(),
                    updatedAt: z.string(),
                  }),
                ),
                tableDataTemperature: z.array(
                  z.object({
                    id: z.uuid(),
                    data: z.number(),
                    updatedUserAt: z.string().nullable(),
                    createdAt: z.string(),
                    updatedAt: z.string(),
                  }),
                ),
                tableDataPressure: z.array(
                  z.object({
                    id: z.uuid(),
                    data: z.number(),
                    updatedUserAt: z.string().nullable(),
                    createdAt: z.string(),
                    updatedAt: z.string(),
                  }),
                ),
              }),
            }),
          },
        },
      },

      async (request) => {
        const { orgSlug, instrumentId } = request.params
        const userId = await request.getCurrentUserId()
        const { membership } = await request.getUserMembership(orgSlug)
        const { cannot } = getUserPermissions(userId, membership.role)

        if (cannot('get', 'InstrumentData')) {
          throw new UnauthorizedError(
            `You're not allowed to see this instrument data.`,
          )
        }

        const { chartVariation, endDate, startDate, tableVariation } =
          request.body
        const instrumentData = await prisma.instrument.findUnique({
          where: {
            id: instrumentId,
          },
          select: {
            id: true,
            name: true,
            type: true,
            data: {
              select: {
                id: true,
                editData: true,
                createdAt: true,
                updatedAt: true,
                userEditData: true,
              },
              where: {
                createdAt: {
                  gte: convertToUTC(startDate),
                  lte: convertToUTC(endDate),
                },
              },
            },
          },
        })

        if (!instrumentData) {
          const joinInstrumentData = await prisma.joinInstrument.findUnique({
            where: {
              id: instrumentId,
            },
            select: {
              id: true,
              name: true,
              firstInstrument: {
                select: {
                  type: true,
                  id: true,
                  data: {
                    select: {
                      id: true,
                      editData: true,
                      userEditData: true,
                      createdAt: true,
                      updatedAt: true,
                    },
                    where: {
                      createdAt: {
                        gte: convertToUTC(startDate),
                        lte: convertToUTC(endDate),
                      },
                    },
                  },
                },
              },
              secondInstrument: {
                select: {
                  type: true,
                  id: true,
                  data: {
                    select: {
                      id: true,
                      editData: true,
                      userEditData: true,
                      createdAt: true,
                      updatedAt: true,
                    },
                    where: {
                      createdAt: {
                        gte: convertToUTC(startDate),
                        lte: convertToUTC(endDate),
                      },
                    },
                  },
                },
              },
            },
          })
          if (!joinInstrumentData) {
            throw new BadRequestError('Join instrument not found.')
          }
          let chartDataTemperature: InstrumentData[] = []
          let chartDataPressure: InstrumentData[] = []
          let tableRangeData: InstrumentData[] = []
          let tablePressureRange: InstrumentData[] = []

          if (joinInstrumentData.firstInstrument.type === 'TEMPERATURE') {
            chartDataTemperature = await filterByInterval({
              data: joinInstrumentData.firstInstrument.data,
              intervalMinutes: chartVariation,
              endDate,
              instrumentId: joinInstrumentData.firstInstrument.id,
            })
            tableRangeData = await filterByInterval({
              data: joinInstrumentData.firstInstrument.data,
              intervalMinutes: tableVariation ?? chartVariation,
              endDate,
              instrumentId: joinInstrumentData.firstInstrument.id,
            })
          } else if (
            joinInstrumentData.secondInstrument.type === 'TEMPERATURE'
          ) {
            chartDataTemperature = await filterByInterval({
              data: joinInstrumentData.secondInstrument.data,
              intervalMinutes: chartVariation,
              endDate,
              instrumentId: joinInstrumentData.secondInstrument.id,
            })
            tableRangeData = await filterByInterval({
              data: joinInstrumentData.secondInstrument.data,
              intervalMinutes: tableVariation ?? chartVariation,
              endDate,
              instrumentId: joinInstrumentData.secondInstrument.id,
            })
          }
          if (joinInstrumentData.firstInstrument.type === 'PRESSURE') {
            chartDataPressure = await filterByInterval({
              data: joinInstrumentData.firstInstrument.data,
              intervalMinutes: chartVariation,
              endDate,
              instrumentId: joinInstrumentData.firstInstrument.id,
            })
            tablePressureRange = await filterByInterval({
              data: joinInstrumentData.firstInstrument.data,
              intervalMinutes: tableVariation ?? chartVariation,
              endDate,
              instrumentId: joinInstrumentData.firstInstrument.id,
            })
          } else if (joinInstrumentData.secondInstrument.type === 'PRESSURE') {
            chartDataPressure = await filterByInterval({
              data: joinInstrumentData.firstInstrument.data,
              intervalMinutes: chartVariation,
              endDate,
              instrumentId: joinInstrumentData.firstInstrument.id,
            })
            tablePressureRange = await filterByInterval({
              data: joinInstrumentData.secondInstrument.data,
              intervalMinutes: tableVariation ?? chartVariation,
              endDate,
              instrumentId: joinInstrumentData.secondInstrument.id,
            })
          }

          const instrumentDataResponse = {
            id: joinInstrumentData.id,
            name: joinInstrumentData.name,
            dateClose: startDate,
            dateOpen: endDate,
            type: ResponseType.JOIN,
            chartDataTemperature: chartDataTemperature.map((temp) => ({
              id: temp.id,
              data: temp.editData,
              updatedUserAt: temp.userEditData,
              createdAt: temp.createdAt.toISOString(),
              updatedAt: temp.updatedAt.toISOString(),
            })),
            chartDataPressure: chartDataPressure.map((press) => ({
              id: press.id,
              data: press.editData,
              updatedUserAt: press.userEditData,
              createdAt: press.createdAt.toISOString(),
              updatedAt: press.updatedAt.toISOString(),
            })),
            tableDataTemperature: tableRangeData.map((temp) => ({
              id: temp.id,
              data: temp.editData,
              updatedUserAt: temp.userEditData,
              createdAt: temp.createdAt.toISOString(),
              updatedAt: temp.updatedAt.toISOString(),
            })),
            tableDataPressure: tablePressureRange.map((press) => ({
              id: press.id,
              data: press.editData,
              updatedUserAt: press.userEditData,
              createdAt: press.createdAt.toISOString(),
              updatedAt: press.updatedAt.toISOString(),
            })),
          }
          return { data: instrumentDataResponse }
        }
        const chartDataTemperature = await filterByInterval({
          data: instrumentData.data,
          instrumentId: instrumentData.id,
          intervalMinutes: chartVariation,
          endDate,
        })
        const tableRangeData = await filterByInterval({
          data: instrumentData.data,
          instrumentId: instrumentData.id,
          intervalMinutes: tableVariation ?? chartVariation,
          endDate,
        })
        let chartDataPressure: InstrumentData[] = []
        let tableDataPressure: InstrumentData[] = []
        if (instrumentData.type === 'PRESSURE') {
          chartDataPressure = await filterByInterval({
            data: instrumentData.data,
            instrumentId: instrumentData.id,
            intervalMinutes: chartVariation,
            endDate,
          })
          tableDataPressure = await filterByInterval({
            data: instrumentData.data,
            instrumentId: instrumentData.id,
            intervalMinutes: tableVariation ?? chartVariation,
            endDate,
          })
        }
        const instrumentDataResponse = {
          id: instrumentData.id,
          name: instrumentData.name,
          dateClose: startDate,
          dateOpen: endDate,
          type:
            instrumentData.type === 'PRESSURE'
              ? ResponseType.PRESSURE
              : ResponseType.TEMPERATURE,
          chartDataTemperature: chartDataTemperature.map((temp) => ({
            id: temp.id,
            data: temp.editData,
            updatedUserAt: temp.userEditData,
            createdAt: temp.createdAt.toISOString(),
            updatedAt: temp.updatedAt.toISOString(),
          })),
          chartDataPressure: chartDataPressure.map((press) => ({
            id: press.id,
            data: press.editData,
            updatedUserAt: press.userEditData,
            createdAt: press.createdAt.toISOString(),
            updatedAt: press.updatedAt.toISOString(),
          })),
          tableDataTemperature: tableRangeData.map((temp) => ({
            id: temp.id,
            data: temp.editData,
            updatedUserAt: temp.userEditData,
            createdAt: temp.createdAt.toISOString(),
            updatedAt: temp.updatedAt.toISOString(),
          })),
          tableDataPressure: tableDataPressure.map((press) => ({
            id: press.id,
            data: press.editData,
            updatedUserAt: press.userEditData,
            createdAt: press.createdAt.toISOString(),
            updatedAt: press.updatedAt.toISOString(),
          })),
        }
        return { data: instrumentDataResponse }
      },
    )
}
