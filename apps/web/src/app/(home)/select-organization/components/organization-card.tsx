
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { getInitials } from "@/utils/get-initials";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

interface OrganizationCardProps {
  id: string;
  name: string;
  slug: string;
  avatarUrl: string | null;
}


export function OrganizationCard({ name, slug, avatarUrl }: OrganizationCardProps) {
  return (
    <Link href={`/org/${slug}`}>
      <Card className={`cursor-pointer transition-all hover:shadow-md group relative `} >
        <CardContent className="p-4 flex items-center gap-3">
          <Avatar className="h-12 w-12 rounded-xl">
            <AvatarImage
              src={avatarUrl || "/placeholder.svg"}
            />
            <AvatarFallback className="rounded-xl bg-blue-600 text-white">
              {getInitials(name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">
              {name}
            </h3>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
        </CardContent>
      </Card>
    </Link>
  )
}
