import { redirect } from "next/navigation"

export default async function DownloadCollectorPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  redirect(`/org/${slug}/settings?tab=collector`)
}
