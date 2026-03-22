import { useState, useEffect, useRef } from "react";
import {
  Mail, Plus, Loader2, Send, Trash2, Edit3, CheckCircle, Clock,
  Users, BarChart2, Eye, X, AlertTriangle, ChevronRight, Search,
  FileText, ArrowLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  getAdminEmailCampaigns, createAdminEmailCampaign, updateAdminEmailCampaign,
  deleteAdminEmailCampaign, sendAdminEmailCampaign, getAdminSubscribers,
  type EmailCampaign,
} from "../../data/api";
import { toast } from "sonner";

const F = "Inter, sans-serif";
const PF = "'Playfair Display', serif";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ── HTML Preview Modal ─────────────────────────────────────────────────────────
function PreviewModal({ html, subject, onClose }: { html: string; subject: string; onClose: () => void }) {
  useEffect(() => {
    const orig = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = orig; };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col"
        style={{ maxHeight: "85vh" }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "rgba(133,108,66,0.12)" }}>
          <div>
            <p className="text-xs text-[#856C42]" style={{ fontFamily: F }}>Pré-visualização</p>
            <p className="text-sm font-semibold text-[#052413] truncate max-w-[400px]" style={{ fontFamily: F }}>{subject}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer"><X className="w-4 h-4 text-[#856C42]" /></button>
        </div>
        <div className="flex-1 overflow-auto p-2">
          <iframe
            srcDoc={html}
            title="Preview"
            className="w-full rounded-lg border"
            style={{ minHeight: "500px", borderColor: "rgba(133,108,66,0.1)" }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Confirm Send Dialog ─────────────────────────────────────────────────────────
function ConfirmSend({ campaign, subscriberCount, onConfirm, onCancel, sending }: {
  campaign: EmailCampaign; subscriberCount: number;
  onConfirm: () => void; onCancel: () => void; sending: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(235,191,116,0.15)" }}>
            <Send className="w-5 h-5 text-[#856C42]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#052413]" style={{ fontFamily: F }}>Confirmar envio</p>
            <p className="text-xs text-[#856C42]" style={{ fontFamily: F }}>Esta ação não pode ser desfeita</p>
          </div>
        </div>
        <div className="rounded-xl p-4 mb-5 space-y-2" style={{ background: "rgba(22,91,54,0.05)" }}>
          <p className="text-xs text-[#052413]" style={{ fontFamily: F }}>
            <strong>Campanha:</strong> {campaign.name}
          </p>
          <p className="text-xs text-[#052413]" style={{ fontFamily: F }}>
            <strong>Assunto:</strong> {campaign.subject}
          </p>
          <p className="text-xs text-[#052413]" style={{ fontFamily: F }}>
            <strong>Destinatários:</strong> {subscriberCount} inscritos
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={sending}
            className="flex-1 py-2.5 rounded-xl text-sm border cursor-pointer disabled:opacity-50"
            style={{ fontFamily: F, borderColor: "rgba(133,108,66,0.2)", color: "#856C42" }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={sending}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-white cursor-pointer disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #165B36, #052413)", fontFamily: F }}
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Enviar agora
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Campaign Editor ────────────────────────────────────────────────────────────
function CampaignEditor({
  initial, onSave, onCancel, saving,
}: {
  initial?: Partial<EmailCampaign>;
  onSave: (data: { name: string; subject: string; html: string; text: string }) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [name, setName] = useState(initial?.name || "");
  const [subject, setSubject] = useState(initial?.subject || "");
  const [html, setHtml] = useState(initial?.html || DEFAULT_HTML);
  const [text, setText] = useState(initial?.text || "");
  const [activeTab, setActiveTab] = useState<"html" | "text">("html");
  const [showPreview, setShowPreview] = useState(false);

  return (
    <>
      <div className="space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-[#F0E8D4] transition-colors cursor-pointer">
            <ArrowLeft className="w-4 h-4 text-[#856C42]" />
          </button>
          <h2 className="text-lg font-semibold text-[#052413]" style={{ fontFamily: F }}>
            {initial?.id ? "Editar campanha" : "Nova campanha"}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#052413] mb-1.5" style={{ fontFamily: F }}>
              Nome da campanha
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Newsletter de Março 2026"
              className="w-full px-3 py-2.5 rounded-lg border text-sm text-[#052413] placeholder:text-[#856C42]/40 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20"
              style={{ fontFamily: F, backgroundColor: "#F0E8D4", borderColor: "rgba(133,108,66,0.2)" }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#052413] mb-1.5" style={{ fontFamily: F }}>
              Assunto do e-mail
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ex: Novidades da Época Editora — Março 2026"
              className="w-full px-3 py-2.5 rounded-lg border text-sm text-[#052413] placeholder:text-[#856C42]/40 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20"
              style={{ fontFamily: F, backgroundColor: "#F0E8D4", borderColor: "rgba(133,108,66,0.2)" }}
            />
          </div>
        </div>

        {/* Editor tabs */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex rounded-lg p-1" style={{ backgroundColor: "#F0E8D4" }}>
              {(["html", "text"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="px-4 py-1.5 rounded-md text-xs transition-all cursor-pointer"
                  style={{
                    fontFamily: F,
                    backgroundColor: activeTab === tab ? "#FFFDF8" : "transparent",
                    color: activeTab === tab ? "#052413" : "#856C42",
                    fontWeight: activeTab === tab ? 500 : 400,
                  }}
                >
                  {tab === "html" ? "HTML" : "Texto simples"}
                </button>
              ))}
            </div>
            {activeTab === "html" && (
              <button
                onClick={() => setShowPreview(true)}
                className="flex items-center gap-1.5 text-xs text-[#165B36] hover:underline cursor-pointer"
                style={{ fontFamily: F }}
              >
                <Eye className="w-3.5 h-3.5" /> Pré-visualizar
              </button>
            )}
          </div>

          {activeTab === "html" ? (
            <textarea
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              rows={18}
              placeholder="Cole o HTML do seu e-mail aqui..."
              className="w-full px-3 py-3 rounded-xl border text-xs font-mono text-[#052413] placeholder:text-[#856C42]/40 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20 resize-y"
              style={{ fontFamily: "monospace", backgroundColor: "#F7F4EE", borderColor: "rgba(133,108,66,0.2)", lineHeight: 1.6 }}
            />
          ) : (
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={12}
              placeholder="Versão em texto simples (para clientes que não exibem HTML)..."
              className="w-full px-3 py-3 rounded-xl border text-sm text-[#052413] placeholder:text-[#856C42]/40 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20 resize-y"
              style={{ fontFamily: F, backgroundColor: "#F7F4EE", borderColor: "rgba(133,108,66,0.2)", lineHeight: 1.7 }}
            />
          )}
          <p className="text-[0.65rem] text-[#856C42] mt-1.5" style={{ fontFamily: F }}>
            {activeTab === "html"
              ? "Dica: use HTML inline styles para melhor compatibilidade com clientes de e-mail."
              : "Dica: o texto simples é gerado automaticamente do HTML se deixado em branco."}
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl text-sm border cursor-pointer"
            style={{ fontFamily: F, borderColor: "rgba(133,108,66,0.2)", color: "#856C42" }}
          >
            Cancelar
          </button>
          <button
            onClick={() => onSave({ name, subject, html, text })}
            disabled={saving || !name.trim() || !subject.trim() || !html.trim()}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-[#052413] cursor-pointer disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, #EBBF74, #D4AF5A)", fontFamily: F }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            Salvar rascunho
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showPreview && <PreviewModal html={html} subject={subject} onClose={() => setShowPreview(false)} />}
      </AnimatePresence>
    </>
  );
}

// ── Campaign Card ──────────────────────────────────────────────────────────────
function CampaignCard({ campaign, onEdit, onDelete, onSend, onPreview }: {
  campaign: EmailCampaign;
  onEdit: () => void; onDelete: () => void;
  onSend: () => void; onPreview: () => void;
}) {
  const sent = campaign.status === "sent";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border p-5 flex flex-col sm:flex-row sm:items-center gap-4"
      style={{ backgroundColor: "#FFFDF8", borderColor: "rgba(133,108,66,0.15)" }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: sent ? "rgba(22,91,54,0.1)" : "rgba(235,191,116,0.15)" }}
      >
        {sent ? <CheckCircle className="w-5 h-5 text-[#165B36]" /> : <Clock className="w-5 h-5 text-[#856C42]" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-[#052413] truncate" style={{ fontFamily: F }}>{campaign.name}</p>
          <span
            className="text-[0.6rem] px-2 py-0.5 rounded-full font-medium"
            style={{
              fontFamily: F,
              background: sent ? "rgba(22,91,54,0.1)" : "rgba(235,191,116,0.2)",
              color: sent ? "#165B36" : "#856C42",
            }}
          >
            {sent ? "Enviada" : "Rascunho"}
          </span>
        </div>
        <p className="text-xs text-[#856C42] mt-0.5 truncate" style={{ fontFamily: F }}>
          Assunto: {campaign.subject}
        </p>
        <div className="flex items-center gap-4 mt-1.5">
          <span className="text-[0.65rem] text-[#856C42]/70" style={{ fontFamily: F }}>
            Criada {formatDate(campaign.createdAt)}
          </span>
          {sent && campaign.sentAt && (
            <span className="text-[0.65rem] text-[#165B36]" style={{ fontFamily: F }}>
              Enviada {formatDate(campaign.sentAt)} · {campaign.sentCount} destinatários
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          onClick={onPreview}
          className="p-2 rounded-lg text-[#856C42] hover:text-[#052413] hover:bg-[#F0E8D4] transition-colors cursor-pointer"
          title="Pré-visualizar"
        >
          <Eye className="w-4 h-4" />
        </button>
        {!sent && (
          <button
            onClick={onEdit}
            className="p-2 rounded-lg text-[#856C42] hover:text-[#052413] hover:bg-[#F0E8D4] transition-colors cursor-pointer"
            title="Editar"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={onDelete}
          className="p-2 rounded-lg text-[#856C42] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
          title="Excluir"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        {!sent && (
          <button
            onClick={onSend}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium text-white transition-all cursor-pointer ml-1"
            style={{ background: "linear-gradient(135deg, #165B36, #052413)", fontFamily: F }}
          >
            <Send className="w-3.5 h-3.5" /> Enviar
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ── Default HTML template ──────────────────────────────────────────────────────
const DEFAULT_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F7F4EE;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F4EE;padding:32px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#FFFDF8;border-radius:16px;overflow:hidden;border:1px solid rgba(133,108,66,0.15)">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#052413,#165B36);padding:32px;text-align:center">
            <h1 style="margin:0;color:#EBBF74;font-size:26px;font-family:Georgia,serif">Época Editora de Livros</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.7);font-size:13px">Histórias que transformam, palavras que ficam</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px">
            <h2 style="margin:0 0 16px;color:#052413;font-size:20px;font-family:Georgia,serif">Olá, leitor!</h2>
            <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.7">
              Escreva aqui o conteúdo principal da sua campanha. Este é um template inicial — personalize à vontade!
            </p>
            <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.7">
              Apresente novidades, lançamentos, promoções ou qualquer mensagem que queira compartilhar com seus leitores.
            </p>
            <!-- CTA Button -->
            <table cellpadding="0" cellspacing="0" style="margin:0 auto">
              <tr>
                <td style="background:linear-gradient(135deg,#EBBF74,#D4AF5A);border-radius:50px;padding:14px 32px">
                  <a href="https://editoraepoca.com.br" style="color:#052413;text-decoration:none;font-weight:bold;font-size:14px">
                    Explorar Catálogo →
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#F0E8D4;padding:20px 32px;text-align:center;border-top:1px solid rgba(133,108,66,0.15)">
            <p style="margin:0;color:#856C42;font-size:11px;line-height:1.6">
              Você recebe este e-mail por estar inscrito na newsletter da Época Editora de Livros.<br>
              <a href="https://editoraepoca.com.br" style="color:#165B36;text-decoration:none">editoraepoca.com.br</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

// ── Main Component ─────────────────────────────────────────────────────────────
export function AdminEmailMarketing() {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "new" | "edit">("list");
  const [editTarget, setEditTarget] = useState<EmailCampaign | null>(null);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [confirmSend, setConfirmSend] = useState<EmailCampaign | null>(null);
  const [previewCampaign, setPreviewCampaign] = useState<EmailCampaign | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "draft" | "sent">("all");

  useEffect(() => {
    Promise.all([getAdminEmailCampaigns(), getAdminSubscribers()])
      .then(([c, s]) => {
        setCampaigns(c.campaigns || []);
        setSubscriberCount((s.subscribers || []).filter((sub: any) => !sub.unsubscribed).length);
      })
      .catch(() => toast.error("Erro ao carregar campanhas"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(data: { name: string; subject: string; html: string; text: string }) {
    setSaving(true);
    try {
      if (editTarget) {
        const res = await updateAdminEmailCampaign(editTarget.id, data);
        setCampaigns((prev) => prev.map((c) => c.id === editTarget.id ? res.campaign : c));
        toast.success("Campanha atualizada!");
      } else {
        const res = await createAdminEmailCampaign(data);
        setCampaigns((prev) => [res.campaign, ...prev]);
        toast.success("Campanha criada!");
      }
      setView("list");
      setEditTarget(null);
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Excluir esta campanha permanentemente?")) return;
    try {
      await deleteAdminEmailCampaign(id);
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
      toast.success("Campanha excluída.");
    } catch (e: any) {
      toast.error(e.message || "Erro ao excluir");
    }
  }

  async function handleSend() {
    if (!confirmSend) return;
    setSending(true);
    try {
      const res = await sendAdminEmailCampaign(confirmSend.id);
      setCampaigns((prev) =>
        prev.map((c) => c.id === confirmSend.id ? { ...c, status: "sent", sentCount: res.sentCount, sentAt: new Date().toISOString() } : c)
      );
      toast.success(`Campanha enviada para ${res.sentCount} destinatários!`);
      if (res.errorCount > 0) toast.error(`${res.errorCount} e-mail(s) falharam. Verifique os logs.`);
      setConfirmSend(null);
    } catch (e: any) {
      toast.error(e.message || "Erro ao enviar campanha");
    } finally {
      setSending(false);
    }
  }

  const filtered = campaigns.filter((c) => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.subject.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || c.status === filter;
    return matchSearch && matchFilter;
  });

  const draftCount = campaigns.filter((c) => c.status === "draft").length;
  const sentCount = campaigns.filter((c) => c.status === "sent").length;
  const totalSent = campaigns.reduce((sum, c) => sum + (c.sentCount || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#165B36" }} />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        {view === "list" && (
          <>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-[#052413]" style={{ fontFamily: F }}>
                  Email Marketing
                </h1>
                <p className="text-sm text-[#856C42] mt-1" style={{ fontFamily: F }}>
                  Crie e envie campanhas para os inscritos da newsletter.
                </p>
              </div>
              <button
                onClick={() => { setEditTarget(null); setView("new"); }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-[#052413] cursor-pointer"
                style={{ background: "linear-gradient(135deg, #EBBF74, #D4AF5A)", fontFamily: F }}
              >
                <Plus className="w-4 h-4" /> Nova campanha
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Inscritos", value: subscriberCount, icon: Users, color: "#165B36", bg: "rgba(22,91,54,0.08)" },
                { label: "Rascunhos", value: draftCount, icon: Clock, color: "#856C42", bg: "rgba(133,108,66,0.1)" },
                { label: "Enviadas", value: sentCount, icon: CheckCircle, color: "#165B36", bg: "rgba(22,91,54,0.08)" },
                { label: "E-mails enviados", value: totalSent, icon: BarChart2, color: "#EBBF74", bg: "rgba(235,191,116,0.15)" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl p-4 border"
                  style={{ backgroundColor: "#FFFDF8", borderColor: "rgba(133,108,66,0.15)" }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-[#856C42]" style={{ fontFamily: F }}>{stat.label}</span>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: stat.bg }}>
                      <stat.icon className="w-3.5 h-3.5" style={{ color: stat.color }} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-[#052413]" style={{ fontFamily: F }}>{stat.value}</p>
                </div>
              ))}
            </div>

            {/* No SMTP warning */}
            {subscriberCount === 0 && (
              <div
                className="rounded-2xl p-4 border flex gap-3"
                style={{ backgroundColor: "rgba(235,191,116,0.07)", borderColor: "rgba(235,191,116,0.25)" }}
              >
                <AlertTriangle className="w-4 h-4 text-[#856C42] flex-shrink-0 mt-0.5" />
                <p className="text-xs text-[#856C42]" style={{ fontFamily: F }}>
                  Nenhum inscrito encontrado. Aguarde inscrições pela newsletter do site, ou verifique as configurações SMTP em{" "}
                  <strong>E-mail → Configurações SMTP</strong> antes de enviar campanhas.
                </p>
              </div>
            )}

            {/* Search + Filter */}
            {campaigns.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#856C42]/50" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar campanha..."
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm text-[#052413] placeholder:text-[#856C42]/40 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20"
                    style={{ fontFamily: F, backgroundColor: "#FFFDF8", borderColor: "rgba(133,108,66,0.15)" }}
                  />
                </div>
                <div className="flex rounded-xl p-1" style={{ backgroundColor: "#F0E8D4" }}>
                  {([["all", "Todas"], ["draft", "Rascunhos"], ["sent", "Enviadas"]] as const).map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => setFilter(val)}
                      className="px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer"
                      style={{
                        fontFamily: F,
                        backgroundColor: filter === val ? "#FFFDF8" : "transparent",
                        color: filter === val ? "#052413" : "#856C42",
                        fontWeight: filter === val ? 500 : 400,
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Campaign list */}
            {filtered.length === 0 ? (
              <div
                className="rounded-2xl border p-12 text-center"
                style={{ backgroundColor: "#FFFDF8", borderColor: "rgba(133,108,66,0.15)" }}
              >
                <Mail className="w-10 h-10 mx-auto mb-3" style={{ color: "rgba(133,108,66,0.3)" }} />
                <p className="text-sm text-[#856C42]" style={{ fontFamily: F }}>
                  {campaigns.length === 0 ? "Nenhuma campanha criada ainda." : "Nenhuma campanha encontrada."}
                </p>
                {campaigns.length === 0 && (
                  <button
                    onClick={() => { setEditTarget(null); setView("new"); }}
                    className="mt-4 inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium text-[#052413] cursor-pointer"
                    style={{ background: "linear-gradient(135deg, #EBBF74, #D4AF5A)", fontFamily: F }}
                  >
                    <Plus className="w-4 h-4" /> Criar primeira campanha
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((campaign) => (
                  <CampaignCard
                    key={campaign.id}
                    campaign={campaign}
                    onEdit={() => { setEditTarget(campaign); setView("edit"); }}
                    onDelete={() => handleDelete(campaign.id)}
                    onSend={() => setConfirmSend(campaign)}
                    onPreview={() => setPreviewCampaign(campaign)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {(view === "new" || view === "edit") && (
          <div
            className="rounded-2xl p-6 border"
            style={{ backgroundColor: "#FFFDF8", borderColor: "rgba(133,108,66,0.15)" }}
          >
            <CampaignEditor
              initial={editTarget || undefined}
              onSave={handleSave}
              onCancel={() => { setView("list"); setEditTarget(null); }}
              saving={saving}
            />
          </div>
        )}
      </div>

      <AnimatePresence>
        {confirmSend && (
          <ConfirmSend
            campaign={confirmSend}
            subscriberCount={subscriberCount}
            onConfirm={handleSend}
            onCancel={() => !sending && setConfirmSend(null)}
            sending={sending}
          />
        )}
        {previewCampaign && (
          <PreviewModal
            html={previewCampaign.html}
            subject={previewCampaign.subject}
            onClose={() => setPreviewCampaign(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
