"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { History, Thermometer } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { ReactNode, useMemo } from "react"

type InstrumentPageTabsProps = {
  history: ReactNode
  realtime: ReactNode
  showHistoryTab?: boolean
}

export function InstrumentPageTabs({
  history,
  realtime,
  showHistoryTab = true,
}: InstrumentPageTabsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const activeTab = useMemo(() => {
    const validTabs = new Set(showHistoryTab ? ["realtime", "history"] : ["realtime"])
    const tab = searchParams.get("tab")
    return tab && validTabs.has(tab) ? tab : "realtime"
  }, [searchParams, showHistoryTab])

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
        {showHistoryTab && (
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Histórico
          </TabsTrigger>
        )}
      </TabsList>

      <TabsContent value="realtime" className="mt-4">
        {realtime}
      </TabsContent>
      {showHistoryTab && (
        <TabsContent value="history" className="mt-4">
          {history}
        </TabsContent>
      )}
    </Tabs>
  )
}
