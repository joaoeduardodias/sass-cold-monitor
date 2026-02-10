import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { ArrowLeft, CheckCircle, LogIn, LogOut, XCircle } from 'lucide-react'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { auth, isAuthenticated } from '@/auth/auth'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { acceptInvite } from '@/http/invites/accept-invite'
import { getInvite } from '@/http/invites/get-invite'
import { getInitials } from '@/utils/get-initials'

dayjs.extend(relativeTime)

interface InvitePageProps {
  params: Promise<{
    id: string
  }>
}

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  operator: "Operador",
  viewer: "Visualizador",
}

const roleDescriptions: Record<string, string> = {
  admin: "Acesso completo, incluindo configurações e gerenciamento de usuários",
  operator: "Visualizar dados e controlar equipamentos",
  viewer: "Apenas visualização de dados e relatórios",
}

const roleColors: Record<string, string> = {
  admin: "bg-red-50 text-red-700 border-red-200",
  operator: "bg-blue-50 text-blue-700 border-blue-200",
  viewer: "bg-zinc-100 text-zinc-700 border-zinc-200",
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { id: inviteId } = await params

  const { invite } = await getInvite(inviteId)
  const isUserAuthenticated = await isAuthenticated()

  let currentUserEmail = null

  if (isUserAuthenticated) {
    const { user } = await auth()

    currentUserEmail = user.email
  }

  const userIsAuthenticatedWithSameEmailFromInvite =
    currentUserEmail === invite.email

  async function signInFromInvite() {
    'use server'
    const cookiesStore = await cookies()

    cookiesStore.set('inviteId', inviteId)

    redirect(`/auth/sign-in?email=${invite.email}`)
  }

  async function acceptInviteAction() {
    'use server'

    await acceptInvite(inviteId)

    redirect(`/org/${invite.organization.slug}`)
  }

  if (!invite) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-semibold">Convite nao encontrado</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Este convite pode ter sido revogado ou o link esta incorreto.
            </p>
          </div>
          <Button variant="outline" asChild className="bg-transparent">
            <Link href="/auth/sign-in">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para o login
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="flex w-full max-w-sm flex-col justify-center space-y-6">
        <div className="flex flex-col items-center space-y-4">
          <Avatar className="size-16">
            {invite.author?.avatarUrl && (
              <AvatarImage src={invite.author.avatarUrl} />
            )}
            <AvatarFallback className='bg-blue-100 text-blue-700 text-lg font-semibold'>{getInitials(invite.author?.name ?? '')}</AvatarFallback>
          </Avatar>

          <p className="text-balance text-center leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">{invite.author?.name}</span> convidou voce para participar de{" "}
            <span className="font-medium text-foreground">{invite.organization.name}</span>.{" "}
            <span className="text-xs">{dayjs(invite.createdAt).fromNow()}</span>
          </p>
        </div>

        <Separator />

        {!isUserAuthenticated && (
          <form action={signInFromInvite}>
            <Button type="submit" className="w-full">
              <LogIn className="mr-2 size-4" />
              Faça Login para aceitar o convite
            </Button>
          </form>
        )}

        {userIsAuthenticatedWithSameEmailFromInvite && (
          <form action={acceptInviteAction}>
            <Button type="submit" className="w-full">
              <CheckCircle className="mr-2 size-4" />
              Convite {invite.organization.name}
            </Button>
          </form>
        )}

        {isUserAuthenticated && !userIsAuthenticatedWithSameEmailFromInvite && (
          <div className="space-y-4">
            <p className="text-balance text-center text-sm leading-relaxed text-muted-foreground">
              Este convite foi enviado para{' '}
              <span className="font-medium text-foreground">
                {invite.email}
              </span>{' '}
              mas você está autenticado como{' '}
              <span className="font-medium text-foreground">
                {currentUserEmail}
              </span>
              .
            </p>

            <div className="space-y-2">
              <Button className="w-full" asChild>
                <a href="/api/auth/sign-out">
                  <LogOut className="mr-2 size-4" />
                  Sair de {currentUserEmail}
                </a>
              </Button>

              <Button className="w-full" variant="outline" asChild>
                <Link href="/">Voltar para o dashboard</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
