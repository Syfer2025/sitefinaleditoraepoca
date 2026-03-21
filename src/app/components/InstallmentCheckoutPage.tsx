import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  BookOpen, CheckCircle, Loader2, Copy, Check, AlertCircle,
  ArrowLeft, Shield, Calendar, Banknote, CreditCard, Zap,
  Eye, EyeOff, QrCode, RefreshCw, ScrollText, FileText, Lock,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { GoldButton } from "./GoldButton";
import { getInstallmentCheckout, generateInstallmentPayoff, regenerateInstallmentPix, regeneratePayoffPix, acceptContract, getPublicContractTemplate } from "../data/api";
import { useUserAuth } from "./UserAuthContext";
import { toast, Toaster } from "sonner";
import logoImg from "/assets/logo.png";

// ============================================
// Types
// ============================================
interface Installment {
  number: number;
  amount: number;
  dueDate: string;
  status: string;
  paidAt: string | null;
  pixCode: string | null;
  pixQrCode: string | null;
  generatedAt: string | null;
}

interface Payoff {
  amount: number;
  installmentsCovered: number[];
  pixCode: string | null;
  pixQrCode: string | null;
  paymentId: string;
  generatedAt: string;
  status: string;
  paidAt?: string;
}

interface CheckoutData {
  projectId: string;
  title: string;
  author: string;
  userName: string;
  description: string;
  format: string;
  pageCount: number | null;
  services: string[];
  notes: string;
  fullPrice: number;
  totalPrice: number;
  depositPercent: number;
  chargeAmount: number;
  depositStatus: string | null;
  depositPaidAt: string | null;
  depositPaymentUrl: string | null;
  depositSandboxUrl: string | null;
  paidAmount: number;
  pendingAmount: number;
  budgetStatus: string;
  budgetDescription: string;
  customClauses: any;
  estimatedDeadline: string | null;
  requireContract: boolean;
  contractAccepted: boolean;
  contractAcceptedAt: string | null;
  contractAcceptorName: string | null;
  contractAcceptorEmail: string | null;
  contractAcceptorCpf: string | null;
  contractHash: string | null;
  installmentPlan: {
    totalInstallments: number;
    requireContract: boolean;
    installments: Installment[];
    payoff: Payoff | null;
    createdAt: string;
  };
}

// ============================================
// Helpers
// ============================================
const f = { play: "'Playfair Display', serif", inter: "Inter, sans-serif" };

