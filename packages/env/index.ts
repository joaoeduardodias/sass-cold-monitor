import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod/v4'

export const env = createEnv({
  server: {
    PORT: z.coerce.number().default(3333),
    DATABASE_URL: z.url(),
    JWT_SECRET: z.string(),
    GOOGLE_OAUTH_CLIENT_ID: z.string(),
    GOOGLE_OAUTH_CLIENT_SECRET: z.string(),
    GOOGLE_OAUTH_CLIENT_REDIRECT_URI: z.url(),
    TIMEZONE: z.string(),
    EMAIL_API_KEY: z.string(),
    EMAIL_FROM_EMAIL: z.email(),
    EMAIL_FROM_NAME: z.string(),
  },
  client: {
    NEXT_PUBLIC_API_URL: z.url(),
  },
  shared: {
    NEXT_PUBLIC_API_URL: z.url(),
  },
  runtimeEnv: {
    PORT: process.env.PORT,
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    GOOGLE_OAUTH_CLIENT_ID: process.env.GOOGLE_OAUTH_CLIENT_ID,
    GOOGLE_OAUTH_CLIENT_SECRET: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    GOOGLE_OAUTH_CLIENT_REDIRECT_URI:
      process.env.GOOGLE_OAUTH_CLIENT_REDIRECT_URI,
    TIMEZONE: process.env.TIMEZONE,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    EMAIL_API_KEY: process.env.EMAIL_API_KEY,
    EMAIL_FROM_EMAIL: process.env.EMAIL_FROM_EMAIL,
    EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME,
  },
  emptyStringAsUndefined: true,
})
