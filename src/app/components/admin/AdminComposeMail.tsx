import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router";
import {
  Send, Loader2, CheckCircle, XCircle, Plus, X,
  Bold, Italic, AlignLeft, Link2, Eye, Pencil,
} from "lucide-react";
import { adminSendEmail, getAdminEmailSignature } from "../../data/api";
import { toast } from "sonner";

function TagInput({
  values,
  onChange,
  placeholder,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function add(raw: string) {
    const emails = raw
      .split(/[,;\s]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && !values.includes(e));
    if (emails.length) onChange([...values, ...emails]);
    setInput("");
  }

  function remove(email: string) {
    onChange(values.filter((v) => v !== email));
  }

  return (
    <div
      className="flex flex-wrap gap-1.5 px-3 py-2 rounded-lg border min-h-[44px] cursor-text"
      style={{ backgroundColor: "#F0E8D4", borderColor: "rgba(133,108,66,0.2)" }}
      onClick={() => inputRef.current?.focus()}
    >
      {values.map((email) => (
        <span
          key={email}
          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
          style={{ background: "rgba(22,91,54,0.1)", color: "#165B36" }}
        >
          {email}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); remove(email); }}
            className="text-[#165B36]/60 hover:text-red-500 cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (["Enter", ",", ";", " "].includes(e.key)) {
            e.preventDefault();
            add(input);
          } else if (e.key === "Backspace" && !input && values.length) {
            remove(values[values.length - 1]);
          }
        }}
        onBlur={() => { if (input.trim()) add(input); }}
        placeholder={values.length === 0 ? placeholder : ""}
        className="flex-1 min-w-[180px] bg-transparent text-sm text-[#052413] placeholder:text-[#856C42]/50 outline-none py-0.5"
      />
    </div>
  );
}

function fmt(cmd: string, value?: string) {
  document.execCommand(cmd, false, value);
}

