import { env } from '@cold-monitor/env'
import fastifyCors from '@fastify/cors'
import fastifyJwt from '@fastify/jwt'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'
import { fastify } from 'fastify'
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from 'fastify-type-provider-zod'

import websocketPlugin from '@/plugins/fastify-websocket'

import { errorHandler } from './error-handler'
import { authenticateWithGoogle } from './routes/auth/authenticate-with-google'
import { authenticateWithPassword } from './routes/auth/authenticate-with-password'
import { createUser } from './routes/auth/create-user'
import { getProfile } from './routes/auth/get-profile'
import { requestPasswordRecover } from './routes/auth/request-password-recover'
import { resetPassword } from './routes/auth/reset-password'
import { generateData } from './routes/data/generate-data'
import { getData } from './routes/data/get-data'
import { updateData } from './routes/data/update-data'
import { createInstrument } from './routes/instruments/create-instrument'
import { createJoinInstrument } from './routes/instruments/create-join-instrument'
import { deleteInstrument } from './routes/instruments/delete-instrument'
import { deleteJoinInstrument } from './routes/instruments/delete-join-instrument'
import { getInstrumentBySlug } from './routes/instruments/get-instrument-by-slug'
import { getInstrumentsWithJoinInstruments } from './routes/instruments/get-instrument-with-join-instruments'
import { getInstruments } from './routes/instruments/get-instruments'
import { getJoinInstruments } from './routes/instruments/get-join-instruments'
import { updateInstrument } from './routes/instruments/update-instrument'
import { acceptInvite } from './routes/invites/accept-invite'
import { createInvite } from './routes/invites/create-invite'
import { getInvite } from './routes/invites/get-invite'
import { getInvites } from './routes/invites/get-invites'
import { getPendingInvites } from './routes/invites/get-pending-invites'
import { rejectInvite } from './routes/invites/reject-invite'
import { revokeInvite } from './routes/invites/revoke-invite'
import { getMembers } from './routes/members/get-member'
import { removeMember } from './routes/members/remove-member'
import { toggleStatusMember } from './routes/members/toggle-status-member'
import { updateMember } from './routes/members/update-member'
import { getNotificationSettings } from './routes/notifications/get-notification-settings'
import { sendEmailAlert } from './routes/notifications/send-email-alert'
import { testEmailNotification } from './routes/notifications/test-email-notification'
import { updateNotificationSettings } from './routes/notifications/update-notification-settings'
import { createOrganization } from './routes/orgs/create-organization'
import { getMembership } from './routes/orgs/get-membership'
import { getOrganization } from './routes/orgs/get-organization'
import { getOrganizations } from './routes/orgs/get-organizations'
import { updateOrganization } from './routes/orgs/update-organization'
import { agentWs } from './routes/ws/agent'
import { dashboardWs } from './routes/ws/dashboard'
const app = fastify().withTypeProvider<ZodTypeProvider>()
app.setSerializerCompiler(serializerCompiler)
app.setValidatorCompiler(validatorCompiler)
app.setErrorHandler(errorHandler)
app.register(fastifyCors, {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type'],
})
app.register(websocketPlugin)

app.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'Api Documentation - Cold Monitor',
      description: 'App documentation  cold monitor',
      version: '1.0.0',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  transform: jsonSchemaTransform,
})

app.register(fastifySwaggerUi, {
  routePrefix: '/docs',
})
app.register(fastifyJwt, {
  secret: env.JWT_SECRET,
})

app.register(createUser)
app.register(authenticateWithPassword)
app.register(authenticateWithGoogle)
app.register(getProfile)
app.register(requestPasswordRecover)
app.register(resetPassword)

app.register(getOrganization)
app.register(getOrganizations)
app.register(updateOrganization)
app.register(createOrganization)

app.register(getMembers)
app.register(getMembership)
app.register(toggleStatusMember)
app.register(updateMember)
app.register(removeMember)

app.register(createInvite)
app.register(getInvite)
app.register(getInvites)
app.register(acceptInvite)
app.register(rejectInvite)
app.register(revokeInvite)
app.register(getPendingInvites)

app.register(getNotificationSettings)
app.register(updateNotificationSettings)
app.register(testEmailNotification)
app.register(sendEmailAlert)

app.register(createInstrument)
app.register(updateInstrument)
app.register(deleteInstrument)
app.register(getInstruments)
app.register(getInstrumentBySlug)
app.register(createJoinInstrument)
app.register(deleteJoinInstrument)
app.register(getInstrumentsWithJoinInstruments)
app.register(getJoinInstruments)

app.register(getData)
app.register(generateData)
app.register(updateData)

app.register(dashboardWs)
app.register(agentWs)

app.listen({ port: env.PORT, host: '0.0.0.0' }).then(() => {
  console.log(`Server is running on http://0.0.0.0:${env.PORT}`)
})
