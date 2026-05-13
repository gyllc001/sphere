import { requireAdmin } from '@/lib/auth/require-admin';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminTopBar } from '@/components/admin/AdminTopBar';

export default async function AdminAuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { admin } = await requireAdmin();

  return (
    <div className="flex h-screen bg-base text-primary">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminTopBar admin={{ name: admin.name, email: admin.email }} />
        <main className="flex-1 overflow-y-auto bg-base">{children}</main>
      </div>
    </div>
  );
}
