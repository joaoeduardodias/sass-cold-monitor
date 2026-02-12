import { env } from "@cold-monitor/env";
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

        let token: string | undefined
        if (typeof window === 'undefined') {
          const { cookies } = await import("next/headers")
          const cookieStore = await cookies()
          token = cookieStore.get("token")?.value
        } else {
          token = await getCookie("token")
        }

        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`)
        }
      },
    ],
  },
})
