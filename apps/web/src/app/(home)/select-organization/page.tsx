import { getOrganizations } from "@/http/organizations/get-organizations"
import { SelectOrganizationView } from "./components/select-organization-view"

export default async function SelectOrganizationPage() {
  const { organizations } = await getOrganizations()

  return <SelectOrganizationView organizations={organizations} />
}