export function AdminComposeMail() {
  const [searchParams] = useSearchParams();
  const [to, setTo] = useState<string[]>(() => {
    const t = searchParams.get("to");
    return t ? [t] : [];
  });
  const [subject, setSubject] = useState(() => searchParams.get("subject") || "");
  const [replyTo, setReplyTo] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<"ok" | "fail" | null>(null);
  const [resultMsg, setResultMsg] = useState("");
  const [mode, setMode] = useState<"write" | "preview">("write");
  const editorRef = useRef<HTMLDivElement>(null);
  const [sigName, setSigName] = useState("Época Editora de Livros");
  const [sigTagline, setSigTagline] = useState("Editorial · Publicação · Literatura");
  const [sigExtra, setSigExtra] = useState("");
  const [sigShowLogo, setSigShowLogo] = useState(true);

  useEffect(() => {
    getAdminEmailSignature()
      .then((data) => {
        if (data.name) setSigName(data.name);
        if (data.tagline) setSigTagline(data.tagline);
        if (data.extra_line !== undefined) setSigExtra(data.extra_line);
        setSigShowLogo(data.show_logo !== false);
      })
      .catch(() => { /* use defaults */ });
  }, []);

  function getBodyText() {
    if (!editorRef.current) return "";
    return editorRef.current.innerText.trim();
  }

  function getBodyHtml() {
    if (!editorRef.current) return "";
    return editorRef.current.innerHTML;
  }

  // Build preview HTML (mirrors backend template)
  function previewHtml() {
    const body = getBodyHtml();
    const sigHtml = `
      <div style="margin-top:32px;padding-top:20px;border-top:1px solid #e5e7eb">
        <table cellpadding="0" cellspacing="0" style="border-collapse:collapse">
          <tr>
            ${sigShowLogo ? `<td style="padding-right:12px;vertical-align:middle"><img src="/assets/logo.png" alt="${sigName}" width="44" style="height:44px;width:auto;display:block"/></td>` : ""}
            <td style="padding-left:14px;border-left:3px solid #EBBF74;vertical-align:middle">
              <p style="margin:0;font-family:Georgia,serif;font-style:italic;font-size:15px;color:#052413;font-weight:bold">${sigName}</p>
              <p style="margin:2px 0 0;font-size:11px;color:#856C42;letter-spacing:0.05em">${sigTagline}</p>
              <a href="https://editoraepoca.com.br" style="font-size:11px;color:#165B36;text-decoration:none">editoraepoca.com.br</a>
              ${sigExtra ? `<p style="margin:2px 0 0;font-size:11px;color:#856C42">${sigExtra}</p>` : ""}
            </td>
          </tr>
        </table>
      </div>`;
    return `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#FFFDF8;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
        <div style="background:linear-gradient(135deg,#165B36,#052413);padding:24px;text-align:center">
          <img src="/assets/logo.png" alt="${sigName}" width="180" style="max-height:64px;max-width:180px;height:auto;display:block;margin:0 auto"/>
        </div>
        <div style="padding:32px 28px;font-size:14px;color:#374151;line-height:1.75">
          ${body || '<p style="color:#9ca3af;font-style:italic">Nenhum conteúdo ainda…</p>'}
          ${sigHtml}
        </div>
        <div style="background:#F0E8D4;padding:12px 24px;text-align:center;border-top:1px solid #e5e7eb">
          <p style="color:#9ca3af;font-size:10px;margin:0">${sigName} · <a href="https://editoraepoca.com.br" style="color:#165B36;text-decoration:none">editoraepoca.com.br</a></p>
        </div>
      </div>`;
  }

  async function handleSend() {
    if (to.length === 0) { toast.error("Adicione ao menos um destinatário."); return; }
    if (!subject.trim()) { toast.error("Informe o assunto."); return; }
    const body = getBodyText();
    if (!body) { toast.error("Escreva o conteúdo do e-mail."); return; }

    setSending(true);
    setResult(null);
    try {
      const data = await adminSendEmail({
        to,
        subject: subject.trim(),
        body: getBodyText(),
        replyTo: replyTo.trim() || undefined,
      });
      setResult("ok");
      setResultMsg(`Enviado para ${data.sent} destinatário${data.sent !== 1 ? "s" : ""}!`);
      toast.success("E-mail enviado com sucesso!");
    } catch (e: any) {
      setResult("fail");
      setResultMsg(e.message || "Falha no envio");
      toast.error(`Falha: ${e.message || "Erro desconhecido"}`);
    } finally {
      setSending(false);
    }
  }

  function reset() {
    setTo([]);
    setSubject("");
    setReplyTo("");
    setResult(null);
    setResultMsg("");
    if (editorRef.current) editorRef.current.innerHTML = "";
    setMode("write");
  }

  function addLink() {
    const url = prompt("URL do link:");
    if (url) fmt("createLink", url);
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[#052413]">Enviar E-mail</h1>
        <p className="text-sm text-[#856C42] mt-1">
          Compose e envie e-mails diretamente do painel, com assinatura e layout da editora.
        </p>
      </div>

      <div
        className="rounded-2xl border overflow-hidden"
        style={{ backgroundColor: "#FFFDF8", borderColor: "rgba(133,108,66,0.15)" }}
      >
        {/* Fields */}
        <div className="divide-y" style={{ borderColor: "rgba(133,108,66,0.1)" }}>
          {/* To */}
          <div className="flex items-start gap-3 px-5 py-3">
            <span className="text-xs font-medium text-[#856C42] pt-2.5 w-16 flex-shrink-0">Para</span>
            <div className="flex-1">
              <TagInput
                values={to}
                onChange={setTo}
                placeholder="email@destinatario.com — pressione Enter ou vírgula para adicionar"
              />
            </div>
          </div>

          {/* Reply-To */}
          <div className="flex items-center gap-3 px-5 py-3">
            <span className="text-xs font-medium text-[#856C42] w-16 flex-shrink-0">Responder</span>
            <input
              type="email"
              value={replyTo}
              onChange={(e) => setReplyTo(e.target.value)}
              placeholder="Opcional — padrão: remetente configurado"
              className="flex-1 bg-transparent text-sm text-[#052413] placeholder:text-[#856C42]/40 outline-none py-1"
            />
          </div>

          {/* Subject */}
          <div className="flex items-center gap-3 px-5 py-3">
            <span className="text-xs font-medium text-[#856C42] w-16 flex-shrink-0">Assunto</span>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Assunto do e-mail"
              className="flex-1 bg-transparent text-sm text-[#052413] placeholder:text-[#856C42]/40 outline-none py-1 font-medium"
            />
          </div>
        </div>

        {/* Toolbar */}
        <div
          className="flex items-center gap-1 px-4 py-2 border-y"
          style={{ backgroundColor: "#F7F4EE", borderColor: "rgba(133,108,66,0.1)" }}
        >
          <button onClick={() => fmt("bold")} title="Negrito" className="p-1.5 rounded hover:bg-[#165B36]/10 cursor-pointer transition-colors" style={{ color: "#856C42" }}><Bold className="w-3.5 h-3.5" /></button>
          <button onClick={() => fmt("italic")} title="Itálico" className="p-1.5 rounded hover:bg-[#165B36]/10 cursor-pointer transition-colors" style={{ color: "#856C42" }}><Italic className="w-3.5 h-3.5" /></button>
          <button onClick={() => fmt("insertUnorderedList")} title="Lista" className="p-1.5 rounded hover:bg-[#165B36]/10 cursor-pointer transition-colors" style={{ color: "#856C42" }}><AlignLeft className="w-3.5 h-3.5" /></button>
          <button onClick={addLink} title="Link" className="p-1.5 rounded hover:bg-[#165B36]/10 cursor-pointer transition-colors" style={{ color: "#856C42" }}><Link2 className="w-3.5 h-3.5" /></button>

          <div className="flex-1" />

          {/* Write / Preview toggle */}
          <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: "rgba(133,108,66,0.2)" }}>
            <button
              onClick={() => setMode("write")}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium transition-colors cursor-pointer"
              style={{
                background: mode === "write" ? "rgba(22,91,54,0.1)" : "transparent",
                color: mode === "write" ? "#165B36" : "#856C42",
              }}
            >
              <Pencil className="w-3 h-3" /> Editar
            </button>
            <button
              onClick={() => setMode("preview")}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium transition-colors cursor-pointer"
              style={{
                background: mode === "preview" ? "rgba(22,91,54,0.1)" : "transparent",
                color: mode === "preview" ? "#165B36" : "#856C42",
              }}
            >
              <Eye className="w-3 h-3" /> Prévia
            </button>
          </div>
        </div>

        {/* Editor — always mounted, hidden during preview to preserve content */}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          data-placeholder="Escreva sua mensagem aqui…"
          className="min-h-[260px] px-6 py-5 text-sm text-[#374151] outline-none leading-relaxed compose-editor"
          style={{ background: "#FFFDF8", display: mode === "write" ? "block" : "none" }}
        />

        {/* Preview */}
        {mode === "preview" && (
          <div className="p-6" style={{ background: "#F7F4EE" }}>
            <div
              className="rounded-xl overflow-hidden shadow-sm"
              dangerouslySetInnerHTML={{ __html: previewHtml() }}
            />
          </div>
        )}

        {/* Footer actions */}
        <div
          className="flex items-center justify-between gap-3 px-5 py-4 border-t"
          style={{ backgroundColor: "#F7F4EE", borderColor: "rgba(133,108,66,0.1)" }}
        >
          <button
            onClick={reset}
            className="text-xs text-[#856C42] hover:text-red-500 transition-colors cursor-pointer flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" /> Limpar
          </button>

          <div className="flex items-center gap-3">
            <span className="text-xs text-[#856C42]">
              {to.length > 0 ? `${to.length} destinatário${to.length !== 1 ? "s" : ""}` : "Nenhum destinatário"}
            </span>
            <button
              onClick={handleSend}
              disabled={sending || to.length === 0}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50 cursor-pointer"
              style={{ background: "linear-gradient(135deg, #165B36, #052413)", color: "#EBBF74" }}
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {sending ? "Enviando…" : "Enviar"}
            </button>
          </div>
        </div>
      </div>

      {/* Result */}
      {result === "ok" && (
        <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: "rgba(22,91,54,0.08)" }}>
          <CheckCircle className="w-5 h-5 text-[#165B36] flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-[#165B36]">{resultMsg}</p>
            <button onClick={reset} className="text-xs text-[#856C42] hover:text-[#052413] mt-1 underline cursor-pointer">
              Compor novo e-mail
            </button>
          </div>
        </div>
      )}
      {result === "fail" && (
        <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: "rgba(220,38,38,0.06)" }}>
          <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-600">Falha no envio</p>
            <p className="text-xs text-red-500 mt-0.5">{resultMsg}</p>
          </div>
        </div>
      )}

      {/* Signature preview */}
      <div
        className="rounded-2xl border p-5 space-y-3"
        style={{ backgroundColor: "#FFFDF8", borderColor: "rgba(133,108,66,0.15)" }}
      >
        <p className="text-xs font-medium text-[#856C42] uppercase tracking-wider">Assinatura automática</p>
        <div className="flex items-center gap-4">
          {sigShowLogo && (
            <img src="/assets/logo.png" alt={sigName} className="h-10 w-auto object-contain flex-shrink-0" />
          )}
          <div className="border-l-4 pl-3" style={{ borderColor: "#EBBF74" }}>
            <p className="font-serif italic font-bold text-[#052413]">{sigName}</p>
            <p className="text-xs text-[#856C42] mt-0.5">{sigTagline}</p>
            <a href="https://editoraepoca.com.br" className="text-xs text-[#165B36]" target="_blank" rel="noreferrer">editoraepoca.com.br</a>
            {sigExtra && <p className="text-xs text-[#856C42] mt-0.5">{sigExtra}</p>}
          </div>
        </div>
        <p className="text-[0.68rem] text-[#856C42]/70">
          Esta assinatura é adicionada automaticamente a todos os e-mails enviados pelo painel. Para editar, acesse <strong>Configurações de E-mail</strong>.
        </p>
      </div>
    </div>
  );
}
