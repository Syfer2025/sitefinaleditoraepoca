import { useState, useEffect } from "react";
import { Plus, Trash2, Loader2, X, Check, Image as ImageIcon, Edit3, MessageSquare, Star } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getTestimonials, updateAdminTestimonials } from "../../data/api";
import { toast } from "sonner";

const F = "Inter, sans-serif";

interface Testimonial {
  id: number;
  name: string;
  role: string;
  image: string;
  quote: string;
  rating: number;
  featured: boolean;
}

function TestimonialModal({
  initial, onSave, onClose, saving,
}: {
  initial: Partial<Testimonial>;
  onSave: (d: Omit<Testimonial, "id">) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [d, setD] = useState({ name: "", role: "", image: "", quote: "", rating: 5, featured: false, ...initial });
  const set = (k: keyof typeof d, v: any) => setD((prev) => ({ ...prev, [k]: v }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!d.name.trim() || !d.quote.trim()) { toast.error("Nome e depoimento são obrigatórios."); return; }
    onSave({ name: d.name.trim(), role: d.role.trim(), image: d.image.trim(), quote: d.quote.trim(), rating: Number(d.rating) || 5, featured: !!d.featured });
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(5,36,19,0.5)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.2 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900" style={{ fontFamily: F }}>
            {initial.id ? "Editar depoimento" : "Novo depoimento"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Photo preview */}
          <div className="flex gap-4 items-center">
            <div className="w-14 h-14 rounded-full border border-gray-200 overflow-hidden flex-shrink-0 bg-gray-50 flex items-center justify-center">
              {d.image ? (
                <img src={d.image} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              ) : (
                <ImageIcon className="w-5 h-5 text-gray-300" />
              )}
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-500 mb-1 block" style={{ fontFamily: F }}>URL da foto</label>
              <input value={d.image} onChange={(e) => set("image", e.target.value)} placeholder="https://..." className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#165B36]/20 focus:border-[#165B36]/40" style={{ fontFamily: F }} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block" style={{ fontFamily: F }}>Nome *</label>
            <input autoFocus value={d.name} onChange={(e) => set("name", e.target.value)} placeholder="Nome da pessoa" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#165B36]/20 focus:border-[#165B36]/40" style={{ fontFamily: F }} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block" style={{ fontFamily: F }}>Cargo / papel</label>
            <input value={d.role} onChange={(e) => set("role", e.target.value)} placeholder="Ex: Autora de 'Caminhos da Alma'" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#165B36]/20 focus:border-[#165B36]/40" style={{ fontFamily: F }} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block" style={{ fontFamily: F }}>Depoimento *</label>
            <textarea value={d.quote} onChange={(e) => set("quote", e.target.value)} placeholder="O que a pessoa disse sobre a Época Editora..." rows={4} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#165B36]/20 focus:border-[#165B36]/40 resize-none" style={{ fontFamily: F }} />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-500 mb-1 block" style={{ fontFamily: F }}>Avaliação (estrelas)</label>
              <select value={d.rating} onChange={(e) => set("rating", Number(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#165B36]/20 cursor-pointer" style={{ fontFamily: F }}>
                {[5,4,3,2,1].map((v) => <option key={v} value={v}>{v} estrela{v !== 1 ? "s" : ""}</option>)}
              </select>
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={d.featured} onChange={(e) => set("featured", e.target.checked)} className="w-4 h-4 rounded accent-[#165B36]" />
                <span className="text-xs text-gray-600" style={{ fontFamily: F }}>Destaque</span>
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer" style={{ fontFamily: F }}>Cancelar</button>
            <button type="submit" disabled={saving} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#165B36] hover:bg-[#0d4227] transition-colors cursor-pointer disabled:opacity-60" style={{ fontFamily: F }}>
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export function AdminTestimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<"new" | Testimonial | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    getTestimonials()
      .then((data) => { if (Array.isArray(data?.testimonials)) setTestimonials(data.testimonials); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(data: Omit<Testimonial, "id">) {
    setSaving(true);
    try {
      let next: Testimonial[];
      if (modal === "new") {
        const newId = testimonials.length > 0 ? Math.max(...testimonials.map((t) => t.id)) + 1 : 1;
        next = [...testimonials, { id: newId, ...data }];
      } else {
        next = testimonials.map((t) => t.id === (modal as Testimonial).id ? { ...t, ...data } : t);
      }
      await updateAdminTestimonials(next);
      setTestimonials(next);
      toast.success(modal === "new" ? "Depoimento adicionado!" : "Depoimento atualizado!");
      setModal(null);
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Excluir este depoimento?")) return;
    setDeletingId(id);
    try {
      const next = testimonials.filter((t) => t.id !== id);
      await updateAdminTestimonials(next);
      setTestimonials(next);
      toast.success("Depoimento removido.");
    } catch (e: any) {
      toast.error(e.message || "Erro ao excluir");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-[#165B36]" /></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900" style={{ fontFamily: F }}>Depoimentos</h1>
          <p className="text-sm text-gray-500 mt-1" style={{ fontFamily: F }}>Gerencie os depoimentos exibidos na seção "Vozes que confiam"</p>
        </div>
        <button onClick={() => setModal("new")} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#165B36] hover:bg-[#0d4227] transition-colors cursor-pointer" style={{ fontFamily: F }}>
          <Plus className="w-4 h-4" /> Novo depoimento
        </button>
      </div>

      {testimonials.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-200 rounded-xl">
          <MessageSquare className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400" style={{ fontFamily: F }}>Nenhum depoimento cadastrado.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {testimonials.map((t) => (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                className="bg-white border border-gray-200 rounded-2xl p-5"
                style={{
                  boxShadow: t.featured ? "0 2px 12px rgba(235,191,116,0.15)" : "0 1px 4px rgba(0,0,0,0.04)",
                  borderColor: t.featured ? "rgba(235,191,116,0.4)" : undefined,
                }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border border-gray-100 bg-gray-50">
                    {t.image ? (
                      <img src={t.image} alt={t.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-gray-400">{t.name[0]}</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>{t.name}</p>
                      {t.featured && <span className="text-[0.65rem] px-1.5 py-0.5 rounded-full font-medium" style={{ background: "rgba(235,191,116,0.15)", color: "#856C42", fontFamily: F }}>Destaque</span>}
                    </div>
                    <p className="text-xs text-[#856C42] mb-2" style={{ fontFamily: F }}>{t.role}</p>
                    <div className="flex gap-0.5 mb-2">
                      {Array.from({ length: t.rating }).map((_, s) => <Star key={s} className="w-3 h-3 fill-[#EBBF74] text-[#EBBF74]" />)}
                    </div>
                    <p className="text-sm text-gray-600 italic line-clamp-2" style={{ fontFamily: "'Playfair Display', serif" }}>"{t.quote}"</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => setModal(t)} className="p-1.5 rounded-lg text-gray-400 hover:text-[#165B36] hover:bg-[#165B36]/5 transition-colors cursor-pointer" title="Editar"><Edit3 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(t.id)} disabled={deletingId === t.id} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50" title="Excluir">
                      {deletingId === t.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {modal !== null && (
          <TestimonialModal
            initial={modal === "new" ? {} : { ...(modal as Testimonial) }}
            onSave={handleSave}
            onClose={() => setModal(null)}
            saving={saving}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
