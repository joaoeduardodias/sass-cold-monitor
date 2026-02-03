
import { isAuthenticated } from '@/auth/auth';
import { redirect } from 'next/navigation';

export default function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {

  if (!isAuthenticated()) {
    redirect('/auth/sign-in')
  }

  return (
    <div className="min-[1600px]:px-4">
      {children}
    </div>
  );
}
