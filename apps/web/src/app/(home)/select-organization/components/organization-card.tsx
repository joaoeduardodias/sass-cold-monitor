"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronRight, Loader2, Star } from "lucide-react"

export function OrganizationCard({
  organization,
  loading,
  onSelect,
  onToggleFavorite,
}: any) {
  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md group relative ${loading ? "opacity-70 pointer-events-none" : ""
        }`}
      onClick={onSelect}
    >
      <CardContent className="p-4 flex items-center gap-3">
        <Avatar className="h-12 w-12 rounded-xl">
          <AvatarImage
            src={organization.logo || "/placeholder.svg"}
          />
          <AvatarFallback className="rounded-xl bg-blue-600 text-white">
            {organization.name[0]}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate">
            {organization.name}
          </h3>
        </div>

        <button
          onClick={onToggleFavorite}
          className="p-1 hover:bg-muted rounded"
        >
          <Star
            className={`h-4 w-4 ${organization.isFavorite
                ? "fill-amber-400 text-amber-400"
                : "text-muted-foreground"
              }`}
          />
        </button>

        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
        ) : (
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
        )}
      </CardContent>
    </Card>
  )
}
