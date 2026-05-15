import { ChevronRight } from 'lucide-react'
import Link from 'next/link'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { getInitials } from '@/utils/get-initials'

interface OrganizationCardProps {
  id: string
  name: string
  slug: string
  avatarUrl: string | null
}

export function OrganizationCard({
  name,
  slug,
  avatarUrl,
}: OrganizationCardProps) {
  return (
    <Link href={`/org/${slug}`}>
      <Card
        className={`group relative cursor-pointer transition-all hover:shadow-md`}
      >
        <CardContent className="flex items-center gap-3 p-4">
          <Avatar className="h-12 w-12 rounded-xl">
            <AvatarImage src={avatarUrl || '/placeholder.svg'} />
            <AvatarFallback className="rounded-xl bg-blue-600 text-white">
              {getInitials(name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold">{name}</h3>
          </div>
          <ChevronRight className="text-muted-foreground h-5 w-5 transition-all group-hover:translate-x-1 group-hover:text-blue-600" />
        </CardContent>
      </Card>
    </Link>
  )
}
