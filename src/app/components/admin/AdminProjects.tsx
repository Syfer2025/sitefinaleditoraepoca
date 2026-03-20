import { useState, useEffect, useRef } from "react";
import {
  Search,
  Eye,
  Edit3,
  Trash2,
  CheckCircle,
  Clock,
  Send,
  LayoutGrid,
  ChevronDown,
  ChevronRight,
  X,
  Link as LinkIcon,
  Save,
  AlertCircle,
  FileText,
  User,
  Loader2,
  CreditCard,
  Upload,
  DollarSign,
  ExternalLink,
  Copy,
  Check,
  ScrollText,
  Download,
  Shield,
  BookOpen,
  Banknote,
  FolderOpen,
  StickyNote,
  Calendar,
  Mail,
  Hash,
  Plus,
  Info,
  Receipt,
  Printer,
  Pencil,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  getAdminProjects,
  updateAdminProject,
  deleteAdminProject,
  createProjectBudget,
  adminConfirmPayment,
  adminGenerateRemainder,
  adminConfirmRemainder,
  uploadAdminReviewFile,
  deleteAdminProjectFile,
  deleteProjectBudget,
  uploadContractPdf,
  deleteContractPdf,
  updateBudgetClauses,
  uploadInvoice,
  deleteInvoice,
  getPublicContractTemplate,
  getContractPdfUrl,
  createInstallmentPlan,
  deleteInstallmentPlan,
  generateInstallmentPix,
  confirmInstallment,
} from "../../data/api";
import { toast } from "sonner";
import logoImg from "figma:asset/866134e81312444c262030ef8ad8f59cefad5b17.png";

interface ProjectStep {
  status: string;
  date: string;
  note: string;
}

interface Project {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  title: string;
  author: string;
  description: string;
  pageCount: number | null;
  format: string;
  services?: string[];
  notes: string;
  status: string;
  steps: ProjectStep[];
  fileUrl: string | null;
  adminNotes: string;
  budget?: {
    description: string;
    price: number;
    depositPercent?: number;
    chargeAmount?: number;
    paymentUrl: string;
    sandboxUrl?: string;
    preferenceId: string;
    status: string;
    paidAt: string | null;
    customClauses?: string;
    estimatedDeadline?: string;
    contractPdfPath?: string;
    contractPdfName?: string;
    contractPdfSize?: number;
    contractPdfUploadedAt?: string;
    contractAcceptance?: {
      contractVersion: string;
      acceptedAt: string;
      acceptorName: string;
      acceptorEmail: string;
      acceptorCpf: string | null;
      ip: string;
      userAgent: string;
      contractHash?: string | null;
      geolocation?: string | null;
      screenResolution?: string | null;
    };
    remainderStatus?: string;
    remainderPaidAt?: string | null;
    remainderPaymentUrl?: string;
    remainderAmount?: number;
    remainderGeneratedAt?: string;
    remainderGeneratedBy?: string;
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
        paymentId?: string;
        generatedAt?: string;
      }[];
      createdAt: string;
      createdBy: string;
    } | null;
  } | null;
  reviewFiles?: { name: string; size: number; path: string; uploadedAt: string; uploadedBy: string }[];
  uploadedFiles?: { name: string; size: number; path: string; uploadedAt: string }[];
  invoices?: { name: string; size: number; path: string; description: string; uploadedAt: string; uploadedBy: string }[];
  reviewObservations?: { text: string; date: string; by: string }[];
  createdAt: string;
  updatedAt: string;
}

const STATUS_FLOW = [
  { key: "solicitado", label: "Solicitado", color: "#856C42" },
  { key: "analise", label: "Análise", color: "#856C42" },
  { key: "orcamento", label: "Orçamento", color: "#EBBF74" },
  { key: "producao", label: "Produção", color: "#165B36" },
  { key: "revisao", label: "Revisão", color: "#165B36" },
  { key: "ajustes", label: "Ajustes finais", color: "#165B36" },
  { key: "concluido", label: "Concluído", color: "#0a7c3e" },
];

function getStatusLabel(status: string) {
  return STATUS_FLOW.find((s) => s.key === status)?.label || status;
}

function getStatusColor(status: string) {
  return STATUS_FLOW.find((s) => s.key === status)?.color || "#856C42";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ============================================
// Contract PDF Download Button (admin)
// ============================================
function AdminContractDownloadBtn({ projectId, pdfName }: { projectId: string; pdfName?: string }) {
  const [loading, setLoading] = useState(false);
  const handleDownload = async () => {
    setLoading(true);
    try {
      const data = await getContractPdfUrl(projectId);
      if (data.url) {
        window.open(data.url, "_blank");
      } else {
        toast.error("Contrato PDF indisponível");
      }
    } catch {
      toast.error("Erro ao obter contrato PDF");
    } finally {
      setLoading(false);
    }
  };
  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.65rem] font-medium text-[#856C42] bg-[#856C42]/5 hover:bg-[#856C42]/10 transition-colors cursor-pointer disabled:opacity-50"
      style={{ fontFamily: F }}
    >
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
      {pdfName ? `Baixar ${pdfName}` : "Baixar PDF"}
    </button>
  );
}

// ============================================
// Edit Project Modal — Tabbed Layout
// ============================================
type ModalTab = "projeto" | "financeiro" | "contrato" | "arquivos" | "nf";

const MODAL_TABS: { key: ModalTab; label: string; icon: any }[] = [
  { key: "projeto", label: "Projeto", icon: BookOpen },
  { key: "financeiro", label: "Financeiro", icon: Banknote },
  { key: "contrato", label: "Contrato", icon: ScrollText },
  { key: "arquivos", label: "Arquivos", icon: FolderOpen },
  { key: "nf", label: "NF", icon: Receipt },
];

