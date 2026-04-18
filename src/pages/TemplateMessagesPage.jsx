import { useEffect, useState } from "react";
import { TemplateMessageManager } from "../components/devices/TemplateMessageManager";
import { setCurrentOrganizationId } from "../lib/organization";
import { masterDataService } from "../services/masterDataService";

export default function TemplateMessagesPage() {
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState(null);

  useEffect(() => {
    const loadOrgs = async () => {
      const orgRows = await masterDataService.listOrganizations();
      setOrganizations(orgRows);
      if (orgRows.length > 0) {
        setSelectedOrgId((prev) => {
          if (prev && orgRows.some((o) => Number(o.id) === Number(prev)))
            return prev;
          return Number(orgRows[0].id);
        });
      } else {
        setSelectedOrgId(null);
      }
    };
    loadOrgs();
  }, []);

  return (
    <section className="px-4 py-5 md:px-7 md:py-7">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-2xl font-bold mb-6">Kelola Template Pesan</h1>
        <div className="mb-6 flex gap-2 items-center">
          <label className="text-xs font-semibold text-slate-600">
            Organization:
          </label>
          <select
            value={selectedOrgId ? String(selectedOrgId) : ""}
            onChange={(e) => {
              const next = e.target.value ? Number(e.target.value) : null;
              setSelectedOrgId(next);
              setCurrentOrganizationId(next);
            }}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none"
            style={{ minWidth: 180 }}
          >
            <option value="">-- Pilih Organization --</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </div>
        <TemplateMessageManager selectedOrgId={selectedOrgId} />
      </div>
    </section>
  );
}
