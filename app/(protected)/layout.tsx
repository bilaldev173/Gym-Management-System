import { Sidebar } from "@/components/layout/sidebar";

export default function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen print:block">
      <div className="print:hidden">
        <Sidebar />
      </div>
      <main className="flex-1 overflow-y-auto bg-zinc-950 p-6 md:p-8 print:bg-white print:p-0">
        {children}
      </main>
    </div>
  );
}
