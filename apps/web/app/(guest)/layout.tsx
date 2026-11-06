import "@/app/globals.css";

export default function GuestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-teff text-buna">
      <main className="w-full min-h-screen pb-20">{children}</main>
    </div>
  );
}
