import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Save,
  GripVertical,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Loader2,
  Edit3,
  X,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getFaqs, updateAdminFaqs } from "../../data/api";
import { toast } from "sonner";


interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const EMPTY: FaqItem = { id: "", question: "", answer: "" };

function newId() {
  return crypto.randomUUID();
}

export function AdminFaq() {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<FaqItem>(EMPTY);
  const [adding, setAdding] = useState(false);
  const [newDraft, setNewDraft] = useState<FaqItem>({ id: "", question: "", answer: "" });

  useEffect(() => {
    getFaqs()
      .then((data) => {
        if (Array.isArray(data?.faqs) && data.faqs.length > 0) setFaqs(data.faqs);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await updateAdminFaqs(faqs);
      toast.success("Perguntas frequentes atualizadas!");
      setDirty(false);
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(faq: FaqItem) {
    setEditingId(faq.id);
    setEditDraft({ ...faq });
  }

  function confirmEdit() {
    if (!editDraft.question.trim() || !editDraft.answer.trim()) {
      toast.error("Preencha a pergunta e a resposta.");
      return;
    }
    setFaqs((prev) => prev.map((f) => (f.id === editingId ? { ...editDraft } : f)));
    setEditingId(null);
    setDirty(true);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  function handleDelete(id: string) {
    setFaqs((prev) => prev.filter((f) => f.id !== id));
    setDirty(true);
  }

  function moveUp(index: number) {
    if (index === 0) return;
    const next = [...faqs];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    setFaqs(next);
    setDirty(true);
  }

  function moveDown(index: number) {
    if (index === faqs.length - 1) return;
    const next = [...faqs];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    setFaqs(next);
    setDirty(true);
  }

  function startAdd() {
    setNewDraft({ id: newId(), question: "", answer: "" });
    setAdding(true);
  }

  function confirmAdd() {
    if (!newDraft.question.trim() || !newDraft.answer.trim()) {
      toast.error("Preencha a pergunta e a resposta.");
      return;
    }
    setFaqs((prev) => [...prev, newDraft]);
    setAdding(false);
    setDirty(true);
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
          <h1 className="text-2xl font-semibold text-gray-900">
            Perguntas Frequentes
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gerencie as perguntas exibidas na seção de FAQ do site
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={startAdd}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-[#165B36] bg-[#165B36]/5 hover:bg-[#165B36]/10 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Nova pergunta
          </button>
          <button
            onClick={handleSave}
            disabled={!dirty || saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: dirty ? "linear-gradient(135deg, #EBBF74, #D4AF5A)" : "#d1d5db",
              color: dirty ? "#052413" : "#9ca3af",
            }}
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </div>

      {/* Info banner */}
      {dirty && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl p-3 border flex items-center gap-2"
          style={{ backgroundColor: "rgba(235,191,116,0.1)", borderColor: "rgba(235,191,116,0.4)" }}
        >
          <span className="w-2 h-2 rounded-full bg-[#EBBF74] animate-pulse" />
          <p className="text-xs text-[#856C42]">
            Alterações não salvas — clique em "Salvar alterações" para publicar no site.
          </p>
        </motion.div>
      )}

      {/* FAQ list */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {faqs.map((faq, i) => (
            <motion.div
              key={faq.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden"
              style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}
            >
              {editingId === faq.id ? (
                /* Edit mode */
                <div className="p-5 space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">
                      Pergunta
                    </label>
                    <input
                      autoFocus
                      value={editDraft.question}
                      onChange={(e) => setEditDraft((d) => ({ ...d, question: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20 focus:border-[#165B36]/40"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">
                      Resposta
                    </label>
                    <textarea
                      value={editDraft.answer}
                      onChange={(e) => setEditDraft((d) => ({ ...d, answer: e.target.value }))}
                      rows={4}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20 focus:border-[#165B36]/40 resize-none"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={cancelEdit}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" /> Cancelar
                    </button>
                    <button
                      onClick={confirmEdit}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-[#165B36] hover:bg-[#0d4227] transition-colors cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" /> Confirmar
                    </button>
                  </div>
                </div>
              ) : (
                /* View mode */
                <div className="flex items-start gap-3 p-4">
                  <GripVertical className="w-4 h-4 text-gray-300 mt-1 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 mb-1 font-serif">
                      {faq.question}
                    </p>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => moveUp(i)}
                      disabled={i === 0}
                      className="p-1.5 rounded-lg text-gray-300 hover:text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Mover para cima"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveDown(i)}
                      disabled={i === faqs.length - 1}
                      className="p-1.5 rounded-lg text-gray-300 hover:text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Mover para baixo"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => startEdit(faq)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-[#165B36] hover:bg-[#165B36]/5 transition-colors cursor-pointer"
                      title="Editar"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(faq.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {faqs.length === 0 && !adding && (
          <div className="text-center py-16 border border-dashed border-gray-200 rounded-xl">
            <HelpCircle className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">
              Nenhuma pergunta cadastrada.
            </p>
            <button
              onClick={startAdd}
              className="mt-3 text-xs text-[#165B36] hover:underline cursor-pointer"
            >
              Adicionar primeira pergunta
            </button>
          </div>
        )}

        {/* Add new FAQ form */}
        <AnimatePresence>
          {adding && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="bg-white border-2 border-dashed border-[#165B36]/30 rounded-xl p-5 space-y-3"
            >
              <p className="text-xs font-semibold text-[#165B36]">
                Nova pergunta
              </p>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">
                  Pergunta
                </label>
                <input
                  autoFocus
                  value={newDraft.question}
                  onChange={(e) => setNewDraft((d) => ({ ...d, question: e.target.value }))}
                  placeholder="Ex: Como funciona o processo editorial?"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20 focus:border-[#165B36]/40"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">
                  Resposta
                </label>
                <textarea
                  value={newDraft.answer}
                  onChange={(e) => setNewDraft((d) => ({ ...d, answer: e.target.value }))}
                  placeholder="Descreva a resposta de forma clara e objetiva..."
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20 focus:border-[#165B36]/40 resize-none"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setAdding(false)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" /> Cancelar
                </button>
                <button
                  onClick={confirmAdd}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-[#165B36] hover:bg-[#0d4227] transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Counter */}
      {faqs.length > 0 && (
        <p className="text-xs text-gray-400 text-right">
          {faqs.length} {faqs.length === 1 ? "pergunta" : "perguntas"} cadastradas
        </p>
      )}
    </div>
  );
}
