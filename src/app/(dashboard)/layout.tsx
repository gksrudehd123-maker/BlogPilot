import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="lg:pl-60">
        <Header />
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
