import { BookOpen, CheckCircle2, ChevronDown, Copy } from "lucide-react";
import { useState } from "react";
import { API_BASE_URL } from "../../config/app";

const BASE = API_BASE_URL.replace(/\/+$/, "");

const ENDPOINTS = [
  {
    title: "Send OTP",
    method: "POST",
    path: "/public/otp/send",
    description: "Kirim kode OTP ke nomor WhatsApp tujuan.",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": "YOUR_API_KEY",
      "Idempotency-Key": "unique-key-per-request",
    },
    body: {
      destination: "6281234567890",
      channel: "whatsapp",
      purpose: "login",
      reference_id: "optional-ref-123",
      metadata: { user_id: "abc" },
    },
    response: {
      success: true,
      data: {
        transaction_id: "uuid-xxx",
        status: "sent",
        channel: "whatsapp",
        purpose: "login",
        destination_masked: "6281****90",
        expires_at: "2026-04-20T10:05:00.000Z",
        next_resend_at: "2026-04-20T10:01:00.000Z",
        attempt_count: 0,
        max_attempts: 5,
        resend_count: 0,
        max_resend: 3,
      },
    },
    curl: `curl -X POST ${BASE}/public/otp/send \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Idempotency-Key: unique-key-123" \\
  -d '{
    "destination": "6281234567890",
    "channel": "whatsapp",
    "purpose": "login"
  }'`,
    nodeJs: `const axios = require('axios');

async function sendOtp() {
  const { data } = await axios.post(
    '${BASE}/public/otp/send',
    {
      destination: '6281234567890',
      channel: 'whatsapp',
      purpose: 'login',
    },
    {
      headers: {
        'x-api-key': 'YOUR_API_KEY',
        'Idempotency-Key': \`otp-\${Date.now()}\`,
      },
    }
  );

  console.log('Transaction ID:', data.data.transaction_id);
  return data;
}

sendOtp();`,
    python: `import requests

response = requests.post(
    '${BASE}/public/otp/send',
    json={
        'destination': '6281234567890',
        'channel': 'whatsapp',
        'purpose': 'login',
    },
    headers={
        'x-api-key': 'YOUR_API_KEY',
        'Idempotency-Key': f'otp-{int(time.time())}',
    }
)

data = response.json()
print('Transaction ID:', data['data']['transaction_id'])`,
  },
  {
    title: "Verify OTP",
    method: "POST",
    path: "/public/otp/verify",
    description:
      "Verifikasi kode OTP yang dimasukkan user. Jika kode salah, attempt_count bertambah.",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": "YOUR_API_KEY",
    },
    body: {
      transaction_id: "uuid-from-send",
      code: "123456",
    },
    response: {
      success: true,
      data: {
        transaction_id: "uuid-xxx",
        verified: true,
        status: "verified",
        verified_at: "2026-04-20T10:02:30.000Z",
      },
    },
    errorCodes: [
      { code: "OTP_INVALID_CODE", desc: "Kode salah, attempts_left dikurangi" },
      { code: "OTP_EXPIRED", desc: "OTP sudah kedaluwarsa" },
      { code: "OTP_MAX_ATTEMPTS_REACHED", desc: "Terlalu banyak percobaan, transaksi diblokir" },
      { code: "OTP_ALREADY_VERIFIED", desc: "OTP sudah diverifikasi sebelumnya" },
    ],
    curl: `curl -X POST ${BASE}/public/otp/verify \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{
    "transaction_id": "uuid-from-send",
    "code": "123456"
  }'`,
    nodeJs: `const axios = require('axios');

async function verifyOtp(transactionId, code) {
  const { data } = await axios.post(
    '${BASE}/public/otp/verify',
    { transaction_id: transactionId, code },
    { headers: { 'x-api-key': 'YOUR_API_KEY' } }
  );

  if (data.data.verified) {
    console.log('OTP verified!');
  }
  return data;
}

verifyOtp('uuid-from-send', '123456');`,
    python: `import requests

response = requests.post(
    '${BASE}/public/otp/verify',
    json={
        'transaction_id': 'uuid-from-send',
        'code': '123456',
    },
    headers={'x-api-key': 'YOUR_API_KEY'}
)

data = response.json()
if data['data']['verified']:
    print('OTP verified!')`,
  },
  {
    title: "Resend OTP",
    method: "POST",
    path: "/public/otp/resend",
    description:
      "Kirim ulang OTP. Kode baru akan digenerate dan dikirim ke nomor yang sama. Cooldown berlaku.",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": "YOUR_API_KEY",
    },
    body: { transaction_id: "uuid-from-send" },
    errorCodes: [
      { code: "OTP_RESEND_COOLDOWN", desc: "Masih dalam periode cooldown, tunggu sebelum resend" },
      { code: "OTP_MAX_RESEND_REACHED", desc: "Batas resend sudah tercapai" },
      { code: "OTP_EXPIRED", desc: "OTP sudah kedaluwarsa" },
    ],
    curl: `curl -X POST ${BASE}/public/otp/resend \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{"transaction_id": "uuid-from-send"}'`,
    nodeJs: `const axios = require('axios');

async function resendOtp(transactionId) {
  const { data } = await axios.post(
    '${BASE}/public/otp/resend',
    { transaction_id: transactionId },
    { headers: { 'x-api-key': 'YOUR_API_KEY' } }
  );
  console.log('Resent! New code expires at:', data.data.expires_at);
  return data;
}

resendOtp('uuid-from-send');`,
    python: `import requests

response = requests.post(
    '${BASE}/public/otp/resend',
    json={'transaction_id': 'uuid-from-send'},
    headers={'x-api-key': 'YOUR_API_KEY'}
)

data = response.json()
print('OTP resent, expires at:', data['data']['expires_at'])`,
  },
  {
    title: "Cancel OTP",
    method: "POST",
    path: "/public/otp/cancel",
    description:
      "Batalkan transaksi OTP yang sedang aktif. Setelah dibatalkan, kode tidak bisa digunakan.",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": "YOUR_API_KEY",
    },
    body: { transaction_id: "uuid-from-send" },
    curl: `curl -X POST ${BASE}/public/otp/cancel \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{"transaction_id": "uuid-from-send"}'`,
    nodeJs: `const axios = require('axios');

async function cancelOtp(transactionId) {
  const { data } = await axios.post(
    '${BASE}/public/otp/cancel',
    { transaction_id: transactionId },
    { headers: { 'x-api-key': 'YOUR_API_KEY' } }
  );
  console.log('Cancelled:', data.data.status);
}

cancelOtp('uuid-from-send');`,
    python: `import requests

response = requests.post(
    '${BASE}/public/otp/cancel',
    json={'transaction_id': 'uuid-from-send'},
    headers={'x-api-key': 'YOUR_API_KEY'}
)
print('Status:', response.json()['data']['status'])`,
  },
  {
    title: "Get Transaction",
    method: "GET",
    path: "/public/otp/transactions/:transactionId",
    description: "Ambil detail dan status transaksi OTP berdasarkan ID.",
    headers: { "x-api-key": "YOUR_API_KEY" },
    curl: `curl ${BASE}/public/otp/transactions/uuid-xxx \\
  -H "x-api-key: YOUR_API_KEY"`,
    nodeJs: `const axios = require('axios');

async function getTransaction(txId) {
  const { data } = await axios.get(
    \`${BASE}/public/otp/transactions/\${txId}\`,
    { headers: { 'x-api-key': 'YOUR_API_KEY' } }
  );
  console.log('Status:', data.data.status);
  return data;
}

getTransaction('uuid-xxx');`,
    python: `import requests

response = requests.get(
    f'${BASE}/public/otp/transactions/uuid-xxx',
    headers={'x-api-key': 'YOUR_API_KEY'}
)
print('Transaction:', response.json()['data'])`,
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
      <pre className="rounded-xl bg-slate-900 p-4 text-[11px] text-slate-200 overflow-x-auto font-mono leading-relaxed">
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

export function OtpDocsPanel() {
  const [openIdx, setOpenIdx] = useState(0);
  const [codeTab, setCodeTab] = useState("curl");

  return (
    <div className="space-y-5">
      {/* Intro */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-5">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <BookOpen size={18} />
            Dokumentasi API OTP
          </h3>
          <p className="text-slate-300 text-sm mt-1">
            Integrasikan layanan OTP WhatsApp ke aplikasi Anda
          </p>
        </div>
        <div className="p-6 space-y-4">
          {/* Auth info */}
          <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
            <h4 className="text-sm font-bold text-indigo-800">
              Autentikasi
            </h4>
            <p className="text-xs text-indigo-700 mt-1">
              Semua request ke API OTP membutuhkan header{" "}
              <code className="rounded bg-indigo-100 px-1.5 py-0.5 font-mono text-[11px]">
                x-api-key
              </code>{" "}
              berisi API key yang didapat saat membuat OTP App.
            </p>
          </div>

          {/* API Key = OTP App concept */}
          <div className="rounded-xl border border-violet-100 bg-violet-50 p-4">
            <h4 className="text-sm font-bold text-violet-800">
              Konsep: 1 API Key = 1 OTP App
            </h4>
            <p className="text-xs text-violet-700 mt-1">
              Setiap OTP App memiliki API key tersendiri. Saat request masuk,
              sistem otomatis menentukan OTP App mana yang digunakan berdasarkan
              API key. Artinya:
            </p>
            <ul className="mt-2 space-y-1 text-xs text-violet-700">
              <li className="flex items-start gap-1.5">
                <span className="mt-0.5 text-violet-500 font-bold">•</span>
                <span>
                  <strong>Device WhatsApp</strong> — sudah di-set per OTP App,
                  tidak perlu dikirim saat request
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="mt-0.5 text-violet-500 font-bold">•</span>
                <span>
                  <strong>Template pesan</strong> — sudah dikonfigurasi per OTP
                  App
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="mt-0.5 text-violet-500 font-bold">•</span>
                <span>
                  <strong>Policy</strong> (TTL, max attempts, dll) — sudah di-set
                  per OTP App
                </span>
              </li>
            </ul>
            <p className="mt-2 text-[11px] text-violet-600">
              Beda dengan API Kirim Pesan WA yang pakai 1 API key untuk semua,
              di OTP setiap app punya key sendiri.
            </p>
          </div>

          {/* Base URL */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold text-slate-600">Base URL</p>
            <p className="mt-1 font-mono text-sm text-slate-800">{BASE}</p>
          </div>

          {/* Idempotency */}
          <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
            <h4 className="text-sm font-bold text-amber-800">
              Idempotency Key
            </h4>
            <p className="text-xs text-amber-700 mt-1">
              Endpoint <strong>Send OTP</strong> membutuhkan header{" "}
              <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-[11px]">
                Idempotency-Key
              </code>
              . Gunakan nilai unik per request untuk mencegah pengiriman OTP
              ganda. Contoh: <code className="font-mono text-[11px]">otp-{"{userId}"}-{"{timestamp}"}</code>
            </p>
          </div>

          {/* Flow */}
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
            <h4 className="text-sm font-bold text-emerald-800">Alur OTP</h4>
            <ol className="mt-2 space-y-1.5 text-xs text-emerald-700">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-200 text-[10px] font-bold text-emerald-800">
                  1
                </span>
                <span>
                  <strong>Send OTP</strong> — panggil{" "}
                  <code className="font-mono">POST /public/otp/send</code> untuk
                  kirim kode OTP ke nomor WA user.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-200 text-[10px] font-bold text-emerald-800">
                  2
                </span>
                <span>
                  <strong>User input kode</strong> — tampilkan form input di
                  aplikasi Anda.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-200 text-[10px] font-bold text-emerald-800">
                  3
                </span>
                <span>
                  <strong>Verify OTP</strong> — panggil{" "}
                  <code className="font-mono">POST /public/otp/verify</code>{" "}
                  dengan kode yang diinput user.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-200 text-[10px] font-bold text-emerald-800">
                  4
                </span>
                <span>
                  <strong>Resend</strong> (opsional) — jika user belum menerima,
                  panggil <code className="font-mono">POST /public/otp/resend</code>.
                </span>
              </li>
            </ol>
          </div>
        </div>
      </div>

      {/* Endpoints */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">
            Endpoint Reference
          </h3>
        </div>
        <div className="divide-y divide-slate-100">
          {ENDPOINTS.map((ep, i) => (
            <div key={i}>
              <button
                onClick={() => setOpenIdx(openIdx === i ? -1 : i)}
                className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50/70 transition"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-md px-2 py-1 text-[10px] font-bold font-mono ${
                      ep.method === "POST"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {ep.method}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {ep.title}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {ep.description}
                    </p>
                  </div>
                </div>
                <ChevronDown
                  size={14}
                  className={`text-slate-400 transition ${
                    openIdx === i ? "rotate-180" : ""
                  }`}
                />
              </button>

              {openIdx === i && (
                <div className="px-6 pb-6 space-y-4">
                  {/* URL */}
                  <div className="rounded-xl bg-indigo-50 border border-indigo-100 px-4 py-2.5">
                    <p className="font-mono text-xs text-indigo-700">
                      {ep.method} {BASE}/{ep.path.replace(/^\//, "")}
                    </p>
                  </div>

                  {/* Headers */}
                  {ep.headers && (
                    <div>
                      <p className="text-[11px] font-semibold text-slate-500 mb-1.5">
                        Headers
                      </p>
                      <div className="rounded-xl bg-slate-50 border border-slate-200 overflow-hidden">
                        {Object.entries(ep.headers).map(([key, val]) => (
                          <div
                            key={key}
                            className="flex border-b border-slate-100 last:border-0"
                          >
                            <span className="px-3 py-2 text-[11px] font-mono font-semibold text-slate-700 bg-slate-100 min-w-[160px]">
                              {key}
                            </span>
                            <span className="px-3 py-2 text-[11px] font-mono text-slate-500">
                              {val}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Body */}
                  {ep.body && (
                    <div>
                      <p className="text-[11px] font-semibold text-slate-500 mb-1.5">
                        Request Body
                      </p>
                      <CodeBlock code={JSON.stringify(ep.body, null, 2)} />
                    </div>
                  )}

                  {/* Response */}
                  {ep.response && (
                    <div>
                      <p className="text-[11px] font-semibold text-slate-500 mb-1.5">
                        Response (200)
                      </p>
                      <CodeBlock code={JSON.stringify(ep.response, null, 2)} />
                    </div>
                  )}

                  {/* Error codes */}
                  {ep.errorCodes && (
                    <div>
                      <p className="text-[11px] font-semibold text-slate-500 mb-1.5">
                        Error Codes
                      </p>
                      <div className="rounded-xl border border-slate-200 overflow-hidden">
                        <table className="w-full text-xs">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="px-3 py-2 text-left font-semibold text-slate-600">
                                Code
                              </th>
                              <th className="px-3 py-2 text-left font-semibold text-slate-600">
                                Keterangan
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {ep.errorCodes.map((ec) => (
                              <tr key={ec.code}>
                                <td className="px-3 py-2 font-mono text-red-600">
                                  {ec.code}
                                </td>
                                <td className="px-3 py-2 text-slate-600">
                                  {ec.desc}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Code examples tabs */}
                  <div>
                    <p className="text-[11px] font-semibold text-slate-500 mb-2">
                      Contoh Kode
                    </p>
                    <div className="flex gap-1.5 mb-3">
                      {["curl", "node", "python"].map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setCodeTab(tab)}
                          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                            codeTab === tab
                              ? "bg-slate-800 text-white"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {tab === "curl"
                            ? "cURL"
                            : tab === "node"
                              ? "Node.js"
                              : "Python"}
                        </button>
                      ))}
                    </div>
                    <CodeBlock
                      code={
                        codeTab === "curl"
                          ? ep.curl || ""
                          : codeTab === "node"
                            ? ep.nodeJs || ""
                            : ep.python || ""
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
