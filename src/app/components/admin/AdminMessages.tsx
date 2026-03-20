import { useEffect, useState } from "react";
import {
  MessageSquare,
  Trash2,
  CheckCheck,
  Mail,
  Calendar,
  X,
  Search,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { api } from "../../data/api";
import { toast } from "sonner";

interface Message {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export function AdminMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Message | null>(null);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [search, setSearch] = useState("");

  const loadMessages = async () => {
    try {
      const data = await api("/admin/messages");
      setMessages(data.messages || []);
    } catch (err) {
      console.error("Load messages error:", err);
      toast.error("Erro ao carregar mensagens.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await api(`/admin/messages/${id}/read`, { method: "PUT" });
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, read: true } : m))
      );
      if (selected?.id === id) setSelected((s) => (s ? { ...s, read: true } : s));
    } catch (err) {
      console.error("Mark read error:", err);
      toast.error("Erro ao marcar mensagem como lida.");
    }
  };

  const deleteMessage = async (id: string) => {
    if (!confirm("Excluir esta mensagem?")) return;
    try {
      await api(`/admin/messages/${id}`, { method: "DELETE" });
      setMessages((prev) => prev.filter((m) => m.id !== id));
      if (selected?.id === id) setSelected(null);
      toast.success("Mensagem excluída.");
    } catch (err) {
      console.error("Delete message error:", err);
      toast.error("Erro ao excluir mensagem.");
    }
  };

  const filtered = messages.filter((m) => {
    if (filter === "unread" && m.read) return false;
    if (filter === "read" && !m.read) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.subject.toLowerCase().includes(q)
      );
    }
    return true;
  });

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

  return (
    <div className="space-y-4">
      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#856C42]/50" />
          <input
            type="text"
            placeholder="Buscar mensagens..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm text-[#052413] placeholder:text-[#856C42]/40 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20"
            style={{
              fontFamily: "Inter, sans-serif",
              backgroundColor: "#FFFDF8",
              borderColor: "rgba(133,108,66,0.15)",
            }}
          />
        </div>
        <div className="flex gap-1.5">
          {[
            { key: "all", label: "Todas" },
            { key: "unread", label: "Não lidas" },
            { key: "read", label: "Lidas" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as any)}
              className={`px-4 py-2.5 rounded-lg text-xs transition-all cursor-pointer ${
                filter === f.key ? "text-white" : "text-[#856C42] hover:bg-[#F0E8D4]"
              }`}
              style={{
                fontFamily: "Inter, sans-serif",
                ...(filter === f.key
                  ? { background: "linear-gradient(135deg, #165B36, #052413)" }
                  : { backgroundColor: "#FFFDF8", border: "1px solid rgba(133,108,66,0.15)" }),
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages list */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{
          backgroundColor: "#FFFDF8",
          borderColor: "rgba(133,108,66,0.12)",
        }}
      >
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <MessageSquare className="w-10 h-10 text-[#856C42]/30 mx-auto mb-3" />
            <p className="text-sm text-[#856C42]" style={{ fontFamily: "Inter, sans-serif" }}>
              Nenhuma mensagem encontrada
            </p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "rgba(133,108,66,0.08)" }}>
            <AnimatePresence>
              {filtered.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`flex items-start gap-3 p-4 cursor-pointer transition-colors hover:bg-[#F0E8D4]/30 ${
                    !msg.read ? "bg-[#165B36]/[0.02]" : ""
                  }`}
                  onClick={() => {
                    setSelected(msg);
                    if (!msg.read) markAsRead(msg.id);
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5"
                    style={{
                      background: msg.read
                        ? "rgba(133,108,66,0.12)"
                        : "linear-gradient(135deg, #165B36, #052413)",
                      color: msg.read ? "#856C42" : "#EBBF74",
                    }}
                  >
                    {msg.name[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p
                        className={`text-sm truncate ${msg.read ? "text-[#856C42]" : "text-[#052413] font-semibold"}`}
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
                      className="text-xs text-[#856C42] font-medium mt-0.5"
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      {msg.subject}
                    </p>
                    <p
                      className="text-xs text-[#856C42]/60 truncate mt-0.5"
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      {msg.message}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className="text-[0.6rem] text-[#856C42]/50"
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      {new Date(msg.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMessage(msg.id);
                      }}
                      className="p-1.5 rounded-lg text-[#856C42]/40 hover:text-[#d4183d] hover:bg-[#d4183d]/5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Message detail modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
            onClick={() => setSelected(null)}
            role="dialog"
            aria-modal="true"
            aria-label="Detalhes da mensagem"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-lg rounded-xl p-6 border max-h-[80vh] overflow-auto"
              style={{
                backgroundColor: "#FFFDF8",
                borderColor: "rgba(133,108,66,0.15)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3
                    className="text-lg text-[#052413]"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {selected.subject}
                  </h3>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="flex items-center gap-1 text-xs text-[#856C42]" style={{ fontFamily: "Inter, sans-serif" }}>
                      <Mail className="w-3 h-3" />
                      {selected.email}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-[#856C42]/60" style={{ fontFamily: "Inter, sans-serif" }}>
                      <Calendar className="w-3 h-3" />
                      {new Date(selected.createdAt).toLocaleString("pt-BR")}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="p-1 text-[#856C42] hover:text-[#052413] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
                  style={{
                    background: "linear-gradient(135deg, #165B36, #052413)",
                    color: "#EBBF74",
                  }}
                >
                  {selected.name[0]?.toUpperCase()}
                </div>
                <p className="text-sm font-medium text-[#052413]" style={{ fontFamily: "Inter, sans-serif" }}>
                  {selected.name}
                </p>
                {selected.read && (
                  <span className="flex items-center gap-1 text-[0.6rem] text-[#165B36]/60 ml-auto" style={{ fontFamily: "Inter, sans-serif" }}>
                    <CheckCheck className="w-3 h-3" /> Lida
                  </span>
                )}
              </div>

              <div
                className="p-4 rounded-lg text-sm text-[#052413] whitespace-pre-wrap leading-relaxed"
                style={{
                  backgroundColor: "#F0E8D4",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                {selected.message}
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => deleteMessage(selected.id)}
                  className="px-4 py-2 rounded-lg text-xs text-[#d4183d] border hover:bg-[#d4183d]/5 transition-colors cursor-pointer"
                  style={{
                    fontFamily: "Inter, sans-serif",
                    borderColor: "rgba(212,24,61,0.2)",
                  }}
                >
                  <Trash2 className="w-3 h-3 inline mr-1" />
                  Excluir
                </button>
                <a
                  href={`mailto:${selected.email}?subject=Re: ${selected.subject}`}
                  className="px-4 py-2 rounded-lg text-xs text-white transition-opacity hover:opacity-90"
                  style={{
                    fontFamily: "Inter, sans-serif",
                    background: "linear-gradient(135deg, #165B36, #052413)",
                  }}
                >
                  <Mail className="w-3 h-3 inline mr-1" />
                  Responder
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}