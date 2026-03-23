import { getCurrentMembership, getCurrentOrg } from "@/auth/auth"
import { getOrganizations } from "@/http/organizations/get-organizations"
import { OrganizationSwitcherMenu } from "./organization-switcher-menu"

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
    <OrganizationSwitcherMenu
      currentOrganization={currentOrganization}
      organizations={organizations}
      currentRoleLabel={membership?.role ? roleLabels[membership.role] : undefined}
    />
  )
}
