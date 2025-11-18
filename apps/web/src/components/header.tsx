import { Gauge, LogOut, Settings, Shield, User } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";

export function Header() {
  const currentUser = {
    name: "João Silva",
    email: "joao@empresa.com",
    role: "Administrador",
    avatar: "/placeholder.svg?height=32&width=32",
    initials: "JS",
  }

  return (

    <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <Gauge className="h-6 w-6 text-blue-600" />
          <h1 className="text-xl font-bold">ColdMonitor</h1>
        </div>
        <div className="flex items-center gap-2">

          <Button variant="outline" size="sm" asChild>
            <Link href="/settings">
              <Settings className="mr-2 size-4" />
              Configurações
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative size-10 rounded-full">
                <Avatar className="size-10">
                  <AvatarImage src={currentUser.avatar || "/placeholder.svg"} alt={currentUser.name} />
                  <AvatarFallback className="bg-blue-600 text-white">{currentUser.initials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{currentUser.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{currentUser.email}</p>
                  <p className="text-xs leading-none text-blue-600 font-medium">{currentUser.role}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem asChild>
                <Link href="/auth/profile" className="cursor-pointer">
                  <User className="mr-2 size-4" />
                  <span>Perfil</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem>
                <Shield className="mr-2 size-4" />
                <span>Segurança</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem asChild>
                <Link href="/auth/sign-in" className="cursor-pointer text-red-600 focus:text-red-600">
                  <LogOut className="mr-2 size-4" />
                  <span>Sair</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}