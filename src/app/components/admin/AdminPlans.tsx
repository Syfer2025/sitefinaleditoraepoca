import { useState, useEffect } from "react";
import { Plus, Trash2, Save, Loader2, X, DollarSign, ChevronUp, ChevronDown, LayoutList, ToggleLeft, ToggleRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getPlans, updateAdminPlans, type ServicesCard } from "../../data/api";
import { toast } from "sonner";

const F = "Inter, sans-serif";

interface Plan {
  id: string;
  name: string;
  description: string;
  price: string;
  featured: boolean;
  features: string[];
}

const DEFAULT_SERVICES_CARD: ServicesCard = {
  active: false,
  title: "Nossos Serviços Editoriais",
  subtitle: "Tudo que você precisa para publicar seu livro com qualidade e profissionalismo.",
  services: [
    "Revisão ortográfica e gramatical",
    "Revisão literária e de estilo",
    "Diagramação e design profissional",
    "Criação de capa personalizada",
    "Registro de ISBN",
    "Distribuição digital (e-book)",
    "Distribuição física em livrarias",
    "Assessoria de marketing editorial",
    "Sessão de lançamento",
    "Consultoria de carreira autoral",
  ],
};

const DEFAULT_PLANS: Plan[] = [
  { id: "essencial", name: "Essencial", description: "Ideal para quem está publicando pela primeira vez.", price: "4.990", featured: false, features: ["Revisão ortográfica e gramatical", "Diagramação profissional", "Capa com design exclusivo", "ISBN e registro", "10 exemplares impressos", "Publicação em e-book"] },
  { id: "profissional", name: "Profissional", description: "Para autores que buscam maior visibilidade e qualidade.", price: "7.490", featured: true, features: ["Tudo do plano Essencial", "Revisão literária aprofundada", "30 exemplares impressos", "Divulgação em redes sociais", "Lançamento virtual", "Distribuição nacional em livrarias"] },
  { id: "premium", name: "Premium", description: "Experiência completa para projetos editoriais ambiciosos.", price: "9.490", featured: false, features: ["Tudo do plano Profissional", "Editor dedicado ao projeto", "Capa ilustrada sob medida", "100 exemplares impressos", "Campanha de marketing completa", "Presença em feiras literárias", "Book trailer promocional", "Audiobook (narração profissional)", "Consultoria de carreira autoral"] },
];

