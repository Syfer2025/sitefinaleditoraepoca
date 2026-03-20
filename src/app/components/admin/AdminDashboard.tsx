import { useEffect, useState } from "react";
import { Users, MessageSquare, Mail, BookOpen, TrendingUp, Eye } from "lucide-react";
import { motion } from "motion/react";
import { api } from "../../data/api";
import { allBooks } from "../../data/books";

interface Stats {
  totalUsers: number;
  totalMessages: number;
  unreadMessages: number;
  totalSubscribers: number;
  totalProjects: number;
  activeProjects: number;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentMessages, setRecentMessages] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([api("/admin/stats"), api("/admin/messages")])
      .then(([statsData, msgsData]) => {
        setStats(statsData);
        setRecentMessages(msgsData.messages?.slice(0, 5) || []);
      })
      .catch((err) => console.error("Dashboard load error:", err))
      .finally(() => setLoading(false));
  }, []);

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
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              {card.value}
            </p>
            <p
              className="text-xs text-[#856C42] mt-0.5"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              {card.label}
            </p>
          </motion.div>
        ))}
      </div>

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
              className="text-base text-[#052413]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Mensagens Recentes
            </h3>
            <a
              href="/admin/mensagens"
              className="text-xs text-[#165B36] hover:underline"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Ver todas
            </a>
          </div>

          {recentMessages.length === 0 ? (
            <p
              className="text-sm text-[#856C42] text-center py-8"
              style={{ fontFamily: "Inter, sans-serif" }}
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
                        style={{ fontFamily: "Inter, sans-serif" }}
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
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      {msg.subject} — {msg.message?.slice(0, 60)}...
                    </p>
                  </div>
                  <span
                    className="text-[0.6rem] text-[#856C42]/60 flex-shrink-0"
                    style={{ fontFamily: "Inter, sans-serif" }}
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
            className="text-base text-[#052413] mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Catálogo
          </h3>
          <div className="flex items-center gap-4 mb-4 p-4 rounded-lg" style={{ backgroundColor: "rgba(22,91,54,0.05)" }}>
            <BookOpen className="w-8 h-8 text-[#165B36]" />
            <div>
              <p className="text-2xl font-semibold text-[#052413]" style={{ fontFamily: "Inter, sans-serif" }}>
                {allBooks.length}
              </p>
              <p className="text-xs text-[#856C42]" style={{ fontFamily: "Inter, sans-serif" }}>
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
                    style={{ fontFamily: "Inter, sans-serif" }}
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
                    style={{ fontFamily: "Inter, sans-serif" }}
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