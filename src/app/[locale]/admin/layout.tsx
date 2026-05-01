'use client';

import { usePathname } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // Login is a standalone screen — show only the form, no sidebar.
  // Strip locale prefix and trailing slash before matching.
  const normalizedPath = pathname.replace(/^\/(ro|en)(?=\/|$)/, '').replace(/\/$/, '');
  const isLoginPage = normalizedPath === '/admin/login';

  if (isLoginPage) {
    return <div className="min-h-screen bg-bg-primary">{children}</div>;
  }

  return (
    <div className="flex min-h-screen bg-bg-primary md:h-screen md:overflow-hidden">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-auto">
        <div className="flex-1 px-4 pb-24 pt-20 sm:px-6 md:p-8">{children}</div>
      </div>
    </div>
  );
}
