"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { Check, ChevronDown, Plus } from "lucide-react"
import Link from "next/link"

import { OrganizationForm } from "@/app/(home)/org/organization-form"
import { getInitials } from "@/utils/get-initials"
import { Avatar, AvatarFallback } from "./ui/avatar"
import { Button } from "./ui/button"
import { Command, CommandGroup, CommandItem, CommandList, CommandSeparator } from "./ui/command"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"

type OrganizationSwitcherMenuProps = {
  currentOrganization?: {
    id: string
    name: string
    slug: string
  }
  organizations: {
    id: string
    name: string
    slug: string
    avatarUrl: string | null
  }[]
  currentRoleLabel?: string
}

export function OrganizationSwitcherMenu({
  currentOrganization,
  organizations,
  currentRoleLabel,
}: OrganizationSwitcherMenuProps) {
  const router = useRouter()
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const [isCreateOrganizationOpen, setIsCreateOrganizationOpen] = useState(false)

  async function handleOrganizationCreated() {
    setIsCreateOrganizationOpen(false)
    setIsPopoverOpen(false)
    router.refresh()
  }

  return (
    <>
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            role="combobox"
            className="justify-between gap-2 px-2 hover:bg-muted/50"
          >
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6 rounded-md">
                <AvatarFallback className="rounded-md bg-linear-to-br from-blue-500 to-blue-600 text-[10px] font-medium text-white">
                  {getInitials(currentOrganization?.name || "Org")}
                </AvatarFallback>
              </Avatar>
              <span className="hidden max-w-[120px] truncate text-sm font-medium sm:inline-block">
                {currentOrganization?.name}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandList className="max-h-[360px]">
              <CommandGroup heading="Empresas">
                {organizations.map((organization) => (
                  <CommandItem
                    key={organization.id}
                    value={organization.name}
                    className="group flex items-center gap-2 py-0"
                    onSelect={() => setIsPopoverOpen(false)}
                  >
                    <Link
                      href={`/org/${organization.slug}`}
                      className="flex w-full items-center gap-3 rounded-md px-2 py-2"
                    >
                      <Avatar className="h-8 w-8 rounded-md">
                        <AvatarFallback className="rounded-md bg-linear-to-br from-blue-500 to-blue-600 text-[10px] font-medium text-white">
                          {getInitials(organization.name)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{organization.name}</div>
                        {currentRoleLabel && (
                          <div className="text-xs text-muted-foreground">
                            {currentRoleLabel}
                          </div>
                        )}
                      </div>

                      {currentOrganization?.id === organization.id && (
                        <Check className="h-4 w-4 shrink-0 text-blue-600" />
                      )}
                    </Link>
                  </CommandItem>
                ))}
              </CommandGroup>

              <CommandSeparator />

              <CommandGroup>
                <CommandItem
                  value="Adicionar empresa"
                  className="mx-1 mb-1 flex items-center gap-2"
                  onSelect={() => {
                    setIsPopoverOpen(false)
                    setIsCreateOrganizationOpen(true)
                  }}
                >
                  <div className="rounded-md bg-blue-100 p-1.5 text-blue-600">
                    <Plus className="size-4" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">Adicionar empresa</div>
                    <div className="text-xs text-muted-foreground">
                      Criar nova empresa
                    </div>
                  </div>
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={isCreateOrganizationOpen} onOpenChange={setIsCreateOrganizationOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Criar Empresa</DialogTitle>
            <DialogDescription>
              Preencha os dados abaixo para adicionar uma nova empresa ao sistema.
            </DialogDescription>
          </DialogHeader>

          <OrganizationForm onSuccess={handleOrganizationCreated} />
        </DialogContent>
      </Dialog>
    </>
  )
}
