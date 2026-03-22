import { useState, useEffect } from "react";
import { Mail, Loader2, Download, Search, X, Users } from "lucide-react";
import { motion } from "motion/react";
import { getAdminSubscribers } from "../../data/api";
import { toast } from "sonner";


interface Subscriber {
  email: string;
  subscribedAt: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

export function AdminNewsletter() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getAdminSubscribers()
      .then((data) => {
        if (Array.isArray(data?.subscribers)) {
          const sorted = [...data.subscribers].sort(
            (a: Subscriber, b: Subscriber) =>
              new Date(b.subscribedAt).getTime() - new Date(a.subscribedAt).getTime()
          );
          setSubscribers(sorted);
        }
      })
      .catch(() => toast.error("Erro ao carregar inscritos"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = subscribers.filter((s) =>
    !search || s.email.toLowerCase().includes(search.toLowerCase())
  );

  function exportCsv() {
    if (subscribers.length === 0) return;
    const rows = [
      ["Email", "Data de inscrição"],
      ...subscribers.map((s) => [s.email, formatDate(s.subscribedAt)]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `newsletter-inscritos-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Lista exportada!");
  }

  // Group by month for stats
  const thisMonth = subscribers.filter((s) => {
    const d = new Date(s.subscribedAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Newsletter</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gerencie os inscritos da newsletter
          </p>
        </div>
        <button
          onClick={exportCsv}
          disabled={subscribers.length === 0}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: "linear-gradient(135deg, #EBBF74, #D4AF5A)",
            color: "#052413",
          }}
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div
          className="rounded-xl p-4 border"
          style={{ backgroundColor: "rgba(22,91,54,0.04)", borderColor: "rgba(22,91,54,0.12)" }}
        >
          <p className="text-2xl font-semibold text-[#165B36]">
            {loading ? "—" : subscribers.length}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Total de inscritos</p>
        </div>
        <div
          className="rounded-xl p-4 border"
          style={{ backgroundColor: "rgba(235,191,116,0.08)", borderColor: "rgba(235,191,116,0.25)" }}
        >
          <p className="text-2xl font-semibold text-[#856C42]">
            {loading ? "—" : thisMonth}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Novos este mês</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por e-mail..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-[#165B36]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-200 rounded-xl">
          <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">
            {search ? "Nenhum inscrito encontrado." : "Nenhum inscrito ainda."}
          </p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">E-mail</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Inscrito em</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((s, i) => (
                <motion.tr
                  key={s.email}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                        style={{ background: "linear-gradient(135deg,#EBBF74,#D4AF5A)", color: "#052413" }}
                      >
                        {s.email[0]?.toUpperCase()}
                      </div>
                      <span className="text-gray-700">{s.email}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs text-right whitespace-nowrap">
                    {formatDate(s.subscribedAt)}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {search && (
            <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-400">
                {filtered.length} de {subscribers.length} inscritos
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
