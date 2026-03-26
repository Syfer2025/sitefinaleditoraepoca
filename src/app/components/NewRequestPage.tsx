import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate, Link } from "react-router";
import {
  BookOpen,
  CheckCircle,
  LayoutGrid,
  ChevronRight,
  Package,
  FileText,
  Loader2,
  AlertCircle,
  Send,
  Upload,
  Trash2,
  Check,
  ArrowLeft,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { GoldButton } from "./GoldButton";
import { useUserAuth } from "./UserAuthContext";
import { createProject, uploadProjectFile } from "../data/api";
import { toast } from "sonner";

// ============================================
// HelpTooltip — rendered via portal to avoid transform ancestry breaking fixed positioning
// ============================================
function HelpTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const visible = show || pinned;

  const updatePos = useCallback(() => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setPos({ top: rect.top + rect.height / 2, left: rect.right + 8 });
  }, []);

  useEffect(() => {
    if (!pinned) return;
    const handler = (e: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node) &&
          btnRef.current && !btnRef.current.contains(e.target as Node)) {
        setPinned(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [pinned]);

  useEffect(() => {
    if (!visible) return;
    updatePos();
    window.addEventListener("scroll", updatePos, true);
    window.addEventListener("resize", updatePos);
    return () => {
      window.removeEventListener("scroll", updatePos, true);
      window.removeEventListener("resize", updatePos);
    };
  }, [visible, updatePos]);

  const tooltip = visible && pos ? createPortal(
    <div
      ref={tooltipRef}
      className="fixed z-[9999] pointer-events-none flex items-center"
      style={{ top: pos.top, left: pos.left, transform: "translateY(-50%)" }}
    >
      <div className="w-2 h-2 bg-[#052413] rotate-45 -mr-1 flex-shrink-0" />
      <div
        className="px-3 py-2 rounded-lg text-[0.65rem] leading-relaxed text-white max-w-[220px] shadow-lg"
        style={{ backgroundColor: "#052413" }}
      >
        {text}
      </div>
    </div>,
    document.body,
  ) : null;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPinned(!pinned); }}
        className="w-4 h-4 rounded-full inline-flex items-center justify-center text-[#856C42]/50 hover:text-[#165B36] hover:bg-[#165B36]/10 transition-all cursor-help ml-1 flex-shrink-0"
        aria-label="Ajuda"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>
      {tooltip}
    </>
  );
}

// ============================================
// Constants
// ============================================
const FORMAT_OPTIONS = [
  { value: "A5", label: "A5 (14x21 cm)" },
  { value: "14x21", label: "14x21 cm" },
  { value: "15.5x22.5", label: "15,5x22,5 cm" },
  { value: "16x23", label: "16x23 cm" },
  { value: "17x24", label: "17x24 cm" },
  { value: "A4", label: "A4 (21x29,7 cm)" },
  { value: "21x28", label: "21x28 cm" },
  { value: "pocket", label: "Pocket (12x18 cm)" },
  { value: "quadrado", label: "Quadrado (21x21 cm)" },
  { value: "infantil_paisagem", label: "Infantil paisagem (28x21 cm)" },
  { value: "infantil_quadrado", label: "Infantil quadrado (24x24 cm)" },
  { value: "letter", label: "Letter (21,6x27,9 cm)" },
  { value: "personalizado", label: "Personalizado" },
];

