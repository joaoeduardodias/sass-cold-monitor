import { getCurrentOrg } from "@/auth/auth";
import { Header } from "@/components/header";
import { redirect } from "next/navigation";

export default async function Home() {
  const currentOrg = await getCurrentOrg()
  if (!currentOrg) {
    redirect('/select-organization');
  }

  return (
    <>
      <Header />
      <main className="container mx-auto pt-4 mb-8 min-[1200px]:px-4">
        Selecione uma empresa
      </main>
    </>
  );
}
