import { faker } from '@faker-js/faker'
import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function seed() {
  await prisma.member.deleteMany()
  await prisma.instrumentData.deleteMany()
  await prisma.joinInstrument.deleteMany()
  await prisma.instrument.deleteMany()
  await prisma.organization.deleteMany()
  await prisma.user.deleteMany()

  const passwordHash = await hash('123456', 1)

  const user = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'johndoe@acme.com',
      avatarUrl: 'https://github.com/joaoeduardodias.png',
      passwordHash,
    },
  })
  const anotherUser = await prisma.user.create({
    data: {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      avatarUrl: faker.image.avatarGitHub(),
      passwordHash,
    },
  })
  const anotherUser2 = await prisma.user.create({
    data: {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      avatarUrl: faker.image.avatarGitHub(),
      passwordHash,
    },
  })
  const anotherUser3 = await prisma.user.create({
    data: {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      avatarUrl: faker.image.avatarGitHub(),
      passwordHash,
    },
  })

  const organization = await prisma.organization.create({
    data: {
      name: 'Acme Inc (Admin)',
      domain: 'acme-admin.com',
      slug: 'acme-admin',
      avatarUrl: faker.image.avatarGitHub(),
      shouldAttachUsersByDomain: true,
      ownerId: user.id,
      members: {
        create: [
          {
            userId: user.id,
            role: 'ADMIN',
          },
          {
            userId: anotherUser.id,
            role: 'EDITOR',
          },
          {
            userId: anotherUser2.id,
            role: 'VIEWER',
          },
          {
            userId: anotherUser3.id,
            role: 'OPERATOR',
          },
        ],
      },
    },
  })
  const organization1 = await prisma.organization.create({
    data: {
      name: 'Acme Inc',
      domain: 'acme.com',
      slug: 'acme',
      avatarUrl: faker.image.avatarGitHub(),
      shouldAttachUsersByDomain: true,
      ownerId: anotherUser.id,
      members: {
        create: [
          {
            userId: user.id,
            role: 'ADMIN',
          },
          {
            userId: anotherUser.id,
            role: 'VIEWER',
          },
          {
            userId: anotherUser3.id,
            role: 'OPERATOR',
          },
        ],
      },
    },
  })

  const instrument = await prisma.instrument.create({
    data: {
      name: faker.lorem.words(5),
      slug: faker.lorem.slug(5),
      type: faker.helpers.arrayElement(['TEMPERATURE', 'PRESSURE']),
      model: faker.helpers.arrayElement([72, 67]),
      idSitrad: faker.number.int({ min: 1, max: 150 }),
      isActive: true,
      minValue: faker.number.int({ min: 0, max: 100 }),
      maxValue: faker.number.int({ min: 100, max: 200 }),
      organizationId: organization.id,
      data: {
        createMany: {
          data: [
            {
              data: faker.number.float({ min: 0, max: 100 }),
              editData: faker.number.float({ min: 0, max: 100 }),
              generateData: faker.number.float({ min: 0, max: 100 }),
            },
            {
              data: faker.number.float({ min: 0, max: 100 }),
              editData: faker.number.float({ min: 0, max: 100 }),
              generateData: faker.number.float({ min: 0, max: 100 }),
            },
            {
              data: faker.number.float({ min: 0, max: 100 }),
              editData: faker.number.float({ min: 0, max: 100 }),
              generateData: faker.number.float({ min: 0, max: 100 }),
            },
            {
              data: faker.number.float({ min: 0, max: 100 }),
              editData: faker.number.float({ min: 0, max: 100 }),
              generateData: faker.number.float({ min: 0, max: 100 }),
            },
            {
              data: faker.number.float({ min: 0, max: 100 }),
              editData: faker.number.float({ min: 0, max: 100 }),
              generateData: faker.number.float({ min: 0, max: 100 }),
            },
          ],
        },
      },
    },
  })
  const instrument1 = await prisma.instrument.create({
    data: {
      name: faker.lorem.words(5),
      slug: faker.lorem.slug(5),
      type: faker.helpers.arrayElement(['TEMPERATURE', 'PRESSURE']),
      model: faker.helpers.arrayElement([72, 67]),
      idSitrad: faker.number.int({ min: 1, max: 150 }),
      isActive: true,
      minValue: faker.number.int({ min: 0, max: 100 }),
      maxValue: faker.number.int({ min: 100, max: 200 }),
      organizationId: organization.id,
      data: {
        createMany: {
          data: [
            {
              data: faker.number.float({ min: 0, max: 100 }),
              editData: faker.number.float({ min: 0, max: 100 }),
              generateData: faker.number.float({ min: 0, max: 100 }),
            },
            {
              data: faker.number.float({ min: 0, max: 100 }),
              editData: faker.number.float({ min: 0, max: 100 }),
              generateData: faker.number.float({ min: 0, max: 100 }),
            },
            {
              data: faker.number.float({ min: 0, max: 100 }),
              editData: faker.number.float({ min: 0, max: 100 }),
              generateData: faker.number.float({ min: 0, max: 100 }),
            },
            {
              data: faker.number.float({ min: 0, max: 100 }),
              editData: faker.number.float({ min: 0, max: 100 }),
              generateData: faker.number.float({ min: 0, max: 100 }),
            },
            {
              data: faker.number.float({ min: 0, max: 100 }),
              editData: faker.number.float({ min: 0, max: 100 }),
              generateData: faker.number.float({ min: 0, max: 100 }),
            },
          ],
        },
      },
    },
  })
  await prisma.instrument.create({
    data: {
      name: faker.lorem.words(5),
      slug: faker.lorem.slug(5),
      type: faker.helpers.arrayElement(['TEMPERATURE', 'PRESSURE']),
      model: faker.helpers.arrayElement([72, 67]),
      idSitrad: faker.number.int({ min: 1, max: 150 }),
      isActive: true,
      minValue: faker.number.int({ min: 0, max: 100 }),
      maxValue: faker.number.int({ min: 100, max: 200 }),
      organizationId: organization1.id,
      data: {
        createMany: {
          data: [
            {
              data: faker.number.float({ min: 0, max: 100 }),
              editData: faker.number.float({ min: 0, max: 100 }),
              generateData: faker.number.float({ min: 0, max: 100 }),
            },
            {
              data: faker.number.float({ min: 0, max: 100 }),
              editData: faker.number.float({ min: 0, max: 100 }),
              generateData: faker.number.float({ min: 0, max: 100 }),
            },
            {
              data: faker.number.float({ min: 0, max: 100 }),
              editData: faker.number.float({ min: 0, max: 100 }),
              generateData: faker.number.float({ min: 0, max: 100 }),
            },
            {
              data: faker.number.float({ min: 0, max: 100 }),
              editData: faker.number.float({ min: 0, max: 100 }),
              generateData: faker.number.float({ min: 0, max: 100 }),
            },
            {
              data: faker.number.float({ min: 0, max: 100 }),
              editData: faker.number.float({ min: 0, max: 100 }),
              generateData: faker.number.float({ min: 0, max: 100 }),
            },
          ],
        },
      },
    },
  })
  await prisma.instrument.create({
    data: {
      name: faker.lorem.words(5),
      slug: faker.lorem.slug(5),
      type: faker.helpers.arrayElement(['TEMPERATURE', 'PRESSURE']),
      model: faker.helpers.arrayElement([72, 67]),
      idSitrad: faker.number.int({ min: 1, max: 150 }),
      isActive: true,
      minValue: faker.number.int({ min: 0, max: 100 }),
      maxValue: faker.number.int({ min: 100, max: 200 }),
      organizationId: organization1.id,
      data: {
        createMany: {
          data: [
            {
              data: faker.number.float({ min: 0, max: 100 }),
              editData: faker.number.float({ min: 0, max: 100 }),
              generateData: faker.number.float({ min: 0, max: 100 }),
            },
            {
              data: faker.number.float({ min: 0, max: 100 }),
              editData: faker.number.float({ min: 0, max: 100 }),
              generateData: faker.number.float({ min: 0, max: 100 }),
            },
            {
              data: faker.number.float({ min: 0, max: 100 }),
              editData: faker.number.float({ min: 0, max: 100 }),
              generateData: faker.number.float({ min: 0, max: 100 }),
            },
            {
              data: faker.number.float({ min: 0, max: 100 }),
              editData: faker.number.float({ min: 0, max: 100 }),
              generateData: faker.number.float({ min: 0, max: 100 }),
            },
            {
              data: faker.number.float({ min: 0, max: 100 }),
              editData: faker.number.float({ min: 0, max: 100 }),
              generateData: faker.number.float({ min: 0, max: 100 }),
            },
          ],
        },
      },
    },
  })

  await prisma.joinInstrument.create({
    data: {
      name: faker.lorem.words(5),
      firstInstrumentId: instrument.id,
      secondInstrumentId: instrument1.id,
    },
  })
}

seed().then(() => {
  console.log('Database seeded!')
})