const SERVICE_OPTIONS = [
  { key: "completo", label: "Pacote completo", desc: "Todos os serviços inclusos", help: "Inclui diagramação, capa, revisão, ISBN, ficha e impressão. Ideal se você quer que cuidemos de tudo." },
  { key: "diagramacao", label: "Diagramação", desc: "Layout e composição das páginas", help: "Organizamos o texto do seu livro nas páginas, com fontes, margens e espaçamentos profissionais." },
  { key: "capa", label: "Design de capa", desc: "Capa, lombada e contracapa", help: "Criamos a arte da capa do seu livro, incluindo a parte da frente, de trás e a lateral (lombada)." },
  { key: "revisao", label: "Revisão textual", desc: "Ortografia, gramática e estilo", help: "Um revisor profissional corrige erros de português e melhora a clareza do seu texto." },
  { key: "impressao", label: "Impressão", desc: "Produção gráfica do livro", help: "Imprimimos os exemplares físicos do seu livro em gráfica profissional." },
  { key: "ficha_catalografica", label: "Ficha catalográfica", desc: "CIP e dados de catalogação", help: "Documento obrigatório que aparece no verso da folha de rosto. É exigido por bibliotecas." },
  { key: "registro_isbn", label: "Registro ISBN", desc: "Código ISBN e código de barras", help: "O ISBN é como o CPF do seu livro — um número único que identifica a obra em qualquer lugar do mundo." },
];

const INPUT_CLASS = "w-full px-3.5 py-2.5 rounded-xl border text-sm text-[#052413] focus:outline-none focus:ring-2 focus:ring-[#165B36]/20 transition-colors";
const INPUT_STYLE = { backgroundColor: "#FFFDF8", borderColor: "rgba(133,108,66,0.2)" } as const;

const ACCEPTED_FILE_TYPES =
  ".doc,.docx,.pdf,.txt,.rtf,.odt,.epub,.indd,.idml,.psd,.ai,.jpg,.jpeg,.png,.tiff,.tif,.svg,.zip,.rar,.7z";

const ACCEPTED_MIME_TYPES = new Set([
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/pdf",
  "text/plain",
  "application/rtf", "text/rtf",
  "application/vnd.oasis.opendocument.text",
  "application/epub+zip",
  "application/x-indesign", "application/x-idml",
  "image/vnd.adobe.photoshop",
  "application/postscript",
  "image/jpeg", "image/png", "image/tiff", "image/svg+xml",
  "application/zip", "application/x-zip-compressed",
  "application/x-rar-compressed", "application/vnd.rar",
  "application/x-7z-compressed",
]);

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
// (Auth is handled by redirecting to /entrar)
// ============================================

