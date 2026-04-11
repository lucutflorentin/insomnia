'use client';

import { usePathname } from 'next/navigation';

export default function PublicOnlyComponents({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname.includes('/admin');

  if (isAdmin) return null;

  return <>{children}</>;
}
