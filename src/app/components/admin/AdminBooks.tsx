import { useState, useEffect, useRef } from "react";
import {
  BookOpen, Search, Star, Plus, Edit3, Trash2,
  Loader2, X, Check, Image as ImageIcon, Upload, Link as LinkIcon, Images,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getBooks, createAdminBook, updateAdminBook, deleteAdminBook, uploadFile } from "../../data/api";
import { toast } from "sonner";

const F = "Inter, sans-serif";
const GENRES = ["Romance", "Ficção", "Contos", "Poesia", "Ensaios", "Suspense", "Crônicas"];

interface Book {
  id: number;
  title: string;
  slug?: string;
  author: string;
  genre: string;
  rating: number;
  year: number;
  description: string;
  image: string;
  photos?: string[];
}

const EMPTY_DRAFT = (): Omit<Book, "id"> => ({
  title: "", author: "", genre: "Ficção",
  rating: 4.5, year: new Date().getFullYear(),
  description: "", image: "", photos: [],
});

function ImageUploadField({
  value,
  onChange,
  label,
  folder,
  placeholder,
  preview = true,
}: {
  value: string;
  onChange: (url: string) => void;
  label: string;
  folder: "books" | "logos" | "authors" | "misc";
  placeholder?: string;
  preview?: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file, folder);
      onChange(url);
      toast.success("Imagem enviada!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar imagem");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div>
      <label className="text-xs font-medium text-gray-500 mb-1 block" style={{ fontFamily: F }}>
        {label}
      </label>
      <div className="flex gap-2 items-start">
        {preview && (
          <div className="w-16 h-20 rounded-lg border border-gray-200 overflow-hidden flex-shrink-0 bg-gray-50 flex items-center justify-center">
            {value ? (
              <img src={value} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            ) : (
              <ImageIcon className="w-6 h-6 text-gray-300" />
            )}
          </div>
        )}
        <div className="flex-1 space-y-1.5">
          <div className="relative flex items-center">
            <LinkIcon className="absolute left-3 w-3.5 h-3.5 text-gray-400" />
            <input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder || "https://... ou clique em Enviar"}
              className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20 focus:border-[#165B36]/40"
              style={{ fontFamily: F }}
            />
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white bg-[#165B36] hover:bg-[#0d4227] transition-colors cursor-pointer disabled:opacity-60"
            style={{ fontFamily: F }}
          >
            {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
            {uploading ? "Enviando..." : "Enviar arquivo"}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </div>
      </div>
    </div>
  );
}

function PhotosManager({
  photos,
  onChange,
}: {
  photos: string[];
  onChange: (photos: string[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = await Promise.all(files.map((f) => uploadFile(f, "books")));
      onChange([...photos, ...urls]);
      toast.success(`${urls.length} foto(s) adicionada(s)!`);
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar fotos");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function removePhoto(i: number) {
    onChange(photos.filter((_, idx) => idx !== i));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-medium text-gray-500" style={{ fontFamily: F }}>
          Portfólio de diagramação ({photos.length} foto{photos.length !== 1 ? "s" : ""})
        </label>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white bg-[#165B36] hover:bg-[#0d4227] transition-colors cursor-pointer disabled:opacity-60"
          style={{ fontFamily: F }}
        >
          {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
          {uploading ? "Enviando..." : "Adicionar fotos"}
        </button>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
      </div>

      {photos.length === 0 ? (
        <div
          className="border-2 border-dashed border-gray-200 rounded-xl py-8 text-center cursor-pointer hover:border-[#165B36]/30 transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          <Images className="w-8 h-8 text-gray-200 mx-auto mb-2" />
          <p className="text-xs text-gray-400" style={{ fontFamily: F }}>
            Clique para adicionar fotos da diagramação
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((url, i) => (
            <div key={i} className="relative aspect-[3/4] rounded-lg overflow-hidden border border-gray-200 group">
              <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(i)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BookFormModal({
  initial,
  onSave,
  onClose,
  saving,
}: {
  initial: Omit<Book, "id"> & { id?: number };
  onSave: (data: Omit<Book, "id">) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [draft, setDraft] = useState<Omit<Book, "id"> & { id?: number }>({
    ...initial,
    photos: initial.photos || [],
  });

  const set = (k: keyof typeof draft, v: any) => setDraft((d) => ({ ...d, [k]: v }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.title.trim() || !draft.author.trim()) {
      toast.error("Título e autor são obrigatórios.");
      return;
    }
    onSave({
      title: draft.title.trim(),
      author: draft.author.trim(),
      genre: draft.genre,
      rating: Number(draft.rating),
      year: Number(draft.year),
      description: draft.description.trim(),
      image: draft.image.trim(),
      photos: draft.photos || [],
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(5,36,19,0.5)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900" style={{ fontFamily: F }}>
            {initial.id ? "Editar livro" : "Novo livro"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Cover */}
          <ImageUploadField
            value={draft.image}
            onChange={(url) => set("image", url)}
            label="Capa do livro"
            folder="books"
            placeholder="https://... ou envie uma imagem"
          />

          {/* Title */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block" style={{ fontFamily: F }}>Título *</label>
            <input
              autoFocus
              value={draft.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Título da obra"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20 focus:border-[#165B36]/40"
              style={{ fontFamily: F }}
            />
          </div>

          {/* Author */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block" style={{ fontFamily: F }}>Autor *</label>
            <input
              value={draft.author}
              onChange={(e) => set("author", e.target.value)}
              placeholder="Nome do autor"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20 focus:border-[#165B36]/40"
              style={{ fontFamily: F }}
            />
          </div>

          {/* Genre + Year + Rating */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block" style={{ fontFamily: F }}>Gênero</label>
              <select
                value={draft.genre}
                onChange={(e) => set("genre", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20 cursor-pointer"
                style={{ fontFamily: F }}
              >
                {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block" style={{ fontFamily: F }}>Ano</label>
              <input
                type="number"
                value={draft.year}
                onChange={(e) => set("year", e.target.value)}
                min={1900}
                max={2100}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20 focus:border-[#165B36]/40"
                style={{ fontFamily: F }}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block" style={{ fontFamily: F }}>Avaliação</label>
              <input
                type="number"
                value={draft.rating}
                onChange={(e) => set("rating", e.target.value)}
                step={0.1}
                min={0}
                max={5}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20 focus:border-[#165B36]/40"
                style={{ fontFamily: F }}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block" style={{ fontFamily: F }}>Descrição</label>
            <textarea
              value={draft.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Sinopse do livro..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20 focus:border-[#165B36]/40 resize-none"
              style={{ fontFamily: F }}
            />
          </div>

          {/* Photos */}
          <PhotosManager
            photos={draft.photos || []}
            onChange={(photos) => set("photos", photos)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer"
              style={{ fontFamily: F }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#165B36] hover:bg-[#0d4227] transition-colors cursor-pointer disabled:opacity-60"
              style={{ fontFamily: F }}
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export function AdminBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [genreFilter, setGenreFilter] = useState("Todos");
  const [modal, setModal] = useState<"new" | Book | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    getBooks()
      .then((data) => { if (Array.isArray(data?.books)) setBooks(data.books); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = books.filter((b) => {
    if (genreFilter !== "Todos" && b.genre !== genreFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q);
    }
    return true;
  });

  async function handleSave(data: Omit<Book, "id">) {
    setSaving(true);
    try {
      if (modal === "new") {
        const res = await createAdminBook(data);
        setBooks((prev) => [...prev, res.book]);
        toast.success("Livro adicionado! A subpágina foi criada automaticamente.");
      } else if (modal && typeof modal === "object") {
        const res = await updateAdminBook(modal.id, data);
        setBooks((prev) => prev.map((b) => b.id === modal.id ? res.book : b));
        toast.success("Livro atualizado!");
      }
      setModal(null);
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar livro");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Excluir este livro? Esta ação não pode ser desfeita.")) return;
    setDeletingId(id);
    try {
      await deleteAdminBook(id);
      setBooks((prev) => prev.filter((b) => b.id !== id));
      toast.success("Livro excluído.");
    } catch (e: any) {
      toast.error(e.message || "Erro ao excluir");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900" style={{ fontFamily: F }}>Catálogo de Livros</h1>
          <p className="text-sm text-gray-500 mt-1" style={{ fontFamily: F }}>
            {books.length} {books.length === 1 ? "obra cadastrada" : "obras cadastradas"} · Subpáginas criadas automaticamente
          </p>
        </div>
        <button
          onClick={() => setModal("new")}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#165B36] hover:bg-[#0d4227] transition-colors cursor-pointer"
          style={{ fontFamily: F }}
        >
          <Plus className="w-4 h-4" />
          Novo livro
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por título ou autor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20"
            style={{ fontFamily: F }}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <select
          value={genreFilter}
          onChange={(e) => setGenreFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20 cursor-pointer"
          style={{ fontFamily: F }}
        >
          <option value="Todos">Todos os gêneros</option>
          {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-[#165B36]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-200 rounded-xl">
          <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400" style={{ fontFamily: F }}>
            {search || genreFilter !== "Todos" ? "Nenhum livro encontrado com esses filtros." : "Nenhum livro cadastrado."}
          </p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ fontFamily: F }}>
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Capa</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Livro</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Gênero</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Ano</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Avaliação</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Fotos</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <AnimatePresence mode="popLayout">
                  {filtered.map((book) => (
                    <motion.tr
                      key={book.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="w-8 h-10 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                          {book.image ? (
                            <img src={book.image} alt={book.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="w-4 h-4 text-gray-300" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 truncate max-w-[180px]">{book.title}</p>
                        <p className="text-xs text-gray-400">{book.author}</p>
                        {book.slug && (
                          <p className="text-[0.65rem] text-[#165B36]/60 mt-0.5">/livros/{book.slug}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ backgroundColor: "rgba(22,91,54,0.08)", color: "#165B36" }}
                        >
                          {book.genre}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{book.year}</td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-[#856C42]">
                          <Star className="w-3.5 h-3.5 fill-[#EBBF74] text-[#EBBF74]" />
                          {book.rating}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {(book.photos?.length || 0) > 0 ? (
                          <span className="flex items-center gap-1 text-[#165B36]">
                            <Images className="w-3.5 h-3.5" />
                            {book.photos!.length}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setModal(book)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-[#165B36] hover:bg-[#165B36]/5 transition-colors cursor-pointer"
                            title="Editar"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(book.id)}
                            disabled={deletingId === book.id}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
                            title="Excluir"
                          >
                            {deletingId === book.id
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : <Trash2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {modal !== null && (
          <BookFormModal
            initial={modal === "new" ? EMPTY_DRAFT() : { ...(modal as Book) }}
            onSave={handleSave}
            onClose={() => setModal(null)}
            saving={saving}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
