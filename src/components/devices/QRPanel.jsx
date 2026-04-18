// QRPanel is embedded directly in DevicePanel since it's tightly coupled.
// This file exists for the import in DevicesPage to not break.
// Re-export DevicePanel's QR section as a standalone if needed later.

export function QRPanel({ qr, status }) {
  if (!qr && status !== 'qr_pending') return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-8 text-center">
      <h3 className="text-base font-bold text-slate-900 mb-1">Scan QR Code</h3>
      <p className="text-sm text-slate-500 mb-5">
        Buka WhatsApp → Settings → Linked Devices → Link a Device
      </p>
      {qr && (
        <div className="inline-block rounded-2xl border-4 border-indigo-100 p-3 bg-white shadow-lg">
          <img src={qr} alt="QR Code" className="w-64 h-64 object-contain" />
        </div>
      )}
      <p className="mt-4 text-xs text-slate-400 animate-pulse">
        QR akan diperbarui otomatis setiap 30 detik...
      </p>
    </div>
  );
}