function formatCurrency(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

function formatDateBR(d: string): string {
  try {
    return new Date(d + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  } catch { return d; }
}

function formatDateShort(d: string): string {
  try {
    return new Date(d + "T12:00:00").toLocaleDateString("pt-BR");
  } catch { return d; }
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch { return iso; }
}

// ============================================
// Main Component
// ============================================
export function InstallmentCheckoutPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useUserAuth();
  const [data, setData] = useState<CheckoutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedPix, setCopiedPix] = useState<number | "payoff" | null>(null);
  const [showQr, setShowQr] = useState<number | "payoff" | null>(null);
  const [generatingPayoff, setGeneratingPayoff] = useState(false);
  const [showPayoff, setShowPayoff] = useState(false);
  const [regenerating, setRegenerating] = useState<number | "payoff" | null>(null);

  // Contract states
  const [contractAccepted, setContractAccepted] = useState(false);
  const [contractExpanded, setContractExpanded] = useState(false);
  const [contractName, setContractName] = useState("");
  const [contractEmail, setContractEmail] = useState("");
  const [contractCpf, setContractCpf] = useState("");
  const [acceptingContract, setAcceptingContract] = useState(false);
  const [contractTemplate, setContractTemplate] = useState<any>(null);
  const [contractLoadError, setContractLoadError] = useState(false);
  const [loadingContract, setLoadingContract] = useState(false);

  const fetchData = useCallback(async () => {
    if (!projectId) return;
    try {
      const result = await getInstallmentCheckout(projectId);
      setData(result);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar dados de parcelamento");
      console.error("Installment checkout error:", err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Sync contract accepted state from server data
  useEffect(() => {
    if (data?.contractAccepted) {
      setContractAccepted(true);
      if (data.contractAcceptorName) setContractName(data.contractAcceptorName);
      if (data.contractAcceptorEmail) setContractEmail(data.contractAcceptorEmail);
      if (data.contractAcceptorCpf) setContractCpf(data.contractAcceptorCpf);
    }
  }, [data]);

  // Load contract template if required
  const loadContractTemplate = useCallback(async () => {
    setLoadingContract(true);
    setContractLoadError(false);
    try {
      const res = await getPublicContractTemplate();
      if (res?.template) {
        setContractTemplate(res.template);
      } else {
        setContractLoadError(true);
      }
    } catch (err: any) {
      console.error("Error loading contract template:", err);
      setContractLoadError(true);
    } finally {
      setLoadingContract(false);
    }
  }, []);

  useEffect(() => {
    if (data?.requireContract && !data.contractAccepted && !contractTemplate && !loadingContract) {
      loadContractTemplate();
    }
  }, [data?.requireContract, data?.contractAccepted, contractTemplate, loadingContract, loadContractTemplate]);

  // Auto-refresh every 30s
  useEffect(() => {
    if (!projectId) return;
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [projectId, fetchData]);

  const handleCopyPix = (key: number | "payoff", code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedPix(key);
    toast.success("Codigo PIX copiado!");
    setTimeout(() => setCopiedPix(null), 3000);
  };

  const handleGeneratePayoff = async () => {
    if (!projectId) return;
    setGeneratingPayoff(true);
    try {
      await generateInstallmentPayoff(projectId);
      toast.success("PIX de quitacao gerado com sucesso!");
      await fetchData();
    } catch (err: any) {
      toast.error(err.message || "Erro ao gerar PIX de quitacao");
    } finally {
      setGeneratingPayoff(false);
    }
  };

  const handleAcceptContract = async () => {
    if (!projectId || !contractName.trim() || !contractEmail.trim()) {
      toast.error("Preencha nome e email para aceitar o contrato.");
      return;
    }
    setAcceptingContract(true);
    try {
      // Generate full contract HTML snapshot for legal record
      const snapshot = generateContractHTML();
      let contractHash = "";
      if (snapshot) {
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(snapshot);
        const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
        contractHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
      }
      await acceptContract(projectId, {
        contractVersion: CONTRACT_VERSION,
        acceptorName: contractName.trim(),
        acceptorEmail: contractEmail.trim(),
        acceptorCpf: contractCpf.trim() || undefined,
        contractHash: contractHash || undefined,
        contractSnapshot: snapshot || undefined,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
      });
      toast.success("Contrato aceito com sucesso!");
      await fetchData();
      setContractAccepted(true); // set after server confirms
    } catch (err: any) {
      toast.error(err.message || "Erro ao registrar aceite do contrato");
    } finally {
      setAcceptingContract(false);
    }
  };

  const handleRegeneratePix = async (key: number | "payoff") => {
    if (!projectId) return;
    setRegenerating(key);
    try {
      if (key === "payoff") {
        await regeneratePayoffPix(projectId);
      } else {
        await regenerateInstallmentPix(projectId, key);
      }
      toast.success("PIX regenerado com sucesso!");
      await fetchData();
    } catch (err: any) {
      toast.error(err.message || "Erro ao regenerar PIX");
    } finally {
      setRegenerating(null);
    }
  };

  // ============================================
  // Contract template helpers
  // ============================================
  const CONTRACT_VERSION = contractTemplate?.version || "1.0";
  const COMPANY_NAME = contractTemplate?.companyName || "Epoca Editora de Livros";
  const COMPANY_DESC = contractTemplate?.companyDescription || "pessoa juridica de direito privado, com sede em territorio brasileiro";
  const CONTRACT_PREAMBLE = contractTemplate?.preamble || "Pelo presente instrumento particular, as partes abaixo qualificadas celebram o presente Contrato de Prestacao de Servicos Editoriais, que se regera pelas seguintes clausulas e condicoes:";

  const getClauseContent = useCallback((num: number): { title: string; content: string } | null => {
    if (!contractTemplate?.clauses) return null;
    return contractTemplate.clauses.find((c: any) => c.number === num) || null;
  }, [contractTemplate]);

  const SERVICE_MAP: Record<string, { label: string; desc: string }> = {
    diagramacao: { label: "Diagramacao", desc: "projeto grafico e composicao visual do livro" },
    capa: { label: "Design de Capa", desc: "criacao de capa profissional para o livro" },
    revisao: { label: "Revisao", desc: "revisao textual e gramatical do conteudo" },
    ebook: { label: "E-book", desc: "conversao para formato digital (ePub/Kindle)" },
    isbn: { label: "ISBN", desc: "obtencao do numero padrao internacional do livro" },
    fichacat: { label: "Ficha Catalografica", desc: "elaboracao da ficha catalografica" },
    impressao: { label: "Impressao", desc: "impressao grafica da obra" },
  };

  const generateContractHTML = useCallback(() => {
    if (!data) return "";
    const getClauseText = (num: number, defaultTitle: string, defaultContent: string) => {
      const tmpl = getClauseContent(num);
      const title = tmpl?.title || defaultTitle;
      const content = tmpl?.content || defaultContent;
      const lines = content.split("\n").filter((l: string) => l.trim());
      return `<p style="font-weight:bold;margin-top:14px;margin-bottom:4px;">CLÁUSULA ${num} — ${title}</p>` +
        lines.map((l: string) => `<p style="margin-bottom:3px;${/^[a-z]\)/.test(l.trim()) ? "padding-left:12px;" : ""}">${l}</p>`).join("");
    };

    let html = "";
    html += `<div style="text-align:center;margin-bottom:20px;padding-bottom:14px;border-bottom:1px solid rgba(133,108,66,0.15);">`;
    html += `<p style="font-weight:bold;font-size:13px;letter-spacing:1px;">CONTRATO DE PRESTACAO DE SERVICOS EDITORIAIS</p>`;
    html += `<p style="font-size:9px;color:#856C42;text-transform:uppercase;letter-spacing:2px;margin-top:4px;">Versao ${CONTRACT_VERSION}</p></div>`;
    html += `<p style="margin-bottom:10px;">${CONTRACT_PREAMBLE}</p>`;

    // Clause 1 - Parties
    html += `<p style="font-weight:bold;margin-top:14px;margin-bottom:4px;">CLÁUSULA 1 — ${getClauseContent(1)?.title || "DAS PARTES"}</p>`;
    html += `<p style="margin-bottom:8px;"><strong>CONTRATADA:</strong> ${COMPANY_NAME}, ${COMPANY_DESC}, doravante denominada simplesmente "EDITORA".</p>`;
    html += `<p style="margin-bottom:8px;"><strong>CONTRATANTE:</strong> ${contractName.trim() || "[nome do contratante]"}`;
    if (contractCpf.replace(/\D/g, "").length >= 11) html += `, inscrito(a) no CPF/CNPJ sob o n. ${contractCpf}`;
    if (contractEmail.includes("@")) html += `, e-mail ${contractEmail.trim()}`;
    html += `, doravante denominado(a) simplesmente "CONTRATANTE".</p>`;

    // Clause 2 - Object
    html += `<p style="font-weight:bold;margin-top:14px;margin-bottom:4px;">CLÁUSULA 2 — DO OBJETO</p>`;
    html += `<p style="margin-bottom:6px;">O presente contrato tem por objeto a prestacao dos seguintes servicos editoriais pela EDITORA ao CONTRATANTE:</p>`;
    if (data.services?.length) {
      data.services.forEach((s: string) => {
        const svc = SERVICE_MAP[s];
        html += `<p style="padding-left:12px;margin-bottom:2px;">• ${svc ? `<strong>${svc.label}</strong> — ${svc.desc}` : s}</p>`;
      });
    } else {
      html += `<p style="padding-left:12px;margin-bottom:4px;"><em>Servicos conforme orcamento aprovado</em></p>`;
    }
    html += `<p style="margin-bottom:4px;">A obra objeto deste contrato e: <strong>"${data.title}"</strong>, de autoria de <strong>${data.author}</strong>.</p>`;
    if (data.format || data.pageCount) {
      html += `<p style="margin-bottom:8px;">Especificacoes tecnicas: ${data.format ? `formato <strong>${data.format}</strong>` : ""}${data.format && data.pageCount ? ", " : ""}${data.pageCount ? `com aproximadamente <strong>${data.pageCount} paginas</strong>` : ""}.</p>`;
    }
    if (data.budgetDescription) {
      html += `<p style="margin-bottom:8px;padding:6px;border-left:3px solid rgba(22,91,54,0.2);background:rgba(22,91,54,0.04);"><strong>Descricao do orcamento:</strong> ${data.budgetDescription}</p>`;
    }

    // Clauses 3-4
    html += getClauseText(3, "DAS OBRIGACOES DA EDITORA", "A EDITORA se obriga a:\na) Executar os servicos contratados com qualidade profissional e dentro dos padroes editoriais vigentes;\nb) Manter sigilo sobre o conteudo da obra e informacoes pessoais do CONTRATANTE;\nc) Fornecer ao CONTRATANTE prova digital da obra para revisao e aprovacao antes da finalizacao;\nd) Realizar os ajustes solicitados pelo CONTRATANTE dentro do escopo contratado;\ne) Entregar o material finalizado no prazo acordado.");
    html += getClauseText(4, "DAS OBRIGACOES DO CONTRATANTE", "O CONTRATANTE se obriga a:\na) Fornecer todos os materiais necessarios para a execucao dos servicos em formato digital adequado;\nb) Efetuar o pagamento conforme as condicoes estipuladas neste contrato;\nc) Responder as solicitacoes da EDITORA em ate 10 (dez) dias uteis;\nd) Revisar e aprovar ou solicitar ajustes na prova digital em ate 15 (quinze) dias uteis;\ne) Garantir que possui todos os direitos autorais sobre o conteudo fornecido.");

    // Clause 5 - Price + installments
    html += `<p style="font-weight:bold;margin-top:14px;margin-bottom:4px;">CLÁUSULA 5 — DO PRECO E CONDICOES DE PAGAMENTO</p>`;
    html += `<p style="margin-bottom:6px;">O valor total dos servicos e de <strong>${formatCurrency(data.fullPrice)}</strong>.</p>`;
    if (data.depositPercent > 0 && data.depositPercent < 100) {
      html += `<p style="margin-bottom:2px;padding-left:12px;">a) <strong>Entrada (${data.depositPercent}%):</strong> ${formatCurrency(data.chargeAmount)}, a ser paga no ato da contratacao;</p>`;
      html += `<p style="margin-bottom:6px;padding-left:12px;">b) <strong>Saldo remanescente (${100 - data.depositPercent}%):</strong> ${formatCurrency(data.totalPrice)}, parcelado conforme cronograma abaixo.</p>`;
    }
    if (data.installmentPlan?.installments?.length) {
      html += `<p style="margin-bottom:4px;"><strong>Parcelamento via PIX (${data.installmentPlan.totalInstallments} parcelas):</strong></p>`;
      data.installmentPlan.installments.forEach((inst: any) => {
        html += `<p style="padding-left:12px;margin-bottom:2px;">${inst.number}ª parcela: <strong>${formatCurrency(inst.amount)}</strong> — vencimento em ${formatDateShort(inst.dueDate)};</p>`;
      });
    }

    // Clauses 6-12
    html += `<p style="font-weight:bold;margin-top:14px;margin-bottom:4px;">CLÁUSULA 6 — DO PRAZO</p>`;
    html += `<p style="margin-bottom:8px;">${data.estimatedDeadline ? `O prazo estimado para execucao e de <strong>${data.estimatedDeadline}</strong>.` : "O prazo sera definido apos a aprovacao do orcamento."}</p>`;
    html += getClauseText(7, "DA REVISAO E APROVACAO", "O CONTRATANTE tera direito a uma rodada de revisao incluida no preco. Ajustes adicionais poderao ser orcados separadamente.");
    html += getClauseText(8, "DA RESCISAO", "O contrato podera ser rescindido por qualquer das partes, mediante aviso previo por escrito com 15 dias de antecedencia. Em caso de rescisao pelo CONTRATANTE, os valores ja pagos nao serao restituidos.");
    html += getClauseText(9, "DA PROPRIEDADE INTELECTUAL", "Os direitos autorais sobre o conteudo da obra permanecem integralmente com o CONTRATANTE. A EDITORA podera utilizar a obra em seu portfolio, salvo disposicao em contrario.");
    html += getClauseText(10, "DA PROTECAO DE DADOS (LGPD)", "As partes comprometem-se a tratar dados pessoais conforme a Lei Geral de Protecao de Dados (Lei n. 13.709/2018).");
    html += getClauseText(11, "DO FORO", "Fica eleito o foro da comarca de Sao Paulo/SP para dirimir quaisquer controversias oriundas deste contrato.");
    html += getClauseText(12, "DAS DISPOSICOES GERAIS", "Este contrato representa o acordo integral entre as partes, substituindo quaisquer entendimentos anteriores.");

    // Custom clauses
    if (data.customClauses?.length) {
      data.customClauses.forEach((cl: any, i: number) => {
        html += `<p style="font-weight:bold;margin-top:14px;margin-bottom:4px;">CLÁUSULA ${13 + i} — ${cl.title}</p>`;
        html += `<p style="margin-bottom:8px;">${cl.content}</p>`;
      });
    }

    return html;
  }, [data, contractTemplate, contractName, contractEmail, contractCpf, getClauseContent, CONTRACT_VERSION, COMPANY_NAME, COMPANY_DESC, CONTRACT_PREAMBLE]);

  // Noise filter for GoldButton
  const noiseFilter = (
    <svg className="absolute w-0 h-0" aria-hidden="true">
      <filter id="goldNoise">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch" />
      </filter>
    </svg>
  );

  // ============================================
  // Loading State
  // ============================================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(180deg, #FFFDF8 0%, #F5F0E8 100%)" }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#856C42] mx-auto mb-4" />
          <p className="text-sm text-[#856C42]" style={{ fontFamily: f.inter }}>Carregando parcelas...</p>
        </motion.div>
      </div>
    );
  }

  // ============================================
  // Error State
  // ============================================
  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "linear-gradient(180deg, #FFFDF8 0%, #F5F0E8 100%)" }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: "rgba(239,68,68,0.1)" }}>
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-[#052413] mb-2" style={{ fontFamily: f.play }}>Erro ao carregar</h2>
          <p className="text-sm text-[#856C42]/70 mb-6" style={{ fontFamily: f.inter }}>{error || "Dados nao encontrados"}</p>
          <Link to="/minha-conta" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-[#856C42] hover:bg-[#F0E8D4] transition-colors" style={{ fontFamily: f.inter }}>
            <ArrowLeft className="w-4 h-4" /> Voltar a minha conta
          </Link>
        </motion.div>
      </div>
    );
  }

  const { installmentPlan } = data;
  const paidCount = installmentPlan.installments.filter(i => i.status === "paid").length;
  const allPaid = paidCount === installmentPlan.totalInstallments;
  const hasDeposit = data.depositPercent > 0 && data.depositPercent < 100;
  // Overall progress: deposit + installments
  const depositPaid = hasDeposit && data.depositStatus === "paid";
  const totalProjectAmount = hasDeposit ? data.fullPrice : data.totalPrice;
  const totalPaidSoFar = (depositPaid ? data.chargeAmount : 0) + data.paidAmount;
  const progressPercent = totalProjectAmount > 0 ? (totalPaidSoFar / totalProjectAmount) * 100 : 0;
  const currentInstallment = installmentPlan.installments.find(i => i.status !== "paid" && i.pixCode);
  const nextPending = installmentPlan.installments.find(i => i.status !== "paid");
  const pendingCount = installmentPlan.totalInstallments - paidCount;
  const hasPayoff = installmentPlan.payoff && installmentPlan.payoff.status !== "paid";
  const payoffPaid = installmentPlan.payoff?.status === "paid";
  const needsContract = data.requireContract && !contractAccepted;

  // ============================================
  // All Paid - Success State
  // ============================================
  if (allPaid) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "linear-gradient(180deg, #FFFDF8 0%, #F0F7F2 100%)" }}>
        {noiseFilter}
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-lg w-full text-center">
          <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(10,124,62,0.1), rgba(10,124,62,0.2))" }}>
            <CheckCircle className="w-10 h-10 text-[#0a7c3e]" />
          </div>
          <h1 className="text-3xl font-bold text-[#052413] mb-3" style={{ fontFamily: f.play }}>Pagamento Concluido!</h1>
          <p className="text-base text-[#856C42]/80 mb-2" style={{ fontFamily: f.inter }}>
            Todas as <strong>{installmentPlan.totalInstallments} parcelas</strong> do livro <strong>&ldquo;{data.title}&rdquo;</strong> foram pagas.
          </p>
          <p className="text-2xl font-bold text-[#0a7c3e] mb-8" style={{ fontFamily: f.inter }}>
            {formatCurrency(totalProjectAmount)}
          </p>
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl mb-8" style={{ background: "rgba(10,124,62,0.06)", border: "1px solid rgba(10,124,62,0.15)" }}>
            <Shield className="w-4 h-4 text-[#0a7c3e]" />
            <span className="text-sm text-[#0a7c3e] font-medium" style={{ fontFamily: f.inter }}>Pagamento 100% quitado</span>
          </div>
          <div>
            <Link to="/minha-conta">
              <GoldButton className="px-8 py-3 text-sm font-semibold">
                <ArrowLeft className="w-4 h-4 mr-2" /> Voltar a minha conta
              </GoldButton>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // ============================================
  // Main Checkout
  // ============================================
  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #FFFDF8 0%, #F5F0E8 100%)" }}>
      {noiseFilter}
      <Toaster position="top-center" richColors />

      {/* Header */}
      <header className="border-b" style={{ borderColor: "rgba(133,108,66,0.1)", background: "rgba(255,253,248,0.95)", backdropFilter: "blur(12px)" }}>
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/minha-conta" className="flex items-center gap-2 text-sm text-[#856C42] hover:text-[#052413] transition-colors" style={{ fontFamily: f.inter }}>
            <ArrowLeft className="w-4 h-4" /> Minha conta
          </Link>
          <Link to="/">
            <img src={logoImg} alt="Epoca Editora" className="h-8 object-contain" />
          </Link>
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-[#0a7c3e]" />
            <span className="text-[0.65rem] text-[#0a7c3e] font-medium" style={{ fontFamily: f.inter }}>Pagamento seguro</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Project Info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #EBBF74, #856C42)" }}>
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-[#052413] mb-1 leading-tight" style={{ fontFamily: f.play }}>
                Parcelamento PIX
              </h1>
              <p className="text-sm text-[#856C42]/70" style={{ fontFamily: f.inter }}>
                {data.title} {data.author && <>— <span className="text-[#052413]">{data.author}</span></>}
              </p>
              {data.userName && (
                <p className="text-xs text-[#856C42]/50 mt-0.5" style={{ fontFamily: f.inter }}>
                  Cliente: {data.userName}
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Progress Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl overflow-hidden mb-6"
          style={{ background: "white", border: "1px solid rgba(133,108,66,0.12)", boxShadow: "0 2px 12px rgba(133,108,66,0.06)" }}
        >
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#856C42]" />
                <span className="text-sm font-semibold text-[#052413]" style={{ fontFamily: f.inter }}>
                  Progresso do pagamento
                </span>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{
                fontFamily: f.inter,
                background: "linear-gradient(135deg, rgba(235,191,116,0.15), rgba(133,108,66,0.08))",
                color: "#856C42"
              }}>
                {hasDeposit ? `${(depositPaid ? 1 : 0) + paidCount}/${1 + installmentPlan.totalInstallments}` : `${paidCount}/${installmentPlan.totalInstallments}`} pagas
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-3 rounded-full overflow-hidden mb-4" style={{ background: "rgba(133,108,66,0.08)" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, #165B36, #0a7c3e)" }}
              />
            </div>

            {/* Amounts */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 rounded-xl" style={{ background: "rgba(10,124,62,0.04)" }}>
                <p className="text-[0.65rem] text-[#856C42]/60 mb-1 uppercase tracking-wider font-medium" style={{ fontFamily: f.inter }}>Pago</p>
                <p className="text-lg font-bold text-[#0a7c3e]" style={{ fontFamily: f.inter }}>
                  {formatCurrency(totalPaidSoFar)}
                </p>
              </div>
              <div className="text-center p-3 rounded-xl" style={{ background: "rgba(235,191,116,0.08)" }}>
                <p className="text-[0.65rem] text-[#856C42]/60 mb-1 uppercase tracking-wider font-medium" style={{ fontFamily: f.inter }}>Restante</p>
                <p className="text-lg font-bold text-[#856C42]" style={{ fontFamily: f.inter }}>
                  {formatCurrency(Math.max(0, totalProjectAmount - totalPaidSoFar))}
                </p>
              </div>
              <div className="text-center p-3 rounded-xl" style={{ background: "rgba(5,36,19,0.03)" }}>
                <p className="text-[0.65rem] text-[#856C42]/60 mb-1 uppercase tracking-wider font-medium" style={{ fontFamily: f.inter }}>Total</p>
                <p className="text-lg font-bold text-[#052413]" style={{ fontFamily: f.inter }}>
                  {formatCurrency(totalProjectAmount)}
                </p>
              </div>
            </div>

            {/* Deposit info */}
            {hasDeposit && (
              <div className="mt-3 flex items-center gap-2 px-3 py-2.5 rounded-lg" style={{ background: depositPaid ? "rgba(10,124,62,0.04)" : "rgba(235,191,116,0.08)", border: `1px solid ${depositPaid ? "rgba(10,124,62,0.1)" : "rgba(235,191,116,0.2)"}` }}>
                {depositPaid ? <CheckCircle className="w-3.5 h-3.5 text-[#0a7c3e] flex-shrink-0" /> : <CreditCard className="w-3.5 h-3.5 text-[#856C42] flex-shrink-0" />}
                <p className="text-[0.65rem] text-[#856C42]/70 leading-relaxed" style={{ fontFamily: f.inter }}>
                  {depositPaid
                    ? <>Entrada de {data.depositPercent}% (<strong className="text-[#0a7c3e]">{formatCurrency(data.chargeAmount)}</strong>) paga — trabalhos iniciados. As {installmentPlan.totalInstallments} parcelas abaixo cobrem o restante de <strong className="text-[#052413]">{formatCurrency(data.totalPrice)}</strong>. A 1ª parcela vence 30 dias apos o pagamento da entrada.</>
                    : <>Entrada de {data.depositPercent}% (<strong className="text-[#052413]">{formatCurrency(data.chargeAmount)}</strong>) para <strong>inicio dos trabalhos</strong>. Apos a confirmacao, as {installmentPlan.totalInstallments} parcelas serao liberadas com a 1ª vencendo em 30 dias.</>
                  }
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* CONTRACT GATE — shown when contract is required but not yet accepted */}
        {needsContract && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl overflow-hidden mb-6"
            style={{
              background: "white",
              border: "2px solid rgba(133,108,66,0.25)",
              boxShadow: "0 4px 24px rgba(133,108,66,0.08)",
            }}
          >
            <div className="px-5 py-4 flex items-center gap-3" style={{ background: "linear-gradient(135deg, rgba(133,108,66,0.06), rgba(235,191,116,0.08))" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(133,108,66,0.1), rgba(235,191,116,0.15))" }}>
                <ScrollText className="w-5 h-5 text-[#856C42]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#052413]" style={{ fontFamily: f.play }}>
                  Aceite do Contrato
                </h2>
                <p className="text-xs text-[#856C42]/70" style={{ fontFamily: f.inter }}>
                  E necessario aceitar o contrato antes de acessar os PIX de pagamento
                </p>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Contract content */}
              {loadingContract ? (
                <div className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-[#856C42] mx-auto mb-2" />
                  <p className="text-xs text-[#856C42]/60" style={{ fontFamily: f.inter }}>Carregando contrato...</p>
                </div>
              ) : contractLoadError && !contractTemplate ? (
                <div className="text-center py-4 space-y-3">
                  <AlertCircle className="w-5 h-5 text-[#856C42]/60 mx-auto" />
                  <p className="text-xs text-[#856C42]/60" style={{ fontFamily: f.inter }}>
                    Nao foi possivel carregar o contrato. Verifique sua conexao e tente novamente.
                  </p>
                  <button
                    onClick={loadContractTemplate}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium text-[#052413] cursor-pointer hover:bg-[#F0E8D4]/60 transition-colors"
                    style={{ background: "rgba(240,232,212,0.4)", border: "1px solid rgba(133,108,66,0.15)", fontFamily: f.inter }}
                  >
                    <RefreshCw className="w-3 h-3" /> Tentar novamente
                  </button>
                  <p className="text-[0.6rem] text-[#856C42]/40 leading-relaxed" style={{ fontFamily: f.inter }}>
                    Se o problema persistir, entre em contato com a editora para prosseguir com o pagamento.
                  </p>
                </div>
              ) : contractTemplate ? (
                <div>
                  <button
                    onClick={() => setContractExpanded(!contractExpanded)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium text-[#052413] cursor-pointer hover:bg-[#F0E8D4]/50 transition-colors"
                    style={{ background: contractExpanded ? "rgba(240,232,212,0.5)" : "rgba(240,232,212,0.3)", border: `1px solid ${contractExpanded ? "rgba(133,108,66,0.2)" : "rgba(133,108,66,0.1)"}`, fontFamily: f.inter }}
                  >
                    <span className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#856C42]" />
                      {contractExpanded ? "Ocultar contrato" : "Ler contrato completo"}
                    </span>
                    {contractExpanded ? <ChevronUp className="w-4 h-4 text-[#856C42]" /> : <ChevronDown className="w-4 h-4 text-[#856C42]" />}
                  </button>
                  {!contractExpanded && (
                    <p className="text-[0.6rem] text-[#856C42]/50 mt-1.5 text-center" style={{ fontFamily: f.inter }}>
                      Clique acima para ler o contrato antes de aceitar
                    </p>
                  )}
                  <AnimatePresence>
                    {contractExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div
                          className="mt-3 p-4 rounded-xl max-h-[500px] overflow-y-auto text-xs leading-relaxed text-[#052413]/80"
                          style={{ background: "rgba(255,253,248,0.8)", border: "1px solid rgba(133,108,66,0.1)", fontFamily: f.inter }}
                          dangerouslySetInnerHTML={{ __html: generateContractHTML() }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-xs text-[#856C42]/60" style={{ fontFamily: f.inter }}>
                    Modelo de contrato nao disponivel. Entre em contato com a editora.
                  </p>
                </div>
              )}

              {/* Acceptance form */}
              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-[0.65rem] text-[#856C42]/70 uppercase tracking-wider font-semibold mb-1 block" style={{ fontFamily: f.inter }}>Nome completo *</label>
                  <input
                    type="text"
                    value={contractName}
                    onChange={(e) => setContractName(e.target.value)}
                    placeholder="Seu nome completo"
                    className="w-full px-4 py-3 rounded-xl text-sm text-[#052413] focus:outline-none focus:ring-2 focus:ring-[#165B36]/20"
                    style={{ background: "rgba(240,232,212,0.3)", border: "1px solid rgba(133,108,66,0.15)", fontFamily: f.inter }}
                  />
                </div>
                <div>
                  <label className="text-[0.65rem] text-[#856C42]/70 uppercase tracking-wider font-semibold mb-1 block" style={{ fontFamily: f.inter }}>Email *</label>
                  <input
                    type="email"
                    value={contractEmail}
                    onChange={(e) => setContractEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full px-4 py-3 rounded-xl text-sm text-[#052413] focus:outline-none focus:ring-2 focus:ring-[#165B36]/20"
                    style={{ background: "rgba(240,232,212,0.3)", border: "1px solid rgba(133,108,66,0.15)", fontFamily: f.inter }}
                  />
                </div>
                <div>
                  <label className="text-[0.65rem] text-[#856C42]/70 uppercase tracking-wider font-semibold mb-1 block" style={{ fontFamily: f.inter }}>CPF/CNPJ (opcional)</label>
                  <input
                    type="text"
                    value={contractCpf}
                    onChange={(e) => setContractCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full px-4 py-3 rounded-xl text-sm text-[#052413] focus:outline-none focus:ring-2 focus:ring-[#165B36]/20"
                    style={{ background: "rgba(240,232,212,0.3)", border: "1px solid rgba(133,108,66,0.15)", fontFamily: f.inter }}
                  />
                </div>

                <button
                  onClick={handleAcceptContract}
                  disabled={acceptingContract || !contractName.trim() || !contractEmail.trim() || !contractTemplate}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 cursor-pointer disabled:opacity-50"
                  style={{ background: contractTemplate ? "linear-gradient(135deg, #165B36, #052413)" : "#999", fontFamily: f.inter }}
                >
                  {acceptingContract ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Registrando aceite...</>
                  ) : (
                    <><ScrollText className="w-4 h-4" /> Aceitar contrato e visualizar PIX</>
                  )}
                </button>

                <p className="text-[0.6rem] text-[#856C42]/50 text-center leading-relaxed" style={{ fontFamily: f.inter }}>
                  Ao clicar, voce declara ter lido e aceito o contrato de prestacao de servicos editoriais, nos termos da MP n. 2.200-2/2001.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Contract accepted badge (when contract was required and accepted) */}
        {data.requireContract && contractAccepted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-xl overflow-hidden mb-6 flex items-center gap-3 px-5 py-3"
            style={{ background: "rgba(10,124,62,0.04)", border: "1px solid rgba(10,124,62,0.12)" }}
          >
            <CheckCircle className="w-4 h-4 text-[#0a7c3e] flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-xs font-semibold text-[#0a7c3e]" style={{ fontFamily: f.inter }}>Contrato aceito</span>
              {data.contractAcceptedAt && (
                <span className="text-[0.6rem] text-[#0a7c3e]/60 ml-2" style={{ fontFamily: f.inter }}>
                  em {formatDateTime(data.contractAcceptedAt)}
                </span>
              )}
            </div>
            <Link
              to={`/contrato/${projectId}`}
              className="text-[0.65rem] text-[#165B36] font-medium hover:underline"
              style={{ fontFamily: f.inter }}
            >
              Ver contrato
            </Link>
          </motion.div>
        )}

        {/* DEPOSIT GATE — installments locked until deposit is paid */}
        {!needsContract && hasDeposit && !depositPaid && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl overflow-hidden mb-6"
            style={{ background: "white", border: "2px solid rgba(235,191,116,0.4)", boxShadow: "0 4px 24px rgba(235,191,116,0.1)" }}
          >
            <div className="px-5 py-4 flex items-start gap-4" style={{ background: "linear-gradient(135deg, rgba(235,191,116,0.1), rgba(133,108,66,0.04))" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #EBBF74, #d4a84a)" }}>
                <Lock className="w-5 h-5 text-[#052413]" />
              </div>
              <div className="flex-1">
                <p className="text-base font-bold text-[#052413] mb-1" style={{ fontFamily: f.inter }}>
                  Parcelas bloqueadas
                </p>
                <p className="text-sm text-[#856C42]/80 leading-relaxed mb-4" style={{ fontFamily: f.inter }}>
                  O pagamento das parcelas so e liberado apos a confirmacao da entrada de <strong className="text-[#052413]">{formatCurrency(data.chargeAmount)}</strong>.
                  Pague a entrada para dar inicio aos trabalhos e desbloquear as parcelas.
                </p>
                {data.depositPaymentUrl && (
                  <a
                    href={`/pagamento/${data.projectId}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-[#052413] transition-all hover:shadow-md hover:opacity-90"
                    style={{ background: "linear-gradient(135deg, #EBBF74, #d4a84a)", fontFamily: f.inter }}
                  >
                    <CreditCard className="w-4 h-4" />
                    Pagar entrada — {formatCurrency(data.chargeAmount)}
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* PIX SECTIONS — only shown if contract is not required OR contract has been accepted */}
        {!needsContract && (!hasDeposit || depositPaid) && (<>

        {/* Current Installment PIX - Prominent */}
        {currentInstallment && !showPayoff && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl overflow-hidden mb-6"
            style={{
              background: "white",
              border: "2px solid rgba(22,91,54,0.2)",
              boxShadow: "0 4px 24px rgba(22,91,54,0.08)",
            }}
          >
            <div className="px-5 py-4 flex items-center justify-between" style={{ background: "linear-gradient(135deg, rgba(22,91,54,0.06), rgba(10,124,62,0.03))" }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #165B36, #0a7c3e)" }}>
                  <Banknote className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#052413]" style={{ fontFamily: f.inter }}>
                    Parcela {currentInstallment.number} de {installmentPlan.totalInstallments}
                  </h2>
                  <p className="text-xs text-[#856C42]/70" style={{ fontFamily: f.inter }}>
                    Vencimento: {formatDateBR(currentInstallment.dueDate)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-[#052413]" style={{ fontFamily: f.inter }}>
                  {formatCurrency(currentInstallment.amount)}
                </p>
              </div>
            </div>

            <div className="p-5">
              {/* QR Code */}
              {currentInstallment.pixQrCode && (
                <div className="text-center mb-5">
                  <div className="inline-block p-4 rounded-2xl bg-white mb-3" style={{ border: "1px solid rgba(133,108,66,0.1)" }}>
                    <img
                      src={`data:image/png;base64,${currentInstallment.pixQrCode}`}
                      alt="QR Code PIX"
                      className="w-48 h-48 mx-auto"
                    />
                  </div>
                  <p className="text-xs text-[#856C42]/50" style={{ fontFamily: f.inter }}>
                    Escaneie o QR Code com o app do seu banco
                  </p>
                </div>
              )}

              {/* PIX Copy-Paste */}
              {currentInstallment.pixCode && (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl break-all text-xs text-[#052413]/70 font-mono leading-relaxed" style={{ background: "rgba(240,232,212,0.4)", border: "1px solid rgba(133,108,66,0.1)" }}>
                    {currentInstallment.pixCode.length > 120
                      ? currentInstallment.pixCode.substring(0, 120) + "..."
                      : currentInstallment.pixCode
                    }
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCopyPix(currentInstallment.number, currentInstallment.pixCode!)}
                      className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 cursor-pointer"
                      style={{ background: "linear-gradient(135deg, #165B36, #0a7c3e)" }}
                    >
                      {copiedPix === currentInstallment.number ? (
                        <><Check className="w-4 h-4" /> Copiado!</>
                      ) : (
                        <><Copy className="w-4 h-4" /> Copiar codigo PIX</>
                      )}
                    </button>
                    {user && (
                      <button
                        onClick={() => handleRegeneratePix(currentInstallment.number)}
                        disabled={regenerating === currentInstallment.number}
                        className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 cursor-pointer disabled:opacity-50"
                        style={{ background: "rgba(133,108,66,0.08)", color: "#856C42", fontFamily: f.inter }}
                        title="Regenerar PIX (caso tenha expirado)"
                      >
                        {regenerating === currentInstallment.number ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                        <span className="hidden sm:inline">Regenerar</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-4 p-3 rounded-xl flex items-start gap-2.5" style={{ background: "rgba(235,191,116,0.08)" }}>
                <Shield className="w-4 h-4 text-[#856C42] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[0.7rem] text-[#856C42]/70 leading-relaxed" style={{ fontFamily: f.inter }}>
                    {hasDeposit && currentInstallment?.number === 1
                      ? "Esta e a 1ª parcela, com vencimento 30 dias apos o pagamento da entrada. Apos a confirmacao, o PIX da proxima parcela sera gerado automaticamente."
                      : "Apos o pagamento ser confirmado, o PIX da proxima parcela sera gerado automaticamente. Voce pode acompanhar o progresso abaixo."
                    }
                  </p>
                  <p className="text-[0.65rem] text-[#856C42]/50 mt-1" style={{ fontFamily: f.inter }}>
                    A confirmacao do PIX pode levar alguns minutos. Esta pagina atualiza automaticamente a cada 30 segundos.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Payoff Option */}
        {pendingCount > 1 && !allPaid && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl overflow-hidden mb-6"
            style={{
              background: showPayoff ? "white" : "linear-gradient(135deg, rgba(235,191,116,0.06), rgba(133,108,66,0.03))",
              border: showPayoff ? "2px solid rgba(235,191,116,0.4)" : "1px solid rgba(235,191,116,0.2)",
              boxShadow: showPayoff ? "0 4px 24px rgba(235,191,116,0.12)" : undefined,
            }}
          >
            <button
              onClick={() => setShowPayoff(!showPayoff)}
              className="w-full px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-[#EBBF74]/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #EBBF74, #856C42)" }}>
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="text-sm font-bold text-[#052413]" style={{ fontFamily: f.inter }}>
                    Quitar tudo de uma vez
                  </h3>
                  <p className="text-xs text-[#856C42]/60" style={{ fontFamily: f.inter }}>
                    Pague {pendingCount} parcela(s) restante(s) com um unico PIX
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-[#856C42]" style={{ fontFamily: f.inter }}>
                  {formatCurrency(data.pendingAmount)}
                </span>
                {showPayoff ? <EyeOff className="w-4 h-4 text-[#856C42]/50" /> : <Eye className="w-4 h-4 text-[#856C42]/50" />}
              </div>
            </button>

            <AnimatePresence>
              {showPayoff && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 border-t" style={{ borderColor: "rgba(235,191,116,0.15)" }}>
                    {/* If payoff already generated and pending */}
                    {hasPayoff && installmentPlan.payoff ? (
                      <div className="pt-5">
                        <div className="text-center mb-4">
                          <p className="text-sm font-semibold text-[#052413] mb-1" style={{ fontFamily: f.inter }}>
                            PIX de quitacao gerado
                          </p>
                          <p className="text-2xl font-bold text-[#856C42]" style={{ fontFamily: f.inter }}>
                            {formatCurrency(installmentPlan.payoff.amount)}
                          </p>
                          <p className="text-[0.65rem] text-[#856C42]/50 mt-1" style={{ fontFamily: f.inter }}>
                            Cobre {installmentPlan.payoff.installmentsCovered.length} parcela(s) restante(s)
                          </p>
                        </div>

                        {installmentPlan.payoff.pixQrCode && (
                          <div className="text-center mb-4">
                            <div className="inline-block p-3 rounded-xl bg-white" style={{ border: "1px solid rgba(133,108,66,0.1)" }}>
                              <img
                                src={`data:image/png;base64,${installmentPlan.payoff.pixQrCode}`}
                                alt="QR Code PIX Quitacao"
                                className="w-40 h-40 mx-auto"
                              />
                            </div>
                          </div>
                        )}

                        {installmentPlan.payoff.pixCode && (
                          <div className="space-y-3">
                            <div className="p-3 rounded-xl break-all text-xs text-[#052413]/70 font-mono leading-relaxed" style={{ background: "rgba(240,232,212,0.4)", border: "1px solid rgba(133,108,66,0.1)" }}>
                              {installmentPlan.payoff.pixCode.length > 120
                                ? installmentPlan.payoff.pixCode.substring(0, 120) + "..."
                                : installmentPlan.payoff.pixCode
                              }
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleCopyPix("payoff", installmentPlan.payoff!.pixCode!)}
                                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold text-[#052413] transition-all hover:opacity-90 cursor-pointer"
                                style={{ background: "linear-gradient(135deg, #EBBF74, #d4a84a)" }}
                              >
                                {copiedPix === "payoff" ? (
                                  <><Check className="w-4 h-4" /> Copiado!</>
                                ) : (
                                  <><Copy className="w-4 h-4" /> Copiar PIX de quitacao</>
                                )}
                              </button>
                              {user && (
                                <button
                                  onClick={() => handleRegeneratePix("payoff")}
                                  disabled={regenerating === "payoff"}
                                  className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 cursor-pointer disabled:opacity-50"
                                  style={{ background: "rgba(133,108,66,0.08)", color: "#856C42", fontFamily: f.inter }}
                                  title="Regenerar PIX de quitacao"
                                >
                                  {regenerating === "payoff" ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <RefreshCw className="w-4 h-4" />
                                  )}
                                  <span className="hidden sm:inline">Regenerar</span>
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : payoffPaid ? (
                      <div className="pt-5 text-center">
                        <CheckCircle className="w-10 h-10 text-[#0a7c3e] mx-auto mb-2" />
                        <p className="text-sm font-semibold text-[#0a7c3e]" style={{ fontFamily: f.inter }}>Quitacao concluida!</p>
                      </div>
                    ) : (
                      <div className="pt-5">
                        <div className="p-4 rounded-xl mb-4" style={{ background: "rgba(235,191,116,0.06)", border: "1px solid rgba(235,191,116,0.15)" }}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-[#856C42]/70" style={{ fontFamily: f.inter }}>Parcelas restantes</span>
                            <span className="text-xs font-bold text-[#856C42]" style={{ fontFamily: f.inter }}>{pendingCount}x</span>
                          </div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-[#856C42]/70" style={{ fontFamily: f.inter }}>Valor total de quitacao</span>
                            <span className="text-base font-bold text-[#052413]" style={{ fontFamily: f.inter }}>{formatCurrency(data.pendingAmount)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-[#856C42]/70" style={{ fontFamily: f.inter }}>Desconto</span>
                            <span className="text-xs text-[#0a7c3e] font-medium" style={{ fontFamily: f.inter }}>Sem juros</span>
                          </div>
                        </div>

                        {user ? (
                          <button
                            onClick={handleGeneratePayoff}
                            disabled={generatingPayoff}
                            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold text-[#052413] transition-all hover:opacity-90 cursor-pointer disabled:opacity-50"
                            style={{ background: "linear-gradient(135deg, #EBBF74, #d4a84a)" }}
                          >
                            {generatingPayoff ? (
                              <><Loader2 className="w-4 h-4 animate-spin" /> Gerando PIX...</>
                            ) : (
                              <><Zap className="w-4 h-4" /> Gerar PIX de quitacao — {formatCurrency(data.pendingAmount)}</>
                            )}
                          </button>
                        ) : (
                          <div className="text-center">
                            <p className="text-xs text-[#856C42]/60 mb-3" style={{ fontFamily: f.inter }}>
                              Faca login para gerar o PIX de quitacao
                            </p>
                            <Link
                              to="/entrar"
                              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-[#052413] transition-all hover:opacity-90"
                              style={{ background: "linear-gradient(135deg, #EBBF74, #d4a84a)", fontFamily: f.inter }}
                            >
                              Entrar na conta
                            </Link>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* All Installments List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl overflow-hidden"
          style={{ background: "white", border: "1px solid rgba(133,108,66,0.12)", boxShadow: "0 2px 12px rgba(133,108,66,0.06)" }}
        >
          <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(133,108,66,0.08)" }}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold text-[#052413]" style={{ fontFamily: f.inter }}>
                {hasDeposit ? "Entrada + Parcelas" : "Todas as parcelas"}
              </h3>
              <span className="text-xs text-[#856C42]/60" style={{ fontFamily: f.inter }}>
                {hasDeposit
                  ? `Entrada + ${installmentPlan.totalInstallments}x de ~${formatCurrency(data.totalPrice / installmentPlan.totalInstallments)}`
                  : `${installmentPlan.totalInstallments}x de ~${formatCurrency(data.totalPrice / installmentPlan.totalInstallments)}`
                }
              </span>
            </div>
            <p className="text-[0.6rem] text-[#856C42]/50 flex items-center gap-1" style={{ fontFamily: f.inter }}>
              <QrCode className="w-3 h-3" />
              Parcelas pagas exclusivamente via PIX — cada codigo expira na data de vencimento
            </p>
          </div>

          <div className="divide-y" style={{ borderColor: "rgba(133,108,66,0.06)" }}>
            {/* Deposit row (Entrada) — shown before installments when deposit exists */}
            {hasDeposit && (
              <div>
                <div
                  className="px-5 py-4 flex items-center gap-4 transition-colors"
                  style={{
                    background: data.depositStatus === "paid" ? "rgba(10,124,62,0.02)" : "rgba(235,191,116,0.04)",
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                    style={{
                      backgroundColor: data.depositStatus === "paid" ? "rgba(10,124,62,0.1)" : "rgba(235,191,116,0.15)",
                      color: data.depositStatus === "paid" ? "#0a7c3e" : "#856C42",
                    }}
                  >
                    {data.depositStatus === "paid" ? <CheckCircle className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-base font-bold text-[#052413]" style={{ fontFamily: f.inter }}>
                        {formatCurrency(data.chargeAmount)}
                      </span>
                      <span className="text-[0.6rem] px-2 py-0.5 rounded-full font-semibold" style={{
                        fontFamily: f.inter,
                        background: data.depositStatus === "paid" ? "rgba(10,124,62,0.08)" : "rgba(235,191,116,0.15)",
                        color: data.depositStatus === "paid" ? "#0a7c3e" : "#856C42",
                      }}>
                        {data.depositStatus === "paid" ? "Pago" : "Pendente"}
                      </span>
                    </div>
                    <p className="text-xs text-[#856C42]/60" style={{ fontFamily: f.inter }}>
                      Entrada ({data.depositPercent}%) — inicio dos trabalhos
                      {data.depositStatus === "paid" && data.depositPaidAt && ` · Pago em ${formatDateTime(data.depositPaidAt)}`}
                    </p>
                  </div>
                  {data.depositStatus !== "paid" && data.depositPaymentUrl && (
                    <a
                      href={`/pagamento/${data.projectId}`}
                      className="px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer"
                      style={{
                        fontFamily: f.inter,
                        background: "linear-gradient(135deg, #EBBF74, #d4a84a)",
                        color: "#052413",
                      }}
                    >
                      Pagar entrada — {formatCurrency(data.chargeAmount)}
                    </a>
                  )}
                </div>
              </div>
            )}

            {installmentPlan.installments.map((inst) => {
              const isPaid = inst.status === "paid";
              const hasPix = !!inst.pixCode;
              const isOverdue = !isPaid && new Date(inst.dueDate + "T23:59:59") < new Date();
              const isCurrent = currentInstallment?.number === inst.number;

              return (
                <div key={inst.number}>
                  <div
                    className="px-5 py-4 flex items-center gap-4 transition-colors"
                    style={{
                      background: isPaid ? "rgba(10,124,62,0.02)" : isCurrent ? "rgba(22,91,54,0.04)" : undefined,
                    }}
                  >
                    {/* Number badge */}
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                      style={{
                        backgroundColor: isPaid ? "rgba(10,124,62,0.1)" : isOverdue ? "rgba(239,68,68,0.1)" : isCurrent ? "rgba(22,91,54,0.15)" : "rgba(133,108,66,0.08)",
                        color: isPaid ? "#0a7c3e" : isOverdue ? "#dc2626" : isCurrent ? "#165B36" : "#856C42",
                      }}
                    >
                      {isPaid ? <CheckCircle className="w-4 h-4" /> : inst.number}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-base font-bold text-[#052413]" style={{ fontFamily: f.inter }}>
                          {formatCurrency(inst.amount)}
                        </span>
                        {isPaid && (
                          <span className="text-[0.6rem] px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-semibold" style={{ fontFamily: f.inter }}>
                            Pago
                          </span>
                        )}
                        {isOverdue && (
                          <span className="text-[0.6rem] px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-semibold" style={{ fontFamily: f.inter }}>
                            Vencida
                          </span>
                        )}
                        {isCurrent && !isPaid && !isOverdue && (
                          <span className="text-[0.6rem] px-2 py-0.5 rounded-full font-semibold" style={{ fontFamily: f.inter, background: "rgba(22,91,54,0.1)", color: "#165B36" }}>
                            Atual
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#856C42]/60" style={{ fontFamily: f.inter }}>
                        Vencimento: {formatDateShort(inst.dueDate)}
                        {isPaid && inst.paidAt && ` · Pago em ${formatDateTime(inst.paidAt)}`}
                      </p>
                      {isOverdue && !isPaid && hasPix && (
                        <p className="text-[0.6rem] text-red-500/70 mt-0.5" style={{ fontFamily: f.inter }}>
                          Vencida — o codigo PIX expirou. Clique em "Renovar PIX" para gerar um novo.
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    {!isPaid && hasPix && (
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {isOverdue ? (
                          /* Overdue: PIX likely expired — show regenerate prominently */
                          user && (
                            <button
                              onClick={() => handleRegeneratePix(inst.number)}
                              disabled={regenerating === inst.number}
                              className="px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                              style={{ fontFamily: f.inter, background: "rgba(239,68,68,0.08)", color: "#dc2626" }}
                              title="PIX vencido — gerar novo codigo"
                            >
                              {regenerating === inst.number ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                              Renovar PIX
                            </button>
                          )
                        ) : (
                          <>
                            <button
                              onClick={() => handleCopyPix(inst.number, inst.pixCode!)}
                              className="px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer"
                              style={{
                                fontFamily: f.inter,
                                background: copiedPix === inst.number ? "#165B36" : "rgba(22,91,54,0.08)",
                                color: copiedPix === inst.number ? "white" : "#165B36",
                              }}
                            >
                              {copiedPix === inst.number ? "Copiado!" : "Copiar PIX"}
                            </button>
                            {inst.pixQrCode && (
                              <button
                                onClick={() => setShowQr(showQr === inst.number ? null : inst.number)}
                                className="p-2 rounded-lg text-[#856C42]/50 hover:text-[#165B36] hover:bg-[#165B36]/5 transition-colors cursor-pointer"
                                title="Ver QR Code"
                              >
                                <QrCode className="w-4 h-4" />
                              </button>
                            )}
                            {user && (
                              <button
                                onClick={() => handleRegeneratePix(inst.number)}
                                disabled={regenerating === inst.number}
                                className="p-2 rounded-lg text-[#856C42]/50 hover:text-[#856C42] hover:bg-[#856C42]/8 transition-colors cursor-pointer disabled:opacity-50"
                                title="Regenerar PIX"
                              >
                                {regenerating === inst.number ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    {!isPaid && !hasPix && user && (
                      <button
                        onClick={() => handleRegeneratePix(inst.number)}
                        disabled={regenerating === inst.number}
                        className="px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 flex-shrink-0"
                        style={{ fontFamily: f.inter, background: "rgba(22,91,54,0.08)", color: "#165B36" }}
                        title="Gerar código PIX para esta parcela"
                      >
                        {regenerating === inst.number ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <QrCode className="w-3.5 h-3.5" />
                        )}
                        Gerar PIX
                      </button>
                    )}
                    {!isPaid && !hasPix && !user && (
                      <span className="text-[0.65rem] text-[#856C42]/40 italic flex-shrink-0" style={{ fontFamily: f.inter }}>
                        Aguardando
                      </span>
                    )}
                  </div>

                  {/* Expanded QR */}
                  <AnimatePresence>
                    {showQr === inst.number && inst.pixQrCode && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-4">
                          <div className="p-4 rounded-xl bg-white text-center" style={{ border: "1px solid rgba(133,108,66,0.1)" }}>
                            <img src={`data:image/png;base64,${inst.pixQrCode}`} alt="QR Code PIX" className="w-40 h-40 mx-auto mb-2" />
                            <p className="text-[0.6rem] text-[#856C42]/50" style={{ fontFamily: f.inter }}>Parcela {inst.number} — {formatCurrency(inst.amount)}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </motion.div>

        </>)}

        {/* Locked PIX info when contract is pending */}
        {needsContract && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl overflow-hidden mb-6 text-center py-10 px-6"
            style={{ background: "rgba(133,108,66,0.03)", border: "1px dashed rgba(133,108,66,0.2)" }}
          >
            <Lock className="w-10 h-10 text-[#856C42]/30 mx-auto mb-3" />
            <p className="text-sm font-medium text-[#856C42]/60" style={{ fontFamily: f.inter }}>
              Os PIX de pagamento serao liberados apos o aceite do contrato
            </p>
            <p className="text-xs text-[#856C42]/40 mt-1" style={{ fontFamily: f.inter }}>
              {hasDeposit
                ? <>Entrada de {formatCurrency(data.chargeAmount)} (inicio dos trabalhos) + {installmentPlan.totalInstallments} parcelas de ~{formatCurrency(data.totalPrice / installmentPlan.totalInstallments)} (1ª em 30 dias apos a entrada)</>
                : <>{installmentPlan.totalInstallments} parcelas de ~{formatCurrency(data.totalPrice / installmentPlan.totalInstallments)}</>
              }
            </p>
          </motion.div>
        )}

        {/* Footer info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center pb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-3" style={{ background: "rgba(133,108,66,0.04)" }}>
            <Shield className="w-3.5 h-3.5 text-[#856C42]/40" />
            <span className="text-[0.65rem] text-[#856C42]/50" style={{ fontFamily: f.inter }}>
              Pagamentos processados via Mercado Pago · Dados criptografados
            </span>
          </div>
          <p className="text-[0.6rem] text-[#856C42]/30" style={{ fontFamily: f.inter }}>
            {hasDeposit
              ? "A entrada e para inicio dos trabalhos. A 1ª parcela vence 30 dias apos a entrada. Cada parcela seguinte e gerada automaticamente apos a confirmacao da anterior."
              : "A proxima parcela e gerada automaticamente apos a confirmacao do pagamento anterior."
            }
          </p>
        </motion.div>
      </main>
    </div>
  );
}