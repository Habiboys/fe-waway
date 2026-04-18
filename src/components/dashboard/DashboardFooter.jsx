export function DashboardFooter({ appName }) {
  return (
    <footer className="border-t border-slate-200 bg-white/90 px-4 py-3 text-center text-xs text-slate-500 md:px-7">
      © {new Date().getFullYear()} {appName} · Built for WhatsApp Blast SaaS
    </footer>
  );
}