// ============================================
// Main Page
// ============================================
export function NewRequestPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useUserAuth();

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
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalSteps = WIZARD_STEPS.length;

  useEffect(() => {
    document.title = "Nova Solicitação — Época Editora de Livros";
    return () => { document.title = "Época Editora de Livros — Histórias que transformam"; };
  }, []);

  // Redirecionar para login se não autenticado
  useEffect(() => {
    if (!authLoading && !user) navigate("/entrar", { replace: true });
  }, [authLoading, user, navigate]);

  const toggleService = (key: string) => {
    if (key === "completo") { setServices(["completo"]); return; }
    let next = services.filter((s) => s !== "completo");
    if (next.includes(key)) { next = next.filter((s) => s !== key); } else { next.push(key); }
    if (next.length === 0) next = ["completo"];
    setServices(next);
  };

  const addFiles = (newFiles: FileList | File[]) => {
    const arr = Array.from(newFiles);
    const maxSize = 50 * 1024 * 1024;
    const valid = arr.filter((f) => {
      if (f.size > maxSize) { setError(`"${f.name}" excede o limite de 50 MB.`); return false; }
      const ext = "." + f.name.split(".").pop()?.toLowerCase();
      const mimeOk = !f.type || ACCEPTED_MIME_TYPES.has(f.type);
      const extOk = ACCEPTED_FILE_TYPES.split(",").includes(ext);
      if (!mimeOk && !extOk) { setError(`"${f.name}" não é um tipo de arquivo permitido.`); return false; }
      return true;
    });
    setFiles((prev) => [...prev, ...valid].slice(0, 10));
  };

  const removeFile = (idx: number) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files); };

  const canAdvance = (): boolean => {
    if (step === 0) return !!title.trim();
    if (step === 1) return services.length > 0;
    if (step === 3) return files.length > 0;
    return true;
  };

  const handleNext = () => { setError(""); if (step === 0 && !title.trim()) { setError("O título da obra é obrigatório."); return; } if (step < totalSteps - 1) setStep(step + 1); };
  const handleBack = () => { setError(""); if (step > 0) setStep(step - 1); };

  const handleSubmit = async () => {
    if (files.length === 0) {
      setError("Envie pelo menos um arquivo do manuscrito.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const res = await createProject({
        title: title.trim(),
        author: author.trim() || undefined,
        description: description.trim() || undefined,
        pageCount: pageCount ? parseInt(pageCount) : undefined,
        format,
        customFormat: format === "personalizado" ? customFormat.trim() : undefined,
        services,
        notes: notes.trim() || undefined,
      });
      let uploadFails = 0;
      if (files.length > 0 && res?.project?.id) {
        for (let i = 0; i < files.length; i++) {
          setUploadProgress(`Enviando arquivo ${i + 1} de ${files.length}...`);
          try { await uploadProjectFile(res.project.id, files[i]); } catch (uploadErr: any) { console.error(`Upload error for ${files[i].name}:`, uploadErr); uploadFails++; }
        }
      }
      setSubmitted(true);
      if (uploadFails > 0) {
        toast.warning(`Solicitação criada, mas ${uploadFails} arquivo(s) falharam no envio. Você pode reenviá-los na área do cliente.`);
      } else {
        toast.success("Solicitação enviada com sucesso!");
      }
    } catch (err: any) {
      setError(err.message || "Erro ao enviar solicitação");
    } finally {
      setSubmitting(false);
      setUploadProgress("");
    }
  };

  const ic = INPUT_CLASS;
  const is = INPUT_STYLE;

  // Loading / auth guard
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(180deg, #FFFDF8 0%, #F5F0E8 100%)" }}>
        <Loader2 className="w-6 h-6 text-[#165B36] animate-spin" />
      </div>
    );
  }

  // Success state
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "linear-gradient(180deg, #FFFDF8 0%, #F5F0E8 100%)" }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg text-center p-10 rounded-2xl" style={{ backgroundColor: "#FFFDF8", boxShadow: "0 25px 50px rgba(5,36,19,0.08), 0 0 0 1px rgba(133,108,66,0.08)" }}>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }} className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: "linear-gradient(135deg, #165B36, #0a7c3e)" }}>
            <CheckCircle className="w-8 h-8 text-white" />
          </motion.div>
          <h2 className="text-2xl text-[#052413] mb-2 font-serif">Solicitação <span className="italic text-[#165B36]">enviada!</span></h2>
          <p className="text-sm text-[#856C42] mb-6 leading-relaxed">
            Sua solicitação foi recebida com sucesso. Nossa equipe irá analisá-la e em breve você receberá um orçamento na sua área do cliente.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <GoldButton onClick={() => navigate("/minha-conta")} className="px-6 py-2.5 text-sm font-semibold justify-center">
              <BookOpen className="w-4 h-4" /> Ir para minha conta
            </GoldButton>
            <button onClick={() => navigate("/")} className="px-6 py-2.5 rounded-xl text-sm text-[#856C42] hover:bg-[#F0E8D4] transition-colors cursor-pointer">
              <span className="flex items-center gap-1.5 justify-center"><ArrowLeft className="w-4 h-4" /> Voltar ao site</span>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #FFFDF8 0%, #F5F0E8 100%)" }}>
      {/* Top bar */}
      <div className="w-full border-b" style={{ borderColor: "rgba(133,108,66,0.08)", backgroundColor: "rgba(255,253,248,0.9)", backdropFilter: "blur(8px)" }}>
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-[#052413] hover:text-[#165B36] transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Voltar ao site</span>
          </Link>
          {user ? (
            <div className="flex items-center gap-2 text-xs text-[#856C42]">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[0.6rem] font-bold" style={{ background: "linear-gradient(135deg, #165B36, #052413)" }}>
                {user.name?.charAt(0).toUpperCase() || "U"}
              </div>
              {user.name}
            </div>
          ) : (
            <span className="text-[0.65rem] text-[#856C42]/60">Preencha o formulário — login só ao enviar</span>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        {/* Page header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4" style={{ backgroundColor: "rgba(22,91,54,0.06)", border: "1px solid rgba(22,91,54,0.1)" }}>
            <Sparkles className="w-3.5 h-3.5 text-[#165B36]" />
            <span className="text-xs font-medium text-[#165B36]">Formulário de nova solicitação</span>
          </div>
          <h1 className="text-3xl sm:text-4xl text-[#052413] mb-2 font-serif">
            Solicite sua <span className="italic text-[#165B36]">diagramação</span>
          </h1>
          <p className="text-sm text-[#856C42] max-w-md mx-auto leading-relaxed">
            Preencha os dados do seu projeto editorial. Nossa equipe irá preparar um orçamento personalizado para você.
          </p>
        </motion.div>

        {/* Form — always accessible */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "#FFFDF8", boxShadow: "0 25px 50px -12px rgba(5,36,19,0.08), 0 0 0 1px rgba(133,108,66,0.08)" }}>
            {/* Step indicators */}
            <div className="px-6 pt-5 pb-4">
              <div className="flex items-center gap-0">
                {WIZARD_STEPS.map((ws, i) => {
                  const Icon = ws.icon;
                  const isDone = i < step;
                  const isCurrent = i === step;
                  return (
                    <div key={ws.label} className="flex items-center flex-1">
                      <button
                        type="button"
                        onClick={() => { if (i < step) { setError(""); setStep(i); } }}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[0.65rem] font-medium transition-all whitespace-nowrap ${isCurrent ? "text-white" : isDone ? "text-[#165B36] cursor-pointer hover:bg-[#165B36]/5" : "text-[#856C42]/40"}`}
                        style={{ ...(isCurrent ? { background: "linear-gradient(135deg, #165B36, #052413)" } : {}) }}
                        disabled={i > step}
                      >
                        {isDone ? <CheckCircle className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
                        <span className="hidden sm:inline">{ws.label}</span>
                      </button>
                      {i < totalSteps - 1 && <div className="flex-1 h-[1.5px] mx-1 rounded-full transition-colors" style={{ backgroundColor: i < step ? "#165B36" : "rgba(133,108,66,0.12)" }} />}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mx-6 h-px" style={{ backgroundColor: "rgba(133,108,66,0.1)" }} />

            {/* Step content */}
            <div className="px-6 py-6">
              <AnimatePresence mode="wait">
                {/* Step 0: Obra */}
                {step === 0 && (
                  <motion.div key="step0" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2 }} className="space-y-3">
                    <p className="text-xs text-[#856C42] mb-1">Informações básicas sobre a obra</p>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="flex items-center text-xs font-medium text-[#052413] mb-1.5">
                          Título da obra *
                          <HelpTooltip text="O nome do seu livro. Pode ser um título provisório — você pode mudar depois." />
                        </label>
                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: O Guardião das Palavras" className={ic} style={is} autoFocus />
                      </div>
                      <div>
                        <label className="flex items-center text-xs font-medium text-[#052413] mb-1.5">
                          Autor
                          <HelpTooltip text="Quem escreveu o livro. Se for você mesmo, pode deixar em branco." />
                        </label>
                        <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Deixe em branco para usar seu nome" className={ic} style={is} />
                      </div>
                    </div>
                    <div>
                      <label className="flex items-center text-xs font-medium text-[#052413] mb-1.5">
                        Descrição do projeto
                        <HelpTooltip text="Conte um pouco sobre o livro: qual o tema, para quem é, se é ficção ou não-ficção, etc. Isso nos ajuda a preparar um orçamento mais preciso." />
                      </label>
                      <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descreva brevemente a obra, gênero, público-alvo..." rows={3} className={ic + " resize-none"} style={is} />
                    </div>
                  </motion.div>
                )}

                {/* Step 1: Serviços */}
                {step === 1 && (
                  <motion.div key="step1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2 }}>
                    <p className="flex items-center text-xs text-[#856C42] mb-3">
                      Selecione os serviços que você precisa
                      <HelpTooltip text="Não sabe o que escolher? Selecione 'Pacote completo' que cuidamos de tudo para você." />
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {SERVICE_OPTIONS.map((svc) => {
                        const isSelected = services.includes(svc.key);
                        return (
                          <button key={svc.key} type="button" onClick={() => toggleService(svc.key)} className={`relative p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer ${isSelected ? "shadow-sm" : "hover:border-[#856C42]/30"}`} style={{ borderColor: isSelected ? "#165B36" : "rgba(133,108,66,0.15)", backgroundColor: isSelected ? "rgba(22,91,54,0.04)" : "#FFFDF8" }}>
                            <div className="flex items-start justify-between gap-1">
                              <p className={`text-xs font-medium leading-tight ${isSelected ? "text-[#165B36]" : "text-[#052413]"}`}>{svc.label}</p>
                              <div className="flex items-center gap-0.5 flex-shrink-0">
                                <HelpTooltip text={svc.help} />
                                {isSelected && <Check className="w-3.5 h-3.5 text-[#165B36]" />}
                              </div>
                            </div>
                            <p className="text-[0.6rem] text-[#856C42]/70 mt-0.5 leading-tight">{svc.desc}</p>
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[0.6rem] text-[#856C42]/50 mt-3">"Pacote completo" inclui todos os serviços. Selecionar outro desmarca o pacote completo.</p>
                  </motion.div>
                )}

                {/* Step 2: Formato */}
                {step === 2 && (
                  <motion.div key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2 }} className="space-y-3">
                    <p className="text-xs text-[#856C42] mb-1">Escolha o formato e especificações do livro</p>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="flex items-center text-xs font-medium text-[#052413] mb-1.5">
                          Formato do livro
                          <HelpTooltip text="É o tamanho das páginas. O mais comum para livros de texto é o A5 (14x21 cm). Se não tem certeza, pode deixar o A5 mesmo — ajustamos depois." />
                        </label>
                        <select value={format} onChange={(e) => setFormat(e.target.value)} className={ic + " cursor-pointer"} style={is}>
                          {FORMAT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="flex items-center text-xs font-medium text-[#052413] mb-1.5">
                          Páginas estimadas
                          <HelpTooltip text="Quantas páginas você acha que o livro vai ter? Não precisa ser exato — é só para termos uma ideia do tamanho." />
                        </label>
                        <input type="number" value={pageCount} onChange={(e) => setPageCount(e.target.value)} placeholder="Ex.: 200" min={1} className={ic} style={is} />
                      </div>
                    </div>
                    {format === "personalizado" && (
                      <div>
                        <label className="flex items-center text-xs font-medium text-[#052413] mb-1.5">
                          Formato personalizado
                          <HelpTooltip text="Descreva o tamanho desejado em centímetros, por exemplo: 13x20 cm." />
                        </label>
                        <input type="text" value={customFormat} onChange={(e) => setCustomFormat(e.target.value)} placeholder="Ex.: 13x20 cm, quadrado 25x25 cm..." className={ic} style={is} />
                        </div>
                      )}
                      <div>
                        <label className="flex items-center text-xs font-medium text-[#052413] mb-1.5">
                          Observações adicionais
                          <HelpTooltip text="Qualquer informação extra: referências visuais, preferência de cores, prazo desejado, etc." />
                        </label>
                        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Referências de estilo, preferências tipográficas, prazos..." rows={2} className={ic + " resize-none"} style={is} />
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3: Arquivos */}
                  {step === 3 && (
                    <motion.div key="step3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2 }}>
                      <p className="flex items-center text-xs text-[#856C42] mb-3">
                        Envie o manuscrito e materiais de apoio *
                        <HelpTooltip text="Precisamos do texto do seu livro (Word, PDF, etc) para avaliar e preparar o orçamento. Sem o manuscrito não conseguimos calcular o valor." />
                      </p>
                      <div
                        className={`relative rounded-xl border-2 border-dashed p-6 text-center transition-colors duration-200 cursor-pointer ${dragOver ? "border-[#165B36] bg-[#165B36]/[0.03]" : "border-[#856C42]/20 hover:border-[#856C42]/40"}`}
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <input ref={fileInputRef} type="file" multiple accept={ACCEPTED_FILE_TYPES} onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }} className="hidden" />
                        <Upload className="w-7 h-7 text-[#856C42]/30 mx-auto mb-2" />
                        <p className="text-xs text-[#052413]">Arraste arquivos aqui ou <span className="text-[#165B36] font-medium">clique para selecionar</span></p>
                        <p className="text-[0.6rem] text-[#856C42]/50 mt-1">Word, PDF, TXT, RTF, ODT, InDesign, imagens, ZIP — máx. 50 MB/arquivo</p>
                      </div>

                      {files.length > 0 && (
                        <div className="mt-3 space-y-1.5 max-h-[120px] overflow-y-auto">
                          {files.map((file, idx) => (
                            <div key={`${file.name}-${idx}`} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: "#F0E8D4" }}>
                              <FileText className="w-4 h-4 text-[#165B36] flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs text-[#052413] truncate">{file.name}</p>
                                <p className="text-[0.6rem] text-[#856C42]/60">{formatFileSize(file.size)}</p>
                              </div>
                              <button type="button" onClick={(e) => { e.stopPropagation(); removeFile(idx); }} className="p-1 rounded text-[#856C42]/40 hover:text-[#d4183d] hover:bg-[#d4183d]/5 transition-colors cursor-pointer">
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
                  <div className="flex items-center gap-2 text-sm text-[#d4183d] p-3 rounded-lg mt-3" style={{ backgroundColor: "rgba(212,24,61,0.05)" }}>
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 pb-6 pt-3 flex items-center justify-between gap-3 border-t" style={{ borderColor: "rgba(133,108,66,0.08)" }}>
                <button type="button" onClick={step === 0 ? () => navigate(-1) : handleBack} className="px-4 py-2.5 rounded-xl text-sm text-[#856C42] hover:bg-[#F0E8D4] transition-colors cursor-pointer">
                  {step === 0 ? "Voltar" : "Anterior"}
                </button>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5 mr-2">
                    {WIZARD_STEPS.map((_, i) => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full transition-colors" style={{ backgroundColor: i <= step ? "#165B36" : "rgba(133,108,66,0.15)" }} />
                    ))}
                  </div>
                  {step < totalSteps - 1 ? (
                    <button type="button" onClick={handleNext} disabled={!canAdvance()} className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed" style={{ background: "linear-gradient(135deg, #165B36, #052413)" }}>
                      Próximo <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <GoldButton onClick={handleSubmit} disabled={files.length === 0 || submitting} className={`px-5 py-2.5 text-sm font-semibold ${submitting || files.length === 0 ? "opacity-70 pointer-events-none" : ""}`}>
                      {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />{uploadProgress || "Enviando..."}</> : <><Send className="w-4 h-4" />Enviar solicitação</>}
                    </GoldButton>
                  )}
                </div>
              </div>
            </div>

            {/* Extra info */}
            <p className="text-center text-[0.65rem] text-[#856C42]/60 mt-4">
              {user
                ? "Ao enviar, você concorda com nossos termos de serviço. Responderemos em até 2 dias úteis."
                : "Você poderá criar uma conta ou fazer login na hora de enviar. Seus dados do formulário ficam salvos."}
            </p>
          </motion.div>
      </div>
    </div>
  );
}
