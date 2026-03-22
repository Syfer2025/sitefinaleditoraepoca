import { useState, useEffect } from "react";
import {
  Save, Loader2, CheckCircle, XCircle, Eye, EyeOff,
  Send, Server, Lock, User, Mail, AtSign, RefreshCw, ShieldCheck, AlertTriangle,
} from "lucide-react";
import { getAdminEmailConfig, updateAdminEmailConfig, testAdminEmailConfig } from "../../data/api";
import { toast } from "sonner";


const ENCRYPTION_OPTIONS = [
  { value: "none",  label: "Nenhum (porta 25)",  desc: "Sem criptografia — não recomendado" },
  { value: "tls",   label: "STARTTLS (porta 587)", desc: "Criptografia na negociação — recomendado" },
  { value: "ssl",   label: "SSL/TLS (porta 465)",  desc: "Criptografia desde a conexão" },
];

const PROVIDER_PRESETS: Record<string, { host: string; port: string; encryption: string }> = {
  "Gmail":        { host: "smtp.gmail.com",         port: "587", encryption: "tls" },
  "Outlook/Hotmail": { host: "smtp.office365.com",  port: "587", encryption: "tls" },
  "Zoho Mail":    { host: "smtp.zoho.com",           port: "587", encryption: "tls" },
  "cPanel/Hosting": { host: "mail.seudominio.com.br", port: "587", encryption: "tls" },
  "Mailtrap":     { host: "sandbox.smtp.mailtrap.io", port: "2525", encryption: "none" },
};

interface Config {
  host: string; port: string; encryption: string;
  user: string; password: string;
  from_name: string; from_email: string; reply_to: string;
  configured: boolean;
}

const EMPTY: Config = {
  host: "", port: "587", encryption: "tls",
  user: "", password: "",
  from_name: "", from_email: "", reply_to: "",
  configured: false,
};

