import { useState, useEffect } from "react";
import { Loader2, Save, BookOpen } from "lucide-react";
import { getAboutContent, updateAdminAboutContent, type AboutContent } from "../../data/api";
import { toast } from "sonner";

const DEFAULT: AboutContent = {
  sectionLabel: "Nossa História",
  heading: "Cultivando a literatura",
  headingHighlight: "brasileira",
  paragraph1:
    "Fundada em 1987, a Época Editora nasceu do amor pela palavra escrita. Ao longo de quase quatro décadas, construímos um catálogo diversificado que abrange ficção contemporânea, poesia, ensaios e literatura infantil.",
  paragraph2:
    "Nossa missão é dar voz a novos talentos e manter viva a chama da literatura de qualidade, conectando autores e leitores em uma experiência transformadora.",
  imageUrl: "",
};

export function AdminAboutContent() {
  const [data, setData] = useState<AboutContent>(DEFAULT);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAboutContent()
      .then((res) => {
        if (res) setData(res);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function update<K extends keyof AboutContent>(key: K, value: AboutContent[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateAdminAboutContent(data);
      toast.success("Conteúdo da seção Sobre atualizado!");
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar conteúdo");
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
        <h1 className="text-2xl font-semibold text-gray-900">Seção Sobre — Texto e Imagem</h1>
        <p className="text-sm text-gray-500 mt-1">
          Edite o texto narrativo e a imagem exibidos na seção "Sobre" da página inicial.
        </p>
      </div>

      {/* Card */}
      <div
        className="rounded-2xl border border-gray-200 overflow-hidden"
        style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
      >
        <div className="flex items-center gap-2 px-5 py-3 bg-gray-50 border-b border-gray-100">
          <BookOpen className="w-4 h-4 text-[#165B36]" />
          <span className="text-sm font-semibold text-gray-700">Conteúdo da Seção</span>
        </div>

        <div className="p-5 space-y-5">
          {/* Label, Heading, Highlight */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[0.7rem] font-medium text-gray-400 uppercase tracking-wider mb-1 block">
                Label da seção
              </label>
              <input
                value={data.sectionLabel}
                onChange={(e) => update("sectionLabel", e.target.value)}
                placeholder="Nossa História"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20 focus:border-[#165B36]/40"
              />
            </div>
            <div>
              <label className="text-[0.7rem] font-medium text-gray-400 uppercase tracking-wider mb-1 block">
                Título principal
              </label>
              <input
                value={data.heading}
                onChange={(e) => update("heading", e.target.value)}
                placeholder="Cultivando a literatura"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20 focus:border-[#165B36]/40 font-serif"
              />
            </div>
            <div>
              <label className="text-[0.7rem] font-medium text-gray-400 uppercase tracking-wider mb-1 block">
                Destaque (itálico)
              </label>
              <input
                value={data.headingHighlight}
                onChange={(e) => update("headingHighlight", e.target.value)}
                placeholder="brasileira"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20 focus:border-[#165B36]/40 italic"
              />
            </div>
          </div>

          {/* Paragraph 1 */}
          <div>
            <label className="text-[0.7rem] font-medium text-gray-400 uppercase tracking-wider mb-1 block">
              Parágrafo 1
            </label>
            <textarea
              value={data.paragraph1}
              onChange={(e) => update("paragraph1", e.target.value)}
              rows={4}
              placeholder="Primeiro parágrafo da seção Sobre..."
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20 focus:border-[#165B36]/40 resize-none"
            />
          </div>

          {/* Paragraph 2 */}
          <div>
            <label className="text-[0.7rem] font-medium text-gray-400 uppercase tracking-wider mb-1 block">
              Parágrafo 2
            </label>
            <textarea
              value={data.paragraph2}
              onChange={(e) => update("paragraph2", e.target.value)}
              rows={4}
              placeholder="Segundo parágrafo da seção Sobre..."
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20 focus:border-[#165B36]/40 resize-none"
            />
          </div>

          {/* Image URL + Preview */}
          <div>
            <label className="text-[0.7rem] font-medium text-gray-400 uppercase tracking-wider mb-1 block">
              URL da Imagem
            </label>
            <input
              value={data.imageUrl}
              onChange={(e) => update("imageUrl", e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20 focus:border-[#165B36]/40"
            />
            <p className="text-[0.65rem] text-gray-400 mt-1">
              Cole uma URL de imagem (Unsplash ou outra). Deixe vazio para usar a imagem padrão.
            </p>
          </div>

          {data.imageUrl && (
            <div>
              <label className="text-[0.7rem] font-medium text-gray-400 uppercase tracking-wider mb-2 block">
                Pré-visualização
              </label>
              <div className="rounded-xl overflow-hidden border border-gray-200 max-w-sm">
                <img
                  src={data.imageUrl}
                  alt="Preview da imagem Sobre"
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            </div>
          )}

          {/* Save */}
          <div className="flex justify-end pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #EBBF74, #D4AF5A)", color: "#052413" }}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Salvando..." : "Salvar conteúdo"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
