import "@/app/globals.css";

export default function KDSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-kds-surface text-kds-text font-sans">
      {children}
    </div>
  );
}
