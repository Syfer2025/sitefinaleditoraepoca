import { useState, useEffect } from "react";
import { Loader2, Save, LayoutGrid } from "lucide-react";
import { getFooterContent, updateAdminFooterContent, type FooterContent } from "../../data/api";
import { toast } from "sonner";

const DEFAULT: FooterContent = {
  brandText: "Transformando manuscritos em obras-primas literárias desde 1987.",
  newsletterText: "Inscreva-se para receber novidades e lançamentos em primeira mão.",
  copyrightText: "Época Editora de Livros. Todos os direitos reservados.",
};

export function AdminFooter() {
  const [data, setData] = useState<FooterContent>(DEFAULT);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFooterContent()
      .then((res) => {
        if (res) setData({ ...DEFAULT, ...res });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await updateAdminFooterContent(data);
      toast.success("Rodapé atualizado com sucesso!");
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar rodapé");
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
        <h1 className="text-2xl font-semibold text-gray-900">Rodapé</h1>
        <p className="text-sm text-gray-500 mt-1">
          Gerencie os textos exibidos no rodapé do site.
        </p>
      </div>

      <div
        className="rounded-2xl border border-gray-200 overflow-hidden"
        style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
      >
        <div className="flex items-center gap-2 px-5 py-3 bg-gray-50 border-b border-gray-100">
          <LayoutGrid className="w-4 h-4 text-[#165B36]" />
          <span className="text-sm font-semibold text-gray-700">Conteúdo do Rodapé</span>
        </div>

        <div className="p-5 space-y-5">
          {/* Brand text */}
          <div>
            <label className="text-[0.7rem] font-medium text-gray-400 uppercase tracking-wider mb-1 block">
              Texto da marca
            </label>
            <textarea
              value={data.brandText}
              onChange={(e) => setData((prev) => ({ ...prev, brandText: e.target.value }))}
              rows={2}
              placeholder="Descrição da editora..."
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20 focus:border-[#165B36]/40 resize-none"
            />
          </div>

          {/* Newsletter text */}
          <div>
            <label className="text-[0.7rem] font-medium text-gray-400 uppercase tracking-wider mb-1 block">
              Texto da newsletter
            </label>
            <textarea
              value={data.newsletterText}
              onChange={(e) => setData((prev) => ({ ...prev, newsletterText: e.target.value }))}
              rows={2}
              placeholder="Chamada para inscrição na newsletter..."
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20 focus:border-[#165B36]/40 resize-none"
            />
          </div>

          {/* Copyright text */}
          <div>
            <label className="text-[0.7rem] font-medium text-gray-400 uppercase tracking-wider mb-1 block">
              Texto de copyright
            </label>
            <input
              value={data.copyrightText}
              onChange={(e) => setData((prev) => ({ ...prev, copyrightText: e.target.value }))}
              placeholder="© Época Editora..."
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20 focus:border-[#165B36]/40"
            />
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
              {saving ? "Salvando..." : "Salvar rodapé"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