export function AdminEmailConfig() {
  const [cfg, setCfg] = useState<Config>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testTo, setTestTo] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [testResult, setTestResult] = useState<"ok" | "fail" | null>(null);
  const [testError, setTestError] = useState("");

  useEffect(() => {
    getAdminEmailConfig()
      .then((data) => setCfg({ ...EMPTY, ...data.config }))
      .catch(() => toast.error("Erro ao carregar configurações de e-mail"))
      .finally(() => setLoading(false));
  }, []);

  function set(field: keyof Config, value: string) {
    setCfg((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
    setTestResult(null);
  }

  function applyPreset(name: string) {
    const p = PROVIDER_PRESETS[name];
    if (!p) return;
    setCfg((prev) => ({ ...prev, host: p.host, port: p.port, encryption: p.encryption }));
    setDirty(true);
    setTestResult(null);
  }

  async function handleSave() {
    if (!cfg.host.trim() || !cfg.user.trim()) {
      toast.error("Servidor e usuário são obrigatórios.");
      return;
    }
    setSaving(true);
    try {
      await updateAdminEmailConfig({
        host: cfg.host.trim(),
        port: cfg.port.trim() || "587",
        encryption: cfg.encryption,
        user: cfg.user.trim(),
        password: cfg.password,
        from_name: cfg.from_name.trim(),
        from_email: cfg.from_email.trim(),
        reply_to: cfg.reply_to.trim(),
      });
      toast.success("Configurações de e-mail salvas!");
      setDirty(false);
      // Reload to get fresh masked password
      const data = await getAdminEmailConfig();
      setCfg({ ...EMPTY, ...data.config });
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    if (!cfg.configured && !dirty) {
      toast.error("Configure e salve o SMTP antes de testar.");
      return;
    }
    setTesting(true);
    setTestResult(null);
    setTestError("");
    try {
      await testAdminEmailConfig(testTo || undefined);
      setTestResult("ok");
      toast.success("E-mail de teste enviado com sucesso!");
    } catch (e: any) {
      setTestResult("fail");
      const msg = e.message || "Falha no envio";
      setTestError(msg);
      toast.error(`Falha: ${msg}`);
    } finally {
      setTesting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#165B36" }} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#052413]">
            Configurações de E-mail
          </h1>
          <p className="text-sm text-[#856C42] mt-1">
            Configure o servidor SMTP para envio de e-mails transacionais e campanhas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {cfg.configured && (
            <span
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full"
              style={{ background: "rgba(22,91,54,0.1)", color: "#165B36" }}
            >
              <CheckCircle className="w-3.5 h-3.5" /> Configurado
            </span>
          )}
        </div>
      </div>

      {/* Provider presets */}
      <div
        className="rounded-2xl p-5 border"
        style={{ backgroundColor: "#FFFDF8", borderColor: "rgba(133,108,66,0.15)" }}
      >
        <p className="text-xs font-medium text-[#856C42] mb-3 uppercase tracking-wider">
          Atalhos de configuração
        </p>
        <div className="flex flex-wrap gap-2">
          {Object.keys(PROVIDER_PRESETS).map((name) => (
            <button
              key={name}
              onClick={() => applyPreset(name)}
              className="px-3 py-1.5 rounded-lg text-xs border transition-all hover:shadow-sm cursor-pointer"
              style={{ borderColor: "rgba(133,108,66,0.2)", color: "#856C42", backgroundColor: "#F7F4EE" }}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* SMTP Settings */}
      <div
        className="rounded-2xl p-6 border space-y-5"
        style={{ backgroundColor: "#FFFDF8", borderColor: "rgba(133,108,66,0.15)" }}
      >
        <div className="flex items-center gap-2 mb-1">
          <Server className="w-4 h-4 text-[#165B36]" />
          <h2 className="text-sm font-semibold text-[#052413]">
            Servidor SMTP
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Host */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-[#052413] mb-1.5">
              Servidor (host)
            </label>
            <input
              type="text"
              value={cfg.host}
              onChange={(e) => set("host", e.target.value)}
              placeholder="smtp.seudominio.com.br"
              className="w-full px-3 py-2.5 rounded-lg border text-sm text-[#052413] placeholder:text-[#856C42]/40 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20"
              style={{ backgroundColor: "#F0E8D4", borderColor: "rgba(133,108,66,0.2)" }}
            />
          </div>
          {/* Port */}
          <div>
            <label className="block text-xs font-medium text-[#052413] mb-1.5">
              Porta
            </label>
            <input
              type="text"
              value={cfg.port}
              onChange={(e) => set("port", e.target.value)}
              placeholder="587"
              className="w-full px-3 py-2.5 rounded-lg border text-sm text-[#052413] placeholder:text-[#856C42]/40 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20"
              style={{ backgroundColor: "#F0E8D4", borderColor: "rgba(133,108,66,0.2)" }}
            />
          </div>
        </div>

        {/* Encryption */}
        <div>
          <label className="block text-xs font-medium text-[#052413] mb-2">
            Criptografia
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {ENCRYPTION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { set("encryption", opt.value); if (opt.value === "ssl") set("port", "465"); else if (opt.value === "tls") set("port", "587"); else set("port", "25"); }}
                className="flex flex-col items-start p-3 rounded-xl border transition-all cursor-pointer text-left"
                style={{
                  borderColor: cfg.encryption === opt.value ? "#165B36" : "rgba(133,108,66,0.2)",
                  backgroundColor: cfg.encryption === opt.value ? "rgba(22,91,54,0.06)" : "#F7F4EE",
                }}
              >
                <span className="text-xs font-medium" style={{ color: cfg.encryption === opt.value ? "#165B36" : "#052413" }}>
                  {opt.label}
                </span>
                <span className="text-[0.65rem] text-[#856C42] mt-0.5">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Auth */}
        <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: "rgba(133,108,66,0.1)" }}>
          <Lock className="w-4 h-4 text-[#165B36]" />
          <h3 className="text-xs font-semibold text-[#052413]">Autenticação</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* User */}
          <div>
            <label className="block text-xs font-medium text-[#052413] mb-1.5">
              <span className="flex items-center gap-1"><User className="w-3 h-3" /> Usuário / E-mail</span>
            </label>
            <input
              type="text"
              value={cfg.user}
              onChange={(e) => set("user", e.target.value)}
              placeholder="noreply@seudominio.com.br"
              className="w-full px-3 py-2.5 rounded-lg border text-sm text-[#052413] placeholder:text-[#856C42]/40 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20"
              style={{ backgroundColor: "#F0E8D4", borderColor: "rgba(133,108,66,0.2)" }}
            />
          </div>
          {/* Password */}
          <div>
            <label className="block text-xs font-medium text-[#052413] mb-1.5">
              Senha
            </label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={cfg.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder={cfg.configured ? "••••••••••••••••" : "Senha do e-mail"}
                className="w-full px-3 py-2.5 pr-10 rounded-lg border text-sm text-[#052413] placeholder:text-[#856C42]/40 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20"
                style={{ backgroundColor: "#F0E8D4", borderColor: "rgba(133,108,66,0.2)" }}
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#856C42] hover:text-[#052413] cursor-pointer"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sender Identity */}
      <div
        className="rounded-2xl p-6 border space-y-4"
        style={{ backgroundColor: "#FFFDF8", borderColor: "rgba(133,108,66,0.15)" }}
      >
        <div className="flex items-center gap-2 mb-1">
          <Mail className="w-4 h-4 text-[#165B36]" />
          <h2 className="text-sm font-semibold text-[#052413]">
            Identidade do Remetente
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#052413] mb-1.5">
              Nome do remetente
            </label>
            <input
              type="text"
              value={cfg.from_name}
              onChange={(e) => set("from_name", e.target.value)}
              placeholder="Época Editora de Livros"
              className="w-full px-3 py-2.5 rounded-lg border text-sm text-[#052413] placeholder:text-[#856C42]/40 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20"
              style={{ backgroundColor: "#F0E8D4", borderColor: "rgba(133,108,66,0.2)" }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#052413] mb-1.5">
              E-mail do remetente (From)
            </label>
            <input
              type="email"
              value={cfg.from_email}
              onChange={(e) => set("from_email", e.target.value)}
              placeholder="noreply@editoraepoca.com.br"
              className="w-full px-3 py-2.5 rounded-lg border text-sm text-[#052413] placeholder:text-[#856C42]/40 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20"
              style={{ backgroundColor: "#F0E8D4", borderColor: "rgba(133,108,66,0.2)" }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#052413] mb-1.5">
              <span className="flex items-center gap-1"><AtSign className="w-3 h-3" /> Reply-To (opcional)</span>
            </label>
            <input
              type="email"
              value={cfg.reply_to}
              onChange={(e) => set("reply_to", e.target.value)}
              placeholder="contato@editoraepoca.com.br"
              className="w-full px-3 py-2.5 rounded-lg border text-sm text-[#052413] placeholder:text-[#856C42]/40 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20"
              style={{ backgroundColor: "#F0E8D4", borderColor: "rgba(133,108,66,0.2)" }}
            />
          </div>
        </div>
      </div>

      {/* Test */}
      <div
        className="rounded-2xl p-6 border space-y-4"
        style={{ backgroundColor: "#FFFDF8", borderColor: "rgba(133,108,66,0.15)" }}
      >
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-4 h-4 text-[#165B36]" />
          <h2 className="text-sm font-semibold text-[#052413]">
            Testar Configuração
          </h2>
        </div>
        <p className="text-xs text-[#856C42]">
          Salve as configurações antes de testar. Um e-mail será enviado para o endereço abaixo.
        </p>
        <div className="flex gap-3">
          <input
            type="email"
            value={testTo}
            onChange={(e) => setTestTo(e.target.value)}
            placeholder="seuemail@teste.com (opcional — usa o e-mail admin)"
            className="flex-1 px-3 py-2.5 rounded-lg border text-sm text-[#052413] placeholder:text-[#856C42]/40 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20"
            style={{ backgroundColor: "#F0E8D4", borderColor: "rgba(133,108,66,0.2)" }}
          />
          <button
            onClick={handleTest}
            disabled={testing}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-50 cursor-pointer"
            style={{ background: "linear-gradient(135deg, #165B36, #052413)" }}
          >
            {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Enviar teste
          </button>
        </div>

        {testResult === "ok" && (
          <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: "rgba(22,91,54,0.08)" }}>
            <CheckCircle className="w-4 h-4 text-[#165B36] flex-shrink-0" />
            <p className="text-xs text-[#165B36]">E-mail de teste enviado com sucesso!</p>
          </div>
        )}
        {testResult === "fail" && (
          <div className="flex items-start gap-2 p-3 rounded-xl" style={{ background: "rgba(220,38,38,0.06)" }}>
            <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-red-600">Falha no envio</p>
              <p className="text-[0.65rem] text-red-500 mt-0.5">{testError}</p>
            </div>
          </div>
        )}
      </div>

      {/* Info box */}
      <div
        className="rounded-2xl p-4 border flex gap-3"
        style={{ backgroundColor: "rgba(235,191,116,0.07)", borderColor: "rgba(235,191,116,0.25)" }}
      >
        <AlertTriangle className="w-4 h-4 text-[#856C42] flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-xs font-medium text-[#052413]">
            Gmail — Configuração especial
          </p>
          <p className="text-[0.68rem] text-[#856C42]">
            Para Gmail, gere uma <strong>Senha de App</strong> em Conta Google → Segurança → Verificação em duas etapas → Senhas de app. Não use sua senha normal.
          </p>
          <p className="text-[0.68rem] text-[#856C42] mt-1">
            Para hospedagem cPanel, use o endereço de e-mail completo como usuário e a senha da caixa postal.
          </p>
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving || !dirty}
          className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold text-[#052413] transition-all disabled:opacity-40 cursor-pointer"
          style={{
            background: dirty ? "linear-gradient(135deg, #EBBF74, #D4AF5A)" : "rgba(133,108,66,0.15)",
          }}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Salvando..." : "Salvar configurações"}
        </button>
      </div>
    </div>
  );
}
