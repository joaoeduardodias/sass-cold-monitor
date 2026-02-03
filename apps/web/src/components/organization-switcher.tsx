import { getCurrentMembership, getCurrentOrg } from "@/auth/auth"
import { getOrganizations } from "@/http/organizations/get-organizations"
import { getInitials } from "@/utils/get-initials"
import { Check, ChevronDown } from "lucide-react"
import Link from "next/link"
import { Avatar, AvatarFallback } from "./ui/avatar"
import { Button } from "./ui/button"
import { Command, CommandGroup, CommandItem, CommandList } from "./ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"


type OrganizationSwitcherProps = {
  currentOrg?: string
}

export async function OrganizationSwitcher({ currentOrg: currentOrgParam }: OrganizationSwitcherProps) {
  const currentOrg = await getCurrentOrg(currentOrgParam)
  const membership = await getCurrentMembership(currentOrg)
  const { organizations } = await getOrganizations()

  const currentOrganization = organizations.find(
    (org) => org.slug === currentOrg,
  )

  const roleLabels: Record<string, string> = {
    ADMIN: "Admin",
    EDITOR: "Editor",
    VIEWER: "Viewer",
    OPERATOR: "Operador"
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          role="combobox"
          className="justify-between gap-2 px-2 hover:bg-muted/50"
        >
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6 rounded-md">
              <AvatarFallback className="rounded-md bg-linear-to-br from-blue-500 to-blue-600 text-[10px] text-white font-medium">
                {getInitials(currentOrganization?.name || "Org")}
              </AvatarFallback>
            </Avatar>
            <span className="max-w-[120px] truncate text-sm font-medium hidden sm:inline-block">
              {currentOrganization?.name}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <Command>
          <CommandList>
            <CommandGroup heading="Empresas">
              {organizations.map((organization) => (
                <CommandItem
                  key={organization.id}
                  value={organization.name}
                  className="flex items-center gap-2 py-2"
                >
                  <Link href={`/org/${organization.slug}`} className="flex items-center gap-2 w-full">
                    <Avatar className="h-7 w-7 rounded-md">
                      <AvatarFallback className="rounded-md bg-linear-to-br from-blue-500 to-blue-600 text-[10px] text-white font-medium">
                        {getInitials(organization.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{organization.name}</span>
                      </div>
                      {membership?.role && (
                        <span className="text-xs text-muted-foreground">
                          {roleLabels[membership!.role]}
                        </span>
                      )}
                    </div>
                    {currentOrganization?.id === organization.id && (
                      <Check className="h-4 w-4 text-blue-600 shrink-0" />
                    )}
                  </Link>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

