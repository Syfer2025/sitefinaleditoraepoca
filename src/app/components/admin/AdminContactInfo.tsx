import { useState, useEffect } from "react";
import { Save, Loader2, RefreshCw, CheckCircle, Phone, Mail, MapPin, MessageCircle, Map } from "lucide-react";
import { getContactInfo, updateAdminContactInfo, type ContactInfo } from "../../data/api";
import { toast } from "sonner";


const EMPTY: ContactInfo = {
  phone: "",
  address: "",
  city: "",
  email: "",
  whatsapp: "",
  mapUrl: "",
};

function Field({
  label,
  value,
  onChange,
  placeholder,
  icon: Icon,
  type = "text",
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  icon: React.ElementType;
  type?: string;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#052413] mb-1.5">
        {label}
      </label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#856C42]/50 pointer-events-none" />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm text-[#052413] placeholder:text-[#856C42]/40 focus:outline-none focus:ring-2 transition-all"
          style={{
            backgroundColor: "#FFFDF8",
            border: "1px solid rgba(133,108,66,0.2)",
          }}
        />
      </div>
      {hint && (
        <p className="mt-1 text-[0.68rem] text-[#856C42]/60">
          {hint}
        </p>
      )}
    </div>
  );
}

export function AdminContactInfo() {
  const [form, setForm] = useState<ContactInfo>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getContactInfo()
      .then((info) => setForm({ ...EMPTY, ...info }))
      .catch(() => toast.error("Erro ao carregar informações de contato"))
      .finally(() => setLoading(false));
  }, []);

  function set(key: keyof ContactInfo, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateAdminContactInfo(form);
      setDirty(false);
      setSaved(true);
      toast.success("Informações de contato atualizadas!");
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      toast.error(err?.message || "Erro ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
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
        <h1 className="text-xl font-semibold text-[#052413] font-serif">
          Informações de Contato
        </h1>
        <p className="text-sm text-[#856C42] mt-0.5">
          Dados exibidos na seção de contato do site e usados no botão de WhatsApp.
        </p>
      </div>

      {/* Form card */}
      <div
        className="rounded-2xl p-6 space-y-5 shadow-sm"
        style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(133,108,66,0.12)" }}
      >
        <div className="grid sm:grid-cols-2 gap-5">
          <Field
            label="Telefone"
            value={form.phone}
            onChange={(v) => set("phone", v)}
            placeholder="(44) 3456-7890"
            icon={Phone}
            hint="Exibido no site. Formato livre."
          />
          <Field
            label="E-mail de contato"
            value={form.email}
            onChange={(v) => set("email", v)}
            placeholder="contato@epocaeditora.com.br"
            icon={Mail}
            type="email"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <Field
            label="Endereço"
            value={form.address}
            onChange={(v) => set("address", v)}
            placeholder="Rua das Letras, 420"
            icon={MapPin}
          />
          <Field
            label="Cidade / UF"
            value={form.city}
            onChange={(v) => set("city", v)}
            placeholder="Maringa, PR - Brasil"
            icon={MapPin}
          />
        </div>

        <Field
          label="Número do WhatsApp"
          value={form.whatsapp}
          onChange={(v) => set("whatsapp", v)}
          placeholder="5544999999999"
          icon={MessageCircle}
          hint="Somente dígitos com DDI e DDD. Ex: 5544999999999. Usado no botão flutuante do site."
        />

        <Field
          label="URL do mapa (opcional)"
          value={form.mapUrl}
          onChange={(v) => set("mapUrl", v)}
          placeholder="https://maps.google.com/..."
          icon={Map}
          hint="Link do Google Maps ou similar para incorporar ou redirecionar."
        />
      </div>

      {/* Save */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            setLoading(true);
            getContactInfo()
              .then((info) => { setForm({ ...EMPTY, ...info }); setDirty(false); })
              .catch(() => toast.error("Erro ao recarregar"))
              .finally(() => setLoading(false));
          }}
          className="flex items-center gap-1.5 text-sm text-[#856C42] hover:text-[#165B36] transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Recarregar
        </button>

        <button
          onClick={handleSave}
          disabled={saving || !dirty}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: saved ? "#165B36" : "#165B36" }}
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? "Salvando..." : saved ? "Salvo!" : "Salvar alterações"}
        </button>
      </div>
    </div>
  );
}