// ============================================
// Installment Plan Admin Component
// ============================================
function InstallmentPlanAdmin({ project, onUpdated }: { project: Project; onUpdated: () => void }) {
  const F = "Inter, sans-serif";
  const plan = project.budget?.installmentPlan;
  const [showForm, setShowForm] = useState(false);
  const [numInst, setNumInst] = useState("3");
  const [installments, setInstallments] = useState<{ amount: string; dueDate: string }[]>([]);
  const [requireContract, setRequireContract] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [generatingPix, setGeneratingPix] = useState<number | null>(null);
  const [confirmingInst, setConfirmingInst] = useState<number | null>(null);

  const fullPrice = project.budget?.price || 0;
  const dpPercent = project.budget?.depositPercent || 0;
  const chargeAmt = project.budget?.chargeAmount || fullPrice;
  const hasDeposit = dpPercent > 0 && dpPercent < 100;
  // Installment plan covers only the REMAINDER after deposit
  const installmentBaseAmount = hasDeposit ? Math.round((fullPrice - chargeAmt) * 100) / 100 : fullPrice;

  useEffect(() => {
    const n = parseInt(numInst, 10) || 1;
    const perInst = Math.floor(installmentBaseAmount / n * 100) / 100;
    const last = Math.round((installmentBaseAmount - perInst * (n - 1)) * 100) / 100;
    // A 1ª parcela vence 30 dias após o pagamento da entrada (início dos trabalhos).
    // Cada parcela subsequente vence em intervalos de 30 dias.
    const today = new Date();
    const arr: { amount: string; dueDate: string }[] = [];
    for (let i = 0; i < n; i++) {
      const due = new Date(today);
      due.setDate(due.getDate() + (i + 1) * 30);
      arr.push({
        amount: (i < n - 1 ? perInst : last).toFixed(2),
        dueDate: due.toISOString().split("T")[0],
      });
    }
    setInstallments(arr);
  }, [numInst, installmentBaseAmount]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const n = parseInt(numInst, 10);
      await createInstallmentPlan(project.id, {
        totalInstallments: n,
        installments: installments.map((inst) => ({
          amount: parseFloat(inst.amount),
          dueDate: inst.dueDate,
        })),
        requireContract,
      });
      toast.success(`Plano de ${n}x parcelas PIX criado ${requireContract ? "(com contrato)" : "(sem contrato)"}! PIX da 1ª parcela gerado automaticamente.`);
      setShowForm(false);
      onUpdated();
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar plano de parcelamento");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Excluir plano de parcelamento? Parcelas já geradas serão descartadas.")) return;
    setDeleting(true);
    try {
      await deleteInstallmentPlan(project.id);
      toast.success("Plano de parcelamento excluído.");
      onUpdated();
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir plano");
    } finally {
      setDeleting(false);
    }
  };

  const handleGeneratePix = async (num: number) => {
    setGeneratingPix(num);
    try {
      await generateInstallmentPix(project.id, num);
      toast.success(`PIX gerado para parcela ${num}!`);
      onUpdated();
    } catch (err: any) {
      toast.error(err.message || "Erro ao gerar PIX");
    } finally {
      setGeneratingPix(null);
    }
  };

  const handleConfirm = async (num: number) => {
    if (!confirm(`Confirmar pagamento da parcela ${num}?`)) return;
    setConfirmingInst(num);
    try {
      await confirmInstallment(project.id, num);
      toast.success(`Parcela ${num} confirmada!`);
      onUpdated();
    } catch (err: any) {
      toast.error(err.message || "Erro ao confirmar parcela");
    } finally {
      setConfirmingInst(null);
    }
  };

  const handleGenerateAll = async () => {
    if (!plan) return;
    const pending = plan.installments.filter((i: any) => i.status !== "paid" && !i.pixCode);
    for (const inst of pending) {
      setGeneratingPix(inst.number);
      try {
        await generateInstallmentPix(project.id, inst.number);
      } catch {
        toast.error(`Erro ao gerar PIX para parcela ${inst.number}`);
      }
    }
    setGeneratingPix(null);
    toast.success("PIX gerado para todas as parcelas pendentes!");
    onUpdated();
  };

  const formatDateBR = (d: string) => {
    try { return new Date(d + "T12:00:00").toLocaleDateString("pt-BR"); } catch { return d; }
  };

  if (plan?.enabled) {
    const paidCount = plan.installments.filter((i: any) => i.status === "paid").length;
    const allPaid = paidCount === plan.totalInstallments;
    const pendingWithoutPix = plan.installments.filter((i: any) => i.status !== "paid" && !i.pixCode).length;

    return (
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: allPaid ? "rgba(10,124,62,0.2)" : "rgba(133,108,66,0.2)" }}>
        <div className="px-4 py-2.5 flex items-center justify-between" style={{ backgroundColor: allPaid ? "rgba(10,124,62,0.04)" : "rgba(235,191,116,0.08)" }}>
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5" style={{ color: allPaid ? "#0a7c3e" : "#856C42" }} />
            <span className="text-sm font-semibold text-gray-800" style={{ fontFamily: F }}>Parcelamento PIX — {plan.totalInstallments}x</span>
            {plan.requireContract ? (
              <span className="text-[0.5rem] px-1.5 py-0.5 rounded-full bg-[#165B36]/10 text-[#165B36] font-semibold" style={{ fontFamily: F }}>c/ contrato</span>
            ) : (
              <span className="text-[0.5rem] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-semibold" style={{ fontFamily: F }}>s/ contrato</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold" style={{ fontFamily: F, color: allPaid ? "#0a7c3e" : "#856C42" }}>
              {paidCount}/{plan.totalInstallments} pagas
            </span>
            {!allPaid && (
              <button onClick={handleDelete} disabled={deleting} className="text-[0.55rem] text-red-400 hover:text-red-600 transition-colors cursor-pointer" style={{ fontFamily: F }}>
                {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Excluir"}
              </button>
            )}
          </div>
        </div>
        <div className="p-3 space-y-2">
          {plan.installments.map((inst: any) => {
            const isPaid = inst.status === "paid";
            const hasPix = !!inst.pixCode;
            const isOverdue = !isPaid && new Date(inst.dueDate + "T23:59:59") < new Date();
            return (
              <div key={inst.number} className="flex items-center gap-3 p-2.5 rounded-lg" style={{ backgroundColor: isPaid ? "rgba(10,124,62,0.03)" : isOverdue ? "rgba(239,68,68,0.04)" : "rgba(249,250,251,0.8)" }}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[0.6rem] font-bold" style={{ backgroundColor: isPaid ? "rgba(10,124,62,0.1)" : isOverdue ? "rgba(239,68,68,0.1)" : "rgba(133,108,66,0.1)", color: isPaid ? "#0a7c3e" : isOverdue ? "#dc2626" : "#856C42" }}>
                  {inst.number}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-800 tracking-tight" style={{ fontFamily: "Inter, sans-serif" }}>R$ {inst.amount.toFixed(2).replace(".", ",")}</span>
                    {isPaid && <CheckCircle className="w-3 h-3 text-green-600" />}
                    {isOverdue && <AlertCircle className="w-3 h-3 text-red-500" />}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[0.65rem] text-gray-500" style={{ fontFamily: F }}>Venc.: {formatDateBR(inst.dueDate)}</span>
                    {isPaid && inst.paidAt && <span className="text-[0.65rem] text-green-600" style={{ fontFamily: F }}>Pago em {formatDateBR(inst.paidAt.split("T")[0])}</span>}
                    {isOverdue && <span className="text-[0.65rem] text-red-500 font-medium" style={{ fontFamily: F }}>Vencida</span>}
                  </div>
                </div>
                {!isPaid && (
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {!hasPix && (
                      <button onClick={() => handleGeneratePix(inst.number)} disabled={generatingPix === inst.number} className="px-2 py-1 rounded text-[0.55rem] font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50" style={{ fontFamily: F }}>
                        {generatingPix === inst.number ? <Loader2 className="w-3 h-3 animate-spin" /> : "Gerar PIX"}
                      </button>
                    )}
                    {hasPix && (
                      <button onClick={() => { navigator.clipboard.writeText(inst.pixCode); toast.success("Código PIX copiado!"); }} className="px-2 py-1 rounded text-[0.55rem] font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer" style={{ fontFamily: F }}>
                        <Copy className="w-3 h-3 inline mr-0.5" />PIX
                      </button>
                    )}
                    <button onClick={() => handleConfirm(inst.number)} disabled={confirmingInst === inst.number} className="px-2 py-1 rounded text-[0.55rem] font-medium text-white bg-green-600 hover:bg-green-700 transition-colors cursor-pointer disabled:opacity-50" style={{ fontFamily: F }}>
                      {confirmingInst === inst.number ? <Loader2 className="w-3 h-3 animate-spin" /> : <><CheckCircle className="w-3 h-3 inline mr-0.5" />Confirmar</>}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          {pendingWithoutPix > 0 && (
            <button onClick={handleGenerateAll} className="w-full mt-1 py-2 rounded-lg text-xs font-medium text-white transition-opacity hover:opacity-90 cursor-pointer" style={{ fontFamily: F, background: "linear-gradient(135deg, #EBBF74, #856C42)" }}>
              <Banknote className="w-3.5 h-3.5 inline mr-1" />Gerar PIX para todas as pendentes ({pendingWithoutPix})
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border-2 overflow-hidden" style={{ borderColor: showForm ? "rgba(22,91,54,0.3)" : "rgba(235,191,116,0.4)", borderStyle: showForm ? "solid" : "dashed" }}>
      <div className="px-4 py-3 flex items-center justify-between" style={{ background: "linear-gradient(135deg, rgba(235,191,116,0.15), rgba(133,108,66,0.08))" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #EBBF74, #856C42)" }}>
            <Banknote className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#052413]" style={{ fontFamily: F }}>Parcelamento PIX</p>
            <p className="text-[0.6rem] text-[#856C42]/70" style={{ fontFamily: F }}>Parcelas individuais via PIX para o cliente</p>
          </div>
        </div>
      </div>
      {showForm ? (
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <label className="text-xs text-gray-600 whitespace-nowrap font-medium" style={{ fontFamily: F }}>Numero de parcelas:</label>
            <select value={numInst} onChange={(e) => setNumInst(e.target.value)} className="px-3 py-1.5 rounded-lg border text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20 cursor-pointer" style={{ fontFamily: F, borderColor: "rgba(133,108,66,0.2)" }}>
              {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => <option key={n} value={n}>{n}x</option>)}
            </select>
            <span className="text-xs text-[#856C42] font-medium" style={{ fontFamily: F }}>Total: R$ {installmentBaseAmount.toFixed(2).replace(".", ",")}{hasDeposit ? ` (restante apos entrada de ${dpPercent}%)` : ""}</span>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {installments.map((inst, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2.5 rounded-lg" style={{ backgroundColor: "rgba(240,232,212,0.4)" }}>
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-[0.6rem] font-bold flex-shrink-0" style={{ background: "linear-gradient(135deg, #EBBF74, #856C42)", color: "white" }}>{idx + 1}</span>
                <div className="flex-1 flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[#856C42]/60 font-medium">R$</span>
                    <input type="number" value={inst.amount} onChange={(e) => { const nv = [...installments]; nv[idx] = { ...nv[idx], amount: e.target.value }; setInstallments(nv); }} className="w-full pl-9 pr-2 py-2 rounded-lg border text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20" style={{ borderColor: "rgba(133,108,66,0.2)" }} step="0.01" min="0.01" />
                  </div>
                  <input type="date" value={inst.dueDate} onChange={(e) => { const nv = [...installments]; nv[idx] = { ...nv[idx], dueDate: e.target.value }; setInstallments(nv); }} className="px-2.5 py-2 rounded-lg border text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20" style={{ borderColor: "rgba(133,108,66,0.2)" }} />
                </div>
              </div>
            ))}
          </div>
          {hasDeposit && (
            <div className="flex items-start gap-2 px-3 py-2 rounded-lg" style={{ background: "rgba(235,191,116,0.08)", border: "1px solid rgba(235,191,116,0.15)" }}>
              <AlertCircle className="w-3.5 h-3.5 text-[#856C42] flex-shrink-0 mt-0.5" />
              <p className="text-[0.6rem] text-[#856C42]/70 leading-relaxed" style={{ fontFamily: F }}>
                A <strong>entrada de {dpPercent}%</strong> ({formatCurrency(chargeAmt)}) e para o inicio dos trabalhos. A <strong>1ª parcela</strong> vence 30 dias apos o pagamento da entrada, e as demais seguem em intervalos de 30 dias. Ajuste as datas acima se necessario.
              </p>
            </div>
          )}
          {/* Contract requirement toggle */}
          <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: requireContract ? "rgba(22,91,54,0.06)" : "rgba(133,108,66,0.04)", border: `1px solid ${requireContract ? "rgba(22,91,54,0.15)" : "rgba(133,108,66,0.1)"}` }}>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={requireContract} onChange={(e) => setRequireContract(e.target.checked)} className="sr-only peer" />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#165B36]"></div>
            </label>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-semibold text-gray-800 block" style={{ fontFamily: F }}>
                {requireContract ? "Com contrato" : "Sem contrato"}
              </span>
              <span className="text-[0.6rem] text-gray-500 block" style={{ fontFamily: F }}>
                {requireContract
                  ? "O cliente precisara aceitar o contrato antes de visualizar os PIX"
                  : "O cliente acessa os PIX diretamente, sem aceite de contrato"}
              </span>
            </div>
            <ScrollText className="w-4 h-4 flex-shrink-0" style={{ color: requireContract ? "#165B36" : "#856C42" }} />
          </div>

          <div className="flex gap-2 pt-2">
            <button onClick={handleCreate} disabled={creating} className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer" style={{ fontFamily: F, background: "linear-gradient(135deg, #165B36, #052413)" }}>
              {creating ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : <><Banknote className="w-4 h-4 inline mr-1.5" />Criar plano de {numInst}x parcelas {requireContract ? "(com contrato)" : "(sem contrato)"}</>}
            </button>
            <button onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-lg text-sm text-[#856C42] hover:bg-[#F0E8D4] transition-colors cursor-pointer border" style={{ fontFamily: F, borderColor: "rgba(133,108,66,0.15)" }}>Cancelar</button>
          </div>
        </div>
      ) : (
        <div className="p-5 text-center">
          <div className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ background: "rgba(235,191,116,0.15)" }}>
            <Calendar className="w-6 h-6 text-[#856C42]" />
          </div>
          <p className="text-sm font-medium text-[#052413] mb-1" style={{ fontFamily: F }}>Nenhum plano de parcelamento ativo</p>
          <p className="text-xs text-[#856C42]/60 mb-4 max-w-xs mx-auto" style={{ fontFamily: F }}>Crie um plano para gerar cobranças PIX individuais para cada parcela e enviar ao cliente</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer"
            style={{ fontFamily: F, background: "linear-gradient(135deg, #EBBF74, #856C42)" }}
          >
            <Plus className="w-4 h-4" />
            Criar plano de parcelamento
          </button>
        </div>
      )}
    </div>
  );
}

function EditProjectModal({
  project,
  onClose,
  onUpdated,
}: {
  project: Project;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [activeTab, setActiveTab] = useState<ModalTab>("projeto");
  const [status, setStatus] = useState(project.status);
  const [note, setNote] = useState("");
  const [fileUrl, setFileUrl] = useState(project.fileUrl || "");
  const [adminNotes, setAdminNotes] = useState(project.adminNotes || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [budgetDesc, setBudgetDesc] = useState("");
  const [budgetPrice, setBudgetPrice] = useState("");
  const [depositEnabled, setDepositEnabled] = useState(false);
  const [depositPercent, setDepositPercent] = useState("50");
  const [creatingBudget, setCreatingBudget] = useState(false);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [generatingRemainder, setGeneratingRemainder] = useState(false);
  const [confirmingRemainder, setConfirmingRemainder] = useState(false);
  const [customClauses, setCustomClauses] = useState("");
  const [estimatedDeadline, setEstimatedDeadline] = useState("");

  // Clause editor for existing budget
  const parseExistingClauses = (): {title: string; content: string}[] => {
    const raw = project.budget?.customClauses;
    if (!raw) return [];
    try { const arr = JSON.parse(raw); if (Array.isArray(arr)) return arr; } catch {}
    return [{ title: "Cláusula personalizada", content: raw }];
  };
  const [editClauses, setEditClauses] = useState<{title: string; content: string}[]>(parseExistingClauses);
  const [editDeadline, setEditDeadline] = useState(project.budget?.estimatedDeadline || "");
  const [savingClauses, setSavingClauses] = useState(false);

  // Convert logo to base64 for print (new window can't access figma:asset URLs)
  const [logoBase64, setLogoBase64] = useState("");
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) { ctx.drawImage(img, 0, 0); setLogoBase64(canvas.toDataURL("image/png")); }
      } catch {}
    };
    img.src = logoImg;
  }, []);

  // Sync local state when project prop is refreshed (e.g. after budget creation)
  useEffect(() => {
    setStatus(project.status);
    setFileUrl(project.fileUrl || "");
    setAdminNotes(project.adminNotes || "");
    setEditClauses(parseExistingClauses());
    setEditDeadline(project.budget?.estimatedDeadline || "");
    // Reset budget form fields if budget now exists
    if (project.budget) {
      setBudgetDesc("");
      setBudgetPrice("");
      setDepositEnabled(false);
      setDepositPercent("50");
      setCustomClauses("");
      setEstimatedDeadline("");
    }
  }, [project.id, project.updatedAt, project.budget?.preferenceId]);

  const handleAddClause = () => setEditClauses(prev => [...prev, { title: "", content: "" }]);
  const handleRemoveClause = (idx: number) => setEditClauses(prev => prev.filter((_, i) => i !== idx));
  const handleClauseChange = (idx: number, field: "title" | "content", value: string) => {
    setEditClauses(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));
  };
  const handleSaveClauses = async () => {
    setSavingClauses(true);
    setError("");
    try {
      const valid = editClauses.filter(c => c.content.trim());
      await updateBudgetClauses(project.id, valid.length > 0 ? JSON.stringify(valid) : null, editDeadline.trim() || undefined);
      toast.success("Contrato atualizado!");
      onUpdated();
    } catch (err: any) {
      setError(err.message || "Erro ao salvar");
    } finally {
      setSavingClauses(false);
    }
  };

  const [uploadingReview, setUploadingReview] = useState(false);
  const reviewFileRef = useRef<HTMLInputElement>(null);
  const [deletingFileKey, setDeletingFileKey] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [deletingBudget, setDeletingBudget] = useState(false);

  const [uploadingContractPdf, setUploadingContractPdf] = useState(false);
  const [deletingContractPdf, setDeletingContractPdf] = useState(false);
  const contractPdfRef = useRef<HTMLInputElement>(null);

  // Invoice (Nota Fiscal) state
  const [uploadingInvoice, setUploadingInvoice] = useState(false);
  const [deletingInvoiceIdx, setDeletingInvoiceIdx] = useState<number | null>(null);
  const [invoiceDesc, setInvoiceDesc] = useState("");
  const invoiceFileRef = useRef<HTMLInputElement>(null);

  // Contract preview state
  const [showContractPreview, setShowContractPreview] = useState(false);
  const [contractTemplate, setContractTemplate] = useState<any>(null);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [previewEditMode, setPreviewEditMode] = useState(false);
  const [previewDeadline, setPreviewDeadline] = useState("");
  const [previewClauses, setPreviewClauses] = useState<{title: string; content: string}[]>([]);
  const [savingPreview, setSavingPreview] = useState(false);

  const handleShowContractPreview = async () => {
    if (!contractTemplate) {
      setLoadingTemplate(true);
      try {
        const data = await getPublicContractTemplate();
        if (data.template) setContractTemplate(data.template);
      } catch (err) {
        console.error("Error loading contract template:", err);
      } finally {
        setLoadingTemplate(false);
      }
    }
    // Sync inline edit state from current project
    setPreviewDeadline(project.budget?.estimatedDeadline || "");
    try {
      const parsed = project.budget?.customClauses ? JSON.parse(project.budget.customClauses) : [];
      setPreviewClauses(Array.isArray(parsed) ? parsed : project.budget?.customClauses ? [{ title: "", content: project.budget.customClauses }] : []);
    } catch { setPreviewClauses(project.budget?.customClauses ? [{ title: "", content: project.budget.customClauses }] : []); }
    setPreviewEditMode(false);
    setShowContractPreview(true);
  };

  const handlePreviewSave = async () => {
    setSavingPreview(true);
    try {
      const valid = previewClauses.filter(c => c.content.trim());
      await updateBudgetClauses(project.id, valid.length > 0 ? JSON.stringify(valid) : null, previewDeadline.trim() || undefined);
      toast.success("Contrato atualizado!");
      // Also sync the sidebar edit state
      setEditDeadline(previewDeadline);
      setEditClauses(valid);
      setPreviewEditMode(false);
      onUpdated();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar alterações");
    } finally {
      setSavingPreview(false);
    }
  };

  const handleContractPrint = () => {
    if (!project.budget) return;
    const budget = project.budget;
    const acceptance = budget.contractAcceptance;
    const companyName = contractTemplate?.companyName || "Epoca Editora de Livros";
    const companyDesc = contractTemplate?.companyDescription || "pessoa juridica de direito privado, com sede em territorio brasileiro";
    const version = contractTemplate?.version || "1.0";
    const preamble = contractTemplate?.preamble || "Pelo presente instrumento particular, as partes abaixo qualificadas celebram o presente Contrato de Prestacao de Servicos Editoriais, que se regera pelas seguintes clausulas e condicoes:";

    const getClauseFromTemplate = (num: number) => contractTemplate?.clauses?.find((c: any) => c.number === num);
    const getClauseText = (num: number, defaultTitle: string, defaultContent: string) => {
      const cl = getClauseFromTemplate(num);
      const title = cl?.title || defaultTitle;
      const content = cl?.content || defaultContent;
      const lines = content.split("\n").filter((l: string) => l.trim());
      return `<p style="font-weight:700;margin-top:16px;margin-bottom:4px;color:#052413">CLAUSULA ${num} — ${title}</p>${lines.map((l: string) => `<p style="${/^[a-z]\)/.test(l.trim()) ? "padding-left:16px;" : ""}margin-bottom:4px">${l}</p>`).join("")}`;
    };

    const name = acceptance?.acceptorName || project.userName || "_______________";
    const email = acceptance?.acceptorEmail || project.userEmail || "";
    const cpf = acceptance?.acceptorCpf || "";
    const dp = budget.depositPercent || 0;
    const chargeAmt = budget.chargeAmount || budget.price || 0;
    const remainder = Math.round((budget.price - chargeAmt) * 100) / 100;

    const printLogo = logoBase64 || logoImg;
    let html = `<div style="text-align:center;margin-bottom:20px;padding-bottom:15px;border-bottom:2px solid #EBBF74">`;
    html += `<img src="${printLogo}" alt="${companyName}" style="height:48px;margin:0 auto 8px;display:block" />`;
    html += `<p style="font-weight:700;font-size:13px;margin-bottom:2px;font-family:'Playfair Display',Georgia,serif;color:#052413;letter-spacing:0.5px">CONTRATO DE PRESTACAO DE SERVICOS EDITORIAIS</p>`;
    html += `<p style="font-size:9px;color:#856C42;text-transform:uppercase;letter-spacing:2px;margin-top:4px">Versao ${version}</p>`;
    html += `</div>`;
    html += `<p style="margin-bottom:8px">${preamble}</p>`;

    // Clause 1
    html += `<p style="font-weight:700;margin-top:16px;margin-bottom:4px;color:#052413">CLAUSULA 1 — ${getClauseFromTemplate(1)?.title || "DAS PARTES"}</p>`;
    html += `<p style="margin-bottom:4px"><strong>EDITORA:</strong> ${companyName}, ${companyDesc}.</p>`;
    const cleanCpfAdmin = cpf ? cpf.replace(/\D/g, "") : "";
    const docLabelAdmin = cleanCpfAdmin.length === 14 ? "CNPJ" : "CPF";
    html += `<p style="margin-bottom:8px"><strong>CONTRATANTE:</strong> ${name}${cleanCpfAdmin.length === 11 || cleanCpfAdmin.length === 14 ? `, inscrito(a) no ${docLabelAdmin} sob o n. ${cpf}` : ""}${email.includes("@") ? `, e-mail ${email}` : ""}.</p>`;

    // Clause 2
    html += `<p style="font-weight:700;margin-top:16px;margin-bottom:4px;color:#052413">CLAUSULA 2 — ${getClauseFromTemplate(2)?.title || "DO OBJETO"}</p>`;
    html += `<p style="margin-bottom:4px">O presente contrato tem por objeto a prestacao dos seguintes servicos editoriais pela EDITORA ao CONTRATANTE:</p>`;
    if (project.services?.length) {
      project.services.forEach((s) => { const svc = SERVICE_MAP[s]; html += `<p style="padding-left:16px;margin-bottom:2px">• ${svc ? svc.label : s}</p>`; });
    }
    html += `<p style="margin-bottom:4px;margin-top:8px">A obra objeto deste contrato e: <strong>"${project.title}"</strong>, de autoria de <strong>${project.author}</strong>.</p>`;
    if (project.format || project.pageCount) {
      html += `<p style="margin-bottom:8px">Especificacoes tecnicas: ${project.format ? `formato ${project.format}` : ""}${project.format && project.pageCount ? ", " : ""}${project.pageCount ? `com aproximadamente ${project.pageCount} paginas` : ""}.</p>`;
    }

    html += getClauseText(3, "DAS OBRIGACOES DA EDITORA", "A EDITORA se obriga a:\na) Executar os servicos contratados com qualidade profissional;\nb) Manter sigilo sobre o conteudo da obra;\nc) Fornecer prova digital para revisao;\nd) Realizar ajustes dentro do escopo contratado;\ne) Entregar o material finalizado no prazo acordado.");
    html += getClauseText(4, "DAS OBRIGACOES DO CONTRATANTE", "O CONTRATANTE se obriga a:\na) Fornecer todos os materiais necessarios;\nb) Efetuar o pagamento conforme estipulado;\nc) Responder as solicitacoes em ate 10 dias uteis;\nd) Revisar a prova digital em ate 15 dias uteis;\ne) Garantir que possui todos os direitos autorais sobre o conteudo.");

    // Clause 5
    html += `<p style="font-weight:700;margin-top:16px;margin-bottom:4px;color:#052413">CLAUSULA 5 — ${getClauseFromTemplate(5)?.title || "DO PRECO E CONDICOES DE PAGAMENTO"}</p>`;
    html += `<p style="margin-bottom:4px">O valor total dos servicos e de <strong>${formatCurrency(budget.price)}</strong>.</p>`;
    if (dp > 0 && dp < 100) {
      html += `<p style="padding-left:16px;margin-bottom:2px">a) Entrada (${dp}%): <strong>${formatCurrency(chargeAmt)}</strong>, devida no ato da contratacao para <strong>inicio dos trabalhos</strong>;</p>`;
      html += `<p style="padding-left:16px;margin-bottom:4px">b) Saldo remanescente (${100 - dp}%): <strong>${formatCurrency(remainder)}</strong>, a ser pago conforme condicoes abaixo.</p>`;
      html += `<p style="margin-top:4px;margin-bottom:8px">O pagamento da entrada autoriza a EDITORA a iniciar os servicos contratados. Os trabalhos somente terao inicio apos a confirmacao do pagamento da entrada.</p>`;
    }
    // Installment plan clause
    const instPlan = budget.installmentPlan;
    if (instPlan?.enabled && instPlan.installments?.length > 0) {
      html += `<p style="margin-top:8px;margin-bottom:4px;font-weight:600">Modalidade de pagamento parcelado via PIX:</p>`;
      html += `<p style="margin-bottom:4px">O CONTRATANTE opta pelo pagamento do saldo remanescente parcelado em <strong>${instPlan.totalInstallments} parcela(s)</strong> via PIX, conforme cronograma abaixo:</p>`;
      if (dp > 0 && dp < 100) {
        html += `<p style="padding-left:16px;margin-bottom:2px;color:#856C42"><em>Entrada: ${formatCurrency(chargeAmt)} — para inicio dos trabalhos (paga no ato da contratacao)</em></p>`;
      }
      instPlan.installments.forEach((inst: any) => {
        const dueFormatted = new Date(inst.dueDate + "T12:00:00").toLocaleDateString("pt-BR");
        html += `<p style="padding-left:16px;margin-bottom:2px">${inst.number}ª parcela: ${formatCurrency(inst.amount)} — vencimento em ${dueFormatted}${inst.status === "paid" ? " (pago)" : ""};</p>`;
      });
      if (dp > 0 && dp < 100) {
        html += `<p style="margin-top:4px;margin-bottom:4px"><strong>Paragrafo unico:</strong> A 1ª parcela tera vencimento em 30 (trinta) dias corridos a partir da data de confirmacao do pagamento da entrada. As parcelas subsequentes vencerao em intervalos de 30 (trinta) dias corridos entre si.</p>`;
      }
      html += `<p style="margin-top:4px;margin-bottom:8px">O CONTRATANTE compromete-se a efetuar o pagamento de cada parcela ate a data de vencimento estipulada. O atraso no pagamento de qualquer parcela podera acarretar a suspensao dos servicos ate a regularizacao.</p>`;
    }

    // Clause 6
    html += `<p style="font-weight:700;margin-top:16px;margin-bottom:4px;color:#052413">CLAUSULA 6 — ${getClauseFromTemplate(6)?.title || "DO PRAZO"}</p>`;
    const deadline = previewEditMode ? previewDeadline : budget.estimatedDeadline;
    if (deadline) {
      html += `<p style="margin-bottom:8px">Prazo estimado: <strong>${deadline}</strong>, contados a partir do recebimento dos arquivos e confirmacao do pagamento.</p>`;
    } else {
      html += `<p style="margin-bottom:8px">O prazo sera informado apos analise do material recebido.</p>`;
    }

    html += getClauseText(7, "DA REVISAO E APROVACAO", "A EDITORA disponibilizara prova digital para revisao. O CONTRATANTE tera uma rodada de revisao incluida. Ajustes adicionais poderao ser cobrados separadamente.");
    html += getClauseText(8, "DA PROPRIEDADE INTELECTUAL", "Os direitos autorais sobre o conteudo permanecem com o CONTRATANTE. A EDITORA detem os direitos sobre o projeto grafico, concedendo licenca de uso irrevogavel e exclusiva.");
    html += getClauseText(9, "DA RESCISAO", "a) Rescisao antes do inicio: reembolso de 80%;\nb) Rescisao durante execucao: cobranca proporcional;\nc) Rescisao por forca maior: reembolso integral dos servicos nao realizados.");
    html += getClauseText(10, "DA PROTECAO DE DADOS PESSOAIS (LGPD)", "a) Tratamento em conformidade com a LGPD (Lei n. 13.709/2018);\nb) Base legal: execucao de contrato (art. 7, V) e obrigacao legal (art. 7, II);\nc) Finalidade: prestacao dos servicos contratados, emissao fiscal e comunicacao;\nd) Retencao: 5 anos apos conclusao do contrato;\ne) Direitos do titular exerciveis por e-mail (art. 18 da LGPD);\nf) Dados nao compartilhados com terceiros, exceto para pagamentos ou por determinacao legal.");
    html += getClauseText(11, "DO FORO E RESOLUCAO DE CONFLITOS", "a) Foro da Comarca de Maringa, PR, com exclusao de qualquer outro;\nb) Resolucao amigavel no prazo de 30 dias antes de acao judicial;\nc) Mediacao ou arbitragem (Lei n. 9.307/1996) como alternativa.");
    html += getClauseText(12, "DISPOSICOES GERAIS", "a) Vigencia a partir do aceite eletronico ate conclusao dos servicos;\nb) Validade juridica nos termos da MP n. 2.200-2/2001;\nc) Registro inclui data, hora, IP, navegador, hash SHA-256 e geolocalizacao;\nd) Copia imutavel armazenada no aceite;\ne) Alteracoes somente mediante acordo escrito;\nf) Casos omissos resolvidos pela legislacao brasileira vigente.");

    // Custom clauses
    const clauses = previewEditMode ? previewClauses : (() => {
      try { const p = budget.customClauses ? JSON.parse(budget.customClauses) : []; return Array.isArray(p) ? p : [{ title: "", content: budget.customClauses }]; } catch { return budget.customClauses ? [{ title: "", content: budget.customClauses }] : []; }
    })();
    clauses.filter((c: any) => c.content?.trim()).forEach((clause: any, idx: number) => {
      html += `<p style="font-weight:700;margin-top:16px;margin-bottom:4px;color:#052413">CLAUSULA ${13 + idx} — ${clause.title ? clause.title.toUpperCase() : `DISPOSICOES ESPECIFICAS ${idx + 1}`}</p>`;
      html += `<p style="margin-bottom:8px;white-space:pre-wrap">${clause.content}</p>`;
    });

    const w = window.open("", "_blank");
    if (!w) { toast.error("Popup bloqueado. Permita popups para imprimir."); return; }
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Contrato — ${companyName}</title><link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap" rel="stylesheet"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Inter,Arial,sans-serif;font-size:11px;line-height:1.6;color:#333;padding:40px 60px;max-width:800px;margin:auto}p{margin-bottom:6px}.footer{margin-top:30px;padding-top:15px;border-top:2px solid #EBBF74;font-size:9px;color:#856C42;text-align:center}@media print{body{padding:20px 40px}}</style></head><body>`);
    w.document.write(html);
    if (acceptance) {
      let footerText = `Contrato aceito eletronicamente em ${new Date(acceptance.acceptedAt).toLocaleString("pt-BR")} por ${acceptance.acceptorName}. IP: ${acceptance.ip}.`;
      if (acceptance.contractHash) {
        footerText += `<br/>Integridade SHA-256: ${acceptance.contractHash}`;
      }
      w.document.write(`<div class="footer">${footerText}</div>`);
    } else {
      w.document.write(`<div class="footer">Documento gerado em ${new Date().toLocaleString("pt-BR")} para conferencia interna.</div>`);
    }
    w.document.write(`</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 300);
  };

  const handleInvoiceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingInvoice(true);
    try {
      await uploadInvoice(project.id, file, invoiceDesc);
      setInvoiceDesc("");
      toast.success("Nota fiscal enviada!");
      onUpdated();
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar nota fiscal");
    } finally {
      setUploadingInvoice(false);
      if (invoiceFileRef.current) invoiceFileRef.current.value = "";
    }
  };

  const handleDeleteInvoice = async (idx: number) => {
    if (!confirm("Excluir esta nota fiscal?")) return;
    setDeletingInvoiceIdx(idx);
    try {
      await deleteInvoice(project.id, idx);
      toast.success("Nota fiscal excluída!");
      onUpdated();
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir nota fiscal");
    } finally {
      setDeletingInvoiceIdx(null);
    }
  };

  const paymentPageUrl = project.budget
    ? `https://editoraepoca.com.br/pagamento/${project.id}`
    : "";

  const handleCopyPaymentLink = async () => {
    if (!paymentPageUrl) return;
    try {
      await navigator.clipboard.writeText(paymentPageUrl);
      setCopiedLink(true);
      toast.success("Link de pagamento copiado!");
      setTimeout(() => setCopiedLink(false), 3000);
    } catch {
      // Fallback for environments where clipboard API is blocked
      try {
        const textarea = document.createElement("textarea");
        textarea.value = paymentPageUrl;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        setCopiedLink(true);
        toast.success("Link de pagamento copiado!");
        setTimeout(() => setCopiedLink(false), 3000);
      } catch {
        toast.error("Não foi possível copiar. Copie manualmente o link abaixo.");
      }
    }
  };

  const handleDeleteFile = async (type: "review" | "uploaded", index: number) => {
    const key = `${type}-${index}`;
    if (!confirm("Tem certeza que deseja apagar este arquivo? Esta ação é irreversível.")) return;
    setDeletingFileKey(key);
    setError("");
    try {
      await deleteAdminProjectFile(project.id, type, index);
      toast.success("Arquivo excluído com sucesso!");
      onUpdated();
    } catch (err: any) {
      setError(err.message || "Erro ao excluir arquivo");
      toast.error(err.message || "Erro ao excluir arquivo.");
    } finally {
      setDeletingFileKey(null);
    }
  };

  const handleDeleteBudget = async () => {
    if (!confirm("Tem certeza que deseja apagar este orçamento? Esta ação é irreversível.")) return;
    setDeletingBudget(true);
    setError("");
    try {
      await deleteProjectBudget(project.id);
      toast.success("Orçamento excluído com sucesso!");
      onUpdated();
    } catch (err: any) {
      setError(err.message || "Erro ao excluir orçamento");
      toast.error(err.message || "Erro ao excluir orçamento.");
    } finally {
      setDeletingBudget(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const updates: any = {};
      if (status !== project.status) {
        // Block "Concluído" if remainder payment is pending
        if (status === "concluido" && isRemainderPending) {
          setSaving(false);
          setError("Não é possível finalizar o projeto com pagamento do restante pendente. Gere e confirme a cobrança do saldo restante antes de concluir.");
          toast.error("Pagamento do restante pendente! Gere a cobrança antes de finalizar.");
          setActiveTab("financeiro");
          return;
        }
        // Block "Concluído" if installments are pending
        const hasInstPending = project.budget?.installmentPlan?.enabled && project.budget.installmentPlan.installments?.some((i: any) => i.status !== "paid");
        if (status === "concluido" && hasInstPending) {
          setSaving(false);
          setError("Não é possível finalizar o projeto com parcelas PIX pendentes. Confirme todas as parcelas antes de concluir.");
          toast.error("Parcelas pendentes! Confirme todas antes de finalizar.");
          setActiveTab("financeiro");
          return;
        }
        updates.status = status;
        updates.note = note.trim() || undefined;
      }
      if (fileUrl !== (project.fileUrl || "")) {
        updates.fileUrl = fileUrl.trim() || null;
      }
      if (adminNotes !== (project.adminNotes || "")) {
        updates.adminNotes = adminNotes;
      }

      if (Object.keys(updates).length === 0) {
        onClose();
        return;
      }

      await updateAdminProject(project.id, updates);
      toast.success("Projeto atualizado com sucesso!");
      onUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message || "Erro ao atualizar");
      toast.error(err.message || "Erro ao atualizar projeto.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateBudget = async () => {
    if (!budgetPrice || parseFloat(budgetPrice) <= 0) {
      setError("Informe um valor válido para o orçamento");
      return;
    }
    setCreatingBudget(true);
    setError("");
    try {
      // First save any pending project field changes (status, fileUrl, adminNotes)
      const pendingUpdates: any = {};
      if (status !== project.status) {
        pendingUpdates.status = status;
        pendingUpdates.note = note.trim() || undefined;
      }
      if (fileUrl !== (project.fileUrl || "")) {
        pendingUpdates.fileUrl = fileUrl.trim() || null;
      }
      if (adminNotes !== (project.adminNotes || "")) {
        pendingUpdates.adminNotes = adminNotes;
      }
      if (Object.keys(pendingUpdates).length > 0) {
        await updateAdminProject(project.id, pendingUpdates);
      }

      // Then create the budget
      await createProjectBudget(project.id, {
        description: budgetDesc.trim() || `Serviço editorial para "${project.title}"`,
        price: parseFloat(budgetPrice),
        depositEnabled,
        depositPercent: depositEnabled ? parseInt(depositPercent) : undefined,
        customClauses: customClauses.trim() || undefined,
        estimatedDeadline: estimatedDeadline.trim() || undefined,
      });
      toast.success("Orçamento criado e link de pagamento gerado!");
      onUpdated();
    } catch (err: any) {
      setError(err.message || "Erro ao criar orçamento");
      toast.error(err.message || "Erro ao criar orçamento.");
    } finally {
      setCreatingBudget(false);
    }
  };

  const handleConfirmPayment = async () => {
    setConfirmingPayment(true);
    setError("");
    try {
      await adminConfirmPayment(project.id);
      toast.success("Pagamento confirmado manualmente!");
      onUpdated();
    } catch (err: any) {
      setError(err.message || "Erro ao confirmar pagamento");
      toast.error(err.message || "Erro ao confirmar pagamento.");
    } finally {
      setConfirmingPayment(false);
    }
  };

  const handleGenerateRemainder = async () => {
    if (!confirm("Gerar cobrança do saldo restante? Um novo link de pagamento será criado no Mercado Pago.")) return;
    setGeneratingRemainder(true);
    setError("");
    try {
      const res = await adminGenerateRemainder(project.id);
      toast.success(`Cobrança do restante gerada: R$ ${res.remainderAmount?.toFixed(2).replace(".", ",")}`);
      onUpdated();
    } catch (err: any) {
      setError(err.message || "Erro ao gerar cobrança do restante");
      toast.error(err.message || "Erro ao gerar cobrança do restante.");
    } finally {
      setGeneratingRemainder(false);
    }
  };

  const handleConfirmRemainder = async () => {
    if (!confirm("Confirmar o pagamento do saldo restante manualmente?")) return;
    setConfirmingRemainder(true);
    setError("");
    try {
      await adminConfirmRemainder(project.id);
      toast.success("Pagamento do restante confirmado!");
      onUpdated();
    } catch (err: any) {
      setError(err.message || "Erro ao confirmar pagamento do restante");
      toast.error(err.message || "Erro ao confirmar pagamento do restante.");
    } finally {
      setConfirmingRemainder(false);
    }
  };

  // Helper: check if project has pending remainder
  const hasPartialDeposit = project.budget && project.budget.depositPercent && project.budget.depositPercent > 0 && project.budget.depositPercent < 100;
  const isEntryPaid = hasPartialDeposit && (project.budget!.status === "paid" || project.budget!.status === "fully_paid");
  const isRemainderPending = isEntryPaid && project.budget!.remainderStatus !== "paid";
  const isRemainderPaid = isEntryPaid && project.budget!.remainderStatus === "paid";
  const remainderAmount = hasPartialDeposit ? Math.round((project.budget!.price - (project.budget!.chargeAmount || 0)) * 100) / 100 : 0;
  const isFullyPaid = (project.budget?.status === "paid" || project.budget?.status === "fully_paid") && (!hasPartialDeposit || isRemainderPaid);

  const handleReviewUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingReview(true);
    setError("");
    try {
      await uploadAdminReviewFile(project.id, file);
      toast.success("Arquivo de revisão enviado!");
      onUpdated();
      // Don't close — let admin continue editing
    } catch (err: any) {
      setError(err.message || "Erro ao enviar arquivo de revisão");
      toast.error(err.message || "Erro ao enviar arquivo.");
    } finally {
      setUploadingReview(false);
      if (reviewFileRef.current) reviewFileRef.current.value = "";
    }
  };

  const handleContractPdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingContractPdf(true);
    setError("");
    try {
      await uploadContractPdf(project.id, file);
      toast.success("PDF do contrato enviado!");
      onUpdated();
      // Don't close — let admin continue editing
    } catch (err: any) {
      setError(err.message || "Erro ao enviar PDF do contrato");
      toast.error(err.message || "Erro ao enviar arquivo.");
    } finally {
      setUploadingContractPdf(false);
      if (contractPdfRef.current) contractPdfRef.current.value = "";
    }
  };

  const handleDeleteContractPdf = async () => {
    if (!confirm("Tem certeza que deseja apagar este PDF do contrato? Esta ação é irreversível.")) return;
    setDeletingContractPdf(true);
    setError("");
    try {
      await deleteContractPdf(project.id);
      toast.success("PDF do contrato excluído com sucesso!");
      onUpdated();
    } catch (err: any) {
      setError(err.message || "Erro ao excluir PDF do contrato");
      toast.error(err.message || "Erro ao excluir PDF do contrato.");
    } finally {
      setDeletingContractPdf(false);
    }
  };

  const F = "Inter, sans-serif";
  const ic = "w-full px-3 py-2.5 rounded-lg border text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20";
  const is = { fontFamily: F, backgroundColor: "#FFFDF8", borderColor: "rgba(133,108,66,0.2)" };

  const reviewCount = project.reviewFiles?.length || 0;
  const uploadCount = project.uploadedFiles?.length || 0;
  const filesCount = reviewCount + uploadCount;
  const statusColor = getStatusColor(project.status);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose} role="dialog" aria-modal="true" aria-label="Gerenciar projeto">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} onClick={(e) => e.stopPropagation()} className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 px-6 pt-5 pb-0 border-b border-gray-100">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-gray-900 truncate" style={{ fontFamily: F }}>{project.title}</h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.65rem] font-semibold whitespace-nowrap flex-shrink-0" style={{ color: statusColor, backgroundColor: `${statusColor}14` }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColor }} />
                  {getStatusLabel(project.status)}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500" style={{ fontFamily: F }}>
                <span className="flex items-center gap-1"><User className="w-3 h-3" /> {project.userName}</span>
                <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {project.userEmail}</span>
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(project.createdAt)}</span>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 cursor-pointer ml-3 flex-shrink-0"><X className="w-5 h-5" /></button>
          </div>
          {/* Tabs */}
          <div className="flex gap-1">
            {MODAL_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              const invoiceCount = project.invoices?.length || 0;
              const badge = tab.key === "arquivos" && filesCount > 0 ? filesCount : tab.key === "contrato" && project.budget?.contractAcceptance ? "✓" : tab.key === "nf" && invoiceCount > 0 ? invoiceCount : null;
              return (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg border-b-2 transition-all cursor-pointer ${isActive ? "text-[#165B36] border-[#165B36] bg-[#165B36]/5" : "text-gray-400 border-transparent hover:text-gray-600 hover:bg-gray-50"}`} style={{ fontFamily: F }}>
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                  {badge !== null && <span className={`ml-0.5 px-1.5 py-0 text-[0.6rem] rounded-full ${isActive ? "bg-[#165B36] text-white" : "bg-gray-200 text-gray-500"}`}>{badge}</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.15 }}>
              {/* TAB: PROJETO */}
              {activeTab === "projeto" && (
                <div className="space-y-5">
                  <div className="rounded-xl border border-gray-100 overflow-hidden">
                    <div className="px-4 py-2.5 bg-gray-50/80 border-b border-gray-100"><p className="text-xs font-semibold text-gray-600" style={{ fontFamily: F }}>Detalhes do pedido</p></div>
                    <div className="p-4 grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm" style={{ fontFamily: F }}>
                      <div><p className="text-[0.65rem] text-gray-400 uppercase tracking-wider mb-0.5">Autor</p><p className="text-gray-800 font-medium">{project.author}</p></div>
                      {project.format && <div><p className="text-[0.65rem] text-gray-400 uppercase tracking-wider mb-0.5">Formato</p><p className="text-gray-800 font-medium">{project.format}</p></div>}
                      {project.pageCount && <div><p className="text-[0.65rem] text-gray-400 uppercase tracking-wider mb-0.5">Páginas</p><p className="text-gray-800 font-medium">{project.pageCount}</p></div>}
                      <div><p className="text-[0.65rem] text-gray-400 uppercase tracking-wider mb-0.5">ID do projeto</p><p className="text-gray-500 text-xs font-mono">{project.id.slice(0, 12)}...</p></div>
                      {project.description && <div className="col-span-2"><p className="text-[0.65rem] text-gray-400 uppercase tracking-wider mb-0.5">Descrição</p><p className="text-gray-700 text-sm">{project.description}</p></div>}
                      {project.notes && <div className="col-span-2"><p className="text-[0.65rem] text-gray-400 uppercase tracking-wider mb-0.5">Observações do cliente</p><p className="text-gray-700 text-sm">{project.notes}</p></div>}
                    </div>
                  </div>
                  <div className="rounded-xl border border-gray-100 overflow-hidden">
                    <div className="px-4 py-2.5 bg-gray-50/80 border-b border-gray-100"><p className="text-xs font-semibold text-gray-600" style={{ fontFamily: F }}>Atualizar status</p></div>
                    <div className="p-4">
                      <div className="grid grid-cols-4 gap-1.5">
                        {STATUS_FLOW.map((s) => (
                          <button key={s.key} onClick={() => setStatus(s.key)} className={`px-2 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer border ${status === s.key ? "text-white border-transparent shadow-sm" : "text-gray-600 border-gray-200 hover:border-gray-300"}`} style={{ fontFamily: F, ...(status === s.key ? { backgroundColor: s.color } : {}) }}>{s.label}</button>
                        ))}
                      </div>
                      {status !== project.status && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3">
                          <label className="block text-xs text-gray-500 mb-1" style={{ fontFamily: F }}>Observação (visível para o cliente)</label>
                          <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex.: Produção iniciada, previsão 5 dias úteis" className={ic} style={is} />
                        </motion.div>
                      )}
                      {status === "concluido" && isRemainderPending && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3">
                          <div className="p-2.5 rounded-lg border flex items-start gap-2" style={{ backgroundColor: "rgba(220,38,38,0.04)", borderColor: "rgba(220,38,38,0.2)" }}>
                            <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                            <p className="text-[0.65rem] text-red-700 leading-relaxed" style={{ fontFamily: F }}>
                              <strong>Bloqueado:</strong> O saldo restante de R$ {remainderAmount.toFixed(2).replace(".", ",")} ainda não foi pago. Vá até a aba <strong>Financeiro</strong> para gerar a cobrança e confirmar o pagamento antes de concluir.
                            </p>
                          </div>
                        </motion.div>
                      )}
                      {status === "concluido" && project.budget?.installmentPlan?.enabled && project.budget.installmentPlan.installments?.some((i: any) => i.status !== "paid") && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3">
                          <div className="p-2.5 rounded-lg border flex items-start gap-2" style={{ backgroundColor: "rgba(220,38,38,0.04)", borderColor: "rgba(220,38,38,0.2)" }}>
                            <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                            <p className="text-[0.65rem] text-red-700 leading-relaxed" style={{ fontFamily: F }}>
                              <strong>Bloqueado:</strong> Há parcelas PIX pendentes ({project.budget.installmentPlan.installments.filter((i: any) => i.status !== "paid").length} de {project.budget.installmentPlan.totalInstallments}). Confirme todas as parcelas na aba <strong>Financeiro</strong> antes de concluir.
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                  {/* Client review observations */}
                  {project.reviewObservations?.length > 0 && (
                    <div className="rounded-xl border border-amber-200/60 overflow-hidden">
                      <div className="px-4 py-2.5 bg-amber-50/50 border-b border-amber-200/40 flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-amber-600" />
                        <p className="text-xs font-semibold text-amber-800" style={{ fontFamily: F }}>Observações do cliente na aprovação</p>
                      </div>
                      <div className="p-4 space-y-2">
                        {project.reviewObservations.map((obs: any, idx: number) => (
                          <div key={idx} className="p-2.5 rounded-lg bg-amber-50/30 text-xs text-gray-700" style={{ fontFamily: F }}>
                            <p className="whitespace-pre-wrap">{obs.text}</p>
                            <p className="text-[0.55rem] text-gray-400 mt-1">{new Date(obs.date).toLocaleString("pt-BR")}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="rounded-xl border border-gray-100 overflow-hidden">
                    <div className="px-4 py-2.5 bg-gray-50/80 border-b border-gray-100 flex items-center gap-2">
                      <StickyNote className="w-3.5 h-3.5 text-gray-400" />
                      <p className="text-xs font-semibold text-gray-600" style={{ fontFamily: F }}>Notas internas</p>
                      <span className="text-[0.55rem] text-gray-400 ml-auto" style={{ fontFamily: F }}>não visíveis para o cliente</span>
                    </div>
                    <div className="p-4"><textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="Anotações internas sobre o projeto..." rows={3} className={ic + " resize-none"} style={is} /></div>
                  </div>
                </div>
              )}

              {/* TAB: FINANCEIRO */}
              {activeTab === "financeiro" && (
                <div className="space-y-5">
                  {project.budget ? (
                    <>
                      <div className="rounded-xl border overflow-hidden" style={{ borderColor: isFullyPaid ? "rgba(10,124,62,0.2)" : isRemainderPending ? "rgba(235,191,116,0.3)" : (project.budget.status === "paid" || project.budget.status === "fully_paid") ? "rgba(10,124,62,0.2)" : "rgba(133,108,66,0.2)" }}>
                        <div className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: isFullyPaid ? "rgba(10,124,62,0.04)" : isRemainderPending ? "rgba(235,191,116,0.1)" : (project.budget.status === "paid" || project.budget.status === "fully_paid") ? "rgba(10,124,62,0.04)" : "rgba(235,191,116,0.08)" }}>
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4" style={{ color: isFullyPaid ? "#0a7c3e" : isRemainderPending ? "#b45309" : (project.budget.status === "paid" || project.budget.status === "fully_paid") ? "#0a7c3e" : "#856C42" }} />
                            <span className="text-sm font-semibold text-gray-900" style={{ fontFamily: F }}>R$ {project.budget.price.toFixed(2).replace(".", ",")}</span>
                          </div>
                          {isFullyPaid ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-green-700 bg-green-100" style={{ fontFamily: F }}><CheckCircle className="w-3 h-3" /> Totalmente pago</span>
                          ) : isRemainderPending ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-amber-700 bg-amber-100" style={{ fontFamily: F }}><AlertCircle className="w-3 h-3" /> Entrada paga — restante pendente</span>
                          ) : (project.budget.status === "paid" || project.budget.status === "fully_paid") ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-green-700 bg-green-100" style={{ fontFamily: F }}><CheckCircle className="w-3 h-3" /> Pago</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-amber-700 bg-amber-100" style={{ fontFamily: F }}><Clock className="w-3 h-3" /> Pendente</span>
                          )}
                        </div>
                        <div className="p-4 space-y-3">
                          {hasPartialDeposit && project.budget.chargeAmount && (
                            <>
                              <div className="flex items-center justify-between p-2.5 rounded-lg" style={{ backgroundColor: isEntryPaid ? "rgba(10,124,62,0.05)" : "rgba(22,91,54,0.05)" }}>
                                <div className="flex items-center gap-1.5">
                                  {isEntryPaid && <CheckCircle className="w-3 h-3 text-[#0a7c3e]" />}
                                  <span className="text-xs text-[#165B36] font-medium" style={{ fontFamily: F }}>Entrada ({project.budget.depositPercent}%)</span>
                                </div>
                                <span className="text-sm font-semibold text-[#165B36]" style={{ fontFamily: F }}>R$ {project.budget.chargeAmount.toFixed(2).replace(".", ",")}</span>
                              </div>
                              <div className="flex items-center justify-between p-2.5 rounded-lg" style={{ backgroundColor: isRemainderPaid ? "rgba(10,124,62,0.05)" : "rgba(235,191,116,0.08)", borderWidth: isRemainderPending ? 1 : 0, borderColor: "rgba(235,191,116,0.25)" }}>
                                <div className="flex items-center gap-1.5">
                                  {isRemainderPaid ? <CheckCircle className="w-3 h-3 text-[#0a7c3e]" /> : isRemainderPending ? <Clock className="w-3 h-3 text-amber-600" /> : null}
                                  <span className={`text-xs font-medium ${isRemainderPaid ? "text-[#0a7c3e]" : "text-amber-700"}`} style={{ fontFamily: F }}>Restante ({100 - (project.budget.depositPercent || 0)}%)</span>
                                </div>
                                <span className={`text-sm font-semibold ${isRemainderPaid ? "text-[#0a7c3e]" : "text-amber-700"}`} style={{ fontFamily: F }}>R$ {remainderAmount.toFixed(2).replace(".", ",")}</span>
                              </div>
                            </>
                          )}
                          <p className="text-xs text-gray-600" style={{ fontFamily: F }}>{project.budget.description}</p>
                          {/* ALERTA: Restante pendente */}
                          {isRemainderPending && (
                            <div className="p-3 rounded-lg border" style={{ backgroundColor: "rgba(235,191,116,0.08)", borderColor: "rgba(235,191,116,0.3)" }}>
                              <div className="flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-amber-800 mb-1" style={{ fontFamily: F }}>Pagamento do restante pendente</p>
                                  <p className="text-[0.65rem] text-amber-700 leading-relaxed mb-2" style={{ fontFamily: F }}>
                                    Somente a entrada de R$ {(project.budget.chargeAmount || 0).toFixed(2).replace(".", ",")} foi paga.{" "}
                                    O saldo de <strong>R$ {remainderAmount.toFixed(2).replace(".", ",")}</strong> precisa ser cobrado antes de finalizar o projeto.
                                  </p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {!project.budget.remainderPaymentUrl ? (
                                      <button onClick={handleGenerateRemainder} disabled={generatingRemainder} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer" style={{ fontFamily: F, background: "linear-gradient(135deg, #EBBF74, #856C42)" }}>
                                        {generatingRemainder ? <Loader2 className="w-3 h-3 animate-spin" /> : <Banknote className="w-3 h-3" />} Gerar cobrança do restante
                                      </button>
                                    ) : (
                                      <>
                                        <a href={project.budget.remainderPaymentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors" style={{ fontFamily: F }}><ExternalLink className="w-3 h-3" /> Link do restante</a>
                                        <button onClick={handleConfirmRemainder} disabled={confirmingRemainder} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-white bg-green-600 hover:bg-green-700 transition-colors cursor-pointer disabled:opacity-50" style={{ fontFamily: F }}>{confirmingRemainder ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />} Confirmar restante</button>
                                      </>
                                    )}
                                  </div>
                                  {project.budget.remainderGeneratedAt && (
                                    <p className="text-[0.55rem] text-amber-600/60 mt-1.5" style={{ fontFamily: F }}>Cobrança gerada em {formatDate(project.budget.remainderGeneratedAt)}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                          {isRemainderPaid && project.budget.remainderPaidAt && (
                            <div className="p-2.5 rounded-lg" style={{ backgroundColor: "rgba(10,124,62,0.04)", borderWidth: 1, borderColor: "rgba(10,124,62,0.15)" }}>
                              <div className="flex items-center gap-2 text-xs text-[#0a7c3e]" style={{ fontFamily: F }}>
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span className="font-medium">Restante pago em {formatDate(project.budget.remainderPaidAt)}</span>
                              </div>
                            </div>
                          )}
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {project.budget.paymentUrl && <a href={project.budget.paymentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors" style={{ fontFamily: F }}><ExternalLink className="w-3 h-3" /> Link Mercado Pago{hasPartialDeposit ? " (entrada)" : ""}</a>}
                            {project.budget.status !== "paid" && project.budget.status !== "fully_paid" && <button onClick={handleConfirmPayment} disabled={confirmingPayment} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-white bg-green-600 hover:bg-green-700 transition-colors cursor-pointer disabled:opacity-50" style={{ fontFamily: F }}>{confirmingPayment ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />} Confirmar pagamento{hasPartialDeposit ? " (entrada)" : ""}</button>}
                            {project.budget.status !== "paid" && project.budget.status !== "fully_paid" && <button onClick={handleDeleteBudget} disabled={deletingBudget} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-red-600 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer disabled:opacity-50" style={{ fontFamily: F }}>{deletingBudget ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />} Excluir</button>}
                          </div>
                        </div>
                      </div>
                      <div className="rounded-xl border border-gray-100 overflow-hidden">
                        <div className="px-4 py-2.5 bg-gray-50/80 border-b border-gray-100"><p className="text-xs font-semibold text-gray-600" style={{ fontFamily: F }}>Link de pagamento</p></div>
                        <div className="p-4 flex items-center gap-3">
                          <button onClick={handleCopyPaymentLink} disabled={copiedLink} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer disabled:cursor-not-allowed whitespace-nowrap flex-shrink-0" style={{ fontFamily: F, backgroundColor: copiedLink ? "#165B36" : "#052413", color: "white" }}>{copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}{copiedLink ? "Copiado!" : "Copiar link"}</button>
                          <p className="text-[0.6rem] text-gray-400 break-all min-w-0" style={{ fontFamily: F }}>{paymentPageUrl}</p>
                        </div>
                      </div>
                      {/* INSTALLMENT PLAN SECTION */}
                      <InstallmentPlanAdmin project={project} onUpdated={onUpdated} />
                    </>
                  ) : (
                    <>
                    <div className="rounded-xl border border-gray-100 overflow-hidden">
                      <div className="px-4 py-2.5 bg-gray-50/80 border-b border-gray-100 flex items-center gap-2"><CreditCard className="w-3.5 h-3.5 text-[#856C42]" /><p className="text-xs font-semibold text-gray-600" style={{ fontFamily: F }}>Criar orçamento</p></div>
                      <div className="p-4 space-y-3">
                        <div><label className="block text-xs text-gray-500 mb-1" style={{ fontFamily: F }}>Descrição do serviço</label><input type="text" value={budgetDesc} onChange={(e) => setBudgetDesc(e.target.value)} placeholder={`Serviço editorial para "${project.title}"`} className={ic} style={is} /></div>
                        <div className="flex gap-2">
                          <div className="relative flex-1"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">R$</span><input type="number" value={budgetPrice} onChange={(e) => setBudgetPrice(e.target.value)} placeholder="0,00" min="0" step="0.01" className={ic + " pl-10"} style={is} /></div>
                          <button onClick={handleCreateBudget} disabled={creatingBudget || !budgetPrice} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed whitespace-nowrap" style={{ fontFamily: F, background: "linear-gradient(135deg, #EBBF74, #856C42)" }}>{creatingBudget ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />} Gerar orçamento</button>
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={depositEnabled} onChange={(e) => setDepositEnabled(e.target.checked)} className="sr-only peer" /><div className="w-8 h-4.5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-[#165B36] transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:after:translate-x-full" /></label>
                          <span className="text-xs text-gray-600" style={{ fontFamily: F }}>Aceitar entrada parcial</span>
                        </div>
                        {depositEnabled && (
                          <div className="flex items-center gap-2 pl-1"><span className="text-xs text-gray-500" style={{ fontFamily: F }}>Entrada de</span><select value={depositPercent} onChange={(e) => setDepositPercent(e.target.value)} className="px-2 py-1.5 rounded-lg border text-xs text-gray-900 focus:outline-none cursor-pointer" style={{ ...is, width: "auto" }}>{[20, 30, 40, 50, 60, 70, 80].map((p) => <option key={p} value={p}>{p}%</option>)}</select><span className="text-xs text-gray-500" style={{ fontFamily: F }}>{budgetPrice ? `= R$ ${(parseFloat(budgetPrice) * parseInt(depositPercent) / 100).toFixed(2).replace(".", ",")} agora` : "do valor total"}</span></div>
                        )}
                        {depositEnabled && budgetPrice && <p className="text-[0.65rem] text-[#165B36] pl-1" style={{ fontFamily: F }}>Restante de R$ {(parseFloat(budgetPrice) * (1 - parseInt(depositPercent) / 100)).toFixed(2).replace(".", ",")} na entrega</p>}
                        <div className="pt-2 border-t border-gray-100 space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1.5" style={{ fontFamily: F }}>Prazo estimado de entrega <span className="text-gray-400 font-normal">(opcional)</span></label>
                            <input type="text" value={estimatedDeadline} onChange={(e) => setEstimatedDeadline(e.target.value)} placeholder="Ex.: 15 dias úteis, 30 dias corridos, 45 dias úteis..." className={ic} style={is} />
                            <p className="text-[0.55rem] text-gray-400 mt-1" style={{ fontFamily: F }}>Aparece automaticamente na Cláusula 6 (Prazo) do contrato.</p>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1.5" style={{ fontFamily: F }}>Cláusulas personalizadas <span className="text-gray-400 font-normal">(opcional)</span></label>
                            <textarea value={customClauses} onChange={(e) => setCustomClauses(e.target.value)} placeholder="Ex.: Material será entregue em formato PDF e InDesign..." rows={3} className={ic + " resize-none"} style={is} />
                            <p className="text-[0.55rem] text-gray-400 mt-1" style={{ fontFamily: F }}>Serão exibidas como cláusula adicional no contrato do cliente.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* PARCELAMENTO PIX — visible even without budget */}
                    <div className="rounded-xl border-2 overflow-hidden" style={{ borderColor: "rgba(133,108,66,0.15)", borderStyle: "dashed" }}>
                      <div className="px-4 py-3 flex items-center gap-2.5" style={{ background: "rgba(240,232,212,0.3)" }}>
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(133,108,66,0.15)" }}>
                          <Banknote className="w-4 h-4 text-[#856C42]/50" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#856C42]/60" style={{ fontFamily: F }}>Parcelamento PIX</p>
                          <p className="text-[0.6rem] text-[#856C42]/40" style={{ fontFamily: F }}>Parcelas individuais via PIX para o cliente</p>
                        </div>
                      </div>
                      <div className="p-5 text-center">
                        <div className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ background: "rgba(133,108,66,0.06)" }}>
                          <AlertCircle className="w-6 h-6 text-[#856C42]/30" />
                        </div>
                        <p className="text-sm font-medium text-[#856C42]/60 mb-1" style={{ fontFamily: F }}>Crie um orcamento primeiro</p>
                        <p className="text-xs text-[#856C42]/40 max-w-xs mx-auto" style={{ fontFamily: F }}>O parcelamento PIX sera habilitado apos voce definir o valor total no orcamento acima</p>
                      </div>
                    </div>
                    </>
                  )}
                </div>
              )}

              {/* TAB: CONTRATO */}
              {activeTab === "contrato" && (
                <div className="space-y-5">
                  {!project.budget ? (
                    <div className="text-center py-10"><ScrollText className="w-10 h-10 text-gray-200 mx-auto mb-3" /><p className="text-sm text-gray-400" style={{ fontFamily: F }}>Crie um orçamento na aba <strong>Financeiro</strong> para habilitar o contrato.</p></div>
                  ) : (
                    <>
                      {/* Info banner */}
                      <div className="rounded-xl p-3 mb-5 flex gap-2.5" style={{ backgroundColor: "rgba(22,91,54,0.04)", border: "1px solid rgba(22,91,54,0.1)" }}>
                        <AlertCircle className="w-4 h-4 text-[#165B36] flex-shrink-0 mt-0.5" />
                        <div className="text-[0.65rem] text-gray-600 leading-relaxed" style={{ fontFamily: F }}>
                          <p className="font-medium text-[#165B36] mb-1">Como funciona o contrato</p>
                          <p>O <strong>contrato principal</strong> é gerado automaticamente na página de pagamento com os dados do cliente (nome, CPF, e-mail), serviços, formato, valor, condições de pagamento (Pix/cartão/boleto, entrada e restante) — tudo preenchido em tempo real.</p>
                          <p className="mt-1">Use o <strong>editor de cláusulas abaixo</strong> para adicionar disposições específicas para este projeto. Elas aparecem como Cláusula 13, 14, 15... no contrato do cliente.</p>
                          <p className="mt-1">O <strong>PDF</strong> é um documento complementar opcional (versão timbrada, termos adicionais).</p>
                        </div>
                      </div>

                      {/* Preview contract as client sees */}
                      <button
                        onClick={handleShowContractPreview}
                        disabled={loadingTemplate}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-[#052413] transition-colors hover:opacity-90 cursor-pointer disabled:opacity-50"
                        style={{ fontFamily: F, background: "linear-gradient(135deg, rgba(235,191,116,0.15), rgba(235,191,116,0.08))", border: "1px solid rgba(133,108,66,0.15)" }}
                      >
                        {loadingTemplate ? <Loader2 className="w-4 h-4 text-[#856C42] animate-spin" /> : <Eye className="w-4 h-4 text-[#856C42]" />}
                        Visualizar contrato como o cliente vê
                      </button>

                      {/* Contract preview modal */}
                      <AnimatePresence>
                        {showContractPreview && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
                            onClick={() => { setShowContractPreview(false); setPreviewEditMode(false); }}
                          >
                            <div className="absolute inset-0 bg-black/60" />
                            <motion.div
                              initial={{ y: 24, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              exit={{ y: 24, opacity: 0 }}
                              transition={{ duration: 0.25 }}
                              onClick={(e) => e.stopPropagation()}
                              className="relative w-full max-w-3xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                              style={{ backgroundColor: "#FFFDF8", boxShadow: "0 25px 50px rgba(5,36,19,0.25)" }}
                            >
                              <div className="px-6 py-4 border-b flex items-center justify-between flex-shrink-0" style={{ borderColor: "rgba(133,108,66,0.1)" }}>
                                <div>
                                  <h3 className="text-lg text-[#052413]" style={{ fontFamily: "'Playfair Display', serif" }}>Contrato de <span className="italic text-[#165B36]">{project.title}</span></h3>
                                  <p className="text-[0.65rem] text-[#856C42]" style={{ fontFamily: F }}>
                                    {previewEditMode ? (
                                      <span className="inline-flex items-center gap-1 text-amber-600"><Pencil className="w-2.5 h-2.5" /> Editando prazo e cláusulas — as alterações aparecem em tempo real</span>
                                    ) : (
                                      <>Exatamente como o cliente vê na página de pagamento</>
                                    )}
                                    {project.budget?.contractAcceptance && (
                                      <span className="ml-2 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[0.55rem] font-medium bg-green-100 text-green-700">
                                        <CheckCircle className="w-2.5 h-2.5" /> Aceito
                                      </span>
                                    )}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  {/* Edit toggle */}
                                  <button
                                    onClick={() => setPreviewEditMode(!previewEditMode)}
                                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${previewEditMode ? "bg-amber-100 text-amber-700" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"}`}
                                    title={previewEditMode ? "Sair do modo edição" : "Editar prazo e cláusulas"}
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  {/* Print */}
                                  <button
                                    onClick={handleContractPrint}
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                                    title="Imprimir / Salvar PDF"
                                  >
                                    <Printer className="w-4 h-4" />
                                  </button>
                                  {/* Close */}
                                  <button onClick={() => { setShowContractPreview(false); setPreviewEditMode(false); }} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer">
                                    <X className="w-5 h-5" />
                                  </button>
                                </div>
                              </div>
                              <div className="flex-1 overflow-y-auto p-6">
                                <ProjectContractPreview
                                  project={project}
                                  template={contractTemplate}
                                  editMode={previewEditMode}
                                  editDeadline={previewDeadline}
                                  onDeadlineChange={setPreviewDeadline}
                                  editClauses={previewClauses}
                                  onClausesChange={setPreviewClauses}
                                />
                              </div>
                              {/* Sticky save bar when editing */}
                              {previewEditMode && (
                                <div className="px-6 py-3 border-t flex items-center justify-between flex-shrink-0" style={{ borderColor: "rgba(133,108,66,0.1)", backgroundColor: "rgba(235,191,116,0.08)" }}>
                                  <p className="text-[0.65rem] text-[#856C42]" style={{ fontFamily: F }}>
                                    Alterações no <strong>prazo</strong> e nas <strong>cláusulas personalizadas</strong> serão salvas e refletidas na página de pagamento do cliente.
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <button onClick={() => setPreviewEditMode(false)} className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer" style={{ fontFamily: F }}>Cancelar</button>
                                    <button onClick={handlePreviewSave} disabled={savingPreview} className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer" style={{ fontFamily: F, background: "linear-gradient(135deg, #165B36, #052413)" }}>
                                      {savingPreview ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Salvar
                                    </button>
                                  </div>
                                </div>
                              )}
                            </motion.div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="rounded-xl border border-gray-100 overflow-hidden">
                        <div className="px-4 py-2.5 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between">
                          <div className="flex items-center gap-2"><FileText className="w-3.5 h-3.5 text-[#856C42]" /><p className="text-xs font-semibold text-gray-600" style={{ fontFamily: F }}>PDF complementar</p></div>
                          <button onClick={() => contractPdfRef.current?.click()} disabled={uploadingContractPdf} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer" style={{ fontFamily: F, background: "linear-gradient(135deg, #856C42, #EBBF74)" }}>{uploadingContractPdf ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}{project.budget.contractPdfName ? "Substituir" : "Enviar PDF"}</button>
                          <input ref={contractPdfRef} type="file" accept=".pdf" onChange={handleContractPdfUpload} className="hidden" />
                        </div>
                        <div className="p-4">
                          {project.budget.contractPdfName ? (
                            <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: "rgba(235,191,116,0.06)", border: "1px solid rgba(133,108,66,0.1)" }}>
                              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, rgba(133,108,66,0.1), rgba(235,191,116,0.15))" }}><FileText className="w-4 h-4 text-[#856C42]" /></div>
                              <div className="min-w-0 flex-1"><p className="text-sm text-gray-900 truncate font-medium" style={{ fontFamily: F }}>{project.budget.contractPdfName}</p><p className="text-[0.65rem] text-gray-400" style={{ fontFamily: F }}>{project.budget.contractPdfSize ? formatFileSize(project.budget.contractPdfSize) : ""}{project.budget.contractPdfUploadedAt ? ` · ${formatDateTime(project.budget.contractPdfUploadedAt)}` : ""}</p></div>
                              <button onClick={handleDeleteContractPdf} disabled={deletingContractPdf} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50" title="Excluir">{deletingContractPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}</button>
                            </div>
                          ) : (
                            <div className="text-center py-6 rounded-lg border-2 border-dashed border-gray-200"><Upload className="w-6 h-6 text-gray-300 mx-auto mb-2" /><p className="text-xs text-gray-400" style={{ fontFamily: F }}>Nenhum PDF enviado. Envie o contrato personalizado deste projeto.</p></div>
                          )}
                        </div>
                      </div>
                      {/* Estimated deadline */}
                      <div className="rounded-xl border border-gray-100 overflow-hidden">
                        <div className="px-4 py-2.5 bg-gray-50/80 border-b border-gray-100 flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-[#856C42]" /><p className="text-xs font-semibold text-gray-600" style={{ fontFamily: F }}>Prazo estimado de entrega</p><span className="text-[0.55rem] text-gray-400" style={{ fontFamily: F }}>aparece na Cláusula 6</span></div>
                        <div className="p-4">
                          <input type="text" value={editDeadline} onChange={(e) => setEditDeadline(e.target.value)} placeholder="Ex.: 15 dias úteis, 30 dias corridos..." className={ic} style={is} />
                          {project.budget.estimatedDeadline && editDeadline === project.budget.estimatedDeadline && (
                            <p className="text-[0.55rem] text-[#165B36] mt-1.5" style={{ fontFamily: F }}>Prazo atual salvo: <strong>{project.budget.estimatedDeadline}</strong></p>
                          )}
                        </div>
                      </div>

                      {/* Link to contract template editor */}
                      <div className="flex items-center gap-2 p-3 rounded-xl" style={{ backgroundColor: "rgba(22,91,54,0.04)", border: "1px solid rgba(22,91,54,0.08)" }}>
                        <Info className="w-3.5 h-3.5 text-[#165B36] flex-shrink-0" />
                        <p className="text-[0.65rem] text-gray-500 flex-1" style={{ fontFamily: F }}>As cláusulas base (1-12) podem ser editadas na seção <a href="/admin/contratos" className="text-[#165B36] font-medium hover:underline">Contratos</a>. Aqui você gerencia as cláusulas extras deste projeto.</p>
                      </div>

                      {/* Clause editor */}
                      <div className="rounded-xl border border-gray-100 overflow-hidden">
                        <div className="px-4 py-2.5 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between">
                          <div className="flex items-center gap-2"><Edit3 className="w-3.5 h-3.5 text-[#856C42]" /><p className="text-xs font-semibold text-gray-600" style={{ fontFamily: F }}>Cláusulas personalizadas</p><span className="text-[0.55rem] text-gray-400" style={{ fontFamily: F }}>aparecem como 13, 14, 15... no contrato</span></div>
                          <button onClick={handleAddClause} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-[#165B36] bg-[#165B36]/5 hover:bg-[#165B36]/10 transition-colors cursor-pointer" style={{ fontFamily: F }}><Plus className="w-3 h-3" /> Adicionar</button>
                        </div>
                        <div className="p-4 space-y-3">
                          {editClauses.length === 0 ? (
                            <p className="text-xs text-gray-400 text-center py-4" style={{ fontFamily: F }}>Nenhuma cláusula personalizada. Clique em "Adicionar" para criar.</p>
                          ) : editClauses.map((clause, idx) => (
                            <div key={idx} className="rounded-lg border p-3 space-y-2" style={{ borderColor: "rgba(133,108,66,0.15)", backgroundColor: "rgba(235,191,116,0.03)" }}>
                              <div className="flex items-center gap-2">
                                <span className="text-[0.6rem] font-semibold text-[#856C42] whitespace-nowrap" style={{ fontFamily: F }}>Cláusula {13 + idx}</span>
                                <input type="text" value={clause.title} onChange={(e) => handleClauseChange(idx, "title", e.target.value)} placeholder="Título da cláusula (ex.: Do prazo de entrega)" className="flex-1 px-2 py-1 rounded border text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#165B36]/20" style={{ ...is, fontSize: "0.75rem" }} />
                                <button onClick={() => handleRemoveClause(idx)} className="p-1 rounded text-gray-400 hover:text-red-500 cursor-pointer" title="Remover"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                              <textarea value={clause.content} onChange={(e) => handleClauseChange(idx, "content", e.target.value)} placeholder="Conteúdo da cláusula..." rows={2} className={ic + " resize-none text-xs"} style={{ ...is, fontSize: "0.75rem" }} />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Save button for deadline + clauses */}
                      <button onClick={handleSaveClauses} disabled={savingClauses} className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer" style={{ fontFamily: F, background: "linear-gradient(135deg, #165B36, #052413)" }}>
                        {savingClauses ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Salvar prazo e cláusulas
                      </button>
                      <div className="rounded-xl border overflow-hidden" style={{ borderColor: project.budget.contractAcceptance ? "rgba(10,124,62,0.2)" : "rgba(217,119,6,0.15)" }}>
                        <div className="px-4 py-2.5 border-b flex items-center gap-2" style={{ backgroundColor: project.budget.contractAcceptance ? "rgba(10,124,62,0.04)" : "rgba(217,119,6,0.04)", borderColor: "inherit" }}>
                          {project.budget.contractAcceptance ? <Shield className="w-3.5 h-3.5 text-green-600" /> : <Clock className="w-3.5 h-3.5 text-amber-500" />}
                          <p className="text-xs font-semibold" style={{ fontFamily: F, color: project.budget.contractAcceptance ? "#0a7c3e" : "#92400e" }}>{project.budget.contractAcceptance ? "Aceite eletrônico registrado" : "Aguardando aceite do cliente"}</p>
                        </div>
                        {project.budget.contractAcceptance ? (
                          <div className="p-4">
                            <div className="grid grid-cols-2 gap-x-6 gap-y-2.5" style={{ fontFamily: F }}>
                              <div><p className="text-[0.6rem] text-gray-400 uppercase tracking-wider mb-0.5">Nome</p><p className="text-sm text-gray-800 font-medium">{project.budget.contractAcceptance.acceptorName}</p></div>
                              <div><p className="text-[0.6rem] text-gray-400 uppercase tracking-wider mb-0.5">E-mail</p><p className="text-sm text-gray-800">{project.budget.contractAcceptance.acceptorEmail}</p></div>
                              {project.budget.contractAcceptance.acceptorCpf && <div><p className="text-[0.6rem] text-gray-400 uppercase tracking-wider mb-0.5">{project.budget.contractAcceptance.acceptorCpf.replace(/\D/g, "").length === 14 ? "CNPJ" : "CPF"}</p><p className="text-sm text-gray-800 font-mono">{project.budget.contractAcceptance.acceptorCpf}</p></div>}
                              <div><p className="text-[0.6rem] text-gray-400 uppercase tracking-wider mb-0.5">Data/hora</p><p className="text-sm text-gray-800">{new Date(project.budget.contractAcceptance.acceptedAt).toLocaleString("pt-BR")}</p></div>
                              <div><p className="text-[0.6rem] text-gray-400 uppercase tracking-wider mb-0.5">Versão do contrato</p><p className="text-sm text-gray-800 font-mono">{project.budget.contractAcceptance.contractVersion}</p></div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
                              <p className="text-[0.55rem] text-gray-400" style={{ fontFamily: F }}><span className="font-medium">IP:</span> {project.budget.contractAcceptance.ip}</p>
                              <p className="text-[0.55rem] text-gray-400 break-all" style={{ fontFamily: F }}><span className="font-medium">User-Agent:</span> {project.budget.contractAcceptance.userAgent}</p>
                              {project.budget.contractAcceptance.contractHash && (
                                <p className="text-[0.55rem] text-gray-400 font-mono break-all" style={{ fontFamily: F }}><span className="font-medium" style={{ fontFamily: F }}>SHA-256:</span> {project.budget.contractAcceptance.contractHash}</p>
                              )}
                              {project.budget.contractAcceptance.geolocation && (
                                <p className="text-[0.55rem] text-gray-400" style={{ fontFamily: F }}><span className="font-medium">Geolocalizacao:</span> {project.budget.contractAcceptance.geolocation}</p>
                              )}
                              {project.budget.contractAcceptance.screenResolution && (
                                <p className="text-[0.55rem] text-gray-400" style={{ fontFamily: F }}><span className="font-medium">Resolucao:</span> {project.budget.contractAcceptance.screenResolution}</p>
                              )}
                            </div>
                            {/* Download actions */}
                            <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-2">
                              <a
                                href={`/contrato/${project.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.65rem] font-medium text-[#165B36] bg-[#165B36]/5 hover:bg-[#165B36]/10 transition-colors"
                                style={{ fontFamily: F }}
                              >
                                <ExternalLink className="w-3 h-3" /> Ver contrato assinado
                              </a>
                              {project.budget.contractPdfPath && (
                                <AdminContractDownloadBtn projectId={project.id} pdfName={project.budget.contractPdfName} />
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="p-4"><p className="text-xs text-gray-500" style={{ fontFamily: F }}>O cliente ainda não aceitou o contrato na página de pagamento.</p></div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* TAB: ARQUIVOS */}
              {activeTab === "arquivos" && (
                <div className="space-y-5">
                  <div className="rounded-xl border border-gray-100 overflow-hidden">
                    <div className="px-4 py-2.5 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-2"><Eye className="w-3.5 h-3.5 text-[#165B36]" /><p className="text-xs font-semibold text-gray-600" style={{ fontFamily: F }}>Arquivos de revisão{reviewCount > 0 && <span className="ml-1.5 text-[0.6rem] font-normal text-gray-400">({reviewCount})</span>}</p></div>
                      <button onClick={() => reviewFileRef.current?.click()} disabled={uploadingReview} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer" style={{ fontFamily: F, background: "linear-gradient(135deg, #165B36, #052413)" }}>{uploadingReview ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />} Enviar</button>
                      <input ref={reviewFileRef} type="file" onChange={handleReviewUpload} className="hidden" />
                    </div>
                    <div className="p-4">
                      {project.reviewFiles && project.reviewFiles.length > 0 ? (
                        <div className="space-y-1.5">{project.reviewFiles.map((f, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-2.5 rounded-lg bg-[#165B36]/[0.03] border border-[#165B36]/10">
                            <FileText className="w-3.5 h-3.5 text-[#165B36] flex-shrink-0" />
                            <div className="min-w-0 flex-1"><p className="text-xs text-gray-900 truncate font-medium" style={{ fontFamily: F }}>{f.name}</p><p className="text-[0.6rem] text-gray-400" style={{ fontFamily: F }}>{formatFileSize(f.size)} · {formatDateTime(f.uploadedAt)}</p></div>
                            <button onClick={() => handleDeleteFile("review", idx)} disabled={deletingFileKey === `review-${idx}`} className="p-1 rounded text-gray-400 hover:text-red-500 cursor-pointer disabled:opacity-50">{deletingFileKey === `review-${idx}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}</button>
                          </div>
                        ))}</div>
                      ) : <p className="text-xs text-gray-400 py-2 text-center" style={{ fontFamily: F }}>Nenhum arquivo de revisão enviado.</p>}
                    </div>
                  </div>
                  <div className="rounded-xl border border-gray-100 overflow-hidden">
                    <div className="px-4 py-2.5 bg-gray-50/80 border-b border-gray-100 flex items-center gap-2"><Upload className="w-3.5 h-3.5 text-[#856C42]" /><p className="text-xs font-semibold text-gray-600" style={{ fontFamily: F }}>Arquivos do cliente{uploadCount > 0 && <span className="ml-1.5 text-[0.6rem] font-normal text-gray-400">({uploadCount})</span>}</p></div>
                    <div className="p-4">
                      {project.uploadedFiles && project.uploadedFiles.length > 0 ? (
                        <div className="space-y-1.5">{project.uploadedFiles.map((f, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-2.5 rounded-lg" style={{ backgroundColor: "rgba(235,191,116,0.05)", border: "1px solid rgba(133,108,66,0.08)" }}>
                            <FileText className="w-3.5 h-3.5 text-[#856C42] flex-shrink-0" />
                            <div className="min-w-0 flex-1"><p className="text-xs text-gray-900 truncate font-medium" style={{ fontFamily: F }}>{f.name}</p><p className="text-[0.6rem] text-gray-400" style={{ fontFamily: F }}>{formatFileSize(f.size)} · {formatDateTime(f.uploadedAt)}</p></div>
                            <button onClick={() => handleDeleteFile("uploaded", idx)} disabled={deletingFileKey === `uploaded-${idx}`} className="p-1 rounded text-gray-400 hover:text-red-500 cursor-pointer disabled:opacity-50">{deletingFileKey === `uploaded-${idx}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}</button>
                          </div>
                        ))}</div>
                      ) : <p className="text-xs text-gray-400 py-2 text-center" style={{ fontFamily: F }}>Nenhum arquivo enviado pelo cliente.</p>}
                    </div>
                  </div>
                  <div className="rounded-xl border border-gray-100 overflow-hidden">
                    <div className="px-4 py-2.5 bg-gray-50/80 border-b border-gray-100 flex items-center gap-2"><LinkIcon className="w-3.5 h-3.5 text-gray-400" /><p className="text-xs font-semibold text-gray-600" style={{ fontFamily: F }}>Link do arquivo finalizado</p></div>
                    <div className="p-4"><input type="url" value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} placeholder="https://drive.google.com/..." className={ic} style={is} /><p className="text-[0.55rem] text-gray-400 mt-1.5" style={{ fontFamily: F }}>Visível para o cliente quando o status for "Concluído"</p></div>
                  </div>
                </div>
              )}

              {/* TAB: NOTAS FISCAIS */}
              {activeTab === "nf" && (
                <div className="space-y-5">
                  <div className="rounded-xl border border-gray-100 overflow-hidden">
                    <div className="px-4 py-2.5 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-2"><Receipt className="w-3.5 h-3.5 text-[#856C42]" /><p className="text-xs font-semibold text-gray-600" style={{ fontFamily: F }}>Notas Fiscais{(project.invoices?.length || 0) > 0 && <span className="ml-1.5 text-[0.6rem] font-normal text-gray-400">({project.invoices!.length})</span>}</p></div>
                      <button onClick={() => invoiceFileRef.current?.click()} disabled={uploadingInvoice} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer" style={{ fontFamily: F, background: "linear-gradient(135deg, #856C42, #EBBF74)" }}>{uploadingInvoice ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />} Enviar NF</button>
                      <input ref={invoiceFileRef} type="file" accept=".pdf,.xml,.png,.jpg,.jpeg" onChange={handleInvoiceUpload} className="hidden" />
                    </div>
                    <div className="p-4 space-y-3">
                      <div>
                        <label className="block text-[0.6rem] font-medium text-gray-500 mb-1" style={{ fontFamily: F }}>Descricao (opcional, aparece para o cliente)</label>
                        <input type="text" value={invoiceDesc} onChange={(e) => setInvoiceDesc(e.target.value)} placeholder="Ex.: NF-e ref. servico de diagramacao" className={ic} style={{ ...is, fontSize: "0.8rem" }} />
                      </div>
                      {project.invoices && project.invoices.length > 0 ? (
                        <div className="space-y-1.5">
                          {project.invoices.map((inv, idx) => (
                            <div key={idx} className="flex items-center gap-2 p-2.5 rounded-lg" style={{ backgroundColor: "rgba(133,108,66,0.04)", border: "1px solid rgba(133,108,66,0.1)" }}>
                              <Receipt className="w-3.5 h-3.5 text-[#856C42] flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs text-gray-900 truncate font-medium" style={{ fontFamily: F }}>{inv.name}</p>
                                {inv.description && <p className="text-[0.6rem] text-[#856C42] truncate" style={{ fontFamily: F }}>{inv.description}</p>}
                                <p className="text-[0.55rem] text-gray-400" style={{ fontFamily: F }}>{formatFileSize(inv.size)} · {formatDateTime(inv.uploadedAt)} · {inv.uploadedBy}</p>
                              </div>
                              <button onClick={() => handleDeleteInvoice(idx)} disabled={deletingInvoiceIdx === idx} className="p-1 rounded text-gray-400 hover:text-red-500 cursor-pointer disabled:opacity-50">
                                {deletingInvoiceIdx === idx ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 rounded-lg border-2 border-dashed border-gray-200">
                          <Receipt className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                          <p className="text-xs text-gray-400" style={{ fontFamily: F }}>Nenhuma nota fiscal enviada.</p>
                          <p className="text-[0.55rem] text-gray-400 mt-1" style={{ fontFamily: F }}>Envie PDFs, XMLs ou imagens de notas fiscais.</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-3 rounded-xl" style={{ backgroundColor: "rgba(133,108,66,0.04)", border: "1px solid rgba(133,108,66,0.08)" }}>
                    <Info className="w-3.5 h-3.5 text-[#856C42] flex-shrink-0 mt-0.5" />
                    <div className="text-[0.6rem] text-gray-500 space-y-0.5" style={{ fontFamily: F }}>
                      <p>As notas fiscais ficam disponiveis para download na area do cliente (<strong>Minha Conta</strong>).</p>
                      <p>Formatos aceitos: PDF, XML, PNG, JPG. Limite: 50 MB por arquivo.</p>
                      <p>Cliente: <strong>{project.userEmail}</strong> · Projeto: <strong>{project.title}</strong></p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center gap-3">
          {error && <div className="flex items-center gap-1.5 text-xs text-red-600 flex-1 min-w-0" style={{ fontFamily: F }}><AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /><span className="truncate">{error}</span></div>}
          <div className={`flex gap-3 ${error ? "" : "flex-1 justify-end"}`}>
            <button onClick={onClose} className="px-5 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer" style={{ fontFamily: F }}>Cancelar</button>
            <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 rounded-lg text-sm text-white font-medium hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer flex items-center gap-2" style={{ fontFamily: F, background: "linear-gradient(135deg, #165B36, #052413)" }}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar alterações</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================
// Service Map (same as PaymentPage)
// ============================================
const SERVICE_MAP: Record<string, { label: string; desc: string }> = {
  completo: { label: "Pacote completo", desc: "Todos os servicos editoriais inclusos" },
  diagramacao: { label: "Diagramacao", desc: "Layout e composicao das paginas" },
  capa: { label: "Design de capa", desc: "Capa, lombada e contracapa" },
  revisao: { label: "Revisao textual", desc: "Ortografia, gramatica e estilo" },
  impressao: { label: "Impressao", desc: "Producao grafica do livro" },
  ficha_catalografica: { label: "Ficha catalografica", desc: "CIP e dados de catalogacao" },
  registro_isbn: { label: "Registro ISBN", desc: "Codigo ISBN e codigo de barras" },
};

function formatCurrency(value: number) {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

// ============================================
// Project Contract Preview — renders the contract with REAL project data
// ============================================
function ProjectContractPreview({ project, template, editMode, editDeadline, onDeadlineChange, editClauses, onClausesChange }: {
  project: Project;
  template: any;
  editMode?: boolean;
  editDeadline?: string;
  onDeadlineChange?: (v: string) => void;
  editClauses?: { title: string; content: string }[];
  onClausesChange?: (v: { title: string; content: string }[]) => void;
}) {
  const F = "Inter, sans-serif";
  const companyName = template?.companyName || "Epoca Editora de Livros";
  const companyDesc = template?.companyDescription || "pessoa juridica de direito privado, com sede em territorio brasileiro";
  const version = template?.version || "1.0";
  const preamble = template?.preamble || "Pelo presente instrumento particular, as partes abaixo qualificadas celebram o presente Contrato de Prestacao de Servicos Editoriais, que se regera pelas seguintes clausulas e condicoes:";

  const getClause = (num: number) => template?.clauses?.find((c: any) => c.number === num);

  const renderClauseContent = (content: string) => {
    const lines = content.split("\n").filter((l: string) => l.trim());
    return lines.map((line: string, i: number) => {
      const isSubItem = /^[a-z]\)/.test(line.trim());
      const isLast = i === lines.length - 1;
      return <p key={i} className={`${isSubItem ? "pl-3" : ""} ${isLast ? "mb-3" : "mb-1"}`}>{line}</p>;
    });
  };

  const renderStaticClause = (num: number, defaultTitle: string, defaultContent: string) => {
    const cl = getClause(num);
    const title = cl?.title || defaultTitle;
    const content = cl?.content || defaultContent;
    return (
      <div>
        <p className="font-semibold text-[#052413] mb-1 mt-4">CLAUSULA {num} — {title}</p>
        {renderClauseContent(content)}
      </div>
    );
  };

  const acceptance = project.budget?.contractAcceptance;
  const name = acceptance?.acceptorName || project.userName || "_______________";
  const email = acceptance?.acceptorEmail || project.userEmail || "";
  const cpf = acceptance?.acceptorCpf || "";
  const budget = project.budget;
  const dp = budget?.depositPercent || 0;
  const chargeAmount = budget?.chargeAmount || budget?.price || 0;
  const remainder = budget?.price ? Math.round((budget.price - chargeAmount) * 100) / 100 : 0;

  // Parse custom clauses
  let customClauses: { title: string; content: string }[] = [];
  if (budget?.customClauses) {
    try {
      const parsed = JSON.parse(budget.customClauses);
      if (Array.isArray(parsed)) customClauses = parsed;
    } catch {}
    if (customClauses.length === 0) {
      customClauses = [{ title: "DISPOSICOES ESPECIFICAS DESTE PROJETO", content: budget.customClauses }];
    }
  }

  return (
    <div className="text-[0.7rem] leading-relaxed text-[#052413]/80" style={{ fontFamily: F }}>
      {/* Branded header */}
      <div className="text-center mb-5 pb-4 border-b" style={{ borderColor: "rgba(133,108,66,0.15)" }}>
        <div className="flex items-center justify-center gap-3 mb-2">
          <img src={logoImg} alt={companyName} className="h-10 object-contain" style={{ filter: "drop-shadow(0 1px 2px rgba(5,36,19,0.1))" }} />
        </div>
        <p className="font-bold text-xs text-[#052413] tracking-wide" style={{ fontFamily: "'Playfair Display', serif" }}>CONTRATO DE PRESTACAO DE SERVICOS EDITORIAIS</p>
        <div className="flex items-center justify-center gap-2 mt-1.5">
          <div className="h-px w-8" style={{ backgroundColor: "rgba(235,191,116,0.5)" }} />
          <p className="text-[0.55rem] text-[#856C42]/80 uppercase tracking-widest">Versao {version}</p>
          <div className="h-px w-8" style={{ backgroundColor: "rgba(235,191,116,0.5)" }} />
        </div>
      </div>

      <p className="mb-3">{preamble}</p>

      {/* Clause 1 — DAS PARTES */}
      <p className="font-semibold text-[#052413] mb-1 mt-4">CLAUSULA 1 — {getClause(1)?.title || "DAS PARTES"}</p>
      <p className="mb-3"><strong>CONTRATADA:</strong> {companyName}, {companyDesc}, doravante denominada simplesmente "EDITORA".</p>
      <p className="mb-3">
        <strong>CONTRATANTE:</strong>{" "}
        <strong className="text-[#165B36] underline decoration-dotted">{name}</strong>
        {cpf && cpf.replace(/\D/g, "").length === 11 && (
          <>, inscrito(a) no CPF sob o n. <strong className="text-[#165B36]">{cpf}</strong></>
        )}
        {email.includes("@") && (
          <>, e-mail <strong className="text-[#165B36]">{email}</strong></>
        )}
        , doravante denominado(a) simplesmente "CONTRATANTE".
      </p>

      {/* Clause 2 — DO OBJETO */}
      <p className="font-semibold text-[#052413] mb-1 mt-4">CLAUSULA 2 — {getClause(2)?.title || "DO OBJETO"}</p>
      <p className="mb-2">O presente contrato tem por objeto a prestacao dos seguintes servicos editoriais pela EDITORA ao CONTRATANTE:</p>
      <div className="mb-2 pl-3">
        {project.services && project.services.length > 0 ? (
          project.services.map((s) => {
            const svc = SERVICE_MAP[s];
            return svc ? (
              <p key={s} className="mb-0.5">• <strong>{svc.label}</strong> — {svc.desc}</p>
            ) : (
              <p key={s} className="mb-0.5">• {s}</p>
            );
          })
        ) : (
          <p className="italic text-[#856C42]/50">Servicos conforme orcamento aprovado</p>
        )}
      </div>
      <p className="mb-1">A obra objeto deste contrato e: <strong>"{project.title}"</strong>, de autoria de <strong>{project.author}</strong>.</p>
      {(project.format || project.pageCount) && (
        <p className="mb-2">
          Especificacoes tecnicas:{" "}
          {project.format && <>formato <strong>{project.format}</strong></>}
          {project.format && project.pageCount && <>, </>}
          {project.pageCount && <>com aproximadamente <strong>{project.pageCount} paginas</strong></>}
          .
        </p>
      )}
      {budget?.description && (
        <p className="mb-3 p-2 rounded-lg" style={{ backgroundColor: "rgba(22,91,54,0.04)", borderLeft: "3px solid rgba(22,91,54,0.2)" }}>
          <strong>Descricao do orcamento:</strong> {budget.description}
        </p>
      )}

      {/* Clauses 3-4 (static) */}
      {renderStaticClause(3, "DAS OBRIGACOES DA EDITORA", "A EDITORA se obriga a:\na) Executar os servicos contratados com qualidade profissional e dentro dos padroes editoriais vigentes;\nb) Manter sigilo sobre o conteudo da obra e informacoes pessoais do CONTRATANTE;\nc) Fornecer ao CONTRATANTE prova digital da obra para revisao e aprovacao antes da finalizacao;\nd) Realizar os ajustes solicitados pelo CONTRATANTE dentro do escopo contratado, limitados a uma rodada de revisao incluida no preco;\ne) Entregar o material finalizado no prazo acordado, a contar da aprovacao do orcamento e recebimento integral dos arquivos necessarios.")}

      {renderStaticClause(4, "DAS OBRIGACOES DO CONTRATANTE", "O CONTRATANTE se obriga a:\na) Fornecer todos os materiais necessarios para a execucao dos servicos em formato digital adequado;\nb) Efetuar o pagamento conforme as condicoes estipuladas neste contrato;\nc) Responder as solicitacoes da EDITORA em ate 10 (dez) dias uteis;\nd) Revisar e aprovar ou solicitar ajustes na prova digital em ate 15 (quinze) dias uteis apos o envio;\ne) Garantir que possui todos os direitos autorais sobre o conteudo fornecido, isentando a EDITORA de qualquer responsabilidade sobre plagio ou violacao de direitos de terceiros.")}

      {/* Clause 5 — PRECO */}
      <p className="font-semibold text-[#052413] mb-1 mt-4">CLAUSULA 5 — {getClause(5)?.title || "DO PRECO E CONDICOES DE PAGAMENTO"}</p>
      {budget && (
        <>
          <p className="mb-2">O valor total dos servicos e de <strong>{formatCurrency(budget.price)}</strong>, conforme detalhado no orcamento apresentado.</p>
          {dp > 0 && dp < 100 ? (
            <div className="mb-2 p-2 rounded-lg" style={{ backgroundColor: "rgba(22,91,54,0.04)", borderLeft: "3px solid rgba(22,91,54,0.2)" }}>
              <p className="mb-1"><strong>Forma de pagamento parcelada:</strong></p>
              <p className="mb-0.5 pl-3">a) <strong>Entrada ({dp}%):</strong> {formatCurrency(chargeAmount)}, a ser paga no ato da contratacao;</p>
              <p className="mb-0.5 pl-3">b) <strong>Saldo remanescente ({100 - dp}%):</strong> {formatCurrency(remainder)}, a ser pago na entrega do material finalizado.</p>
            </div>
          ) : (
            <p className="mb-2">O pagamento integral no valor de <strong>{formatCurrency(budget.price)}</strong> devera ser realizado no ato da contratacao.</p>
          )}
          <p className="mb-1">O pagamento podera ser realizado por meio das seguintes modalidades:</p>
          <p className="mb-0.5 pl-3">a) <strong>Pix</strong> — transferencia instantanea via QR Code ou codigo;</p>
          <p className="mb-0.5 pl-3">b) <strong>Cartao de credito</strong> — pagamento a vista ou parcelado em ate 12x;</p>
          <p className="mb-2 pl-3">c) <strong>Boleto bancario</strong> — com vencimento em ate 3 dias uteis.</p>
          <p className="mb-3">O nao pagamento nos prazos estipulados podera resultar na suspensao dos servicos sem aviso previo.</p>
        </>
      )}

      {/* Clause 6 — PRAZO */}
      <p className="font-semibold text-[#052413] mb-1 mt-4">CLAUSULA 6 — {getClause(6)?.title || "DO PRAZO"}</p>
      {(() => {
        const deadlineValue = editMode ? editDeadline : budget?.estimatedDeadline;
        if (editMode) {
          return (
            <div className="mb-3">
              <div className="relative mb-2">
                <p className="mb-1.5">O prazo estimado para a execucao dos servicos e de:</p>
                <input
                  type="text"
                  value={editDeadline || ""}
                  onChange={(e) => onDeadlineChange?.(e.target.value)}
                  placeholder="Ex.: 15 dias úteis, 30 dias corridos..."
                  className="w-full px-3 py-2 rounded-lg text-[0.7rem] text-[#052413] border focus:outline-none focus:ring-2 focus:ring-[#165B36]/20"
                  style={{ fontFamily: F, borderColor: "rgba(133,108,66,0.25)", backgroundColor: "rgba(235,191,116,0.06)" }}
                />
                <Pencil className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-amber-500 pointer-events-none mt-3" />
              </div>
              <p className="mb-3 text-[0.6rem] text-[#856C42]/60">contados a partir do recebimento integral dos arquivos necessarios e da confirmacao do pagamento.</p>
            </div>
          );
        }
        return deadlineValue ? (
          <>
            <p className="mb-2">O prazo estimado para a execucao dos servicos e de <strong className="text-[#165B36]">{deadlineValue}</strong>, contados a partir do recebimento integral dos arquivos necessarios e da confirmacao do pagamento.</p>
            <p className="mb-3">Atrasos no fornecimento de materiais ou na aprovacao de etapas pelo CONTRATANTE prorrogarao o prazo proporcionalmente. O prazo podera ser revisto pela EDITORA mediante comunicacao previa ao CONTRATANTE.</p>
          </>
        ) : (
          <p className="mb-3">O prazo estimado para a execucao dos servicos sera informado pela EDITORA apos a analise do material recebido. O prazo comeca a contar a partir do recebimento integral dos arquivos e da confirmacao do pagamento. Atrasos no fornecimento de materiais ou na aprovacao de etapas pelo CONTRATANTE prorrogarao o prazo proporcionalmente.</p>
        );
      })()}

      {/* Clauses 7-12 (static) */}
      {renderStaticClause(7, "DA REVISAO E APROVACAO", "A EDITORA disponibilizara ao CONTRATANTE uma prova digital para revisao. O CONTRATANTE tera uma rodada de revisao incluida no escopo contratado. Ajustes adicionais alem do escopo original poderao ser cobrados separadamente. A aprovacao da prova pelo CONTRATANTE autoriza a EDITORA a finalizar o trabalho.")}
      {renderStaticClause(8, "DA PROPRIEDADE INTELECTUAL", "Os direitos autorais sobre o conteudo da obra permanecem integralmente com o CONTRATANTE. A EDITORA detem os direitos sobre o projeto grafico criado especificamente para a obra, concedendo ao CONTRATANTE licenca de uso irrevogavel e exclusiva. A EDITORA podera utilizar imagens do projeto grafico para fins de divulgacao do seu portfolio, salvo oposicao expressa do CONTRATANTE.")}
      {renderStaticClause(9, "DA RESCISAO", "a) Rescisao pelo CONTRATANTE antes do inicio: reembolso de 80% do valor pago;\nb) Rescisao pelo CONTRATANTE durante a execucao: cobranca proporcional aos servicos realizados;\nc) Rescisao pela EDITORA por forca maior: reembolso integral dos servicos nao realizados.")}
      {renderStaticClause(10, "DA PROTECAO DE DADOS PESSOAIS (LGPD)", "a) Tratamento em conformidade com a LGPD (Lei n. 13.709/2018);\nb) Base legal: execucao de contrato (art. 7, V) e obrigacao legal (art. 7, II);\nc) Finalidade: prestacao dos servicos contratados, emissao fiscal e comunicacao;\nd) Retencao: 5 anos apos conclusao do contrato;\ne) Direitos do titular exerciveis por e-mail (art. 18 da LGPD);\nf) Dados nao compartilhados com terceiros, exceto para pagamentos ou por determinacao legal.")}
      {renderStaticClause(11, "DO FORO E RESOLUCAO DE CONFLITOS", "a) Foro da Comarca de Maringa, PR, com exclusao de qualquer outro;\nb) Resolucao amigavel no prazo de 30 dias antes de acao judicial;\nc) Mediacao ou arbitragem (Lei n. 9.307/1996) como alternativa.")}
      {renderStaticClause(12, "DISPOSICOES GERAIS", "a) Vigencia a partir do aceite eletronico ate conclusao dos servicos;\nb) Validade juridica nos termos da MP n. 2.200-2/2001;\nc) Registro inclui data, hora, IP, navegador, hash SHA-256 e geolocalizacao;\nd) Copia imutavel armazenada no aceite;\ne) Alteracoes somente mediante acordo escrito;\nf) Casos omissos resolvidos pela legislacao brasileira vigente.")}

      {/* Custom clauses */}
      {(() => {
        const clausesList = editMode && editClauses ? editClauses : customClauses;
        const handleClauseEdit = (idx: number, field: "title" | "content", value: string) => {
          if (!editClauses || !onClausesChange) return;
          onClausesChange(editClauses.map((c, i) => i === idx ? { ...c, [field]: value } : c));
        };
        const handleAddClause = () => {
          if (!onClausesChange) return;
          onClausesChange([...(editClauses || []), { title: "", content: "" }]);
        };
        const handleRemoveClause = (idx: number) => {
          if (!editClauses || !onClausesChange) return;
          onClausesChange(editClauses.filter((_, i) => i !== idx));
        };

        return (clausesList.length > 0 || editMode) ? (
          <div className="mt-2 pt-2 border-t border-dashed" style={{ borderColor: "rgba(133,108,66,0.15)" }}>
            {clausesList.map((clause, idx) => (
              <div key={idx}>
                {editMode ? (
                  <div className="mt-4 rounded-lg p-3 space-y-2" style={{ backgroundColor: "rgba(235,191,116,0.06)", border: "1px solid rgba(133,108,66,0.15)" }}>
                    <div className="flex items-center gap-2">
                      <span className="text-[0.6rem] font-bold text-[#856C42] whitespace-nowrap" style={{ fontFamily: F }}>Cláusula {13 + idx}</span>
                      <input
                        type="text"
                        value={clause.title}
                        onChange={(e) => handleClauseEdit(idx, "title", e.target.value)}
                        placeholder="Título (ex.: Do prazo de entrega)"
                        className="flex-1 px-2 py-1 rounded border text-[0.65rem] text-[#052413] focus:outline-none focus:ring-1 focus:ring-[#165B36]/20"
                        style={{ fontFamily: F, borderColor: "rgba(133,108,66,0.2)", backgroundColor: "#fff" }}
                      />
                      <button onClick={() => handleRemoveClause(idx)} className="p-1 rounded text-gray-400 hover:text-red-500 cursor-pointer" title="Remover cláusula"><Trash2 className="w-3 h-3" /></button>
                    </div>
                    <textarea
                      value={clause.content}
                      onChange={(e) => handleClauseEdit(idx, "content", e.target.value)}
                      placeholder="Conteúdo da cláusula..."
                      rows={3}
                      className="w-full px-2 py-1.5 rounded border text-[0.65rem] text-[#052413] resize-none focus:outline-none focus:ring-1 focus:ring-[#165B36]/20"
                      style={{ fontFamily: F, borderColor: "rgba(133,108,66,0.2)", backgroundColor: "#fff" }}
                    />
                  </div>
                ) : (
                  <>
                    <p className="font-semibold text-[#052413] mb-1 mt-4">CLAUSULA {13 + idx} — {clause.title ? clause.title.toUpperCase() : `DISPOSICOES ESPECIFICAS ${idx + 1}`}</p>
                    <p className="mb-3 whitespace-pre-wrap">{clause.content}</p>
                  </>
                )}
              </div>
            ))}
            {editMode && (
              <button
                onClick={handleAddClause}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.65rem] font-medium text-[#856C42] hover:bg-[#EBBF74]/10 transition-colors cursor-pointer"
                style={{ fontFamily: F, border: "1px dashed rgba(133,108,66,0.3)" }}
              >
                <Plus className="w-3 h-3" /> Adicionar cláusula
              </button>
            )}
          </div>
        ) : null;
      })()}

      {/* Acceptance stamp if contract was accepted */}
      {acceptance && (
        <div className="mt-6 pt-4 border-t" style={{ borderColor: "rgba(10,124,62,0.2)" }}>
          <div className="p-3 rounded-xl" style={{ backgroundColor: "rgba(10,124,62,0.04)", border: "1px solid rgba(10,124,62,0.15)" }}>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-xs font-semibold text-green-700" style={{ fontFamily: F }}>Contrato aceito eletronicamente</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[0.6rem]">
              <p><span className="text-gray-400">Nome:</span> <span className="text-gray-700 font-medium">{acceptance.acceptorName}</span></p>
              <p><span className="text-gray-400">E-mail:</span> <span className="text-gray-700">{acceptance.acceptorEmail}</span></p>
              {acceptance.acceptorCpf && <p><span className="text-gray-400">CPF:</span> <span className="text-gray-700 font-mono">{acceptance.acceptorCpf}</span></p>}
              <p><span className="text-gray-400">Data:</span> <span className="text-gray-700">{new Date(acceptance.acceptedAt).toLocaleString("pt-BR")}</span></p>
              <p><span className="text-gray-400">Versão:</span> <span className="text-gray-700 font-mono">{acceptance.contractVersion}</span></p>
              <p><span className="text-gray-400">IP:</span> <span className="text-gray-700 font-mono">{acceptance.ip}</span></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Main Admin Projects Component
// ============================================
export function AdminProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await getAdminProjects();
      const freshProjects = data.projects || [];
      setProjects(freshProjects);
      // Update editingProject with fresh data if modal is open
      setEditingProject(prev => {
        if (!prev) return null;
        const updated = freshProjects.find((p: Project) => p.id === prev.id);
        return updated || null;
      });
    } catch (err) {
      console.error("Error loading projects:", err);
      toast.error("Erro ao carregar projetos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este projeto?")) return;
    setDeletingId(id);
    try {
      await deleteAdminProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      toast.success("Projeto excluído.");
    } catch (err) {
      console.error("Delete project error:", err);
      toast.error("Erro ao excluir projeto.");
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = projects.filter((p) => {
    const matchesSearch =
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.userName.toLowerCase().includes(search.toLowerCase()) ||
      p.userEmail.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "all" || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = STATUS_FLOW.reduce((acc, s) => {
    acc[s.key] = projects.filter((p) => p.status === s.key).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900" style={{ fontFamily: "Inter, sans-serif" }}>
            Projetos
          </h1>
          <p className="text-sm text-gray-500 mt-1" style={{ fontFamily: "Inter, sans-serif" }}>
            Gerencie as solicitações dos clientes
          </p>
        </div>
        <button
          onClick={async () => {
            const url = `${window.location.origin}/nova-solicitacao`;
            try {
              await navigator.clipboard.writeText(url);
              toast.success("Link do formulário copiado!");
            } catch {
              prompt("Copie o link:", url);
            }
          }}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-[#165B36] bg-[#165B36]/5 hover:bg-[#165B36]/10 transition-colors cursor-pointer whitespace-nowrap"
          style={{ fontFamily: "Inter, sans-serif" }}
          title="Copiar link do formulário de nova solicitação"
        >
          <Copy className="w-3.5 h-3.5" />
          Link de solicitação
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
        {STATUS_FLOW.map((s) => (
          <button
            key={s.key}
            onClick={() => setFilterStatus(filterStatus === s.key ? "all" : s.key)}
            className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
              filterStatus === s.key ? "ring-2 ring-offset-1" : ""
            }`}
            style={{
              borderColor: filterStatus === s.key ? s.color : "rgba(0,0,0,0.06)",
              ringColor: s.color,
            }}
          >
            <p className="text-lg font-semibold" style={{ color: s.color, fontFamily: "Inter, sans-serif" }}>
              {statusCounts[s.key] || 0}
            </p>
            <p className="text-[0.55rem] text-gray-500 leading-tight" style={{ fontFamily: "Inter, sans-serif" }}>
              {s.label}
            </p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por título, cliente ou email..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20"
          style={{ fontFamily: "Inter, sans-serif" }}
        />
        {filterStatus !== "all" && (
          <button
            onClick={() => setFilterStatus("all")}
            className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer flex items-center gap-1"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            {getStatusLabel(filterStatus)}
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Projects table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-[#165B36] rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm" style={{ fontFamily: "Inter, sans-serif" }}>
            {search || filterStatus !== "all"
              ? "Nenhum projeto encontrado com esses filtros"
              : "Nenhum projeto ainda"}
          </p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ fontFamily: "Inter, sans-serif" }}>
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Projeto</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Pgto.</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((project) => {
                  const color = getStatusColor(project.status);
                  return (
                    <tr key={project.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 truncate max-w-[200px]">{project.title}</p>
                        <p className="text-xs text-gray-400">{project.author}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-700 truncate max-w-[150px]">{project.userName}</p>
                        <p className="text-xs text-gray-400 truncate max-w-[150px]">{project.userEmail}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ color, backgroundColor: `${color}12` }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                          {getStatusLabel(project.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {project.budget ? (() => {
                          const hd = project.budget.depositPercent && project.budget.depositPercent > 0 && project.budget.depositPercent < 100;
                          const bpaid = project.budget.status === "paid" || project.budget.status === "fully_paid";
                          const ep = hd && bpaid;
                          const rp = ep && project.budget.remainderStatus !== "paid";
                          const fp = bpaid && (!hd || project.budget.remainderStatus === "paid");
                          const hasInst = project.budget.installmentPlan?.enabled;
                          const instPaid = hasInst ? project.budget.installmentPlan!.installments.filter((i: any) => i.status === "paid").length : 0;
                          const instTotal = hasInst ? project.budget.installmentPlan!.totalInstallments : 0;
                          const allInstPaid = hasInst && instPaid === instTotal;
                          if (hasInst) {
                            return allInstPaid ? (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600"><CheckCircle className="w-3 h-3" /> {instTotal}x pago</span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600"><Calendar className="w-3 h-3" /> {instPaid}/{instTotal}x</span>
                            );
                          }
                          return fp ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600"><CheckCircle className="w-3 h-3" /> {hd ? "Total pago" : "Pago"}</span>
                          ) : rp ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600"><AlertCircle className="w-3 h-3" /> Entrada paga</span>
                          ) : bpaid ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600"><CheckCircle className="w-3 h-3" /> Pago</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600"><Clock className="w-3 h-3" /> Pendente</span>
                          );
                        })() : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {formatDate(project.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditingProject(project)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-[#165B36] hover:bg-[#165B36]/5 transition-colors cursor-pointer"
                            title="Editar"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(project.id)}
                            disabled={deletingId === project.id}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
                            title="Excluir"
                          >
                            {deletingId === project.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit modal */}
      <AnimatePresence>
        {editingProject && (
          <EditProjectModal
            project={editingProject}
            onClose={() => setEditingProject(null)}
            onUpdated={loadProjects}
          />
        )}
      </AnimatePresence>
    </div>
  );
}