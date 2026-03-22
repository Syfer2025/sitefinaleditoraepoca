import { useState, useEffect } from "react";
import { Loader2, Save, Megaphone } from "lucide-react";
import { getCtaBanner, updateAdminCtaBanner, type CtaBannerContent } from "../../data/api";
import { toast } from "sonner";

const DEFAULT: CtaBannerContent = {
  title: "Pronto para publicar",
  titleHighlight: "seu livro?",
  subtitle: "Oferecemos todo o suporte editorial para transformar seu manuscrito em uma obra publicada.",
  ctaPrimary: "Comece Agora",
  ctaPrimaryLink: "/contato",
  ctaSecondary: "Saiba Mais",
  ctaSecondaryLink: "/catalogo",
};

export function AdminCtaBanner() {
  const [data, setData] = useState<CtaBannerContent>(DEFAULT);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCtaBanner()
      .then((res) => { if (res) setData(res); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await updateAdminCtaBanner(data);
      toast.success("Banner CTA atualizado com sucesso!");
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar banner CTA");
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
        <h1 className="text-2xl font-semibold text-gray-900">Banner CTA</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure o banner de chamada para ação exibido na página inicial.
        </p>
      </div>

      <div
        className="rounded-2xl border border-gray-200 overflow-hidden"
        style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
      >
        <div className="flex items-center gap-2 px-5 py-3 bg-gray-50 border-b border-gray-100">
          <Megaphone className="w-4 h-4 text-[#165B36]" />
          <span className="text-sm font-semibold text-gray-700">Conteúdo do Banner</span>
        </div>

        <div className="p-5 space-y-5">
          {/* Title + Highlight */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[0.7rem] font-medium text-gray-400 uppercase tracking-wider mb-1 block">
                Título
              </label>
              <input
                value={data.title}
                onChange={(e) => setData((d) => ({ ...d, title: e.target.value }))}
                placeholder="Pronto para publicar"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20 focus:border-[#165B36]/40"
              />
            </div>
            <div>
              <label className="text-[0.7rem] font-medium text-gray-400 uppercase tracking-wider mb-1 block">
                Destaque (itálico)
              </label>
              <input
                value={data.titleHighlight}
                onChange={(e) => setData((d) => ({ ...d, titleHighlight: e.target.value }))}
                placeholder="seu livro?"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20 focus:border-[#165B36]/40 italic"
              />
            </div>
          </div>

          {/* Subtitle */}
          <div>
            <label className="text-[0.7rem] font-medium text-gray-400 uppercase tracking-wider mb-1 block">
              Subtítulo
            </label>
            <textarea
              value={data.subtitle}
              onChange={(e) => setData((d) => ({ ...d, subtitle: e.target.value }))}
              rows={3}
              placeholder="Texto de apoio do banner..."
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20 focus:border-[#165B36]/40 resize-none"
            />
          </div>

          {/* Primary CTA */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[0.7rem] font-medium text-gray-400 uppercase tracking-wider mb-1 block">
                Texto do botão primário
              </label>
              <input
                value={data.ctaPrimary}
                onChange={(e) => setData((d) => ({ ...d, ctaPrimary: e.target.value }))}
                placeholder="Comece Agora"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20 focus:border-[#165B36]/40"
              />
            </div>
            <div>
              <label className="text-[0.7rem] font-medium text-gray-400 uppercase tracking-wider mb-1 block">
                Link do botão primário
              </label>
              <input
                value={data.ctaPrimaryLink}
                onChange={(e) => setData((d) => ({ ...d, ctaPrimaryLink: e.target.value }))}
                placeholder="/contato"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20 focus:border-[#165B36]/40 font-mono text-xs"
              />
            </div>
          </div>

          {/* Secondary CTA */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[0.7rem] font-medium text-gray-400 uppercase tracking-wider mb-1 block">
                Texto do botão secundário
              </label>
              <input
                value={data.ctaSecondary}
                onChange={(e) => setData((d) => ({ ...d, ctaSecondary: e.target.value }))}
                placeholder="Saiba Mais"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20 focus:border-[#165B36]/40"
              />
            </div>
            <div>
              <label className="text-[0.7rem] font-medium text-gray-400 uppercase tracking-wider mb-1 block">
                Link do botão secundário
              </label>
              <input
                value={data.ctaSecondaryLink}
                onChange={(e) => setData((d) => ({ ...d, ctaSecondaryLink: e.target.value }))}
                placeholder="/catalogo"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20 focus:border-[#165B36]/40 font-mono text-xs"
              />
            </div>
          </div>

          {/* Save button */}
          <div className="flex justify-end pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #EBBF74, #D4AF5A)", color: "#052413" }}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Salvando..." : "Salvar banner"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
