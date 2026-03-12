"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { History, Thermometer } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { ReactNode, useMemo } from "react"

type InstrumentPageTabsProps = {
  history: ReactNode
  realtime: ReactNode
}

const VALID_TABS = new Set(["realtime", "history"])

export function InstrumentPageTabs({
  history,
  realtime,
}: InstrumentPageTabsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const activeTab = useMemo(() => {
    const tab = searchParams.get("tab")
    return tab && VALID_TABS.has(tab) ? tab : "realtime"
  }, [searchParams])

  const handleTabChange = (nextTab: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", nextTab)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      <TabsList>
        <TabsTrigger value="realtime" className="flex items-center gap-2">
          <Thermometer className="h-4 w-4" />
          Tempo Real
        </TabsTrigger>
        <TabsTrigger value="history" className="flex items-center gap-2">
          <History className="h-4 w-4" />
          Histórico
        </TabsTrigger>
      </TabsList>

      <TabsContent value="realtime" className="mt-4">
        {realtime}
      </TabsContent>
      <TabsContent value="history" className="mt-4">
        {history}
      </TabsContent>
    </Tabs>
  )
}
