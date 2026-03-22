import { useState, useEffect } from "react";
import { Loader2, Save, Image as ImageIcon, Type } from "lucide-react";
import { getHero, updateAdminHero, type HeroContent } from "../../data/api";
import { toast } from "sonner";

const DEFAULT: HeroContent = {
  title: "Histórias que",
  titleHighlight: "transformam vidas",
  subtitle:
    "Publicamos obras que desafiam o comum e dão voz a quem tem algo único para contar. Da ideia ao livro, cuidamos de tudo com excelência editorial.",
  ctaPrimary: "Conheça nosso catálogo",
  ctaSecondary: "Sobre a editora",
  imageUrl: "",
};

export function AdminHero() {
  const [hero, setHero] = useState<HeroContent>(DEFAULT);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHero()
      .then((data) => {
        if (data) setHero((prev) => ({ ...prev, ...data }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await updateAdminHero(hero);
      toast.success("Hero atualizado com sucesso!");
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar hero");
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
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Hero da Home</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure o conteúdo da seção principal (hero) exibida no topo da página inicial.
        </p>
      </div>

      {/* Textos card */}
      <div
        className="rounded-2xl border border-gray-200 overflow-hidden"
        style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
      >
        <div className="flex items-center gap-2 px-5 py-3 bg-gray-50 border-b border-gray-100">
          <Type className="w-4 h-4 text-[#165B36]" />
          <span className="text-sm font-semibold text-gray-700">Textos do Hero</span>
        </div>

        <div className="p-5 space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[0.7rem] font-medium text-gray-400 uppercase tracking-wider mb-1 block">
                Título principal
              </label>
              <input
                value={hero.title}
                onChange={(e) => setHero((v) => ({ ...v, title: e.target.value }))}
                placeholder="Histórias que"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20 focus:border-[#165B36]/40 font-serif"
              />
            </div>
            <div>
              <label className="text-[0.7rem] font-medium text-gray-400 uppercase tracking-wider mb-1 block">
                Destaque (itálico)
              </label>
              <input
                value={hero.titleHighlight}
                onChange={(e) => setHero((v) => ({ ...v, titleHighlight: e.target.value }))}
                placeholder="transformam vidas"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20 focus:border-[#165B36]/40 italic font-serif"
              />
            </div>
          </div>

          <div>
            <label className="text-[0.7rem] font-medium text-gray-400 uppercase tracking-wider mb-1 block">
              Subtítulo
            </label>
            <textarea
              value={hero.subtitle}
              onChange={(e) => setHero((v) => ({ ...v, subtitle: e.target.value }))}
              rows={3}
              placeholder="Descrição do hero..."
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20 focus:border-[#165B36]/40 resize-none"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[0.7rem] font-medium text-gray-400 uppercase tracking-wider mb-1 block">
                Botão primário
              </label>
              <input
                value={hero.ctaPrimary}
                onChange={(e) => setHero((v) => ({ ...v, ctaPrimary: e.target.value }))}
                placeholder="Conheça nosso catálogo"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20 focus:border-[#165B36]/40"
              />
            </div>
            <div>
              <label className="text-[0.7rem] font-medium text-gray-400 uppercase tracking-wider mb-1 block">
                Botão secundário
              </label>
              <input
                value={hero.ctaSecondary}
                onChange={(e) => setHero((v) => ({ ...v, ctaSecondary: e.target.value }))}
                placeholder="Sobre a editora"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20 focus:border-[#165B36]/40"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Imagem card */}
      <div
        className="rounded-2xl border border-gray-200 overflow-hidden"
        style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
      >
        <div className="flex items-center gap-2 px-5 py-3 bg-gray-50 border-b border-gray-100">
          <ImageIcon className="w-4 h-4 text-[#165B36]" />
          <span className="text-sm font-semibold text-gray-700">Imagem de fundo</span>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="text-[0.7rem] font-medium text-gray-400 uppercase tracking-wider mb-1 block">
              URL da imagem
            </label>
            <input
              value={hero.imageUrl}
              onChange={(e) => setHero((v) => ({ ...v, imageUrl: e.target.value }))}
              placeholder="https://exemplo.com/imagem.jpg"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20 focus:border-[#165B36]/40"
            />
            <p className="text-[0.65rem] text-gray-400 mt-1">
              Cole a URL completa da imagem de fundo do hero
            </p>
          </div>

          {hero.imageUrl && (
            <div>
              <label className="text-[0.7rem] font-medium text-gray-400 uppercase tracking-wider mb-2 block">
                Pré-visualização
              </label>
              <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
                <img
                  src={hero.imageUrl}
                  alt="Preview do hero"
                  className="w-full max-h-64 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #EBBF74, #D4AF5A)", color: "#052413" }}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Salvando..." : "Salvar hero"}
        </button>
      </div>
    </div>
  );
}
