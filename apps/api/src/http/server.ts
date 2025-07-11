
import { env } from '@cold-monitor/env';
import fastifyCors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { fastify } from 'fastify';
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider
} from 'fastify-type-provider-zod';
import { errorHandler } from './error-handler';
import { authenticateWithGoogle } from './routes/auth/authenticate-with-google';
import { authenticateWithPassword } from './routes/auth/authenticate-with-password';
import { createUser } from './routes/auth/create-user';
import { getProfile } from './routes/auth/get-profile';
import { requestPasswordRecover } from './routes/auth/request-password-recover';
import { resetPassword } from './routes/auth/reset-password';

const app = fastify().withTypeProvider<ZodTypeProvider>();
app.setSerializerCompiler(serializerCompiler)
app.setValidatorCompiler(validatorCompiler)
app.setErrorHandler(errorHandler)
app.register(fastifyCors)

app.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'Cold Monitor',
      description: 'App monitoring cold',
      version: '1.0.0',
    },
    servers: [],
  },
  transform: jsonSchemaTransform,
});

app.register(fastifySwaggerUi, {
  routePrefix: '/docs',
});
app.register(fastifyJwt, {
  secret: env.JWT_SECRET
})

app.register(createUser)
app.register(authenticateWithPassword)
app.register(authenticateWithGoogle)
app.register(getProfile)
app.register(requestPasswordRecover)
app.register(resetPassword)

app.listen({ port: env.SERVER_PORT }).then(() => {
  console.log(`Server is running on http://localhost:${env.SERVER_PORT}`)
})