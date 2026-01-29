
import { env } from "@cold-monitor/env";
import type { CookiesFn } from 'cookies-next';
import { getCookie } from 'cookies-next';
import ky from 'ky';
const API_URL = env.NEXT_PUBLIC_API_URL || "http://localhost:3333";

export const api = ky.create({
  prefixUrl: API_URL,
  hooks: {
    beforeRequest: [
      async (request) => {
        if (request.headers.get("X-Skip-Auth") === "true") {
          request.headers.delete("X-Skip-Auth")
          return
        }

        let cookieStore: CookiesFn | undefined

        if (typeof window === 'undefined') {
          const { cookies: serverCookies } = require("next/headers");

          cookieStore = serverCookies
        }
        const token = await getCookie('token', { cookies: cookieStore })

        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`)
        }
      },
    ],
  },
})