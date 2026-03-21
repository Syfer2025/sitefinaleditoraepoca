import { useState, useEffect } from "react";
import {
  Save,
  Loader2,
  RefreshCw,
  CheckCircle,
  BarChart2,
  Megaphone,
  ShoppingBag,
  MapPin,
  Search,
  Info,
  Phone,
  Clock,
  Hash,
} from "lucide-react";
import { getTrackingSettings, saveTrackingSettings, type TrackingSettings } from "../../data/trackingService";
import { toast } from "sonner";

const F = "Inter, sans-serif";

const EMPTY: TrackingSettings = {
  ga4_id: "",
  google_ads_id: "",
  search_console_id: "",
  merchant_center_id: "",
  merchant_verification_id: "",
  business_name: "",
  business_address: "",
  business_city: "",
  business_state: "",
  business_zip: "",
  business_phone: "",
  business_hours: "",
};

function Field({
  label,
  value,
  onChange,
  placeholder,
  icon: Icon,
  hint,
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  icon: React.ElementType;
  hint?: string;
  mono?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#052413] mb-1.5" style={{ fontFamily: F }}>
        {label}
      </label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#856C42]/50 pointer-events-none" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm text-[#052413] placeholder:text-[#856C42]/40 focus:outline-none focus:ring-2 transition-all"
          style={{
            fontFamily: mono ? "monospace" : F,
            backgroundColor: "#FFFDF8",
            border: "1px solid rgba(133,108,66,0.2)",
            letterSpacing: mono ? "0.03em" : undefined,
          }}
        />
      </div>
      {hint && (
        <p className="mt-1 text-[0.68rem] text-[#856C42]/60" style={{ fontFamily: F }}>
          {hint}
        </p>
      )}
    </div>
  );
}

