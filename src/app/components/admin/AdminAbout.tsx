import { useState, useEffect } from "react";
import { Save, Loader2, BookOpen, Award, Users, Globe, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getAbout, updateAdminAbout } from "../../data/api";
import { toast } from "sonner";


interface Stat {
  key: string;
  value: number;
  suffix: string;
  label: string;
}

interface AboutData {
  yearsOfHistory: number;
  stats: Stat[];
}

const ICON_MAP: Record<string, any> = {
  titulos: BookOpen,
  premios: Award,
  autores: Users,
  paises: Globe,
};

const DEFAULT: AboutData = {
  yearsOfHistory: 37,
  stats: [
    { key: "titulos", value: 500, suffix: "+", label: "Títulos publicados" },
    { key: "premios", value: 32, suffix: "", label: "Prêmios literários" },
    { key: "autores", value: 120, suffix: "+", label: "Autores parceiros" },
    { key: "paises", value: 15, suffix: "", label: "Países alcançados" },
  ],
};

export function AdminAbout() {
  const [about, setAbout] = useState<AboutData>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    getAbout()
      .then((data) => { if (data?.about) setAbout(data.about); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function updateStat(key: string, field: keyof Stat, value: any) {
    setAbout((prev) => ({
      ...prev,
      stats: prev.stats.map((s) => s.key === key ? { ...s, [field]: value } : s),
    }));
    setDirty(true);
  }

  function updateYears(value: number) {
    setAbout((prev) => ({ ...prev, yearsOfHistory: value }));
    setDirty(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateAdminAbout(about);
      toast.success("Dados atualizados!");
      setDirty(false);
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-[#165B36]" /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Sobre a Editora</h1>
          <p className="text-sm text-gray-500 mt-1">Edite os números e estatísticas da seção "Nossa História"</p>
        </div>
        <button
          onClick={handleSave}
          disabled={!dirty || saving}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: dirty ? "linear-gradient(135deg, #EBBF74, #D4AF5A)" : "#d1d5db",
            color: dirty ? "#052413" : "#9ca3af",
          }}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Salvando..." : "Salvar alterações"}
        </button>
      </div>

      {/* Unsaved banner */}
      <AnimatePresence>
        {dirty && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="rounded-xl p-3 border flex items-center gap-2"
            style={{ backgroundColor: "rgba(235,191,116,0.1)", borderColor: "rgba(235,191,116,0.4)" }}
          >
            <span className="w-2 h-2 rounded-full bg-[#EBBF74] animate-pulse" />
            <p className="text-xs text-[#856C42]">Alterações não salvas — clique em "Salvar alterações" para publicar no site.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Years badge */}
      <div
        className="rounded-2xl border p-6"
        style={{ backgroundColor: "#052413", borderColor: "rgba(235,191,116,0.2)" }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#EBBF74,#856C42)" }}>
            <Info className="w-4 h-4 text-[#052413]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Badge de destaque</p>
            <p className="text-xs text-white/50">Exibido sobre a foto na seção "Nossa História"</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div
            className="bg-[#052413] border border-[#EBBF74]/30 px-6 py-4 rounded-xl text-center"
            style={{ minWidth: 100 }}
          >
            <p className="text-3xl text-[#EBBF74] font-serif">{about.yearsOfHistory}</p>
            <p className="text-xs text-[#EBBF74]/60 mt-0.5">anos de história</p>
          </div>
          <div className="flex-1">
            <label className="text-xs font-medium text-white/60 mb-1.5 block">Anos de história</label>
            <input
              type="number"
              min={1}
              value={about.yearsOfHistory}
              onChange={(e) => updateYears(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#EBBF74]/30"
              style={{ borderColor: "rgba(235,191,116,0.3)", backgroundColor: "rgba(255,255,255,0.95)" }}
            />
            <p className="text-xs text-white/40 mt-1">Atualize conforme a data atual</p>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-3">Estatísticas (grid de 4 itens)</p>
        <div className="grid sm:grid-cols-2 gap-4">
          {about.stats.map((stat) => {
            const Icon = ICON_MAP[stat.key] || BookOpen;
            return (
              <div
                key={stat.key}
                className="bg-white border border-gray-200 rounded-2xl p-5"
                style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(22,91,54,0.08)" }}>
                    <Icon className="w-4.5 h-4.5 text-[#165B36]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#165B36] font-serif">
                      {stat.value}{stat.suffix}
                    </p>
                    <p className="text-xs text-gray-400">{stat.label}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[0.7rem] font-medium text-gray-400 mb-1 block">Valor</label>
                    <input
                      type="number"
                      min={0}
                      value={stat.value}
                      onChange={(e) => updateStat(stat.key, "value", Number(e.target.value))}
                      className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20"
                    />
                  </div>
                  <div>
                    <label className="text-[0.7rem] font-medium text-gray-400 mb-1 block">Sufixo</label>
                    <input
                      value={stat.suffix}
                      onChange={(e) => updateStat(stat.key, "suffix", e.target.value)}
                      placeholder="+ ou vazio"
                      className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20"
                    />
                  </div>
                  <div>
                    <label className="text-[0.7rem] font-medium text-gray-400 mb-1 block">Rótulo</label>
                    <input
                      value={stat.label}
                      onChange={(e) => updateStat(stat.key, "label", e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
