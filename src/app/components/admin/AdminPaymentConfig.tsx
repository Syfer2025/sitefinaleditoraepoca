import { useState, useEffect } from "react";
import { Loader2, Save, RefreshCw, CheckCircle, XCircle, Eye, EyeOff, CreditCard, QrCode, FileText, ShieldCheck, AlertTriangle } from "lucide-react";
import { getAdminPaymentConfig, updateAdminPaymentConfig, testAdminPaymentConfig } from "../../data/api";
import { toast } from "sonner";


interface Methods { pix: boolean; credit_card: boolean; boleto: boolean; }
interface Config {
  configured: boolean;
  tokenSource: "kv" | "env" | "none";
  maskedToken: string;
  maskedKey: string;
  methods: Methods;
}
interface Account { id: number; email: string; nickname: string; site_id: string; country: string; }

const METHOD_INFO = [
  { key: "pix" as const, label: "PIX", desc: "Pagamento instantâneo, confirmação automática via webhook", icon: QrCode, color: "#165B36" },
  { key: "credit_card" as const, label: "Cartão de Crédito", desc: "Parcelamento em até 12x, tokenização segura via SDK", icon: CreditCard, color: "#856C42" },
  { key: "boleto" as const, label: "Boleto Bancário", desc: "Prazo de 1–3 dias úteis para compensação", icon: FileText, color: "#4a5568" },
];

