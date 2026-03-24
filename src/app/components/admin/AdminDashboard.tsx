import { useEffect, useState } from "react";
import { Users, MessageSquare, Mail, BookOpen, TrendingUp, Eye, DollarSign, Clock, AlertTriangle, Bell } from "lucide-react";
import { motion } from "motion/react";
import { api, getAdminFinancialStats, sendInstallmentReminders } from "../../data/api";
import { allBooks } from "../../data/books";
import { toast } from "sonner";

interface Stats {
  totalUsers: number;
  totalMessages: number;
  unreadMessages: number;
  totalSubscribers: number;
  totalProjects: number;
  activeProjects: number;
}

interface FinancialStats {
  totalRevenue: number;
  totalPending: number;
  totalOverdue: number;
  totalProjects: number;
  monthlyRevenue: { month: string; amount: number }[];
}

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentMessages, setRecentMessages] = useState<any[]>([]);
  const [financial, setFinancial] = useState<FinancialStats | null>(null);
  const [sendingReminders, setSendingReminders] = useState(false);

  useEffect(() => {
    Promise.all([api("/admin/stats"), api("/admin/messages"), getAdminFinancialStats()])
      .then(([statsData, msgsData, finData]) => {
        setStats(statsData);
        setRecentMessages(msgsData.messages?.slice(0, 5) || []);
        setFinancial(finData);
      })
      .catch((err) => console.error("Dashboard load error:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleSendReminders = async () => {
    setSendingReminders(true);
    try {
      const res = await sendInstallmentReminders(3);
      toast.success(`${res.sent} lembrete(s) enviado(s)`);
    } catch (e: any) { toast.error(e.message || "Erro ao enviar lembretes"); }
    finally { setSendingReminders(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div
          className="w-8 h-8 border-3 rounded-full animate-spin"
          style={{ borderColor: "rgba(22,91,54,0.2)", borderTopColor: "#165B36" }}
        />
      </div>
    );
  }

  const cards = [
    {
      label: "Usuários",
      value: stats?.totalUsers || 0,
      icon: Users,
      color: "#165B36",
      bg: "rgba(22,91,54,0.08)",
    },
    {
      label: "Projetos ativos",
      value: stats?.activeProjects || 0,
      icon: BookOpen,
      color: "#EBBF74",
      bg: "rgba(235,191,116,0.12)",
    },
    {
      label: "Mensagens",
      value: stats?.totalMessages || 0,
      icon: MessageSquare,
      color: "#856C42",
      bg: "rgba(133,108,66,0.1)",
    },
    {
      label: "Não lidas",
      value: stats?.unreadMessages || 0,
      icon: Eye,
      color: "#d4183d",
      bg: "rgba(212,24,61,0.08)",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            className="rounded-xl p-5 border"
            style={{
              backgroundColor: "#FFFDF8",
              borderColor: "rgba(133,108,66,0.12)",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: card.bg }}
              >
                <card.icon className="w-5 h-5" style={{ color: card.color }} />
              </div>
              <TrendingUp className="w-3.5 h-3.5 text-[#165B36]/40" />
            </div>
            <p
              className="text-2xl font-semibold text-[#052413]"
            >
              {card.value}
            </p>
            <p
              className="text-xs text-[#856C42] mt-0.5"
            >
              {card.label}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Financial Dashboard */}
      {financial && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base text-[#052413] font-serif">Resumo Financeiro</h3>
            <button onClick={handleSendReminders} disabled={sendingReminders} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#856C42] hover:bg-[#F0E8D4]/60 transition-colors border cursor-pointer disabled:opacity-50" style={{ borderColor: "rgba(133,108,66,0.15)" }}>
              <Bell className="w-3.5 h-3.5" />
              {sendingReminders ? "Enviando..." : "Enviar lembretes de parcelas"}
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Faturado", value: financial.totalRevenue, icon: DollarSign, color: "#165B36", bg: "rgba(22,91,54,0.08)" },
              { label: "A receber", value: financial.totalPending, icon: Clock, color: "#EBBF74", bg: "rgba(235,191,116,0.12)" },
              { label: "Em atraso", value: financial.totalOverdue, icon: AlertTriangle, color: "#d4183d", bg: "rgba(212,24,61,0.08)" },
            ].map((card, i) => (
              <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.08, duration: 0.4 }} className="rounded-xl p-5 border" style={{ backgroundColor: "#FFFDF8", borderColor: "rgba(133,108,66,0.12)" }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: card.bg }}>
                    <card.icon className="w-5 h-5" style={{ color: card.color }} />
                  </div>
                  <p className="text-xs text-[#856C42]">{card.label}</p>
                </div>
                <p className="text-2xl font-semibold text-[#052413]">{card.value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
              </motion.div>
            ))}
          </div>

          {/* Monthly Revenue Chart */}
          {financial.monthlyRevenue.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.4 }} className="rounded-xl border p-5" style={{ backgroundColor: "#FFFDF8", borderColor: "rgba(133,108,66,0.12)" }}>
              <h4 className="text-sm text-[#052413] font-serif mb-4">Receita Mensal (últimos 12 meses)</h4>
              {(() => {
                const maxVal = Math.max(...financial.monthlyRevenue.map(m => m.amount), 1);
                return (
                  <div className="flex items-end gap-2 h-40">
                    {financial.monthlyRevenue.map((m) => {
                      const pct = (m.amount / maxVal) * 100;
                      const monthLabel = new Date(m.month + "-15").toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
                      return (
                        <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-[0.55rem] text-[#856C42]/70">{m.amount > 0 ? (m.amount / 1000).toFixed(1) + "k" : ""}</span>
                          <div className="w-full rounded-t-md" style={{ height: `${Math.max(pct, 4)}%`, background: "linear-gradient(180deg, #165B36, #052413)" }} />
                          <span className="text-[0.55rem] text-[#856C42]/60">{monthLabel}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </motion.div>
          )}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent messages */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="rounded-xl border p-5"
          style={{
            backgroundColor: "#FFFDF8",
            borderColor: "rgba(133,108,66,0.12)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3
              className="text-base text-[#052413] font-serif"
            >
              Mensagens Recentes
            </h3>
            <a
              href="/admin/mensagens"
              className="text-xs text-[#165B36] hover:underline"
            >
              Ver todas
            </a>
          </div>

          {recentMessages.length === 0 ? (
            <p
              className="text-sm text-[#856C42] text-center py-8"
            >
              Nenhuma mensagem ainda
            </p>
          ) : (
            <div className="space-y-3">
              {recentMessages.map((msg: any) => (
                <div
                  key={msg.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-[#F0E8D4]/50 transition-colors"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                    style={{
                      background: msg.read
                        ? "rgba(133,108,66,0.15)"
                        : "linear-gradient(135deg, #165B36, #052413)",
                      color: msg.read ? "#856C42" : "#EBBF74",
                    }}
                  >
                    {msg.name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p
                        className="text-sm text-[#052413] font-medium truncate"
                      >
                        {msg.name}
                      </p>
                      {!msg.read && (
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: "#165B36" }}
                        />
                      )}
                    </div>
                    <p
                      className="text-xs text-[#856C42] truncate"
                    >
                      {msg.subject} — {msg.message?.slice(0, 60)}...
                    </p>
                  </div>
                  <span
                    className="text-[0.6rem] text-[#856C42]/60 flex-shrink-0"
                  >
                    {new Date(msg.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Quick info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="rounded-xl border p-5"
          style={{
            backgroundColor: "#FFFDF8",
            borderColor: "rgba(133,108,66,0.12)",
          }}
        >
          <h3
            className="text-base text-[#052413] mb-4 font-serif"
          >
            Catálogo
          </h3>
          <div className="flex items-center gap-4 mb-4 p-4 rounded-lg" style={{ backgroundColor: "rgba(22,91,54,0.05)" }}>
            <BookOpen className="w-8 h-8 text-[#165B36]" />
            <div>
              <p className="text-2xl font-semibold text-[#052413]">
                {allBooks.length}
              </p>
              <p className="text-xs text-[#856C42]">
                Livros publicados
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {["Romance", "Ficção", "Contos", "Poesia", "Ensaios"].map((genre) => {
              const count = allBooks.filter((b) => b.genre === genre).length;
              const pct = (count / allBooks.length) * 100;
              return (
                <div key={genre} className="flex items-center gap-3">
                  <span
                    className="text-xs text-[#856C42] w-16"
                  >
                    {genre}
                  </span>
                  <div
                    className="flex-1 h-2 rounded-full overflow-hidden"
                    style={{ backgroundColor: "rgba(133,108,66,0.1)" }}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{
                        background: "linear-gradient(90deg, #165B36, #EBBF74)",
                      }}
                    />
                  </div>
                  <span
                    className="text-xs text-[#052413] w-6 text-right"
                  >
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}