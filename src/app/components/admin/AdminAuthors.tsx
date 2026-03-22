import { useState, useEffect } from "react";
import { Plus, Trash2, Loader2, X, Check, Image as ImageIcon, Edit3, Users, Youtube, Save } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getAuthors, updateAdminAuthors, type VideoSection } from "../../data/api";
import { toast } from "sonner";

const DEFAULT_VIDEO: VideoSection = {
  url: "",
  title: "Conheça a Época Editora",
  text: "Há mais de três décadas transformamos manuscritos em obras publicadas com excelência editorial. Assista ao vídeo e descubra como podemos dar vida à sua história.",
};


interface Author {
  id: number;
  name: string;
  specialty: string;
  books: number;
  image: string;
  quote: string;
}

const EMPTY = (): Omit<Author, "id"> => ({
  name: "", specialty: "", books: 0, image: "", quote: "",
});

function AuthorModal({
  initial, onSave, onClose, saving,
}: {
  initial: Partial<Author>;
  onSave: (d: Omit<Author, "id">) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [d, setD] = useState({ name: "", specialty: "", books: 0, image: "", quote: "", ...initial });
  const set = (k: keyof typeof d, v: any) => setD((prev) => ({ ...prev, [k]: v }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!d.name.trim()) { toast.error("Nome é obrigatório."); return; }
    onSave({ name: d.name.trim(), specialty: d.specialty.trim(), books: Number(d.books) || 0, image: d.image.trim(), quote: d.quote.trim() });
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
          <h2 className="text-base font-semibold text-gray-900">
            {initial.id ? "Editar autor" : "Novo autor"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Photo preview */}
          <div className="flex gap-4 items-center">
            <div className="w-16 h-16 rounded-full border border-gray-200 overflow-hidden flex-shrink-0 bg-gray-50 flex items-center justify-center">
              {d.image ? (
                <img src={d.image} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              ) : (
                <ImageIcon className="w-5 h-5 text-gray-300" />
              )}
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-500 mb-1 block">URL da foto</label>
              <input value={d.image} onChange={(e) => set("image", e.target.value)} placeholder="https://..." className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20 focus:border-[#165B36]/40" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Nome *</label>
            <input autoFocus value={d.name} onChange={(e) => set("name", e.target.value)} placeholder="Nome do autor" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20 focus:border-[#165B36]/40" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Especialidade</label>
            <input value={d.specialty} onChange={(e) => set("specialty", e.target.value)} placeholder="Ex: Romance Contemporâneo" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20 focus:border-[#165B36]/40" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Livros publicados</label>
            <input type="number" min={0} value={d.books} onChange={(e) => set("books", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20 focus:border-[#165B36]/40" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Frase / citação</label>
            <textarea value={d.quote} onChange={(e) => set("quote", e.target.value)} placeholder="Uma frase marcante do autor..." rows={3} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20 focus:border-[#165B36]/40 resize-none" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer">Cancelar</button>
            <button type="submit" disabled={saving} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#165B36] hover:bg-[#0d4227] transition-colors cursor-pointer disabled:opacity-60">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export function AdminAuthors() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [video, setVideo] = useState<VideoSection>(DEFAULT_VIDEO);
  const [videoSaving, setVideoSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<"new" | Author | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    getAuthors()
      .then((data) => {
        if (Array.isArray(data?.authors)) setAuthors(data.authors);
        if (data?.videoSection) setVideo(data.videoSection);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSaveVideo() {
    setVideoSaving(true);
    try {
      await updateAdminAuthors(authors, video);
      toast.success("Vídeo atualizado!");
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar vídeo");
    } finally {
      setVideoSaving(false);
    }
  }

  async function handleSave(data: Omit<Author, "id">) {
    setSaving(true);
    try {
      let next: Author[];
      if (modal === "new") {
        const newId = authors.length > 0 ? Math.max(...authors.map((a) => a.id)) + 1 : 1;
        next = [...authors, { id: newId, ...data }];
      } else {
        next = authors.map((a) => a.id === (modal as Author).id ? { ...a, ...data } : a);
      }
      await updateAdminAuthors(next);
      setAuthors(next);
      toast.success(modal === "new" ? "Autor adicionado!" : "Autor atualizado!");
      setModal(null);
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Excluir este autor?")) return;
    setDeletingId(id);
    try {
      const next = authors.filter((a) => a.id !== id);
      await updateAdminAuthors(next);
      setAuthors(next);
      toast.success("Autor removido.");
    } catch (e: any) {
      toast.error(e.message || "Erro ao excluir");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-[#165B36]" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Seção de Vídeo</h1>
        <p className="text-sm text-gray-500 mt-1">Configure o vídeo exibido na seção "Nossos Autores"</p>
      </div>

      {/* Video config */}
      <div className="rounded-2xl border border-gray-200 overflow-hidden" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <div className="flex items-center gap-2 px-5 py-3 bg-gray-50 border-b border-gray-100">
          <Youtube className="w-4 h-4 text-red-500" />
          <span className="text-sm font-semibold text-gray-700">Configuração do Vídeo</span>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-[0.7rem] font-medium text-gray-400 uppercase tracking-wider mb-1 block">URL do YouTube</label>
            <input
              value={video.url}
              onChange={(e) => setVideo((v) => ({ ...v, url: e.target.value }))}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20 focus:border-[#165B36]/40"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[0.7rem] font-medium text-gray-400 uppercase tracking-wider mb-1 block">Título</label>
              <input
                value={video.title}
                onChange={(e) => setVideo((v) => ({ ...v, title: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20 focus:border-[#165B36]/40 font-serif"
              />
            </div>
            <div>
              <label className="text-[0.7rem] font-medium text-gray-400 uppercase tracking-wider mb-1 block">Texto lateral</label>
              <textarea
                value={video.text}
                onChange={(e) => setVideo((v) => ({ ...v, text: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20 focus:border-[#165B36]/40 resize-none"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleSaveVideo}
              disabled={videoSaving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #EBBF74, #D4AF5A)", color: "#052413" }}
            >
              {videoSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {videoSaving ? "Salvando..." : "Salvar vídeo"}
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Autores em Destaque</h2>
          <p className="text-sm text-gray-500 mt-0.5">Mantidos para uso futuro</p>
        </div>
        <button onClick={() => setModal("new")} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#165B36] hover:bg-[#0d4227] transition-colors cursor-pointer">
          <Plus className="w-4 h-4" /> Novo autor
        </button>
      </div>

      {authors.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-200 rounded-xl">
          <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">Nenhum autor cadastrado.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {authors.map((author) => (
              <motion.div
                key={author.id}
                layout
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col items-center text-center"
                style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
              >
                <div className="relative w-20 h-20 mb-3">
                  <div className="absolute inset-[-3px] rounded-full" style={{ background: "linear-gradient(135deg,#EBBF74,#856C42,#EBBF74)", opacity: 0.5 }} />
                  <div className="relative w-full h-full rounded-full overflow-hidden bg-gray-100">
                    {author.image ? (
                      <img src={author.image} alt={author.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-gray-300" />
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-base font-semibold text-gray-900 mb-0.5 font-serif">{author.name}</p>
                <p className="text-xs text-[#165B36] mb-0.5">{author.specialty}</p>
                <p className="text-xs text-gray-400 mb-3">{author.books} livros publicados</p>
                {author.quote && (
                  <p className="text-xs text-gray-500 italic mb-4 line-clamp-2 font-serif">"{author.quote}"</p>
                )}
                <div className="flex gap-2 mt-auto">
                  <button onClick={() => setModal(author)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-[#165B36] bg-[#165B36]/5 hover:bg-[#165B36]/10 transition-colors cursor-pointer">
                    <Edit3 className="w-3.5 h-3.5" /> Editar
                  </button>
                  <button onClick={() => handleDelete(author.id)} disabled={deletingId === author.id} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-red-400 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer disabled:opacity-50">
                    {deletingId === author.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    Excluir
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {modal !== null && (
          <AuthorModal
            initial={modal === "new" ? {} : { ...(modal as Author) }}
            onSave={handleSave}
            onClose={() => setModal(null)}
            saving={saving}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
