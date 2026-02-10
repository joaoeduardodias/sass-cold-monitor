
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
    <div>

      {children}
    </div>
  );
}
