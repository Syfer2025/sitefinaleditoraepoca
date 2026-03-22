import { useState, useEffect } from "react";
import {
  BookOpen,
  CheckCircle,
  LayoutGrid,
  ChevronRight,
  Package,
  FileText,
  Loader2,
  AlertCircle,
  X,
  Send,
  Upload,
  Trash2,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { GoldButton } from "./GoldButton";
import { createProject, uploadProjectFile } from "../data/api";

// ============================================
// Constants
// ============================================
const FORMAT_OPTIONS = [
  { value: "A5", label: "A5 (14×21 cm)" },
  { value: "14x21", label: "14×21 cm" },
  { value: "15.5x22.5", label: "15,5×22,5 cm" },
  { value: "16x23", label: "16×23 cm" },
  { value: "17x24", label: "17×24 cm" },
  { value: "A4", label: "A4 (21×29,7 cm)" },
  { value: "21x28", label: "21×28 cm" },
  { value: "pocket", label: "Pocket (12×18 cm)" },
  { value: "quadrado", label: "Quadrado (21×21 cm)" },
  { value: "infantil_paisagem", label: "Infantil paisagem (28×21 cm)" },
  { value: "infantil_quadrado", label: "Infantil quadrado (24×24 cm)" },
  { value: "letter", label: "Letter (21,6×27,9 cm)" },
  { value: "personalizado", label: "Personalizado" },
];

const SERVICE_OPTIONS = [
  { key: "completo", label: "Pacote completo", desc: "Todos os serviços inclusos" },
  { key: "diagramacao", label: "Diagramação", desc: "Layout e composição das páginas" },
  { key: "capa", label: "Design de capa", desc: "Capa, lombada e contracapa" },
  { key: "revisao", label: "Revisão textual", desc: "Ortografia, gramática e estilo" },
  { key: "impressao", label: "Impressão", desc: "Produção gráfica do livro" },
  { key: "ficha_catalografica", label: "Ficha catalográfica", desc: "CIP e dados de catalogação" },
  { key: "registro_isbn", label: "Registro ISBN", desc: "Código ISBN e código de barras" },
];

const ACCEPTED_FILE_TYPES =
  ".doc,.docx,.pdf,.txt,.rtf,.odt,.epub,.indd,.idml,.psd,.ai,.jpg,.jpeg,.png,.tiff,.tif,.svg,.zip,.rar,.7z";

const WIZARD_STEPS = [
  { label: "Obra", icon: BookOpen },
  { label: "Serviços", icon: Package },
  { label: "Formato", icon: LayoutGrid },
  { label: "Arquivos", icon: Upload },
];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ============================================
// Component
// ============================================
export function NewRequestForm({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [description, setDescription] = useState("");
  const [pageCount, setPageCount] = useState("");
  const [format, setFormat] = useState("A5");
  const [customFormat, setCustomFormat] = useState("");
  const [services, setServices] = useState<string[]>(["completo"]);
  const [files, setFiles] = useState<File[]>([]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = { current: null as HTMLInputElement | null };

  const totalSteps = WIZARD_STEPS.length;

  const toggleService = (key: string) => {
    if (key === "completo") {
      setServices(["completo"]);
      return;
    }
    let next = services.filter((s) => s !== "completo");
    if (next.includes(key)) {
      next = next.filter((s) => s !== key);
    } else {
      next.push(key);
    }
    if (next.length === 0) next = ["completo"];
    setServices(next);
  };

  const addFiles = (newFiles: FileList | File[]) => {
    const arr = Array.from(newFiles);
    const maxSize = 50 * 1024 * 1024;
    const valid = arr.filter((f) => {
      if (f.size > maxSize) {
        setError(`"${f.name}" excede o limite de 50 MB.`);
        return false;
      }
      return true;
    });
    setFiles((prev) => [...prev, ...valid].slice(0, 10));
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  const canAdvance = (): boolean => {
    if (step === 0) return !!title.trim();
    if (step === 1) return services.length > 0;
    return true;
  };

  const handleNext = () => {
    setError("");
    if (step === 0 && !title.trim()) {
      setError("O título da obra é obrigatório.");
      return;
    }
    if (step < totalSteps - 1) setStep(step + 1);
  };

  const handleBack = () => {
    setError("");
    if (step > 0) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const res = await createProject({
        title: title.trim(),
        author: author.trim() || undefined,
        description: description.trim() || undefined,
        pageCount: pageCount ? parseInt(pageCount) : undefined,
        format,
        customFormat:
          format === "personalizado" ? customFormat.trim() : undefined,
        services,
        notes: notes.trim() || undefined,
      });

      if (files.length > 0 && res.project?.id) {
        for (let i = 0; i < files.length; i++) {
          setUploadProgress(
            `Enviando arquivo ${i + 1} de ${files.length}...`
          );
          try {
            await uploadProjectFile(res.project.id, files[i]);
          } catch (uploadErr: any) {
            console.error(`Upload error for ${files[i].name}:`, uploadErr);
          }
        }
      }

      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || "Erro ao enviar solicitação");
    } finally {
      setSubmitting(false);
      setUploadProgress("");
    }
  };

  const inputClasses =
    "w-full px-3.5 py-2.5 rounded-xl border text-sm text-[#052413] focus:outline-none focus:ring-2 focus:ring-[#165B36]/20 transition-colors";
  const inputStyle = {
    backgroundColor: "#FFFDF8",
    borderColor: "rgba(133,108,66,0.2)",
  };

  // Lock body scroll
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = original; };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ outline: "none" }}
      tabIndex={-1}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Nova solicitação de diagramação"
    >
      <div className="absolute inset-0 bg-black/60" />
      <motion.div
        initial={{ y: 24 }}
        animate={{ y: 0 }}
        exit={{ y: 24 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden will-change-transform"
        tabIndex={-1}
        style={{
          backgroundColor: "#FFFDF8",
          boxShadow: "0 25px 50px -12px rgba(5,36,19,0.25), 0 0 0 1px rgba(133,108,66,0.1)",
          backfaceVisibility: "hidden",
          outline: "none",
        }}
      >
        {/* Header */}
        <div
          className="px-5 pt-5 pb-3 flex items-center justify-between flex-shrink-0"
        >
          <div>
            <h2
              className="text-xl text-[#052413] font-serif"
            >
              Nova <span className="italic text-[#165B36]">solicitação</span>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#856C42]/50 hover:bg-[#F0E8D4] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step indicators */}
        <div className="px-5 pb-4 flex-shrink-0">
          <div className="flex items-center gap-0">
            {WIZARD_STEPS.map((ws, i) => {
              const Icon = ws.icon;
              const isDone = i < step;
              const isCurrent = i === step;
              return (
                <div key={ws.label} className="flex items-center flex-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (i < step) {
                        setError("");
                        setStep(i);
                      }
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[0.65rem] font-medium transition-all whitespace-nowrap ${
                      isCurrent
                        ? "text-white"
                        : isDone
                          ? "text-[#165B36] cursor-pointer hover:bg-[#165B36]/5"
                          : "text-[#856C42]/40"
                    }`}
                    style={{
                      ...(isCurrent
                        ? {
                            background:
                              "linear-gradient(135deg, #165B36, #052413)",
                          }
                        : {}),
                    }}
                    disabled={i > step}
                  >
                    {isDone ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : (
                      <Icon className="w-3 h-3" />
                    )}
                    <span className="hidden sm:inline">{ws.label}</span>
                  </button>
                  {i < totalSteps - 1 && (
                    <div
                      className="flex-1 h-[1.5px] mx-1 rounded-full transition-colors"
                      style={{
                        backgroundColor:
                          i < step ? "#165B36" : "rgba(133,108,66,0.12)",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Separator */}
        <div
          className="mx-5 h-px flex-shrink-0"
          style={{ backgroundColor: "rgba(133,108,66,0.1)" }}
        />

        {/* Step content */}
        <div className="px-5 py-5 flex-shrink-0">
          <AnimatePresence mode="wait">
            {/* Step 0: Obra */}
            {step === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                <p
                  className="text-xs text-[#856C42] mb-1"
                >
                  Informações básicas sobre a obra
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      className="block text-xs font-medium text-[#052413] mb-1.5"
                    >
                      Título da obra *
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ex.: O Guardião das Palavras"
                      className={inputClasses}
                      style={inputStyle}
                      autoFocus
                    />
                  </div>
                  <div>
                    <label
                      className="block text-xs font-medium text-[#052413] mb-1.5"
                    >
                      Autor
                    </label>
                    <input
                      type="text"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder="Deixe em branco para usar seu nome"
                      className={inputClasses}
                      style={inputStyle}
                    />
                  </div>
                </div>
                <div>
                  <label
                    className="block text-xs font-medium text-[#052413] mb-1.5"
                  >
                    Descrição do projeto
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descreva brevemente a obra, gênero, público-alvo..."
                    rows={3}
                    className={inputClasses + " resize-none"}
                    style={inputStyle}
                  />
                </div>
              </motion.div>
            )}

            {/* Step 1: Serviços */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.2 }}
              >
                <p
                  className="text-xs text-[#856C42] mb-3"
                >
                  Selecione os serviços que você precisa
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SERVICE_OPTIONS.map((svc) => {
                    const isSelected = services.includes(svc.key);
                    return (
                      <button
                        key={svc.key}
                        type="button"
                        onClick={() => toggleService(svc.key)}
                        className={`relative p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? "shadow-sm"
                            : "hover:border-[#856C42]/30"
                        }`}
                        style={{
                          borderColor: isSelected
                            ? "#165B36"
                            : "rgba(133,108,66,0.15)",
                          backgroundColor: isSelected
                            ? "rgba(22,91,54,0.04)"
                            : "#FFFDF8",
                        }}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <p
                            className={`text-xs font-medium leading-tight ${isSelected ? "text-[#165B36]" : "text-[#052413]"}`}
                          >
                            {svc.label}
                          </p>
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 text-[#165B36] flex-shrink-0" />
                          )}
                        </div>
                        <p
                          className="text-[0.6rem] text-[#856C42]/70 mt-0.5 leading-tight"
                        >
                          {svc.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
                <p
                  className="text-[0.6rem] text-[#856C42]/50 mt-3"
                >
                  "Pacote completo" inclui todos os serviços. Selecionar outro
                  desmarca o pacote completo.
                </p>
              </motion.div>
            )}

            {/* Step 2: Formato */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                <p
                  className="text-xs text-[#856C42] mb-1"
                >
                  Escolha o formato e especificações do livro
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      className="block text-xs font-medium text-[#052413] mb-1.5"
                    >
                      Formato do livro
                    </label>
                    <select
                      value={format}
                      onChange={(e) => setFormat(e.target.value)}
                      className={inputClasses + " cursor-pointer"}
                      style={inputStyle}
                    >
                      {FORMAT_OPTIONS.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      className="block text-xs font-medium text-[#052413] mb-1.5"
                    >
                      Páginas estimadas
                    </label>
                    <input
                      type="number"
                      value={pageCount}
                      onChange={(e) => setPageCount(e.target.value)}
                      placeholder="Ex.: 200"
                      min={1}
                      className={inputClasses}
                      style={inputStyle}
                    />
                  </div>
                </div>
                {format === "personalizado" && (
                  <div>
                    <label
                      className="block text-xs font-medium text-[#052413] mb-1.5"
                    >
                      Formato personalizado
                    </label>
                    <input
                      type="text"
                      value={customFormat}
                      onChange={(e) => setCustomFormat(e.target.value)}
                      placeholder="Ex.: 13×20 cm, quadrado 25×25 cm..."
                      className={inputClasses}
                      style={inputStyle}
                    />
                  </div>
                )}
                <div>
                  <label
                    className="block text-xs font-medium text-[#052413] mb-1.5"
                  >
                    Observações adicionais
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Referências de estilo, preferências tipográficas, prazos..."
                    rows={2}
                    className={inputClasses + " resize-none"}
                    style={inputStyle}
                  />
                </div>
              </motion.div>
            )}

            {/* Step 3: Arquivos */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.2 }}
              >
                <p
                  className="text-xs text-[#856C42] mb-3"
                >
                  Envie o manuscrito e materiais de apoio (opcional)
                </p>
                <div
                  className="flex items-start gap-2 mb-3 p-2.5 rounded-lg text-[0.65rem] leading-relaxed"
                  style={{ backgroundColor: "rgba(22,91,54,0.05)", border: "1px solid rgba(22,91,54,0.1)", color: "#052413" }}
                >
                  <svg className="w-3.5 h-3.5 text-[#165B36] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" /></svg>
                  <span>
                    Os arquivos enviados serao armazenados de forma segura em nossos servidores e utilizados exclusivamente para a prestacao dos servicos editoriais contratados.
                    Consulte nossa{" "}
                    <a href="/privacidade" target="_blank" rel="noopener noreferrer" className="text-[#165B36] font-medium hover:underline">
                      Politica de Privacidade
                    </a>{" "}
                    para mais informacoes.
                  </span>
                </div>
                <div
                  className={`relative rounded-xl border-2 border-dashed p-6 text-center transition-colors duration-200 cursor-pointer ${
                    dragOver
                      ? "border-[#165B36] bg-[#165B36]/[0.03]"
                      : "border-[#856C42]/20 hover:border-[#856C42]/40"
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={(el) => {
                      fileInputRef.current = el;
                    }}
                    type="file"
                    multiple
                    accept={ACCEPTED_FILE_TYPES}
                    onChange={(e) => {
                      if (e.target.files) addFiles(e.target.files);
                      e.target.value = "";
                    }}
                    className="hidden"
                  />
                  <Upload className="w-7 h-7 text-[#856C42]/30 mx-auto mb-2" />
                  <p
                    className="text-xs text-[#052413]"
                  >
                    Arraste arquivos aqui ou{" "}
                    <span className="text-[#165B36] font-medium">
                      clique para selecionar
                    </span>
                  </p>
                  <p
                    className="text-[0.6rem] text-[#856C42]/50 mt-1"
                  >
                    Word, PDF, TXT, RTF, ODT, InDesign, imagens, ZIP — máx. 50
                    MB/arquivo
                  </p>
                </div>

                {files.length > 0 && (
                  <div className="mt-3 space-y-1.5 max-h-[120px] overflow-y-auto">
                    {files.map((file, idx) => (
                      <div
                        key={`${file.name}-${idx}`}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg"
                        style={{ backgroundColor: "#F0E8D4" }}
                      >
                        <FileText className="w-4 h-4 text-[#165B36] flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p
                            className="text-xs text-[#052413] truncate"
                          >
                            {file.name}
                          </p>
                          <p
                            className="text-[0.6rem] text-[#856C42]/60"
                          >
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(idx);
                          }}
                          className="p-1 rounded text-[#856C42]/40 hover:text-[#d4183d] hover:bg-[#d4183d]/5 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          {error && (
            <div
              className="flex items-center gap-2 text-sm text-[#d4183d] p-3 rounded-lg mt-3"
              style={{ backgroundColor: "rgba(212,24,61,0.05)" }}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer navigation */}
        <div
          className="px-5 pb-5 pt-3 flex items-center justify-between gap-3 flex-shrink-0 border-t"
          style={{ borderColor: "rgba(133,108,66,0.08)" }}
        >
          <button
            type="button"
            onClick={step === 0 ? onClose : handleBack}
            className="px-4 py-2.5 rounded-xl text-sm text-[#856C42] hover:bg-[#F0E8D4] transition-colors cursor-pointer"
          >
            {step === 0 ? "Cancelar" : "Voltar"}
          </button>

          <div className="flex items-center gap-2">
            {/* Step dots */}
            <div className="flex gap-1.5 mr-2">
              {WIZARD_STEPS.map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full transition-colors"
                  style={{
                    backgroundColor:
                      i <= step ? "#165B36" : "rgba(133,108,66,0.15)",
                  }}
                />
              ))}
            </div>

            {step < totalSteps - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={!canAdvance()}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                style={{
                  background: "linear-gradient(135deg, #165B36, #052413)",
                }}
              >
                Próximo
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <GoldButton
                onClick={handleSubmit}
                className={`px-5 py-2.5 text-sm font-semibold ${submitting ? "opacity-70 pointer-events-none" : ""}`}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {uploadProgress || "Enviando..."}
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Enviar
                    {files.length > 0 && (
                      <span className="opacity-70 text-xs ml-1">
                        ({files.length}{" "}
                        {files.length === 1 ? "arquivo" : "arquivos"})
                      </span>
                    )}
                  </>
                )}
              </GoldButton>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
