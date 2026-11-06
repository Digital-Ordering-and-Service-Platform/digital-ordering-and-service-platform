"use client";

interface TableEntity {
  id: string;
  table_number: string;
  type: string;
  qr_token?: string;
}

interface QRPrintSheetProps {
  tables: TableEntity[];
  restaurantName: string;
  onClose: () => void;
}

export default function QRPrintSheet({ tables, restaurantName, onClose }: QRPrintSheetProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto p-8">
      <div className="no-print flex justify-between items-center max-w-4xl mx-auto border-b border-buna/20 pb-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-primary">QR Code Sheet Print Preview</h2>
          <p className="text-xs text-buna-mocha">Print high-resolution QR tiles for physical table and counter placement.</p>
        </div>
        <div className="space-x-2">
          <button onClick={onClose} className="px-4 py-2 border border-buna/20 text-buna rounded-md text-xs font-semibold">
            Close Preview
          </button>
          <button onClick={handlePrint} className="px-5 py-2 bg-primary text-white rounded-md text-xs font-bold">
            Print QR Sheet
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl mx-auto print:grid-cols-2 print:gap-4 print:p-0">
        {tables.map((tbl) => (
          <div key={tbl.id} className="border-2 border-buna/30 rounded-2xl p-6 text-center bg-teff space-y-4 print:break-inside-avoid">
            <span className="text-xs font-bold tracking-wider uppercase text-buna-mocha block">
              {restaurantName}
            </span>

            {/* QR Code Placeholder Box */}
            <div className="w-40 h-40 mx-auto bg-white border-4 border-buna p-2 rounded-xl flex items-center justify-center shadow-sm">
              <div className="text-[10px] font-mono text-center text-buna break-all p-1">
                [QR CODE VECTOR]<br />
                <span className="text-[8px] text-primary">{tbl.qr_token ? tbl.qr_token.substring(0, 24) + "..." : "TOKEN"}</span>
              </div>
            </div>

            {/* Table Pill / Pickup Pill per UX-DR9 */}
            <div className="inline-block">
              <span className={`px-4 py-1.5 rounded-full text-sm font-bold shadow-sm ${
                tbl.type === 'pickup' 
                  ? 'bg-primary text-white' 
                  : 'bg-surface-container-high text-primary border border-primary/20'
              }`}>
                {tbl.type === 'pickup' ? `Pickup #${tbl.table_number} • Bole` : `Table ${tbl.table_number} • Bole`}
              </span>
            </div>

            <p className="text-[10px] text-buna-mocha gees-text block pt-1" lang="am">
              ምግብና መጠጥ ለማዘዝ QR ኮዱን በስልክዎ ይቃኙ
            </p>
          </div>
        ))}
      </div>

      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background-color: white !important;
          }
        }
      `}</style>
    </div>
  );
}
