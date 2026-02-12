import { getCurrentOrg } from "@/auth/auth"
import { redirect } from "next/navigation"

export default async function SettingsIndexPage() {
  const currentOrg = await getCurrentOrg()

  if (!currentOrg) {
    redirect("/select-organization")
  }

  redirect(`/org/${currentOrg}/settings`)
}
