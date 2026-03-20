import { useState, useEffect, useMemo, useCallback, forwardRef } from "react";
import { Link, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft, BookOpen, CheckCircle, ChevronRight, Clock, CreditCard,
  Download, Edit3, Eye, FileText, Folder, LayoutGrid, Loader2,
  LogOut, Mail, Package, Plus, Receipt, Save, Search, Send, Upload, X,
  Info, Files, Wallet, ScrollText, ExternalLink, Calendar
} from "lucide-react";
import { GoldButton } from "./GoldButton";
import { useUserAuth } from "./UserAuthContext";
import { getUserProjects, userConfirmPayment, getReviewFiles, getUserProject, approveReview, getUserInvoices, getContractPdfUrl, getUserInstallments } from "../data/api";
import { NewRequestForm } from "./NewRequestForm";
import { toast } from "sonner";
import { FileViewer, isViewableFile } from "./account/FileViewer";

// ============================================
// Types
// ============================================
interface ProjectStep { status: string; date: string; note: string; }

interface Project {
  id: string;
  title: string;
  author: string;
  description: string;
  pageCount: number | null;
  format: string;
  notes: string;
  status: string;
  steps: ProjectStep[];
  fileUrl: string | null;
  budget?: {
    description: string;
    price: number;
    depositPercent?: number;
    chargeAmount?: number;
    paymentUrl: string;
    status: string;
    paidAt: string | null;
    remainderStatus?: string;
    remainderPaidAt?: string | null;
    remainderPaymentUrl?: string;
    remainderAmount?: number;
    contractAcceptance?: {
      acceptedAt: string;
      acceptorName: string;
      contractVersion: string;
    } | null;
    contractPdfPath?: string;
    contractPdfName?: string;
    installmentPlan?: {
      enabled: boolean;
      totalInstallments: number;
      installments: {
        number: number;
        amount: number;
        dueDate: string;
        status: string;
        paidAt?: string;
        pixCode?: string;
        pixQrCode?: string;
        generatedAt?: string;
      }[];
      createdAt: string;
    } | null;
  } | null;
  reviewFiles?: { name: string; size: number; path: string; uploadedAt: string }[];
  uploadedFiles?: { name: string; size: number; path: string; url?: string | null; uploadedAt: string }[];
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Shared constants & helpers
// ============================================
const STATUS_FLOW = [
  { key: "solicitado", label: "Solicitado", icon: Send },
  { key: "analise", label: "Analise", icon: Search },
  { key: "orcamento", label: "Orcamento", icon: FileText },
  { key: "producao", label: "Producao", icon: LayoutGrid },
  { key: "revisao", label: "Revisao", icon: Eye },
  { key: "ajustes", label: "Ajustes", icon: Edit3 },
  { key: "concluido", label: "Concluido", icon: CheckCircle },
];

const FORMAT_LABELS: Record<string, string> = {
  A5: "A5 (14x21 cm)", "14x21": "14x21 cm", "15.5x22.5": "15,5x22,5 cm",
  "16x23": "16x23 cm", "17x24": "17x24 cm", A4: "A4 (21x29,7 cm)",
  "21x28": "21x28 cm", pocket: "Pocket (12x18 cm)", quadrado: "Quadrado (21x21 cm)",
  infantil_paisagem: "Infantil paisagem (28x21 cm)", infantil_quadrado: "Infantil quadrado (24x24 cm)",
  letter: "Letter (21,6x27,9 cm)", personalizado: "Personalizado",
};

const f = { play: "'Playfair Display', serif", inter: "Inter, sans-serif" };

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}
function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function formatCurrency(v: number): string {
  return `R$ ${v.toFixed(2).replace(".", ",")}`;
}
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getStatusLabel(status: string): string {
  return STATUS_FLOW.find((s) => s.key === status)?.label || status;
}

function getStatusColor(status: string): string {
  if (status === "concluido") return "#0a7c3e";
  if (["producao", "revisao", "ajustes"].includes(status)) return "#165B36";
  if (status === "orcamento") return "#EBBF74";
  return "#856C42";
}