function SectionCard({
  icon: Icon,
  title,
  description,
  badge,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden shadow-sm"
      style={{ border: "1px solid rgba(133,108,66,0.12)" }}
    >
      <div
        className="px-5 py-4 flex items-start gap-3"
        style={{ backgroundColor: "#052413" }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #EBBF74, #D4AF5A)" }}
        >
          <Icon className="w-4 h-4 text-[#052413]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
              {title}
            </p>
            {badge && (
              <span
                className="text-[0.6rem] font-semibold px-2 py-0.5 rounded-full text-[#052413]"
                style={{ background: "linear-gradient(135deg, #EBBF74, #D4AF5A)" }}
              >
                {badge}
              </span>
            )}
          </div>
          <p className="text-[0.7rem] text-white/50 mt-0.5" style={{ fontFamily: F }}>
            {description}
          </p>
        </div>
      </div>
      <div className="p-5 space-y-4 bg-white">{children}</div>
    </div>
  );
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex items-start gap-2 p-3 rounded-xl text-[0.7rem] text-[#856C42]"
      style={{ fontFamily: F, backgroundColor: "rgba(235,191,116,0.08)", border: "1px solid rgba(235,191,116,0.2)" }}
    >
      <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-[#EBBF74]" />
      <span>{children}</span>
    </div>
  );
}

export function AdminTracking() {
  const [form, setForm] = useState<TrackingSettings>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getTrackingSettings()
      .then((data) => setForm({ ...EMPTY, ...data }))
      .catch(() => toast.error("Erro ao carregar configurações de rastreamento"))
      .finally(() => setLoading(false));
  }, []);

  function set(key: keyof TrackingSettings, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveTrackingSettings(form);
      setDirty(false);
      setSaved(true);
      toast.success("Integrações salvas com sucesso!");
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar. Tente novamente.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleReload() {
    setLoading(true);
    getTrackingSettings()
      .then((data) => { setForm({ ...EMPTY, ...data }); setDirty(false); })
      .catch(() => toast.error("Erro ao recarregar"))
      .finally(() => setLoading(false));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-[#165B36]" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-[#052413]" style={{ fontFamily: "'Playfair Display', serif" }}>
          Integrações & Rastreamento
        </h1>
        <p className="text-sm text-[#856C42] mt-0.5" style={{ fontFamily: F }}>
          Configure Google Analytics, Ads, Merchant Center e Meu Negócio. Os scripts são ativados automaticamente conforme o consentimento de cookies do usuário.
        </p>
      </div>

      {/* GA4 */}
      <SectionCard
        icon={BarChart2}
        title="Google Analytics 4"
        description="Acompanhe visitantes, sessões e comportamento no site"
        badge="Recomendado"
      >
        <InfoBox>
          Acesse <strong>analytics.google.com</strong> → Admin → Fluxos de dados → seu site → copie o ID de medição.
        </InfoBox>
        <Field
          label="ID de Medição (GA4)"
          value={form.ga4_id}
          onChange={(v) => set("ga4_id", v)}
          placeholder="G-XXXXXXXXXX"
          icon={BarChart2}
          hint="Formato: G-XXXXXXXXXX. Deixe vazio para desativar."
          mono
        />
      </SectionCard>

      {/* Google Ads */}
      <SectionCard
        icon={Megaphone}
        title="Google Ads"
        description="Rastreamento de conversões para suas campanhas pagas"
      >
        <InfoBox>
          Acesse <strong>ads.google.com</strong> → Ferramentas → Tag do Google → copie o ID de conversão.
        </InfoBox>
        <Field
          label="ID de Conversão (Google Ads)"
          value={form.google_ads_id}
          onChange={(v) => set("google_ads_id", v)}
          placeholder="AW-XXXXXXXXXX"
          icon={Megaphone}
          hint="Formato: AW-XXXXXXXXXX. Requer GA4 configurado acima."
          mono
        />
      </SectionCard>

      {/* Search Console */}
      <SectionCard
        icon={Search}
        title="Google Search Console"
        description="Verifique a propriedade do site e monitore o desempenho de busca"
      >
        <InfoBox>
          Acesse <strong>search.google.com/search-console</strong> → Adicionar propriedade → método de verificação "Tag HTML" → copie apenas o valor do atributo content da meta tag.
        </InfoBox>
        <Field
          label="Código de verificação"
          value={form.search_console_id}
          onChange={(v) => set("search_console_id", v)}
          placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
          icon={Search}
          hint='Apenas o valor do content, ex: "abcdef123456". Não a tag completa.'
          mono
        />
      </SectionCard>

      {/* Merchant Center */}
      <SectionCard
        icon={ShoppingBag}
        title="Google Merchant Center"
        description="Exiba seus livros no Google Shopping e anúncios de produto"
      >
        <InfoBox>
          Acesse <strong>merchants.google.com</strong> → Configurações → Verificação do site → copie o código de verificação HTML.
        </InfoBox>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field
            label="ID da conta Merchant Center"
            value={form.merchant_center_id}
            onChange={(v) => set("merchant_center_id", v)}
            placeholder="123456789"
            icon={Hash}
            hint="Número da conta, visível no topo do painel."
            mono
          />
          <Field
            label="Código de verificação"
            value={form.merchant_verification_id}
            onChange={(v) => set("merchant_verification_id", v)}
            placeholder="xxxxxxxxxxxxxxxx"
            icon={ShoppingBag}
            hint="Valor do content da meta tag de verificação."
            mono
          />
        </div>
      </SectionCard>

      {/* Google Meu Negócio */}
      <SectionCard
        icon={MapPin}
        title="Google Meu Negócio"
        description="Dados do negócio injetados como dados estruturados (Schema.org) para ajudar o Google a associar o site ao seu perfil de negócio"
      >
        <InfoBox>
          Preencha os dados do seu negócio. Eles são adicionados automaticamente como JSON-LD (LocalBusiness) no site — isso melhora a aparência nos resultados do Google e ajuda na integração com o Google Meu Negócio.
        </InfoBox>
        <Field
          label="Nome do negócio"
          value={form.business_name}
          onChange={(v) => set("business_name", v)}
          placeholder="Época Editora de Livros"
          icon={MapPin}
        />
        <div className="grid sm:grid-cols-2 gap-4">
          <Field
            label="Telefone"
            value={form.business_phone}
            onChange={(v) => set("business_phone", v)}
            placeholder="+55 44 3456-7890"
            icon={Phone}
          />
          <Field
            label="Horário de funcionamento"
            value={form.business_hours}
            onChange={(v) => set("business_hours", v)}
            placeholder="Mo-Fr 08:00-18:00"
            icon={Clock}
            hint="Formato Schema.org. Ex: Mo-Fr 09:00-18:00"
          />
        </div>
        <Field
          label="Endereço (rua e número)"
          value={form.business_address}
          onChange={(v) => set("business_address", v)}
          placeholder="Rua das Letras, 420"
          icon={MapPin}
        />
        <div className="grid sm:grid-cols-3 gap-4">
          <Field
            label="Cidade"
            value={form.business_city}
            onChange={(v) => set("business_city", v)}
            placeholder="Maringá"
            icon={MapPin}
          />
          <Field
            label="Estado (UF)"
            value={form.business_state}
            onChange={(v) => set("business_state", v)}
            placeholder="PR"
            icon={MapPin}
          />
          <Field
            label="CEP"
            value={form.business_zip}
            onChange={(v) => set("business_zip", v)}
            placeholder="87000-000"
            icon={MapPin}
            mono
          />
        </div>
      </SectionCard>

      {/* Actions */}
      <div className="flex items-center justify-between pb-4">
        <button
          onClick={handleReload}
          className="flex items-center gap-1.5 text-sm text-[#856C42] hover:text-[#165B36] transition-colors"
          style={{ fontFamily: F }}
        >
          <RefreshCw className="w-3.5 h-3.5" /> Recarregar
        </button>

        <button
          onClick={handleSave}
          disabled={saving || !dirty}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ fontFamily: F, backgroundColor: "#165B36" }}
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? "Salvando..." : saved ? "Salvo!" : "Salvar integrações"}
        </button>
      </div>
    </div>
  );
}
