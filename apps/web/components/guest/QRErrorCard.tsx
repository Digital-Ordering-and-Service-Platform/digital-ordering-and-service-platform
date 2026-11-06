"use client";

export default function QRErrorCard() {
  return (
    <div className="min-h-screen bg-teff flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl p-6 border border-buna/10 shadow-lg text-center max-w-sm w-full space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto text-xl font-bold">
          !
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-bold text-buna">This menu link is no longer active</h2>
          <p className="text-xs text-primary font-semibold gees-text" lang="am">
            ይህ የምግብ ዝርዝር ማገናኛ ተሰናክሏል
          </p>
        </div>
        <p className="text-xs text-buna-mocha leading-relaxed">
          Ask a server for assistance, or scan a fresh QR code from your table or takeaway counter.
        </p>
      </div>
    </div>
  );
}