export function AdminPaymentConfig() {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [account, setAccount] = useState<Account | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [methods, setMethods] = useState<Methods>({ pix: true, credit_card: true, boleto: true });
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    getAdminPaymentConfig()
      .then((data) => {
        setConfig(data);
        setAccessToken(data.maskedToken || "");
        setPublicKey(data.maskedKey || "");
        setMethods(data.methods || { pix: true, credit_card: true, boleto: true });
      })
      .catch(() => toast.error("Erro ao carregar configurações"))
      .finally(() => setLoading(false));
  }, []);

  async function handleTest() {
    setTesting(true);
    setAccount(null);
    setTestError(null);
    try {
      const res = await testAdminPaymentConfig();
      if (res.ok) {
        setAccount(res.account);
        toast.success("Conexão com Mercado Pago OK!");
      } else {
        setTestError(res.error || "Erro desconhecido");
        toast.error(`Falha na conexão: ${res.error}`);
      }
    } catch (e: any) {
      setTestError(e.message);
      toast.error("Erro ao testar conexão");
    } finally {
      setTesting(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload: any = { methods };
      if (accessToken && !accessToken.includes("•")) payload.access_token = accessToken;
      if (publicKey && !publicKey.includes("•")) payload.public_key = publicKey;
      await updateAdminPaymentConfig(payload);
      toast.success("Configurações salvas!");
      setDirty(false);
      // Reload to get updated masked values
      const data = await getAdminPaymentConfig();
      setConfig(data);
      setAccessToken(data.maskedToken || "");
      setPublicKey(data.maskedKey || "");
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-[#165B36]" />
    </div>
  );

  const isConfigured = config?.configured;

  return (
    <div className="space-y-6 max-w-3xl">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Pagamentos</h1>
        <p className="text-sm text-gray-500 mt-1">Gerencie a integração com o Mercado Pago</p>
      </div>

      {/* Status card */}
      <div
        className="rounded-2xl border p-5 flex items-start justify-between gap-4"
        style={{
          borderColor: isConfigured ? "rgba(22,91,54,0.25)" : "rgba(220,38,38,0.2)",
          background: isConfigured ? "rgba(22,91,54,0.04)" : "rgba(254,242,242,0.6)",
        }}
      >
        <div className="flex items-start gap-3">
          {isConfigured
            ? <CheckCircle className="w-5 h-5 text-[#165B36] mt-0.5 shrink-0" />
            : <XCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
          }
          <div>
            <p className="text-sm font-semibold" style={{ color: isConfigured ? "#165B36" : "#dc2626" }}>
              {isConfigured ? "Mercado Pago configurado" : "Credenciais não configuradas"}
            </p>
            <p className="text-xs mt-0.5" style={{ color: isConfigured ? "#856C42" : "#ef4444" }}>
              {isConfigured
                ? `Token via ${config?.tokenSource === "kv" ? "painel admin" : "variável de ambiente"}`
                : "Configure o Access Token e a Public Key abaixo para ativar os pagamentos"
              }
            </p>
          </div>
        </div>
        <button
          onClick={handleTest}
          disabled={testing || !isConfigured}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          style={{ background: "#165B36", color: "#EBBF74" }}
        >
          {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {testing ? "Testando..." : "Testar conexão"}
        </button>
      </div>

      {/* Account info after test */}
      {account && (
        <div className="rounded-xl border border-[#165B36]/20 bg-[#165B36]/5 p-4 flex items-center gap-4">
          <ShieldCheck className="w-8 h-8 text-[#165B36] shrink-0" />
          <div>
            <p className="text-sm font-semibold text-[#165B36]">Conta verificada com sucesso</p>
            <p className="text-xs text-[#856C42] mt-0.5">
              {account.nickname} · {account.email} · ID {account.id} · {account.site_id}
            </p>
          </div>
        </div>
      )}
      {testError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700">Falha na conexão</p>
            <p className="text-xs text-red-500 mt-0.5">{testError}</p>
          </div>
        </div>
      )}

      {/* Credentials */}
      <div className="rounded-2xl border border-gray-200 overflow-hidden" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-700">Credenciais Mercado Pago</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Encontre em <span className="font-medium text-gray-500">mercadopago.com.br → Configurações → Credenciais</span>
          </p>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-[0.7rem] font-medium text-gray-400 uppercase tracking-wider mb-1.5 block">
              Access Token <span className="normal-case tracking-normal text-gray-300">(começa com APP_USR- ou TEST-)</span>
            </label>
            <div className="relative">
              <input
                type={showToken ? "text" : "password"}
                value={accessToken}
                onChange={(e) => { setAccessToken(e.target.value); setDirty(true); }}
                placeholder="APP_USR-0000000000000000-000000-..."
                className="w-full px-3 py-2 pr-10 rounded-lg border border-gray-200 text-sm text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-[#165B36]/20 focus:border-[#165B36]/40"
                style={{ fontFamily: "monospace" }}
              />
              <button
                type="button"
                onClick={() => setShowToken((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-[0.7rem] font-medium text-gray-400 uppercase tracking-wider mb-1.5 block">
              Public Key <span className="normal-case tracking-normal text-gray-300">(usada no frontend para tokenizar cartão)</span>
            </label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={publicKey}
                onChange={(e) => { setPublicKey(e.target.value); setDirty(true); }}
                placeholder="APP_USR-00000000-0000-0000-..."
                className="w-full px-3 py-2 pr-10 rounded-lg border border-gray-200 text-sm text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-[#165B36]/20 focus:border-[#165B36]/40"
                style={{ fontFamily: "monospace" }}
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              onClick={handleSave}
              disabled={saving || !dirty}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: dirty ? "linear-gradient(135deg, #EBBF74, #D4AF5A)" : "#d1d5db", color: dirty ? "#052413" : "#9ca3af" }}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Salvando..." : "Salvar credenciais"}
            </button>
          </div>
        </div>
      </div>

      {/* Payment methods */}
      <div className="rounded-2xl border border-gray-200 overflow-hidden" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-700">Métodos de Pagamento</p>
          <p className="text-xs text-gray-400 mt-0.5">Ative ou desative métodos disponíveis na página de pagamento</p>
        </div>
        <div className="p-5 space-y-3">
          {METHOD_INFO.map(({ key, label, desc, icon: Icon, color }) => (
            <div
              key={key}
              className="flex items-center justify-between p-4 rounded-xl border transition-colors cursor-pointer"
              style={{
                borderColor: methods[key] ? `${color}30` : "rgba(0,0,0,0.07)",
                background: methods[key] ? `${color}06` : "transparent",
              }}
              onClick={() => { setMethods((m) => ({ ...m, [key]: !m[key] })); setDirty(true); }}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: methods[key] ? `${color}15` : "rgba(0,0,0,0.04)" }}>
                  <Icon className="w-4 h-4" style={{ color: methods[key] ? color : "#9ca3af" }} />
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: methods[key] ? "#111827" : "#9ca3af" }}>{label}</p>
                  <p className="text-xs" style={{ color: "#9ca3af" }}>{desc}</p>
                </div>
              </div>
              <div
                className="w-10 h-5 rounded-full relative transition-colors"
                style={{ background: methods[key] ? color : "#d1d5db" }}
              >
                <div
                  className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform"
                  style={{ transform: methods[key] ? "translateX(22px)" : "translateX(2px)" }}
                />
              </div>
            </div>
          ))}
          <div className="flex justify-end pt-1">
            <button
              onClick={handleSave}
              disabled={saving || !dirty}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: dirty ? "linear-gradient(135deg, #EBBF74, #D4AF5A)" : "#d1d5db", color: dirty ? "#052413" : "#9ca3af" }}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Salvando..." : "Salvar métodos"}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
