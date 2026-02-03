import { Gauge } from "lucide-react";
import { OrganizationSwitcher } from "./organization-switcher";
import { ProfileButton } from "./profile-button";
import { Separator } from "./ui/separator";

type HeaderProps = {
  currentOrg?: string
}

export function Header({ currentOrg }: HeaderProps) {

  return (
    <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between py-4">
        <div className="flex gap-2">
          <div className="flex items-center gap-2">
            <Gauge className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-bold">ColdMonitor</h1>
          </div>
          <Separator orientation="vertical" className="h-6" />

          <OrganizationSwitcher currentOrg={currentOrg} />
        </div>
        <div className="flex items-center gap-2">
          <ProfileButton />
        </div>
      </div>
    </header>
  )
}