export function AdminPlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [servicesCard, setServicesCard] = useState<ServicesCard>(DEFAULT_SERVICES_CARD);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [newFeature, setNewFeature] = useState<Record<string, string>>({});
  const [newService, setNewService] = useState("");

  useEffect(() => {
    getPlans()
      .then((data) => {
        if (Array.isArray(data?.plans) && data.plans.length > 0) setPlans(data.plans);
        else setPlans(DEFAULT_PLANS);
        if (data?.servicesCard) setServicesCard(data.servicesCard);
      })
      .catch(() => setPlans(DEFAULT_PLANS))
      .finally(() => setLoading(false));
  }, []);

  function updateServicesCard(key: keyof ServicesCard, value: any) {
    setServicesCard((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  }

  function addService() {
    const text = newService.trim();
    if (!text) return;
    setServicesCard((prev) => ({ ...prev, services: [...prev.services, text] }));
    setNewService("");
    setDirty(true);
  }

  function removeService(idx: number) {
    setServicesCard((prev) => ({ ...prev, services: prev.services.filter((_, i) => i !== idx) }));
    setDirty(true);
  }

  function moveService(idx: number, dir: -1 | 1) {
    setServicesCard((prev) => {
      const s = [...prev.services];
      const target = idx + dir;
      if (target < 0 || target >= s.length) return prev;
      [s[idx], s[target]] = [s[target], s[idx]];
      return { ...prev, services: s };
    });
    setDirty(true);
  }

  function update(id: string, key: keyof Plan, value: any) {
    setPlans((prev) => prev.map((p) => p.id === id ? { ...p, [key]: value } : p));
    setDirty(true);
  }

  function toggleFeatured(id: string) {
    setPlans((prev) => prev.map((p) => p.id === id ? { ...p, featured: !p.featured } : p));
    setDirty(true);
  }

  function addPlan() {
    const newPlan: Plan = {
      id: `plano-${Date.now()}`,
      name: "Novo Plano",
      description: "",
      price: "0",
      featured: false,
      features: [],
    };
    setPlans((prev) => [...prev, newPlan]);
    setDirty(true);
  }

  function removePlan(id: string) {
    if (!confirm("Excluir este plano?")) return;
    setPlans((prev) => prev.filter((p) => p.id !== id));
    setDirty(true);
  }

  function addFeature(planId: string) {
    const text = (newFeature[planId] || "").trim();
    if (!text) return;
    setPlans((prev) => prev.map((p) => p.id === planId ? { ...p, features: [...p.features, text] } : p));
    setNewFeature((prev) => ({ ...prev, [planId]: "" }));
    setDirty(true);
  }

  function removeFeature(planId: string, idx: number) {
    setPlans((prev) => prev.map((p) => p.id === planId ? { ...p, features: p.features.filter((_, i) => i !== idx) } : p));
    setDirty(true);
  }

  function moveFeature(planId: string, idx: number, dir: -1 | 1) {
    setPlans((prev) => prev.map((p) => {
      if (p.id !== planId) return p;
      const f = [...p.features];
      const target = idx + dir;
      if (target < 0 || target >= f.length) return p;
      [f[idx], f[target]] = [f[target], f[idx]];
      return { ...p, features: f };
    }));
    setDirty(true);
  }

  async function handleSave() {
    for (const p of plans) {
      if (!p.name.trim()) {
        toast.error("Todos os planos precisam ter um nome.");
        return;
      }
    }
    setSaving(true);
    try {
      await updateAdminPlans(plans, servicesCard);
      toast.success("Planos atualizados!");
      setDirty(false);
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-[#165B36]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900" style={{ fontFamily: F }}>Planos de Preço</h1>
          <p className="text-sm text-gray-500 mt-1" style={{ fontFamily: F }}>
            Edite os planos exibidos na seção de preços do site
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={addPlan}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-[#165B36] bg-[#165B36]/5 hover:bg-[#165B36]/10 transition-colors cursor-pointer"
            style={{ fontFamily: F }}
          >
            <Plus className="w-4 h-4" /> Adicionar plano
          </button>
          <button
            onClick={handleSave}
            disabled={!dirty || saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              fontFamily: F,
              background: dirty ? "linear-gradient(135deg, #EBBF74, #D4AF5A)" : "#d1d5db",
              color: dirty ? "#052413" : "#9ca3af",
            }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </div>

      {/* Unsaved banner */}
      <AnimatePresence>
        {dirty && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-xl p-3 border flex items-center gap-2"
            style={{ backgroundColor: "rgba(235,191,116,0.1)", borderColor: "rgba(235,191,116,0.4)" }}
          >
            <span className="w-2 h-2 rounded-full bg-[#EBBF74] animate-pulse" />
            <p className="text-xs text-[#856C42]" style={{ fontFamily: F }}>
              Alterações não salvas — clique em "Salvar alterações" para publicar no site.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Services Card Editor */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ borderColor: servicesCard.active ? "#165B36" : "rgba(0,0,0,0.08)", boxShadow: servicesCard.active ? "0 4px 24px rgba(22,91,54,0.12)" : "0 2px 8px rgba(0,0,0,0.04)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ background: servicesCard.active ? "linear-gradient(90deg,#052413,#165B36)" : "rgba(0,0,0,0.03)" }}
        >
          <div className="flex items-center gap-2">
            <LayoutList className="w-4 h-4" style={{ color: servicesCard.active ? "#EBBF74" : "#9ca3af" }} />
            <span className="text-sm font-semibold" style={{ fontFamily: F, color: servicesCard.active ? "#EBBF74" : "#6b7280" }}>
              Card de Serviços Editoriais
            </span>
            <span className="text-[0.65rem] px-2 py-0.5 rounded-full" style={{ fontFamily: F, background: servicesCard.active ? "rgba(235,191,116,0.2)" : "rgba(0,0,0,0.06)", color: servicesCard.active ? "#EBBF74" : "#9ca3af" }}>
              {servicesCard.active ? "Ativo no site" : "Oculto no site"}
            </span>
          </div>
          <button
            onClick={() => updateServicesCard("active", !servicesCard.active)}
            className="flex items-center gap-1.5 text-sm font-medium cursor-pointer transition-colors"
            style={{ fontFamily: F, color: servicesCard.active ? "#EBBF74" : "#9ca3af" }}
          >
            {servicesCard.active
              ? <ToggleRight className="w-6 h-6" style={{ color: "#EBBF74" }} />
              : <ToggleLeft className="w-6 h-6" style={{ color: "#9ca3af" }} />
            }
            {servicesCard.active ? "Desativar" : "Ativar"}
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[0.7rem] font-medium text-gray-400 uppercase tracking-wider mb-1 block" style={{ fontFamily: F }}>Título</label>
              <input
                value={servicesCard.title}
                onChange={(e) => updateServicesCard("title", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20 focus:border-[#165B36]/40"
                style={{ fontFamily: "'Playfair Display', serif" }}
              />
            </div>
            <div>
              <label className="text-[0.7rem] font-medium text-gray-400 uppercase tracking-wider mb-1 block" style={{ fontFamily: F }}>Subtítulo</label>
              <input
                value={servicesCard.subtitle}
                onChange={(e) => updateServicesCard("subtitle", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20 focus:border-[#165B36]/40"
                style={{ fontFamily: F }}
              />
            </div>
          </div>

          <div>
            <label className="text-[0.7rem] font-medium text-gray-400 uppercase tracking-wider mb-2 block" style={{ fontFamily: F }}>
              Serviços listados ({servicesCard.services.length})
            </label>
            <div className="grid sm:grid-cols-2 gap-1 mb-2 max-h-56 overflow-y-auto pr-1">
              {servicesCard.services.map((svc, i) => (
                <div key={i} className="flex items-center gap-1.5 group">
                  <div className="flex flex-col">
                    <button onClick={() => moveService(i, -1)} disabled={i === 0} className="text-gray-300 hover:text-gray-500 disabled:opacity-20 cursor-pointer leading-none">
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <button onClick={() => moveService(i, 1)} disabled={i === servicesCard.services.length - 1} className="text-gray-300 hover:text-gray-500 disabled:opacity-20 cursor-pointer leading-none">
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>
                  <input
                    value={svc}
                    onChange={(e) => {
                      const next = [...servicesCard.services];
                      next[i] = e.target.value;
                      updateServicesCard("services", next);
                    }}
                    className="flex-1 px-2 py-1 rounded border border-gray-200 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#165B36]/20"
                    style={{ fontFamily: F }}
                  />
                  <button onClick={() => removeService(i)} className="p-0.5 text-gray-300 hover:text-red-400 transition-colors cursor-pointer opacity-0 group-hover:opacity-100">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-1.5">
              <input
                value={newService}
                onChange={(e) => setNewService(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addService()}
                placeholder="Novo serviço..."
                className="flex-1 px-2 py-1.5 rounded-lg border border-dashed border-gray-300 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#165B36]/20 focus:border-[#165B36]/40"
                style={{ fontFamily: F }}
              />
              <button onClick={addService} className="p-1.5 rounded-lg bg-[#165B36]/5 text-[#165B36] hover:bg-[#165B36]/10 transition-colors cursor-pointer">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Plans */}
      <div className="grid md:grid-cols-3 gap-5">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="rounded-2xl border overflow-hidden"
            style={{
              borderColor: plan.featured ? "#EBBF74" : "rgba(0,0,0,0.08)",
              boxShadow: plan.featured ? "0 4px 24px rgba(235,191,116,0.2)" : "0 2px 8px rgba(0,0,0,0.04)",
            }}
          >
            {/* Featured badge strip */}
            <div
              className="flex items-center justify-between px-4 py-2.5"
              style={{
                background: plan.featured
                  ? "linear-gradient(90deg,#8B6914,#D4AF5A,#8B6914)"
                  : "rgba(0,0,0,0.03)",
              }}
            >
              <span
                className="text-[0.7rem] font-semibold tracking-wider uppercase"
                style={{ color: plan.featured ? "#1a1206" : "#9ca3af", fontFamily: F }}
              >
                {plan.featured ? "★ Mais popular" : "Plano"}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => toggleFeatured(plan.id)}
                  className="text-[0.65rem] px-2 py-0.5 rounded-full border transition-colors cursor-pointer"
                  style={{
                    fontFamily: F,
                    borderColor: plan.featured ? "rgba(26,18,6,0.3)" : "rgba(0,0,0,0.12)",
                    color: plan.featured ? "#1a1206" : "#9ca3af",
                    background: plan.featured ? "rgba(26,18,6,0.08)" : "transparent",
                  }}
                >
                  {plan.featured ? "Destaque ativo" : "Marcar destaque"}
                </button>
                <button
                  onClick={() => removePlan(plan.id)}
                  className="p-0.5 text-gray-300 hover:text-red-400 transition-colors cursor-pointer"
                  title="Excluir plano"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Name */}
              <div>
                <label className="text-[0.7rem] font-medium text-gray-400 uppercase tracking-wider mb-1 block" style={{ fontFamily: F }}>Nome do plano</label>
                <input
                  value={plan.name}
                  onChange={(e) => update(plan.id, "name", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20 focus:border-[#165B36]/40"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                />
              </div>

              {/* Price */}
              <div>
                <label className="text-[0.7rem] font-medium text-gray-400 uppercase tracking-wider mb-1 block" style={{ fontFamily: F }}>Preço (R$) <span className="normal-case tracking-normal text-gray-300">— opcional</span></label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    value={plan.price}
                    onChange={(e) => update(plan.id, "price", e.target.value)}
                    placeholder="Deixe em branco para ocultar"
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20 focus:border-[#165B36]/40"
                    style={{ fontFamily: F }}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-[0.7rem] font-medium text-gray-400 uppercase tracking-wider mb-1 block" style={{ fontFamily: F }}>Descrição</label>
                <textarea
                  value={plan.description}
                  onChange={(e) => update(plan.id, "description", e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20 focus:border-[#165B36]/40 resize-none"
                  style={{ fontFamily: F }}
                />
              </div>

              {/* Features */}
              <div>
                <label className="text-[0.7rem] font-medium text-gray-400 uppercase tracking-wider mb-2 block" style={{ fontFamily: F }}>
                  Itens incluídos ({plan.features.length})
                </label>
                <div className="space-y-1 mb-2 max-h-48 overflow-y-auto pr-1">
                  {plan.features.map((feat, i) => (
                    <div key={i} className="flex items-center gap-1.5 group">
                      <div className="flex flex-col">
                        <button onClick={() => moveFeature(plan.id, i, -1)} disabled={i === 0} className="text-gray-300 hover:text-gray-500 disabled:opacity-20 cursor-pointer leading-none">
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button onClick={() => moveFeature(plan.id, i, 1)} disabled={i === plan.features.length - 1} className="text-gray-300 hover:text-gray-500 disabled:opacity-20 cursor-pointer leading-none">
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </div>
                      <input
                        value={feat}
                        onChange={(e) => {
                          const next = [...plan.features];
                          next[i] = e.target.value;
                          update(plan.id, "features", next);
                        }}
                        className="flex-1 px-2 py-1 rounded border border-gray-200 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#165B36]/20"
                        style={{ fontFamily: F }}
                      />
                      <button
                        onClick={() => removeFeature(plan.id, i)}
                        className="p-0.5 text-gray-300 hover:text-red-400 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-1.5">
                  <input
                    value={newFeature[plan.id] || ""}
                    onChange={(e) => setNewFeature((prev) => ({ ...prev, [plan.id]: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && addFeature(plan.id)}
                    placeholder="Novo item..."
                    className="flex-1 px-2 py-1.5 rounded-lg border border-dashed border-gray-300 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#165B36]/20 focus:border-[#165B36]/40"
                    style={{ fontFamily: F }}
                  />
                  <button
                    onClick={() => addFeature(plan.id)}
                    className="p-1.5 rounded-lg bg-[#165B36]/5 text-[#165B36] hover:bg-[#165B36]/10 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
