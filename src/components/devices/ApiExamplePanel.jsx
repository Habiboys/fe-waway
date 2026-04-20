import { CheckCircle2, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { API_BASE_URL } from "../../config/app";
import { apiKeyService } from "../../services/apiKeyService";

const BASE_API_URL = API_BASE_URL.replace(/\/+$/, "");
const toAbsoluteUrl = (path) =>
  `${BASE_API_URL}/${String(path || "").replace(/^\/api\/?/, "")}`;
const applyBaseApiUrl = (text) =>
  String(text || "").replaceAll("http://localhost:3000/api", BASE_API_URL);

const EXAMPLES = [
  {
    title: "1. Kirim Pesan Tunggal",
    description: "Kirim satu pesan ke satu nomor WhatsApp",
    method: "POST",
    url: "/api/devices/:deviceId/send",
    headers: {
      "x-api-key": "YOUR_API_KEY",
      "Content-Type": "application/json",
    },
    body: {
      phone: "6281234567890",
      message: "Halo, ini pesan test dari WAWAY!",
    },
    curl: `curl -X POST http://localhost:3000/api/devices/1/send \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"phone":"6281234567890","message":"Halo, pesan test!"}'`,
    nodeJs: `const axios = require('axios');

const API_URL = 'http://localhost:3000/api';
const API_KEY = 'YOUR_API_KEY';

async function sendMessage() {
  const { data } = await axios.post(
    \`\${API_URL}/devices/1/send\`,
    {
      phone: '6281234567890',
      message: 'Halo, ini pesan test dari WAWAY!'
    },
    {
      headers: {
        'x-api-key': API_KEY
      }
    }
  );
  console.log('Result:', data);
}

sendMessage();`,
  },
  {
    title: "2. Kirim Pesan Massal (JSON)",
    description: "Kirim pesan ke banyak nomor sekaligus dengan template",
    method: "POST",
    url: "/api/devices/:deviceId/send-bulk",
    body: {
      contacts: [
        { phone: "6281234567890", name: "Budi" },
        { phone: "6289876543210", name: "Ani" },
      ],
      message: "Halo {{nama}}, terima kasih telah bergabung!",
    },
    curl: `curl -X POST http://localhost:3000/api/devices/1/send-bulk \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "contacts": [
      {"phone":"6281234567890","name":"Budi"},
      {"phone":"6289876543210","name":"Ani"}
    ],
    "message": "Halo {{nama}}, terima kasih!"
  }'`,
    nodeJs: `const axios = require('axios');

async function sendBulk() {
  const { data } = await axios.post(
    'http://localhost:3000/api/devices/1/send-bulk',
    {
      contacts: [
        { phone: '6281234567890', name: 'Budi' },
        { phone: '6289876543210', name: 'Ani' },
      ],
      message: 'Halo {{nama}}, terima kasih!',
    },
    {
      headers: {
        'x-api-key': 'YOUR_API_KEY'
      }
    }
  );
  console.log('Bulk result:', data);
}

sendBulk();`,
  },
  {
    title: "3. Upload Excel & Kirim Massal",
    description: "Upload file Excel berisi kontak, lalu kirim pesan massal",
    method: "POST",
    url: "/api/devices/:deviceId/send-bulk-excel",
    curl: `curl -X POST http://localhost:3000/api/devices/1/send-bulk-excel \\
  -H "x-api-key: YOUR_API_KEY" \\
  -F "file=@contacts.xlsx" \\
  -F "message=Halo {{nama}}, promo hari ini!"`,
    nodeJs: `const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function sendBulkExcel() {
  const form = new FormData();
  form.append('file', fs.createReadStream('contacts.xlsx'));
  form.append('message', 'Halo {{nama}}, promo hari ini!');

  const { data } = await axios.post(
    'http://localhost:3000/api/devices/1/send-bulk-excel',
    form,
    {
      headers: {
        ...form.getHeaders(),
        'x-api-key': 'YOUR_API_KEY'
      }
    }
  );
  console.log('Result:', data);
}

sendBulkExcel();`,
  },
  {
    title: "4. Connect Device (QR Code)",
    description: "Mulai koneksi WhatsApp dan dapatkan QR code",
    method: "POST",
    url: "/api/devices/:deviceId/connect",
    curl: `# 1. Connect device
curl -X POST http://localhost:3000/api/devices/1/connect \\
  -H "x-api-key: YOUR_API_KEY"

# 2. Poll QR code
curl http://localhost:3000/api/devices/1/qr \\
  -H "x-api-key: YOUR_API_KEY"

# 3. Check status
curl http://localhost:3000/api/devices/1/status \\
  -H "x-api-key: YOUR_API_KEY"`,
    nodeJs: `const axios = require('axios');

const API = 'http://localhost:3000/api';
const headers = {
  'x-api-key': 'YOUR_API_KEY'
};

async function connectAndSend() {
  // 1. Connect
  await axios.post(\`\${API}/devices/1/connect\`, {}, { headers });

  // 2. Poll for QR (or use Socket.IO for realtime)
  let status;
  do {
    const { data } = await axios.get(\`\${API}/devices/1/status\`, { headers });
    status = data.status;
    console.log('Status:', status);
    if (status !== 'ready') await new Promise(r => setTimeout(r, 3000));
  } while (status !== 'ready');

  // 3. Send message
  const { data } = await axios.post(
    \`\${API}/devices/1/send\`,
    { phone: '6281234567890', message: 'Halo!' },
    { headers }
  );
  console.log('Sent:', data);
}

connectAndSend();`,
  },
];

function CodeBlock({ code }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative group">
      <pre className="rounded-xl bg-slate-900 p-4 text-xs text-slate-200 overflow-x-auto font-mono leading-relaxed">
        <code>{code}</code>
      </pre>
      <button
        onClick={copy}
        className="absolute top-2 right-2 rounded-lg bg-slate-700 p-1.5 text-slate-300 opacity-0 group-hover:opacity-100 hover:bg-slate-600 transition"
      >
        {copied ? (
          <CheckCircle2 size={12} className="text-emerald-400" />
        ) : (
          <Copy size={12} />
        )}
      </button>
    </div>
  );
}

