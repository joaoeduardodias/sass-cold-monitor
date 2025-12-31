import dayjs from 'dayjs'
import { v4 as uuidv4 } from 'uuid'

import { prisma } from '@/lib/prisma'

export interface DataItem {
  id: string
  createdAt: Date
  updatedAt: Date
  editData: number
  userEditData: string | null
}

export function generateMissingDataItem(
  timestamp: Date,
  lastKnownValue: number | null,
  averageValue?: number,
): DataItem {
  const base = averageValue ?? lastKnownValue ?? 2
  const variation = 0.05

  const generatedEditData = base * (1 + (Math.random() * 2 - 1) * variation)

  return {
    id: uuidv4(),
    createdAt: timestamp,
    updatedAt: timestamp,
    editData: parseFloat(generatedEditData.toFixed(1)),
    userEditData: null,
  }
}

interface FilterByIntervalParams<T> {
  data: T[]
  intervalMinutes: number
  endDate: Date
  instrumentId: string
  averageValue?: number
}

export async function filterByInterval<T extends DataItem>({
  data,
  endDate,
  instrumentId,
  intervalMinutes,
  averageValue,
}: FilterByIntervalParams<T>): Promise<T[]> {
  if (data.length === 0) return []

  const result: T[] = []
  const sortedData = [...data].sort(
    (a, b) => dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf(),
  )

  let currentIntervalStart = dayjs(sortedData[0].createdAt)
    .second(0)
    .millisecond(0)

  const endLimit = endDate
    ? dayjs(endDate)
    : dayjs(sortedData[sortedData.length - 1].createdAt)

  let dataIndex = 0
  let lastKnownValue: number | null = null

  while (currentIntervalStart.valueOf() <= endLimit.valueOf()) {
    const intervalEnd = currentIntervalStart.add(intervalMinutes, 'minute')
    let foundItemInInterval = false
    let itemToPush: T | null = null

    while (dataIndex < sortedData.length) {
      const currentItem = sortedData[dataIndex]
      const itemTime = dayjs(currentItem.createdAt)

      if (
        itemTime.valueOf() >= currentIntervalStart.valueOf() &&
        itemTime.valueOf() < intervalEnd.valueOf()
      ) {
        itemToPush = currentItem
        foundItemInInterval = true
        dataIndex++
        break
      } else if (itemTime.valueOf() >= intervalEnd.valueOf()) {
        break
      }
      dataIndex++
    }

    if (foundItemInInterval && itemToPush) {
      result.push(itemToPush)
      lastKnownValue = itemToPush.editData
    } else {
      const generatedItem = generateMissingDataItem(
        currentIntervalStart.toDate(),
        lastKnownValue,
        averageValue,
      )
      result.push(generatedItem as T)
      lastKnownValue = generatedItem.editData
    }

    currentIntervalStart = intervalEnd
  }

  if (endDate) {
    const end = dayjs(endDate)
    const lastItem = result[result.length - 1]

    let finalItem = await prisma.instrumentData.findFirst({
      where: {
        instrumentId,
        createdAt: end.toDate(),
      },
    })

    let finalValue: number

    if (finalItem) {
      finalValue = finalItem.editData
    } else {
      const generatedItem = generateMissingDataItem(
        end.toDate(),
        lastKnownValue,
        averageValue,
      )
      finalValue = generatedItem.editData

      finalItem = await prisma.instrumentData.create({
        data: {
          instrumentId,
          editData: finalValue,
          data: finalValue,
          createdAt: generatedItem.createdAt,
        },
      })
    }

    if (!dayjs(lastItem.createdAt).isSame(end, 'second')) {
      result.push({
        id: finalItem.id,
        createdAt: finalItem.createdAt,
        updatedAt: finalItem.updatedAt,
        editData: finalItem.editData,
        userEditData: finalItem.userEditData,
      } as T)
    }

    lastKnownValue = finalValue
  }

  return result
}
