import "@/app/globals.css";

export default function WaiterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-teff text-buna">
      <main className="w-full min-h-screen p-4 md:p-6">{children}</main>
    </div>
  );
}