export function ApiExamplePanel() {
  const [openIdx, setOpenIdx] = useState(0);
  const [codeTab, setCodeTab] = useState("curl");
  const [keys, setKeys] = useState([]);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [revokingId, setRevokingId] = useState(null);
  const [latestKey, setLatestKey] = useState("");

  const loadKeys = async () => {
    try {
      setLoadingKeys(true);
      const rows = await apiKeyService.list();
      setKeys(rows || []);
    } catch (error) {
      toast.error(error.message || "Gagal memuat API key");
    } finally {
      setLoadingKeys(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadKeys();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const onGenerate = async () => {
    try {
      setGenerating(true);
      const result = await apiKeyService.generate();
      setLatestKey(result?.api_key || "");
      toast.success("API key baru berhasil dibuat. Key lama nonaktif.");
      await loadKeys();
    } catch (error) {
      toast.error(error.message || "Gagal generate API key");
    } finally {
      setGenerating(false);
    }
  };

  const onRevoke = async (id) => {
    try {
      setRevokingId(id);
      await apiKeyService.revoke(id);
      toast.success("API key dinonaktifkan");
      await loadKeys();
    } catch (error) {
      toast.error(error.message || "Gagal revoke API key");
    } finally {
      setRevokingId(null);
    }
  };

  const copyLatestKey = async () => {
    if (!latestKey) return;
    try {
      await navigator.clipboard.writeText(latestKey);
      toast.success("API key disalin");
    } catch {
      toast.error("Gagal menyalin API key");
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">
            API Key Management
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Generate, lihat, dan nonaktifkan API key untuk organisasi aktif.
          </p>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onGenerate}
              disabled={generating}
              className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {generating ? "Generating..." : "Generate / Rotate Key"}
            </button>
            <button
              onClick={loadKeys}
              disabled={loadingKeys}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Refresh
            </button>
          </div>

          {latestKey ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-xs font-semibold text-emerald-700">
                Key baru (tampil sekali):
              </p>
              <div className="mt-2 flex gap-2">
                <input
                  readOnly
                  value={latestKey}
                  className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 font-mono text-xs text-slate-700"
                />
                <button
                  onClick={copyLatestKey}
                  className="rounded-lg border border-emerald-300 px-3 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                >
                  Copy
                </button>
              </div>
            </div>
          ) : null}

          <div className="overflow-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-120 text-left text-xs">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="px-3 py-2 font-semibold">No</th>
                  <th className="px-3 py-2 font-semibold">Key Preview</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                  <th className="px-3 py-2 font-semibold">Created</th>
                  <th className="px-3 py-2 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {loadingKeys ? (
                  <tr>
                    <td className="px-3 py-3 text-slate-500" colSpan={5}>
                      Memuat API key...
                    </td>
                  </tr>
                ) : keys.length === 0 ? (
                  <tr>
                    <td className="px-3 py-3 text-slate-500" colSpan={5}>
                      Belum ada API key.
                    </td>
                  </tr>
                ) : (
                  keys.map((key, index) => (
                    <tr key={key.id} className="border-t border-slate-100">
                      <td className="px-3 py-2">{index + 1}</td>
                      <td className="px-3 py-2 font-mono">{key.key_preview}</td>
                      <td className="px-3 py-2">
                        {key.is_active ? "active" : "inactive"}
                      </td>
                      <td className="px-3 py-2">
                        {key.created_at
                          ? new Date(key.created_at).toLocaleString("id-ID")
                          : "-"}
                      </td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => onRevoke(key.id)}
                          disabled={!key.is_active || revokingId === key.id}
                          className="rounded-md border border-red-200 px-2 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          {revokingId === key.id ? "Processing..." : "Revoke"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="bg-linear-to-r from-slate-700 to-slate-900 px-6 py-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            Contoh Kode API
          </h3>
          <p className="text-slate-300 text-xs mt-1">
            Gunakan API ini untuk integrasi dari sistem lain
          </p>
          <p className="text-slate-400 text-[11px] mt-1">
            Auth: gunakan header <span className="font-mono">x-api-key</span>.
            Generate/rotate key via endpoint{" "}
            <span className="font-mono">POST /api/api-keys</span> (key lama
            otomatis nonaktif).
          </p>
        </div>
        <div className="p-6 space-y-4">
          {EXAMPLES.map((ex, i) => (
            <div
              key={i}
              className="rounded-xl border border-slate-200 overflow-hidden"
            >
              <button
                onClick={() => setOpenIdx(openIdx === i ? -1 : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition"
              >
                <div>
                  <p className="text-sm font-bold text-slate-800">{ex.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {ex.description}
                  </p>
                </div>
                <span
                  className={`text-xs font-mono rounded-md px-2 py-1 ${ex.method === "POST" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}
                >
                  {ex.method}
                </span>
              </button>
              {openIdx === i && (
                <div className="px-5 pb-5 space-y-3">
                  <p className="text-xs font-mono text-indigo-600 bg-indigo-50 rounded-lg px-3 py-2">
                    {toAbsoluteUrl(ex.url)}
                  </p>
                  {ex.body && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 mb-1">
                        Request Body:
                      </p>
                      <CodeBlock
                        code={JSON.stringify(ex.body, null, 2)}
                        lang="json"
                      />
                    </div>
                  )}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => setCodeTab("curl")}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${codeTab === "curl" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600"}`}
                    >
                      cURL
                    </button>
                    <button
                      onClick={() => setCodeTab("node")}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${codeTab === "node" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600"}`}
                    >
                      Node.js
                    </button>
                  </div>
                  <CodeBlock
                    code={applyBaseApiUrl(
                      codeTab === "curl" ? ex.curl : ex.nodeJs,
                    )}
                    lang={codeTab === "curl" ? "bash" : "javascript"}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
