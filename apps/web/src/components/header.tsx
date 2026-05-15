import { Gauge } from 'lucide-react'

import { OrganizationSwitcher } from './organization-switcher'
import { ProfileButton } from './profile-button'

export function Header() {
  return (
    <header className="bg-background/95 sticky top-0 z-10 border-b backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Gauge className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-bold">ColdMonitor</h1>
          </div>
          <div className="bg-muted-foreground/30 h-6 w-px" aria-hidden="true" />

          <OrganizationSwitcher />
        </div>
        <div className="flex items-center gap-2">
          <ProfileButton />
        </div>
      </div>
    </header>
  )
}
