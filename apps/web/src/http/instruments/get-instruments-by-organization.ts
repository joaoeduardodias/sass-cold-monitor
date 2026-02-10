import { api } from "../api";

interface GetInstrumentsByOrganization {
  instruments: {
    id: string;
    name: string;
    slug: string;
    model: number;
    orderDisplay: number;
    maxValue: number;
    minValue: number;
    isActive: boolean;
    type: "TEMPERATURE" | "PRESSURE";
    idSitrad: number | null;
  }[]
}

export async function getInstrumentsByOrganization(org: string) {
  const result = await api
    .get(`organization/${org}/instruments`)
    .json<GetInstrumentsByOrganization>()

  return result
}