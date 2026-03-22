import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  Inbox, RefreshCw, Loader2, Trash2, Reply, ChevronLeft,
  Mail, MailOpen, Paperclip, AlertCircle, MailX,
} from "lucide-react";
import { getAdminInbox, getAdminEmail, deleteAdminEmail } from "../../data/api";
import { toast } from "sonner";

interface EmailSummary {
  uid: number;
  subject: string;
  from: { name: string; address: string };
  date: string;
  seen: boolean;
  answered: boolean;
}

interface EmailDetail {
  uid: number;
  subject: string;
  from: { name: string; address: string } | null;
  to: { name: string; address: string }[];
  cc: { name: string; address: string }[];
  date: string;
  text: string;
  html: string;
  attachments: { filename: string; contentType: string; size: number }[];
}

interface InboxData {
  messages: EmailSummary[];
  total: number;
  unseen: number;
  page: number;
  pages: number;
}

function formatDate(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const isThisYear = d.getFullYear() === now.getFullYear();
  if (isThisYear) return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function AdminInbox() {
  const navigate = useNavigate();
  const [inbox, setInbox] = useState<InboxData | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState("");
  const [selectedUid, setSelectedUid] = useState<number | null>(null);
  const [detail, setDetail] = useState<EmailDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "detail">("list");

  const fetchList = useCallback(async (page = 1) => {
    setLoadingList(true);
    setListError("");
    try {
      const data = await getAdminInbox(page);
      setInbox(data);
    } catch (e: any) {
      setListError(e.message || "Erro ao carregar caixa de entrada");
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => { fetchList(1); }, [fetchList]);

  async function openEmail(uid: number) {
    setSelectedUid(uid);
    setDetail(null);
    setLoadingDetail(true);
    setMobileView("detail");
    // Optimistically mark as read
    setInbox((prev) => prev ? {
      ...prev,
      messages: prev.messages.map((m) => m.uid === uid ? { ...m, seen: true } : m),
      unseen: Math.max(0, prev.unseen - (prev.messages.find((m) => m.uid === uid && !m.seen) ? 1 : 0)),
    } : prev);
    try {
      const data = await getAdminEmail(uid);
      setDetail(data);
    } catch (e: any) {
      toast.error(`Erro ao abrir e-mail: ${e.message}`);
      setLoadingDetail(false);
    } finally {
      setLoadingDetail(false);
    }
  }

  async function handleDelete(uid: number) {
    if (!confirm("Excluir esta mensagem permanentemente?")) return;
    setDeleting(true);
    try {
      await deleteAdminEmail(uid);
      setInbox((prev) => prev ? { ...prev, messages: prev.messages.filter((m) => m.uid !== uid), total: prev.total - 1 } : prev);
      setSelectedUid(null);
      setDetail(null);
      setMobileView("list");
      toast.success("Mensagem excluída.");
    } catch (e: any) {
      toast.error(`Erro: ${e.message}`);
    } finally {
      setDeleting(false);
    }
  }

  function handleReply() {
    if (!detail) return;
    const to = detail.from?.address || "";
    const subject = detail.subject.startsWith("Re:") ? detail.subject : `Re: ${detail.subject}`;
    navigate(`/admin/compor-email?to=${encodeURIComponent(to)}&subject=${encodeURIComponent(subject)}`);
  }

  const selectedMsg = inbox?.messages.find((m) => m.uid === selectedUid);

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-[#052413]">Caixa de Entrada</h1>
          {inbox && inbox.unseen > 0 && (
            <span
              className="px-2.5 py-0.5 rounded-full text-xs font-bold"
              style={{ background: "#165B36", color: "#EBBF74" }}
            >
              {inbox.unseen} não lida{inbox.unseen !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <button
          onClick={() => fetchList(inbox?.page || 1)}
          disabled={loadingList}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-[#856C42] hover:text-[#052413] border transition-colors cursor-pointer disabled:opacity-50"
          style={{ borderColor: "rgba(133,108,66,0.2)", backgroundColor: "#FFFDF8" }}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingList ? "animate-spin" : ""}`} />
          Atualizar
        </button>
      </div>

      {/* Error */}
      {listError && (
        <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: "rgba(220,38,38,0.07)", borderColor: "rgba(220,38,38,0.15)", border: "1px solid" }}>
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-600">Erro ao carregar caixa de entrada</p>
            <p className="text-xs text-red-500 mt-0.5">{listError}</p>
            <p className="text-xs text-[#856C42] mt-2">
              Verifique se o SMTP está configurado e se o servidor suporta IMAP na porta 993.
              Em cPanel, o servidor IMAP é o mesmo que o SMTP.
            </p>
          </div>
        </div>
      )}

      {/* Main pane */}
      {!listError && (
        <div
          className="flex rounded-2xl border overflow-hidden"
          style={{ backgroundColor: "#FFFDF8", borderColor: "rgba(133,108,66,0.15)", minHeight: "520px" }}
        >
          {/* Email list — hidden on mobile when reading */}
          <div
            className={`flex flex-col border-r ${mobileView === "detail" ? "hidden md:flex" : "flex"}`}
            style={{ width: "320px", minWidth: "320px", borderColor: "rgba(133,108,66,0.1)", flexShrink: 0 }}
          >
            {/* List header */}
            <div
              className="px-4 py-3 border-b flex items-center justify-between"
              style={{ borderColor: "rgba(133,108,66,0.1)", backgroundColor: "#F7F4EE" }}
            >
              <span className="text-xs font-medium text-[#856C42] uppercase tracking-wider">
                {loadingList ? "Carregando…" : `${inbox?.total ?? 0} mensagem${(inbox?.total ?? 0) !== 1 ? "s" : ""}`}
              </span>
            </div>

            {/* Loading skeleton */}
            {loadingList && (
              <div className="flex-1 p-3 space-y-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-16 rounded-lg animate-pulse" style={{ backgroundColor: "rgba(133,108,66,0.08)" }} />
                ))}
              </div>
            )}

            {/* Empty state */}
            {!loadingList && inbox?.messages.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
                <MailX className="w-10 h-10 text-[#856C42]/30" />
                <p className="text-sm text-[#856C42]">Caixa de entrada vazia</p>
              </div>
            )}

            {/* Email rows */}
            {!loadingList && (inbox?.messages || []).map((msg) => (
              <button
                key={msg.uid}
                onClick={() => openEmail(msg.uid)}
                className="w-full text-left px-4 py-3 border-b transition-colors cursor-pointer"
                style={{
                  borderColor: "rgba(133,108,66,0.07)",
                  backgroundColor: selectedUid === msg.uid
                    ? "rgba(22,91,54,0.07)"
                    : msg.seen ? "transparent" : "rgba(235,191,116,0.06)",
                }}
              >
                <div className="flex items-start gap-2">
                  {!msg.seen && (
                    <span className="mt-1.5 flex-shrink-0 w-2 h-2 rounded-full" style={{ background: "#165B36" }} />
                  )}
                  {msg.seen && <span className="mt-1.5 flex-shrink-0 w-2 h-2" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="text-xs truncate"
                        style={{ fontWeight: msg.seen ? 400 : 700, color: msg.seen ? "#856C42" : "#052413" }}
                      >
                        {msg.from.name || msg.from.address}
                      </span>
                      <span className="text-[0.65rem] text-[#856C42]/60 flex-shrink-0">{formatDate(msg.date)}</span>
                    </div>
                    <p
                      className="text-xs truncate mt-0.5"
                      style={{ fontWeight: msg.seen ? 400 : 600, color: msg.seen ? "#374151" : "#052413" }}
                    >
                      {msg.subject}
                    </p>
                  </div>
                </div>
              </button>
            ))}

            {/* Pagination */}
            {inbox && inbox.pages > 1 && (
              <div className="flex items-center justify-center gap-2 p-3 border-t" style={{ borderColor: "rgba(133,108,66,0.1)" }}>
                {inbox.page > 1 && (
                  <button onClick={() => fetchList(inbox.page - 1)} className="px-3 py-1.5 rounded-lg text-xs text-[#856C42] hover:text-[#052413] border cursor-pointer" style={{ borderColor: "rgba(133,108,66,0.2)" }}>
                    ← Anterior
                  </button>
                )}
                <span className="text-xs text-[#856C42]">{inbox.page} / {inbox.pages}</span>
                {inbox.page < inbox.pages && (
                  <button onClick={() => fetchList(inbox.page + 1)} className="px-3 py-1.5 rounded-lg text-xs text-[#856C42] hover:text-[#052413] border cursor-pointer" style={{ borderColor: "rgba(133,108,66,0.2)" }}>
                    Próxima →
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Email detail */}
          <div className={`flex-1 flex flex-col min-w-0 ${mobileView === "list" ? "hidden md:flex" : "flex"}`}>
            {/* Mobile back */}
            <button
              onClick={() => setMobileView("list")}
              className="md:hidden flex items-center gap-1.5 px-4 py-3 text-xs text-[#856C42] border-b cursor-pointer"
              style={{ borderColor: "rgba(133,108,66,0.1)", backgroundColor: "#F7F4EE" }}
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Voltar
            </button>

            {/* No email selected */}
            {!selectedUid && (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
                <Inbox className="w-12 h-12 text-[#856C42]/20" />
                <p className="text-sm text-[#856C42]/60">Selecione uma mensagem para ler</p>
              </div>
            )}

            {/* Loading detail */}
            {selectedUid && loadingDetail && (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-[#165B36]" />
              </div>
            )}

            {/* Email content */}
            {selectedUid && !loadingDetail && detail && (
              <div className="flex-1 flex flex-col overflow-auto">
                {/* Email header */}
                <div className="px-6 py-5 border-b space-y-3" style={{ borderColor: "rgba(133,108,66,0.1)" }}>
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="text-base font-semibold text-[#052413] leading-snug">{detail.subject}</h2>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={handleReply}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer"
                        style={{ borderColor: "rgba(22,91,54,0.3)", color: "#165B36", backgroundColor: "rgba(22,91,54,0.05)" }}
                      >
                        <Reply className="w-3.5 h-3.5" /> Responder
                      </button>
                      <button
                        onClick={() => handleDelete(detail.uid)}
                        disabled={deleting}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer disabled:opacity-50"
                        style={{ borderColor: "rgba(220,38,38,0.2)", color: "#dc2626", backgroundColor: "rgba(220,38,38,0.04)" }}
                      >
                        {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        Excluir
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    {detail.from && (
                      <div className="flex items-center gap-2">
                        <span className="text-[0.7rem] font-medium text-[#856C42] w-10">De:</span>
                        <span className="text-xs text-[#374151]">
                          {detail.from.name ? `${detail.from.name} <${detail.from.address}>` : detail.from.address}
                        </span>
                      </div>
                    )}
                    {detail.to.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-[0.7rem] font-medium text-[#856C42] w-10">Para:</span>
                        <span className="text-xs text-[#374151]">{detail.to.map((t) => t.address).join(", ")}</span>
                      </div>
                    )}
                    {detail.cc.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-[0.7rem] font-medium text-[#856C42] w-10">CC:</span>
                        <span className="text-xs text-[#374151]">{detail.cc.map((t) => t.address).join(", ")}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-[0.7rem] font-medium text-[#856C42] w-10">Data:</span>
                      <span className="text-xs text-[#856C42]">
                        {detail.date ? new Date(detail.date).toLocaleString("pt-BR") : ""}
                      </span>
                    </div>
                  </div>

                  {detail.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {detail.attachments.map((att, i) => (
                        <span key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.65rem]" style={{ background: "rgba(133,108,66,0.1)", color: "#856C42" }}>
                          <Paperclip className="w-3 h-3" />
                          {att.filename} ({formatBytes(att.size)})
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Body */}
                <div className="flex-1 p-6">
                  {detail.html ? (
                    <iframe
                      srcDoc={detail.html}
                      sandbox="allow-same-origin"
                      className="w-full rounded-lg border"
                      style={{ minHeight: "400px", borderColor: "rgba(133,108,66,0.1)", background: "#fff" }}
                      onLoad={(e) => {
                        const iframe = e.currentTarget;
                        if (iframe.contentDocument) {
                          iframe.style.height = `${iframe.contentDocument.body.scrollHeight + 32}px`;
                        }
                      }}
                    />
                  ) : (
                    <pre className="text-sm text-[#374151] whitespace-pre-wrap font-sans leading-relaxed">
                      {detail.text || "(mensagem vazia)"}
                    </pre>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* IMAP info box */}
      <div
        className="rounded-xl px-4 py-3 flex items-start gap-2.5"
        style={{ backgroundColor: "rgba(235,191,116,0.07)", borderColor: "rgba(235,191,116,0.2)", border: "1px solid" }}
      >
        <Mail className="w-4 h-4 text-[#856C42] flex-shrink-0 mt-0.5" />
        <p className="text-[0.7rem] text-[#856C42] leading-relaxed">
          A caixa de entrada usa <strong>IMAP</strong> com as mesmas credenciais do SMTP configurado.
          Porta padrão: <strong>993 (SSL)</strong>. Em cPanel, o servidor IMAP é o mesmo do SMTP.
        </p>
      </div>
    </div>
  );
}
