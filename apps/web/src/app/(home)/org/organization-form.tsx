'use client'

import { AlertTriangle, CircleDollarSign, Loader2 } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useFormState } from '@/hooks/use-form-state'

import { Separator } from '@/components/ui/separator'
import {
  createOrganizationAction,
  OrganizationSchema,
  updateOrganizationAction,
} from './actions'

interface OrganizationFormProps {
  isUpdating?: boolean
  initialData?: OrganizationSchema
}

export function OrganizationForm({
  isUpdating = false,
  initialData,
}: OrganizationFormProps) {
  const formAction = isUpdating
    ? updateOrganizationAction
    : createOrganizationAction

  const [{ errors, message, success }, handleSubmit, isPending] =
    useFormState(formAction)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {success === false && message && (
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertTitle>Falha ao salvar empresa!</AlertTitle>
          <AlertDescription>
            <p>{message}</p>
          </AlertDescription>
        </Alert>
      )}

      {success === true && message && (
        <Alert >
          <AlertTriangle className="size-4" />
          <AlertTitle>Sucesso!</AlertTitle>
          <AlertDescription>
            <p>{message}</p>
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-1">
        <Label htmlFor="name">Nome da empresa</Label>
        <Input name="name" id="name" defaultValue={initialData?.name} />

        {errors?.name && (
          <p className="text-xs font-medium text-red-500 dark:text-red-400">
            {errors.name[0]}
          </p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="domain">Domínio de e-mail</Label>
        <Input
          name="domain"
          type="text"
          id="domain"
          inputMode="url"
          placeholder="example.com"
          defaultValue={initialData?.domain ?? undefined}
        />

        {errors?.domain && (
          <p className="text-xs font-medium text-red-500 dark:text-red-400">
            {errors.domain[0]}
          </p>
        )}
      </div>

      <div className="space-y-1">
        <div className="flex items-start space-x-2">
          <div className="translate-y-0.5">
            <Checkbox
              name="shouldAttachUsersByDomain"
              id="shouldAttachUsersByDomain"
              defaultChecked={initialData?.shouldAttachUsersByDomain}
            />
          </div>
          <label htmlFor="shouldAttachUsersByDomain" className="space-y-1">
            <span className="text-sm font-medium leading-none">
              Auto-join novos usuários.
            </span>
            <p className="text-sm text-muted-foreground">
              Isso trará automaticamente todos os membros com o mesmo domínio de e-mail
              para esta empresa.
            </p>
          </label>
        </div>

        {errors?.shouldAttachUsersByDomain && (
          <p className="text-xs font-medium text-red-500 dark:text-red-400">
            {errors.shouldAttachUsersByDomain[0]}
          </p>
        )}
      </div>
      <div className="space-y-4">
        <Separator />

        <div className="flex items-center gap-2">
          <CircleDollarSign className="size-5 text-blue-600" />
          <h3 className="text-lg font-medium">Informações de Custo</h3>
        </div>

        <div className="gap-4">
          <div className="space-y-2">
            <Label htmlFor="currency">Custo</Label>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-sm text-muted-foreground">Plano </span>
                <span className="text-2xl font-bold">R$ 2.000</span>
                <span className="text-sm text-muted-foreground">/mês</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Button className="w-full" type="submit" disabled={isPending}>
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          'Salvar empresa'
        )}
      </Button>
    </form>
  )
}