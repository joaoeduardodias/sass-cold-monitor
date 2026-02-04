import { ChevronDown, LogOut, Settings, User } from 'lucide-react'

import { auth, getCurrentOrg } from '@/auth/auth'

import { getInitials } from '@/utils/get-initials'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'




export async function ProfileButton() {
  const { user } = await auth()
  const currentOrg = await getCurrentOrg()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className='flex items-center space-x-2'>
        <div className="flex flex-col items-end">
          <span className="text-sm font-medium">{user.name}</span>
          <span className="text-xs text-muted-foreground text-ellipsis">{user.email}</span>
        </div>
        <Avatar className="size-10">
          {user.avatarUrl && <AvatarImage src={user.avatarUrl} />}
          {user.name && (
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          )}
        </Avatar>
        <ChevronDown className="size-4 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          {currentOrg && (
            <Link href={`/org/${currentOrg}/settings`} className="cursor-pointer">
              <Settings className="mr-2 size-4" />
              <span>Configurações</span>
            </Link>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/auth/profile" className="cursor-pointer">
            <User className="mr-2 size-4" />
            <span>Perfil</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <a href="/api/auth/sign-out">
            <LogOut className="mr-2 size-4" />
            Sair
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>

    </DropdownMenu>
  )
}