// ============================================
// Progress Bar (compact, horizontal-only)
// ============================================
function ProgressBar({ project }: { project: Project }) {
  const currentIdx = STATUS_FLOW.findIndex((s) => s.key === project.status);
  const progress = currentIdx >= 0 ? ((currentIdx + 1) / STATUS_FLOW.length) * 100 : 0;
  const isPaid = project.budget && (project.budget.status === "paid" || project.budget.status === "fully_paid");
  const hasDeposit = project.budget?.depositPercent && project.budget.depositPercent > 0 && project.budget.depositPercent < 100;
  const isRemainderPaid = hasDeposit && project.budget?.remainderStatus === "paid";
  const isFullyPaid = isPaid && (!hasDeposit || isRemainderPaid);
  const isRemainderPending = hasDeposit && isPaid && project.budget?.remainderStatus !== "paid";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span
          className="inline-flex items-center gap-1.5 text-xs font-medium"
          style={{ fontFamily: f.inter, color: getStatusColor(project.status) }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getStatusColor(project.status) }} />
          {getStatusLabel(project.status)}
        </span>
        <div className="flex items-center gap-2">
          {/* Financial milestone badge */}
          {isFullyPaid && (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[0.5rem] font-semibold text-[#0a7c3e]"
              style={{ backgroundColor: "rgba(10,124,62,0.08)", fontFamily: f.inter }}
            >
              <CheckCircle className="w-2.5 h-2.5" />
              Pago total
            </span>
          )}
          {isRemainderPending && (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[0.5rem] font-semibold text-[#856C42]"
              style={{ backgroundColor: "rgba(235,191,116,0.15)", fontFamily: f.inter }}
            >
              <CreditCard className="w-2.5 h-2.5" />
              Restante pendente
            </span>
          )}
          <span className="text-[0.6rem] text-[#856C42]/50" style={{ fontFamily: f.inter }}>
            {currentIdx + 1}/{STATUS_FLOW.length}
          </span>
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-[#F0E8D4] overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: "linear-gradient(90deg, #165B36, #EBBF74)" }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
      {/* Step dots */}
      <div className="flex items-center gap-0.5">
        {STATUS_FLOW.map((step, i) => {
          const done = i <= currentIdx;
          const isCurrent = i === currentIdx;
          return (
            <div key={step.key} className="flex-1 flex flex-col items-center group relative">
              <div
                className="w-2 h-2 rounded-full transition-all"
                style={{
                  backgroundColor: done ? "#165B36" : "#E8DFC8",
                  transform: isCurrent ? "scale(1.25)" : undefined,
                  boxShadow: isCurrent ? "0 0 0 2px #FFFDF8, 0 0 0 4px rgba(22,91,54,0.2)" : undefined,
                }}
              />
              <span
                className="text-[0.5rem] mt-1 text-center leading-tight hidden sm:block"
                style={{ fontFamily: f.inter, color: done ? "#052413" : "#856C42" + "60", fontWeight: isCurrent ? 600 : 400 }}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// Project Card (compact, clear hierarchy)
// ============================================
const ProjectCard = forwardRef<HTMLButtonElement, { project: Project; onSelect: (p: Project) => void }>(
  ({ project, onSelect }, ref) => {
    const isComplete = project.status === "concluido";
    const hasPendingPayment = project.budget && project.budget.status !== "paid" && project.budget.status !== "fully_paid";
    const currentIdx = STATUS_FLOW.findIndex((s) => s.key === project.status);
    const hasDeposit = project.budget?.depositPercent && project.budget.depositPercent > 0 && project.budget.depositPercent < 100;
    const isRemainderPaid = hasDeposit && project.budget?.remainderStatus === "paid";
    const isRemainderPending = hasDeposit && (project.budget?.status === "paid" || project.budget?.status === "fully_paid") && project.budget?.remainderStatus !== "paid";
    const hasRemainderUrl = isRemainderPending && !!project.budget?.remainderPaymentUrl;

    return (
      <motion.button
        ref={ref}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        transition={{ duration: 0.25 }}
        onClick={() => onSelect(project)}
        className={`w-full text-left rounded-2xl p-4 transition-shadow hover:shadow-lg cursor-pointer group ${isComplete ? "opacity-80 hover:opacity-100" : ""}`}
        style={{
          backgroundColor: isComplete ? "#f8fdf8" : "#FFFDF8",
          borderWidth: 1,
          borderColor: isComplete ? "rgba(10,124,62,0.2)" : hasPendingPayment ? "rgba(235,191,116,0.35)" : "rgba(133,108,66,0.12)",
        }}
      >
        {/* Title row */}
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className="min-w-0 flex-1">
            <h3 className="text-[0.95rem] text-[#052413] truncate leading-snug" style={{ fontFamily: f.play }}>{project.title}</h3>
            <p className="text-[0.7rem] text-[#856C42]/70 mt-0.5 truncate" style={{ fontFamily: f.inter }}>
              {project.author} · {formatDate(project.createdAt)}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-[#856C42]/30 group-hover:text-[#856C42]/60 transition-colors flex-shrink-0 mt-0.5" />
        </div>

        {/* Mini progress */}
        <div className="flex gap-0.5 mb-3">
          {STATUS_FLOW.map((s, i) => (
            <div
              key={s.key}
              className="h-1 flex-1 rounded-full transition-colors"
              style={{ backgroundColor: i <= currentIdx ? "#165B36" : "#F0E8D4" }}
            />
          ))}
        </div>

        {/* Footer: status + actions */}
        <div className="flex items-center justify-between">
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.6rem] font-medium"
            style={{ fontFamily: f.inter, color: getStatusColor(project.status), backgroundColor: `${getStatusColor(project.status)}10` }}
          >
            <span className="w-1 h-1 rounded-full" style={{ backgroundColor: getStatusColor(project.status) }} />
            {getStatusLabel(project.status)}
          </span>

          <div className="flex items-center gap-1.5">
            {hasPendingPayment && (
              <a
                href={project.budget?.installmentPlan?.enabled ? `/parcelas/${project.id}` : `/pagamento/${project.id}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[0.6rem] font-semibold text-[#052413] hover:shadow-sm transition-all"
                style={{ background: "linear-gradient(135deg, #EBBF74, #d4a84a)", fontFamily: f.inter }}
              >
                {project.budget?.installmentPlan?.enabled ? <Calendar className="w-3 h-3" /> : <CreditCard className="w-3 h-3" />}
                {project.budget?.installmentPlan?.enabled ? "Parcelas" : "Pagar"}
              </a>
            )}
            {hasRemainderUrl && (
              <a
                href={project.budget!.remainderPaymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[0.6rem] font-semibold text-[#052413] hover:shadow-sm transition-all"
                style={{ background: "linear-gradient(135deg, #EBBF74, #d4a84a)", fontFamily: f.inter }}
              >
                <CreditCard className="w-3 h-3" />
                Pagar restante
              </a>
            )}
            {isRemainderPaid && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.55rem] font-medium text-[#0a7c3e]"
                style={{ backgroundColor: "rgba(10,124,62,0.08)", fontFamily: f.inter }}
              >
                <CheckCircle className="w-2.5 h-2.5" />
                Pago total
              </span>
            )}
            {project.uploadedFiles && project.uploadedFiles.length > 0 && (
              <span className="flex items-center gap-0.5 text-[#856C42]/40" title={`${project.uploadedFiles.length} arquivo(s)`}>
                <Upload className="w-3 h-3" />
                <span className="text-[0.55rem]">{project.uploadedFiles.length}</span>
              </span>
            )}
            {isComplete && <CheckCircle className="w-3.5 h-3.5 text-[#0a7c3e]" />}
          </div>
        </div>
      </motion.button>
    );
  }
);
ProjectCard.displayName = "ProjectCard";

// ============================================
// Detail Tab: Overview
// ============================================
function TabOverview({ project }: { project: Project }) {
  const isPaid = project.budget && (project.budget.status === "paid" || project.budget.status === "fully_paid");
  const hasDeposit = project.budget?.depositPercent && project.budget.depositPercent > 0 && project.budget.depositPercent < 100;
  const isRemainderPaid = hasDeposit && project.budget?.remainderStatus === "paid";
  const isFullyPaid = isPaid && (!hasDeposit || isRemainderPaid);

  return (
    <div className="space-y-4">
      <ProgressBar project={project} />

      {/* Financial milestone card (shows when there's a notable financial event) */}
      {isFullyPaid && hasDeposit && (
        <div
          className="p-3 rounded-xl flex items-center gap-3"
          style={{ backgroundColor: "rgba(10,124,62,0.04)", borderWidth: 1, borderColor: "rgba(10,124,62,0.15)" }}
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(10,124,62,0.1)" }}>
            <CheckCircle className="w-4 h-4 text-[#0a7c3e]" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#0a7c3e]" style={{ fontFamily: f.inter }}>Pagamento total concluido</p>
            <p className="text-[0.6rem] text-[#856C42]/70" style={{ fontFamily: f.inter }}>
              Entrada + restante de {formatCurrency(project.budget!.price)} confirmados.
              {project.budget?.remainderPaidAt && ` Restante pago em ${formatDateTime(project.budget.remainderPaidAt)}.`}
            </p>
          </div>
        </div>
      )}

      {/* Quick info grid */}
      <div className="grid grid-cols-2 gap-2">
        {project.format && (
          <InfoChip label="Formato" value={FORMAT_LABELS[project.format] || project.format} />
        )}
        {project.pageCount && (
          <InfoChip label="Paginas est." value={String(project.pageCount)} />
        )}
        <InfoChip label="Criado em" value={formatDate(project.createdAt)} />
        <InfoChip label="Atualizado" value={formatDate(project.updatedAt)} />
      </div>

      {project.description && (
        <div className="p-3 rounded-xl bg-[#F0E8D4]/50">
          <p className="text-[0.6rem] uppercase tracking-wider text-[#856C42]/70 mb-1" style={{ fontFamily: f.inter }}>Descricao</p>
          <p className="text-sm text-[#052413] leading-relaxed" style={{ fontFamily: f.inter }}>{project.description}</p>
        </div>
      )}

      {project.notes && (
        <div className="p-3 rounded-xl bg-[#F0E8D4]/50">
          <p className="text-[0.6rem] uppercase tracking-wider text-[#856C42]/70 mb-1" style={{ fontFamily: f.inter }}>Observacoes</p>
          <p className="text-sm text-[#052413] leading-relaxed" style={{ fontFamily: f.inter }}>{project.notes}</p>
        </div>
      )}

      {/* Timeline */}
      <div>
        <p className="text-[0.6rem] uppercase tracking-wider text-[#856C42]/70 mb-2" style={{ fontFamily: f.inter }}>Historico</p>
        <div className="space-y-0 pl-1">
          {project.steps.map((step, i) => (
            <div key={i} className="flex gap-2.5">
              <div className="flex flex-col items-center">
                <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: "#165B36" }} />
                {i < project.steps.length - 1 && <div className="w-px flex-1 min-h-5" style={{ backgroundColor: "rgba(22,91,54,0.15)" }} />}
              </div>
              <div className="pb-2.5 min-w-0">
                <p className="text-xs text-[#052413] font-medium" style={{ fontFamily: f.inter }}>{getStatusLabel(step.status)}</p>
                <p className="text-[0.6rem] text-[#856C42]/50 truncate" style={{ fontFamily: f.inter }}>
                  {formatDateTime(step.date)}{step.note && ` — ${step.note}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2.5 rounded-xl bg-[#F0E8D4]/40">
      <p className="text-[0.55rem] uppercase tracking-wider text-[#856C42]/60 mb-0.5" style={{ fontFamily: f.inter }}>{label}</p>
      <p className="text-xs text-[#052413] font-medium" style={{ fontFamily: f.inter }}>{value}</p>
    </div>
  );
}

// ============================================
// Detail Tab: Files
// ============================================
function TabFiles({
  project,
  onViewFile,
}: {
  project: Project;
  onViewFile: (file: { name: string; url: string }) => void;
}) {
  const [reviewFiles, setReviewFiles] = useState<{ name: string; size: number; url: string | null; uploadedAt: string }[]>([]);
  const [loadingReview, setLoadingReview] = useState(false);

  const showReview = ["revisao", "ajustes", "concluido"].includes(project.status);

  useEffect(() => {
    if (!showReview) return;
    let cancelled = false;
    (async () => {
      try {
        setLoadingReview(true);
        const data = await getReviewFiles(project.id);
        if (!cancelled) setReviewFiles(data.files || []);
      } catch (err) {
        console.error("Error loading review files:", err);
      } finally {
        if (!cancelled) setLoadingReview(false);
      }
    })();
    return () => { cancelled = true; };
  }, [project.id, showReview]);

  const uploaded = project.uploadedFiles || [];
  const hasContent = uploaded.length > 0 || (showReview && (loadingReview || reviewFiles.length > 0));

  if (!hasContent) {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <Folder className="w-10 h-10 text-[#856C42]/20 mb-3" />
        <p className="text-sm text-[#856C42]/60" style={{ fontFamily: f.inter }}>Nenhum arquivo neste projeto</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Uploaded files */}
      {uploaded.length > 0 && (
        <FileGroup
          title="Seus arquivos"
          icon={<Upload className="w-4 h-4 text-[#856C42]" />}
          count={uploaded.length}
          files={uploaded.map((f) => ({ name: f.name, size: f.size, uploadedAt: f.uploadedAt, url: f.url || null }))}
          onView={onViewFile}
        />
      )}

      {/* Review files */}
      {showReview && (
        loadingReview ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-[#165B36]" />
          </div>
        ) : reviewFiles.length > 0 ? (
          <FileGroup
            title="Arquivos para revisao"
            icon={<Eye className="w-4 h-4 text-[#165B36]" />}
            count={reviewFiles.length}
            files={reviewFiles}
            onView={onViewFile}
            accent="green"
          />
        ) : (
          <div className="p-3 rounded-xl border border-dashed" style={{ borderColor: "rgba(22,91,54,0.15)" }}>
            <p className="text-xs text-[#856C42]/50 text-center" style={{ fontFamily: f.inter }}>Nenhum arquivo de revisao enviado ainda</p>
          </div>
        )
      )}

      {/* Final file */}
      {project.status === "concluido" && project.fileUrl && (
        <div
          className="rounded-xl p-4 border-2"
          style={{ borderColor: "rgba(10,124,62,0.2)", background: "linear-gradient(135deg, rgba(10,124,62,0.04), rgba(235,191,116,0.06))" }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(10,124,62,0.1)" }}>
              <Download className="w-4.5 h-4.5 text-[#0a7c3e]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#052413]" style={{ fontFamily: f.inter }}>Arquivo final pronto!</p>
              <p className="text-[0.65rem] text-[#856C42]" style={{ fontFamily: f.inter }}>Sua diagramacao foi finalizada</p>
            </div>
          </div>
          <a
            href={project.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #165B36, #052413)", fontFamily: f.inter }}
          >
            <Download className="w-4 h-4" />
            Baixar arquivo final
          </a>
        </div>
      )}
    </div>
  );
}

function FileGroup({
  title,
  icon,
  count,
  files,
  onView,
  accent = "gold",
}: {
  title: string;
  icon: React.ReactNode;
  count: number;
  files: { name: string; size: number; uploadedAt: string; url: string | null }[];
  onView: (file: { name: string; url: string }) => void;
  accent?: "gold" | "green";
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-medium text-[#052413]" style={{ fontFamily: f.inter }}>{title}</span>
        <span className="text-[0.55rem] px-1.5 py-0.5 rounded-full font-medium bg-[#F0E8D4] text-[#856C42]" style={{ fontFamily: f.inter }}>{count}</span>
      </div>
      <div className="space-y-1.5">
        {files.map((file, idx) => (
          <div key={idx} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/70 border border-[#F0E8D4]/50">
            <FileText className={`w-4 h-4 flex-shrink-0 ${accent === "green" ? "text-[#165B36]" : "text-[#856C42]"}`} />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-[#052413] truncate font-medium" style={{ fontFamily: f.inter }}>{file.name}</p>
              <p className="text-[0.55rem] text-[#856C42]/50" style={{ fontFamily: f.inter }}>
                {formatFileSize(file.size)} · {formatDate(file.uploadedAt)}
              </p>
            </div>
            {file.url && (
              <div className="flex items-center gap-1 flex-shrink-0">
                {isViewableFile(file.name) && (
                  <button
                    onClick={() => onView({ name: file.name, url: file.url! })}
                    className="p-1.5 rounded-lg text-[#856C42]/60 hover:text-[#856C42] hover:bg-[#F0E8D4]/60 transition-colors cursor-pointer"
                    title="Visualizar"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                )}
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg text-[#856C42]/60 hover:text-[#165B36] hover:bg-[#165B36]/5 transition-colors"
                  title="Baixar"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// Contract Link (discrete)
// ============================================
function ContractLink({
  projectId,
  contract,
  hasPdf,
  pdfName,
}: {
  projectId: string;
  contract: { acceptedAt: string; acceptorName: string; contractVersion: string };
  hasPdf: boolean;
  pdfName?: string;
}) {
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const data = await getContractPdfUrl(projectId);
      if (data.url) {
        window.open(data.url, "_blank");
      } else {
        toast.error("Contrato PDF indisponível");
      }
    } catch {
      toast.error("Erro ao obter contrato");
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="flex items-center gap-2.5 py-2 border-t border-b" style={{ borderColor: "rgba(133,108,66,0.06)" }}>
      <ScrollText className="w-3.5 h-3.5 text-[#856C42]/40 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-[0.65rem] text-[#856C42]/60" style={{ fontFamily: f.inter }}>
          Contrato aceito em {formatDate(contract.acceptedAt)} por {contract.acceptorName}
        </p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <Link
          to={`/contrato/${projectId}`}
          target="_blank"
          className="p-1.5 rounded-lg text-[#856C42]/40 hover:text-[#165B36] hover:bg-[#165B36]/5 transition-colors"
          title="Visualizar contrato"
        >
          <ExternalLink className="w-3 h-3" />
        </Link>
        {hasPdf && (
          <button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="p-1.5 rounded-lg text-[#856C42]/40 hover:text-[#165B36] hover:bg-[#165B36]/5 transition-colors cursor-pointer disabled:opacity-30"
            title={pdfName ? `Baixar ${pdfName}` : "Baixar contrato PDF"}
          >
            {downloadingPdf ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================
// Installment Plan Client Component
// ============================================
function InstallmentPlanClient({ installmentPlan, totalPrice, projectId, depositPaid, hasDeposit }: {
  installmentPlan: NonNullable<NonNullable<Project["budget"]>["installmentPlan"]>;
  totalPrice: number;
  projectId: string;
  depositPaid?: boolean;
  hasDeposit?: boolean;
}) {
  const [copiedPix, setCopiedPix] = useState<number | null>(null);

  const paidCount = installmentPlan.installments.filter((i) => i.status === "paid").length;
  const allPaid = paidCount === installmentPlan.totalInstallments;
  const paidAmount = installmentPlan.installments.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0);
  // Use sum of installment amounts (covers only remainder after deposit)
  const installmentTotal = installmentPlan.installments.reduce((s, i) => s + i.amount, 0);
  const pendingAmount = Math.round((installmentTotal - paidAmount) * 100) / 100;
  const pendingCount = installmentPlan.totalInstallments - paidCount;
  const progressPercent = installmentTotal > 0 ? (paidAmount / installmentTotal) * 100 : 0;

  const formatDateBR = (d: string) => {
    try { return new Date(d + "T12:00:00").toLocaleDateString("pt-BR"); } catch { return d; }
  };

  const handleCopyPix = (num: number, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedPix(num);
    toast.success("Código PIX copiado!");
    setTimeout(() => setCopiedPix(null), 3000);
  };

  const currentInst = installmentPlan.installments.find(i => i.status !== "paid" && i.pixCode);

  return (
    <div className="rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: allPaid ? "rgba(10,124,62,0.2)" : "rgba(235,191,116,0.25)" }}>
      <div className="px-4 py-3 flex items-center justify-between" style={{ background: allPaid ? "linear-gradient(135deg, rgba(10,124,62,0.04), rgba(10,124,62,0.08))" : "linear-gradient(135deg, rgba(235,191,116,0.08), rgba(133,108,66,0.04))" }}>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" style={{ color: allPaid ? "#0a7c3e" : "#856C42" }} />
          <span className="text-xs font-semibold text-[#052413]" style={{ fontFamily: f.inter }}>Parcelamento PIX — {installmentPlan.totalInstallments}x</span>
        </div>
        <span className="text-[0.6rem] font-medium px-2 py-0.5 rounded-full" style={{
          fontFamily: f.inter,
          backgroundColor: allPaid ? "rgba(10,124,62,0.1)" : "rgba(235,191,116,0.2)",
          color: allPaid ? "#0a7c3e" : "#856C42"
        }}>
          {paidCount}/{installmentPlan.totalInstallments} pagas
        </span>
      </div>

      {/* Progress bar */}
      <div className="px-4 pt-3">
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(133,108,66,0.08)" }}>
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${progressPercent}%`, background: "linear-gradient(90deg, #165B36, #0a7c3e)" }} />
        </div>
      </div>

      {/* Summary */}
      <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottomWidth: 1, borderColor: "rgba(133,108,66,0.08)" }}>
        <span className="text-xs text-[#856C42]/70 font-medium" style={{ fontFamily: f.inter }}>Pago: <strong className="text-[#052413]">R$ {paidAmount.toFixed(2).replace(".", ",")}</strong></span>
        {!allPaid && <span className="text-xs text-[#856C42] font-bold" style={{ fontFamily: f.inter }}>Restante: R$ {pendingAmount.toFixed(2).replace(".", ",")}</span>}
        {allPaid && <span className="text-xs text-[#0a7c3e] font-bold" style={{ fontFamily: f.inter }}>Totalmente pago!</span>}
      </div>

      {/* Installment list with inline actions */}
      <div className="p-3 space-y-1.5">
        {installmentPlan.installments.map((inst) => {
          const isPaid = inst.status === "paid";
          const isOverdue = !isPaid && new Date(inst.dueDate + "T23:59:59") < new Date();
          const isNext = !isPaid && installmentPlan.installments.filter((i) => i.status !== "paid").indexOf(inst) === 0;
          const hasPix = isNext && !!inst.pixCode;

          return (
            <div
              key={inst.number}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
              style={{
                background: isPaid ? "rgba(10,124,62,0.03)" : isNext ? "rgba(22,91,54,0.04)" : "transparent",
                borderWidth: isNext ? 1 : 0,
                borderColor: isNext ? "rgba(22,91,54,0.12)" : "transparent",
              }}
            >
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[0.5rem] font-bold" style={{
                backgroundColor: isPaid ? "rgba(10,124,62,0.1)" : isOverdue ? "rgba(239,68,68,0.1)" : isNext ? "rgba(22,91,54,0.12)" : "rgba(133,108,66,0.08)",
                color: isPaid ? "#0a7c3e" : isOverdue ? "#dc2626" : isNext ? "#165B36" : "#856C42",
              }}>
                {isPaid ? <CheckCircle className="w-2.5 h-2.5" /> : inst.number}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-semibold ${isNext ? "text-[#052413]" : "text-[#052413]/80"}`} style={{ fontFamily: f.inter }}>R$ {inst.amount.toFixed(2).replace(".", ",")}</span>
                  {isPaid && <span className="text-[0.5rem] px-1 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold" style={{ fontFamily: f.inter }}>Pago</span>}
                  {isOverdue && <span className="text-[0.5rem] px-1 py-0.5 rounded-full bg-red-100 text-red-600 font-semibold" style={{ fontFamily: f.inter }}>Vencida</span>}
                  {isNext && !isOverdue && <span className="text-[0.5rem] px-1 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold" style={{ fontFamily: f.inter }}>Próxima</span>}
                </div>
              </div>
              <span className="text-[0.6rem] text-[#856C42]/50 flex-shrink-0" style={{ fontFamily: f.inter }}>
                {formatDateBR(inst.dueDate)}
                {isPaid && inst.paidAt ? " ✓" : ""}
              </span>
              {hasPix && (
                <button
                  onClick={() => handleCopyPix(inst.number, inst.pixCode!)}
                  className="px-2 py-1 rounded-md text-[0.55rem] font-medium transition-all cursor-pointer flex-shrink-0"
                  style={{
                    fontFamily: f.inter,
                    backgroundColor: copiedPix === inst.number ? "#165B36" : "rgba(22,91,54,0.08)",
                    color: copiedPix === inst.number ? "white" : "#165B36",
                  }}
                >
                  {copiedPix === inst.number ? "Copiado!" : "Copiar PIX"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Single CTA */}
      {!allPaid && (
        <div className="px-3 pb-3">
          <a
            href={`/parcelas/${projectId}`}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold text-[#052413] transition-all hover:shadow-md cursor-pointer"
            style={{ background: "linear-gradient(135deg, #EBBF74, #d4a84a)", fontFamily: f.inter }}
          >
            <CreditCard className="w-3.5 h-3.5" />
            {pendingCount > 1 ? "Pagar parcelas" : "Pagar parcela"}
          </a>
        </div>
      )}
    </div>
  );
}

// ============================================
// Detail Tab: Financial
// ============================================
function TabFinancial({ project }: { project: Project }) {
  const [invoices, setInvoices] = useState<{ name: string; size: number; description: string; uploadedAt: string; url: string | null }[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getUserInvoices(project.id);
        if (!cancelled) setInvoices(data.invoices || []);
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoadingInvoices(false);
      }
    })();
    return () => { cancelled = true; };
  }, [project.id]);

  const budget = project.budget;

  if (!budget) {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <Wallet className="w-10 h-10 text-[#856C42]/20 mb-3" />
        <p className="text-sm text-[#856C42]/60" style={{ fontFamily: f.inter }}>Orcamento ainda nao disponivel</p>
        <p className="text-xs text-[#856C42]/40 mt-1" style={{ fontFamily: f.inter }}>O orcamento sera enviado apos a analise do projeto</p>
      </div>
    );
  }

  const isPaid = budget.status === "paid" || budget.status === "fully_paid";
  const hasDeposit = !!budget.depositPercent && budget.depositPercent > 0 && budget.depositPercent < 100 && !!budget.chargeAmount;
  const remainingAmount = hasDeposit ? budget.price - budget.chargeAmount! : 0;
  const isDepositPaid = hasDeposit && isPaid;
  const isFullyPaid = isPaid && (!hasDeposit || budget.remainderStatus === "paid");
  const isRemainderPending = isDepositPaid && budget.remainderStatus !== "paid";
  const isRemainderPaid = isDepositPaid && budget.remainderStatus === "paid";

  return (
    <div className="space-y-4">
      {/* Payment status card */}
      <div
        className="rounded-xl p-4"
        style={{
          borderWidth: 1,
          borderColor: isPaid ? "rgba(10,124,62,0.2)" : "rgba(235,191,116,0.35)",
          background: isPaid
            ? "linear-gradient(135deg, rgba(10,124,62,0.04), rgba(235,191,116,0.06))"
            : "linear-gradient(135deg, rgba(235,191,116,0.08), rgba(133,108,66,0.04))",
        }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: isPaid ? "rgba(10,124,62,0.1)" : "rgba(235,191,116,0.2)" }}
          >
            {isPaid ? <CheckCircle className="w-4.5 h-4.5 text-[#0a7c3e]" /> : <CreditCard className="w-4.5 h-4.5 text-[#856C42]" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[#052413]" style={{ fontFamily: f.inter }}>
              {isFullyPaid ? "Pagamento total confirmado" : isRemainderPending ? (budget.remainderPaymentUrl ? "Restante disponivel para pagamento" : "Entrada paga — restante na entrega") : isDepositPaid ? (budget.installmentPlan?.enabled ? "Entrada paga — trabalhos iniciados" : "Entrada paga") : "Orcamento disponivel"}
            </p>
            <p className="text-[0.65rem] text-[#856C42] truncate" style={{ fontFamily: f.inter }}>{budget.description}</p>
          </div>
        </div>

        {/* Price breakdown */}
        <div className="space-y-1 mb-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/60">
            <span className="text-sm text-[#856C42] font-medium" style={{ fontFamily: f.inter }}>Valor total do servico</span>
            <span className="text-lg font-bold text-[#052413] tracking-tight" style={{ fontFamily: f.inter }}>{formatCurrency(budget.price)}</span>
          </div>

          {hasDeposit && (
            <>
              {/* Deposit line */}
              <div
                className="flex items-center justify-between px-2.5 py-2 rounded-lg"
                style={{
                  backgroundColor: isPaid ? "rgba(10,124,62,0.05)" : "rgba(22,91,54,0.03)",
                  borderWidth: 1,
                  borderColor: isPaid ? "rgba(10,124,62,0.15)" : "rgba(22,91,54,0.1)",
                }}
              >
                <div className="flex items-center gap-1.5">
                  {isPaid && <CheckCircle className="w-3 h-3 text-[#0a7c3e]" />}
                  <span className={`text-sm font-medium ${isPaid ? "text-[#0a7c3e]" : "text-[#165B36]"}`} style={{ fontFamily: f.inter }}>
                    Entrada ({budget.depositPercent}%)
                  </span>
                </div>
                <span className={`text-base font-bold tracking-tight ${isPaid ? "text-[#0a7c3e]" : "text-[#165B36]"}`} style={{ fontFamily: f.inter }}>
                  {formatCurrency(budget.chargeAmount!)}
                </span>
              </div>

              {/* Remaining balance */}
              <div
                className="flex items-center justify-between px-2.5 py-2 rounded-lg"
                style={{
                  backgroundColor: isRemainderPaid ? "rgba(10,124,62,0.05)" : isDepositPaid ? "rgba(235,191,116,0.08)" : "rgba(133,108,66,0.03)",
                  borderWidth: isDepositPaid ? 1 : 0,
                  borderColor: isRemainderPaid ? "rgba(10,124,62,0.15)" : isDepositPaid ? "rgba(235,191,116,0.2)" : "transparent",
                }}
              >
                <div className="flex items-center gap-1.5">
                  {isRemainderPaid ? <CheckCircle className="w-3 h-3 text-[#0a7c3e]" /> : isDepositPaid ? <Clock className="w-3 h-3 text-[#856C42]" /> : null}
                  <span
                    className={`text-sm font-medium ${isRemainderPaid ? "text-[#0a7c3e]" : isDepositPaid ? "text-[#856C42]" : "text-[#856C42]/50"}`}
                    style={{ fontFamily: f.inter }}
                  >
                    {isRemainderPaid ? "Restante pago" : budget.installmentPlan?.enabled ? `Parcelado em ${budget.installmentPlan.totalInstallments}x` : isDepositPaid ? "Restante a pagar" : "Restante na entrega"}
                  </span>
                </div>
                <span
                  className={`text-base font-bold tracking-tight ${isRemainderPaid ? "text-[#0a7c3e]" : isDepositPaid ? "text-[#856C42]" : "text-[#856C42]/50"}`}
                  style={{ fontFamily: f.inter }}
                >
                  {formatCurrency(remainingAmount)}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Payment status / action */}
        {isPaid ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-[#0a7c3e]" style={{ fontFamily: f.inter }}>
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium">
                {isDepositPaid ? `Entrada de ${formatCurrency(budget.chargeAmount!)} paga` : "Pagamento confirmado"}
              </span>
              {budget.paidAt && <span className="text-[0.65rem] text-[#856C42]/50 ml-1">em {formatDateTime(budget.paidAt)}</span>}
            </div>
            {isRemainderPaid && budget.remainderPaidAt && (
              <div className="flex items-center gap-2 text-xs text-[#0a7c3e] mt-1" style={{ fontFamily: f.inter }}>
                <CheckCircle className="w-3.5 h-3.5" />
                <span className="font-medium">Restante pago em {formatDateTime(budget.remainderPaidAt)}</span>
              </div>
            )}
            {isRemainderPending && budget.remainderPaymentUrl && (
              <div className="p-3 rounded-lg" style={{ backgroundColor: "rgba(235,191,116,0.1)", borderWidth: 1, borderColor: "rgba(235,191,116,0.25)" }}>
                <p className="text-[0.7rem] text-[#856C42] leading-relaxed mb-2.5" style={{ fontFamily: f.inter }}>
                  O saldo restante de <strong className="text-[#052413]">{formatCurrency(remainingAmount)}</strong> esta disponivel para pagamento.
                </p>
                <a
                  href={budget.remainderPaymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold text-[#052413] transition-all hover:shadow-md"
                  style={{ background: "linear-gradient(135deg, #EBBF74, #d4a84a)", fontFamily: f.inter }}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  Pagar restante de {formatCurrency(remainingAmount)}
                </a>
              </div>
            )}
            {isRemainderPending && !budget.remainderPaymentUrl && (
              <div className="p-2.5 rounded-lg" style={{ backgroundColor: "rgba(235,191,116,0.1)", borderWidth: 1, borderColor: "rgba(235,191,116,0.2)" }}>
                <p className="text-[0.7rem] text-[#856C42] leading-relaxed" style={{ fontFamily: f.inter }}>
                  O valor restante de <strong className="text-[#052413]">{formatCurrency(remainingAmount)}</strong> sera cobrado na entrega do projeto finalizado.
                  Voce sera notificado quando o projeto estiver pronto.
                </p>
              </div>
            )}
          </div>
        ) : budget.installmentPlan?.enabled ? null : (
          <a
            href={`/pagamento/${project.id}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-[#052413] transition-all hover:shadow-md"
            style={{ background: "linear-gradient(135deg, #EBBF74, #d4a84a)", fontFamily: f.inter }}
          >
            <CreditCard className="w-4 h-4" />
            {hasDeposit ? `Pagar entrada de ${formatCurrency(budget.chargeAmount!)}` : "Pagar agora"}
          </a>
        )}
      </div>

      {/* Contract (discrete) */}
      {budget.contractAcceptance && (
        <ContractLink projectId={project.id} contract={budget.contractAcceptance} hasPdf={!!budget.contractPdfPath} pdfName={budget.contractPdfName} />
      )}

      {/* Invoices */}
      {loadingInvoices ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-4 h-4 animate-spin text-[#856C42]/40" />
        </div>
      ) : invoices.length > 0 ? (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Receipt className="w-4 h-4 text-[#856C42]" />
            <span className="text-xs font-medium text-[#052413]" style={{ fontFamily: f.inter }}>Notas Fiscais</span>
            <span className="text-[0.55rem] px-1.5 py-0.5 rounded-full font-medium bg-[#F0E8D4] text-[#856C42]" style={{ fontFamily: f.inter }}>{invoices.length}</span>
          </div>
          <div className="space-y-1.5">
            {invoices.map((inv, idx) => (
              <div key={idx} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/70 border border-[#F0E8D4]/50">
                <Receipt className="w-3.5 h-3.5 text-[#856C42] flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-[#052413] truncate font-medium" style={{ fontFamily: f.inter }}>{inv.description || inv.name}</p>
                  <p className="text-[0.55rem] text-[#856C42]/50" style={{ fontFamily: f.inter }}>
                    {inv.name} · {formatFileSize(inv.size)} · {formatDate(inv.uploadedAt)}
                  </p>
                </div>
                {inv.url && (
                  <a
                    href={inv.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg text-[#856C42]/60 hover:text-[#165B36] hover:bg-[#165B36]/5 transition-colors"
                    title="Baixar NF"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Installment Plan */}
      {budget.installmentPlan?.enabled && budget.installmentPlan.installments?.length > 0 && (
        <InstallmentPlanClient installmentPlan={budget.installmentPlan} totalPrice={budget.price} projectId={project.id} depositPaid={isDepositPaid} hasDeposit={hasDeposit} />
      )}

      {/* Payment methods info */}
      {!isPaid && !budget.installmentPlan?.enabled && (
        <div className="pt-2 border-t" style={{ borderColor: "rgba(133,108,66,0.08)" }}>
          <p className="text-[0.6rem] text-[#856C42]/50 mb-1.5" style={{ fontFamily: f.inter }}>Meios aceitos via Mercado Pago</p>
          <div className="flex flex-wrap gap-1.5">
            {["Pix", "Credito", "Debito", "Boleto"].map((m) => (
              <span key={m} className="text-[0.6rem] px-2 py-1 rounded-lg bg-white/70 text-[#052413] font-medium" style={{ fontFamily: f.inter }}>{m}</span>
            ))}
          </div>
          <p className="text-[0.5rem] text-[#856C42]/35 mt-1" style={{ fontFamily: f.inter }}>Parcele em ate 12x no cartao de credito</p>
        </div>
      )}
    </div>
  );
}

// ============================================
// Project Detail Modal (tabbed)
// ============================================
type DetailTab = "overview" | "files" | "financial";

function ProjectDetail({ project, onClose }: { project: Project; onClose: () => void }) {
  const [liveProject, setLiveProject] = useState<Project>(project);
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");
  const [viewingFile, setViewingFile] = useState<{ name: string; url: string } | null>(null);

  // Review approval
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [approvingReview, setApprovingReview] = useState(false);
  const [reviewObservations, setReviewObservations] = useState("");
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Lock body scroll
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = original; };
  }, []);

  // Refresh project data + auto-polling every 30s
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const fetchProject = async () => {
      try {
        const data = await getUserProject(project.id, controller.signal);
        if (!cancelled && data.project) setLiveProject(data.project);
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        // Silent: polling failures are expected when edge function is temporarily unavailable
      }
    };
    fetchProject();
    const interval = setInterval(fetchProject, 30000);
    return () => { cancelled = true; controller.abort(); clearInterval(interval); };
  }, [project.id]);

  // Auto-switch to files tab if in review
  useEffect(() => {
    if (liveProject.status === "revisao") setActiveTab("files");
    else if (liveProject.budget && liveProject.budget.status !== "paid" && liveProject.budget.status !== "fully_paid") setActiveTab("financial");
  }, []);

  const handleApproveReview = async () => {
    if (!acceptTerms) return;
    setApprovingReview(true);
    try {
      await approveReview(project.id, reviewObservations.trim() || undefined);
      toast.success("Revisao aprovada! Projeto em fase de ajustes finais.");
      setTimeout(onClose, 2000);
    } catch {
      toast.error("Erro ao aprovar revisao. Tente novamente.");
    } finally {
      setApprovingReview(false);
    }
  };

  const tabs: { key: DetailTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: "overview", label: "Visao Geral", icon: <Info className="w-3.5 h-3.5" /> },
    { key: "files", label: "Arquivos", icon: <Files className="w-3.5 h-3.5" />, badge: (liveProject.uploadedFiles?.length || 0) + (liveProject.reviewFiles?.length || 0) || undefined },
    { key: "financial", label: "Financeiro", icon: <Wallet className="w-3.5 h-3.5" />, badge: (liveProject.budget && liveProject.budget.status !== "paid" && liveProject.budget.status !== "fully_paid") || (liveProject.budget && liveProject.budget.remainderPaymentUrl && liveProject.budget.remainderStatus !== "paid") ? 1 : undefined },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Detalhes: ${liveProject.title}`}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ y: 20, scale: 0.98 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 20, scale: 0.98 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg max-h-[88vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: "#FFFDF8", boxShadow: "0 25px 50px -12px rgba(5,36,19,0.25), 0 0 0 1px rgba(133,108,66,0.1)" }}
      >
        {/* Header */}
        <div className="flex-shrink-0 px-5 pt-5 pb-3 border-b" style={{ borderColor: "rgba(133,108,66,0.08)" }}>
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0">
              <h2 className="text-lg text-[#052413] leading-snug" style={{ fontFamily: f.play }}>{liveProject.title}</h2>
              <p className="text-xs text-[#856C42] mt-0.5" style={{ fontFamily: f.inter }}>{liveProject.author}</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-[#856C42]/40 hover:bg-[#F0E8D4] hover:text-[#856C42] transition-colors cursor-pointer flex-shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.7rem] font-medium transition-all cursor-pointer ${
                  activeTab === tab.key
                    ? "text-[#052413] bg-[#F0E8D4]/80"
                    : "text-[#856C42]/60 hover:text-[#856C42] hover:bg-[#F0E8D4]/30"
                }`}
                style={{ fontFamily: f.inter }}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="w-4 h-4 flex items-center justify-center rounded-full text-[0.5rem] font-bold bg-[#EBBF74]/30 text-[#856C42]">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === "overview" && <TabOverview project={liveProject} />}
              {activeTab === "files" && <TabFiles project={liveProject} onViewFile={setViewingFile} />}
              {activeTab === "financial" && <TabFinancial project={liveProject} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer action: Review approval (always visible when in review) */}
        {liveProject.status === "revisao" && (
          <div className="flex-shrink-0 px-5 py-3 border-t bg-[#165B36]/[0.02] space-y-2.5" style={{ borderColor: "rgba(22,91,54,0.12)" }}>
            {/* Observations textarea */}
            <div>
              <label className="block text-[0.6rem] text-[#856C42]/70 mb-1" style={{ fontFamily: f.inter }}>
                Observações ou solicitações de alteração <span className="text-[#856C42]/40">(opcional)</span>
              </label>
              <textarea
                value={reviewObservations}
                onChange={(e) => setReviewObservations(e.target.value)}
                placeholder="Descreva aqui qualquer observação ou solicitação de alteração antes de aprovar..."
                rows={2}
                maxLength={1000}
                className="w-full px-3 py-2 text-xs rounded-lg border resize-none focus:outline-none focus:ring-1 focus:ring-[#165B36]/30"
                style={{ fontFamily: f.inter, borderColor: "rgba(22,91,54,0.15)", backgroundColor: "rgba(255,255,255,0.7)" }}
              />
              {reviewObservations.length > 0 && (
                <p className="text-[0.5rem] text-[#856C42]/40 text-right mt-0.5" style={{ fontFamily: f.inter }}>{reviewObservations.length}/1000</p>
              )}
            </div>
            {/* Terms checkbox with link */}
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="w-3.5 h-3.5 rounded accent-[#165B36] mt-0.5 flex-shrink-0"
                id="approve-checkbox"
              />
              <label htmlFor="approve-checkbox" className="text-xs text-[#052413] cursor-pointer leading-relaxed" style={{ fontFamily: f.inter }}>
                Declaro que revisei o material entregue e aceito o projeto como está sendo entregue.{" "}
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setShowTermsModal(true); }}
                  className="text-[#165B36] underline underline-offset-2 hover:text-[#0a7c3e] cursor-pointer text-[0.65rem]"
                  style={{ fontFamily: f.inter }}
                >
                  Ler termos e condições
                </button>
              </label>
            </div>
            <button
              onClick={handleApproveReview}
              disabled={!acceptTerms || approvingReview}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-40 transition-all cursor-pointer"
              style={{ background: "linear-gradient(135deg, #165B36, #052413)", fontFamily: f.inter }}
            >
              {approvingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4" /> Aprovar revisão</>}
            </button>
          </div>
        )}

        {/* Terms modal */}
        <AnimatePresence>
          {showTermsModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4"
              onClick={() => setShowTermsModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl"
              >
                <div className="sticky top-0 bg-white px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "rgba(133,108,66,0.1)" }}>
                  <h3 className="text-sm font-semibold text-[#052413]" style={{ fontFamily: f.play }}>Termos e Condições de Aprovação</h3>
                  <button onClick={() => setShowTermsModal(false)} className="p-1 rounded-full hover:bg-gray-100 cursor-pointer"><X className="w-4 h-4 text-gray-400" /></button>
                </div>
                <div className="px-6 py-5 space-y-4 text-xs text-[#052413]/80 leading-relaxed" style={{ fontFamily: f.inter }}>
                  <p className="font-semibold text-[#052413]">Ao aprovar a revisão do projeto, o CONTRATANTE declara e concorda com os seguintes termos:</p>
                  <div className="space-y-3">
                    <p><strong>1. Aceitação do Trabalho Entregue:</strong> Ao clicar em "Aprovar revisão", o CONTRATANTE declara ter revisado integralmente o material entregue pela Editora e o aceita como está, reconhecendo que o trabalho foi executado conforme o escopo contratado.</p>
                    <p><strong>2. Conclusão da Etapa de Revisão:</strong> A aprovação encerra a etapa de revisão e inicia a fase de ajustes finais. Após a aprovação, alterações substanciais no conteúdo ou na diagramação poderão ser cobradas separadamente, conforme Cláusula 7 do contrato de prestação de serviços.</p>
                    <p><strong>3. Observações e Ressalvas:</strong> O CONTRATANTE poderá registrar observações no campo apropriado antes de aprovar. Tais observações serão consideradas pela Editora na fase de ajustes finais, dentro do escopo contratado.</p>
                    <p><strong>4. Registro Eletrônico:</strong> A aprovação será registrada eletronicamente, incluindo data, hora e identificação do usuário, servindo como comprovante de aceite nos termos da MP nº 2.200-2/2001.</p>
                    <p><strong>5. Irreversibilidade:</strong> Uma vez aprovada a revisão, o status do projeto avançará automaticamente. A reversão só será possível mediante contato direto com a Editora e poderá estar sujeita a custos adicionais.</p>
                  </div>
                  <p className="text-[0.6rem] text-[#856C42]/50 pt-2 border-t" style={{ borderColor: "rgba(133,108,66,0.1)" }}>
                    Estes termos complementam o contrato de prestação de serviços editoriais firmado entre as partes.
                  </p>
                </div>
                <div className="sticky bottom-0 bg-white px-6 py-3 border-t" style={{ borderColor: "rgba(133,108,66,0.1)" }}>
                  <button
                    onClick={() => setShowTermsModal(false)}
                    className="w-full py-2 rounded-lg text-xs font-medium text-white cursor-pointer"
                    style={{ background: "linear-gradient(135deg, #165B36, #052413)", fontFamily: f.inter }}
                  >
                    Entendi
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer action: Pay now (always visible when pending) */}
        {liveProject.budget && liveProject.budget.status !== "paid" && liveProject.budget.status !== "fully_paid" && liveProject.status !== "revisao" && (
          <div className="flex-shrink-0 px-5 py-3 border-t" style={{ borderColor: "rgba(235,191,116,0.15)" }}>
            {liveProject.budget.installmentPlan?.enabled ? (
              <a
                href={`/parcelas/${liveProject.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-[#052413] transition-all hover:shadow-md"
                style={{ background: "linear-gradient(135deg, #EBBF74, #d4a84a)", fontFamily: f.inter }}
              >
                <Calendar className="w-4 h-4" />
                {liveProject.budget!.depositPercent && liveProject.budget!.depositPercent < 100 && liveProject.budget!.chargeAmount
                  ? `PAGAR ENTRADA`
                  : "Pagar parcelas"}
              </a>
            ) : (
              <a
                href={`/pagamento/${liveProject.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-[#052413] transition-all hover:shadow-md"
                style={{ background: "linear-gradient(135deg, #EBBF74, #d4a84a)", fontFamily: f.inter }}
              >
                <CreditCard className="w-4 h-4" />
                {liveProject.budget.depositPercent && liveProject.budget.depositPercent < 100 && liveProject.budget.chargeAmount
                  ? `Pagar entrada de ${formatCurrency(liveProject.budget.chargeAmount)}`
                  : `Pagar ${formatCurrency(liveProject.budget.price)}`}
              </a>
            )}
          </div>
        )}
        {/* Footer action: Pay remainder */}
        {liveProject.budget && (liveProject.budget.status === "paid" || liveProject.budget.status === "fully_paid") && liveProject.budget.remainderPaymentUrl && liveProject.budget.remainderStatus !== "paid" && liveProject.status !== "revisao" && (() => {
          const remAmt = liveProject.budget!.remainderAmount || (liveProject.budget!.price - (liveProject.budget!.chargeAmount || 0));
          return (
            <div className="flex-shrink-0 px-5 py-3 border-t" style={{ borderColor: "rgba(235,191,116,0.15)" }}>
              <a
                href={liveProject.budget!.remainderPaymentUrl!}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-[#052413] transition-all hover:shadow-md"
                style={{ background: "linear-gradient(135deg, #EBBF74, #d4a84a)", fontFamily: f.inter }}
              >
                <CreditCard className="w-4 h-4" />
                Pagar restante de {formatCurrency(remAmt)}
              </a>
            </div>
          );
        })()}
      </motion.div>

      {/* File Viewer Overlay */}
      <AnimatePresence>
        {viewingFile && <FileViewer file={viewingFile} onClose={() => setViewingFile(null)} />}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================
// Main Page
// ============================================
export function UserAccountPage() {
  const navigate = useNavigate();
  const { user, loading, logout, updateProfile } = useUserAuth();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!loading && !user) navigate("/entrar");
  }, [user, loading, navigate]);

  useEffect(() => {
    document.title = "Minha Conta — Epoca Editora de Livros";
    return () => { document.title = "Epoca Editora de Livros — Historias que transformam"; };
  }, []);

  // Handle MercadoPago callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get("payment");
    const projectId = params.get("project");
    if (paymentStatus && projectId && user) {
      window.history.replaceState({}, "", "/minha-conta");
      if (paymentStatus === "success") {
        userConfirmPayment(projectId, "success")
          .then(() => { toast.success("Pagamento confirmado com sucesso!"); loadProjects(); })
          .catch(() => toast.error("Erro ao confirmar pagamento."));
      } else if (paymentStatus === "remainder-success") {
        toast.success("Pagamento do restante confirmado com sucesso!");
        loadProjects();
      }
    }
  }, [user, loading]);

  useEffect(() => {
    if (!loading && user) {
      setEditName(user.name);
      loadProjects();
    }
  }, [user, loading]);

  // Auto-refresh
  useEffect(() => {
    if (!user) return;
    const handleFocus = () => refreshSilent();
    window.addEventListener("focus", handleFocus);
    const interval = setInterval(refreshSilent, 30000);
    return () => { window.removeEventListener("focus", handleFocus); clearInterval(interval); };
  }, [user]);

  const loadProjects = useCallback(async () => {
    try {
      setLoadingProjects(true);
      const data = await getUserProjects();
      setProjects(data.projects || []);
    } catch {
      toast.error("Erro ao carregar projetos.");
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  const refreshSilent = useCallback(async () => {
    try {
      const data = await getUserProjects();
      setProjects(data.projects || []);
    } catch { /* silent */ }
  }, []);

  const handleSave = useCallback(async () => {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      await updateProfile(editName.trim());
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      toast.error("Erro ao atualizar perfil.");
    } finally {
      setSaving(false);
    }
  }, [editName, updateProfile]);

  const handleLogout = useCallback(async () => {
    await logout();
    navigate("/");
  }, [logout, navigate]);

  // Computed lists with search — show all projects sorted: active first, then completed
  const displayProjects = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const filtered = q
      ? projects.filter((p) => p.title.toLowerCase().includes(q) || p.author.toLowerCase().includes(q))
      : projects;
    return [...filtered].sort((a, b) => {
      const aComplete = a.status === "concluido" ? 1 : 0;
      const bComplete = b.status === "concluido" ? 1 : 0;
      if (aComplete !== bComplete) return aComplete - bComplete;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [projects, searchQuery]);

  const totalActive = projects.filter((p) => p.status !== "concluido").length;
  const totalCompleted = projects.filter((p) => p.status === "concluido").length;

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full animate-spin" style={{ borderWidth: 3, borderStyle: "solid", borderColor: "rgba(22,91,54,0.2)", borderTopColor: "#165B36" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="pt-8 pb-10 relative" style={{ background: "linear-gradient(135deg, #052413 0%, #165B36 60%, #052413 100%)" }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-10 -right-10 w-80 h-80 rounded-full opacity-[0.06]" style={{ background: "radial-gradient(circle, #EBBF74, transparent)" }} />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 w-full">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white/80 transition-colors mb-4" style={{ fontFamily: f.inter }}>
            <ArrowLeft className="w-4 h-4" />
            Voltar ao site
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <h1 className="text-2xl sm:text-3xl text-white" style={{ fontFamily: f.play }}>
              Minha <span className="italic text-[#EBBF74]">Conta</span>
            </h1>
            {/* Quick stats pills */}
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 rounded-full bg-white/10 text-white/80 text-xs" style={{ fontFamily: f.inter }}>
                <span className="font-semibold text-[#EBBF74]">{totalActive}</span> em andamento
              </div>
              <div className="px-3 py-1.5 rounded-full bg-white/10 text-white/80 text-xs" style={{ fontFamily: f.inter }}>
                <span className="font-semibold text-[#EBBF74]">{totalCompleted}</span> concluido{totalCompleted !== 1 ? "s" : ""}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid lg:grid-cols-[280px_1fr] gap-6">
          {/* Left: Profile sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-3"
          >
            {/* Profile card */}
            <div className="rounded-2xl p-4 shadow-sm" style={{ backgroundColor: "#FFFDF8", borderWidth: 1, borderColor: "rgba(133,108,66,0.12)" }}>
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-base font-semibold flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #165B36, #052413)", color: "#EBBF74", fontFamily: f.play }}
                >
                  {user.name?.[0]?.toUpperCase() || user.email[0]?.toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  {editing ? (
                    <div className="flex gap-1 items-center">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 min-w-0 px-2 py-1 rounded-lg border text-sm text-[#052413] focus:outline-none focus:ring-2 focus:ring-[#165B36]/20"
                        style={{ fontFamily: f.inter, backgroundColor: "#F0E8D4", borderColor: "rgba(133,108,66,0.2)" }}
                        autoFocus
                        onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") { setEditing(false); setEditName(user.name); } }}
                      />
                      <button onClick={handleSave} disabled={saving} className="p-1.5 rounded-lg text-white transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer" style={{ background: "linear-gradient(135deg, #165B36, #052413)" }}>
                        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <p className="text-sm font-medium text-[#052413] truncate" style={{ fontFamily: f.play }}>{user.name || "Sem nome"}</p>
                      <button onClick={() => setEditing(true)} className="p-0.5 text-[#856C42]/30 hover:text-[#165B36] transition-colors cursor-pointer"><Edit3 className="w-3 h-3" /></button>
                      {saved && <CheckCircle className="w-3 h-3 text-[#165B36]" />}
                    </div>
                  )}
                  <p className="text-[0.65rem] text-[#856C42] truncate" style={{ fontFamily: f.inter }}>{user.email}</p>
                </div>
              </div>

              <div className="space-y-1 pt-2 border-t" style={{ borderColor: "rgba(133,108,66,0.08)" }}>
                <Link to="/catalogo" className="flex items-center gap-2 p-2 rounded-lg text-xs text-[#052413] hover:bg-[#F0E8D4]/50 transition-colors" style={{ fontFamily: f.inter }}>
                  <BookOpen className="w-3.5 h-3.5 text-[#165B36]" /> Ver catalogo
                </Link>
                <a href="https://wa.me/5511999999999?text=Ol%C3%A1!%20Gostaria%20de%20saber%20mais%20sobre%20os%20servi%C3%A7os%20da%20%C3%89poca%20Editora." target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded-lg text-xs text-[#052413] hover:bg-[#F0E8D4]/50 transition-colors" style={{ fontFamily: f.inter }}>
                  <Mail className="w-3.5 h-3.5 text-[#165B36]" /> Fale conosco
                </a>
                <button onClick={handleLogout} className="w-full flex items-center gap-2 p-2 rounded-lg text-xs text-[#d4183d] hover:bg-[#d4183d]/5 transition-colors cursor-pointer" style={{ fontFamily: f.inter }}>
                  <LogOut className="w-3.5 h-3.5" /> Sair da conta
                </button>
              </div>
            </div>
          </motion.div>

          {/* Right: Projects */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="space-y-4"
          >
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#856C42]/40" />
                <input
                  type="text"
                  placeholder="Buscar projeto..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm text-[#052413] bg-white/80 focus:outline-none focus:ring-2 focus:ring-[#165B36]/15 focus:border-[#165B36]/30 transition-all"
                  style={{ fontFamily: f.inter, borderColor: "rgba(133,108,66,0.12)" }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#856C42]/40 hover:text-[#856C42] transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <GoldButton onClick={() => setShowNewForm(true)} className="px-3 py-2.5 text-xs font-semibold">
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Novo projeto</span>
              </GoldButton>
            </div>

            {/* Project list */}
            {loadingProjects ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 rounded-full animate-spin" style={{ borderWidth: 2, borderStyle: "solid", borderColor: "rgba(22,91,54,0.2)", borderTopColor: "#165B36" }} />
              </div>
            ) : displayProjects.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-2xl p-10 text-center"
                style={{ backgroundColor: "#FFFDF8", borderWidth: 1, borderColor: "rgba(133,108,66,0.12)" }}
              >
                {searchQuery ? (
                  <>
                    <Search className="w-10 h-10 text-[#856C42]/20 mx-auto mb-3" />
                    <p className="text-sm text-[#856C42]/60" style={{ fontFamily: f.inter }}>
                      Nenhum projeto encontrado para "<span className="font-medium text-[#052413]">{searchQuery}</span>"
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: "rgba(235,191,116,0.1)" }}>
                      <Package className="w-6 h-6 text-[#856C42]/30" />
                    </div>
                    <p className="text-[#052413] font-medium text-sm mb-1" style={{ fontFamily: f.play }}>Nenhum projeto ainda</p>
                    <p className="text-xs text-[#856C42]/60 mb-4" style={{ fontFamily: f.inter }}>Solicite sua diagramacao e acompanhe aqui</p>
                    <GoldButton onClick={() => setShowNewForm(true)} className="px-5 py-2.5 text-sm font-semibold">
                      <Plus className="w-4 h-4" />
                      Solicitar diagramacao
                    </GoldButton>
                  </>
                )}
              </motion.div>
            ) : (() => {
              const activeList = displayProjects.filter((p) => p.status !== "concluido");
              const completedList = displayProjects.filter((p) => p.status === "concluido");
              return (
                <div className="space-y-4">
                  {activeList.length > 0 && (
                    <>
                      {completedList.length > 0 && (
                        <p className="text-[0.65rem] font-semibold text-[#856C42]/50 uppercase tracking-wider" style={{ fontFamily: f.inter }}>
                          Em andamento ({activeList.length})
                        </p>
                      )}
                      <div className="grid sm:grid-cols-2 gap-3">
                        {activeList.map((p) => (
                          <ProjectCard key={p.id} project={p} onSelect={setSelectedProject} />
                        ))}
                      </div>
                    </>
                  )}
                  {completedList.length > 0 && (
                    <>
                      <p className="text-[0.65rem] font-semibold text-[#0a7c3e]/50 uppercase tracking-wider flex items-center gap-1.5 pt-2" style={{ fontFamily: f.inter }}>
                        <CheckCircle className="w-3 h-3" />
                        Concluidos ({completedList.length})
                      </p>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {completedList.map((p) => (
                          <ProjectCard key={p.id} project={p} onSelect={setSelectedProject} />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })()}
          </motion.div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {selectedProject && <ProjectDetail project={selectedProject} onClose={() => setSelectedProject(null)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showNewForm && <NewRequestForm onClose={() => setShowNewForm(false)} onCreated={loadProjects} />}
      </AnimatePresence>
    </div>
  );
}