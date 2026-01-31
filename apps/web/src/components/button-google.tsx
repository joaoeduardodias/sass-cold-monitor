import { signInWithGoogle } from "@/app/auth/actions";
import googleIcon from "@/assets/google.svg";
import Image from "next/image";
import { Button } from "./ui/button";

export interface ButtonGoogleProps {
  isPending?: boolean;
}

export function ButtonGoogle({ isPending }: ButtonGoogleProps) {
  return (
    <Button type="button" onClick={signInWithGoogle} variant="outline" className="w-full cursor-pointer" disabled={isPending}>
      <Image src={googleIcon} alt="" unoptimized className="size-4" />
      Entrar com Google
    </Button>
  )
}