import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  BookOpen, CheckCircle, CreditCard, FileText, Loader2,
  Copy, Check, QrCode, AlertCircle, ArrowLeft, Shield, Lock,
  ScrollText, ChevronDown, ChevronUp, Download
} from "lucide-react";
import { GoldButton } from "./GoldButton";
import { getPaymentInfo, processPayment, acceptContract, getContractPdfUrl, getPublicContractTemplate, checkPaymentStatus } from "../data/api";
import { toast, Toaster } from "sonner";
import footerLogoImg from "figma:asset/36074aebf24684a213a02f0250350012b7c049a7.png";
import logoImg from "figma:asset/866134e81312444c262030ef8ad8f59cefad5b17.png";

// ============================================
// Types
// ============================================
interface PaymentInfo {
  projectId: string;
  title: string;
  author: string;
  description: string;
  format: string;
  pageCount: number | null;
  services: string[];
  notes: string;
  userName: string;
  budgetDescription: string;
  price: number;
  depositPercent: number;
  chargeAmount: number;
  remainderAmount: number;
  budgetStatus: string;
  paidAt: string | null;
  publicKey: string | null;
  preferenceId: string;
  contractAccepted: boolean;
  contractAcceptedAt: string | null;
  contractAcceptorName: string | null;
  contractAcceptorEmail: string | null;
  contractAcceptorCpf: string | null;
  customClauses: string | null;
  estimatedDeadline: string | null;
  contractPdfName: string | null;
  hasContractPdf: boolean;
  contractHash: string | null;
}

type PaymentMethod = "pix" | "credit_card" | "bolbradesco";

interface PaymentResult {
  status: string;
  status_detail: string;
  id: number;
  payment_method_id: string;
  point_of_interaction?: {
    transaction_data?: {
      qr_code?: string;
      qr_code_base64?: string;
      ticket_url?: string;
    };
  };
  transaction_details?: {
    external_resource_url?: string;
    barcode?: { content?: string };
  };
  date_of_expiration?: string;
}

// ============================================
// Helper: format currency
// ============================================
function formatCurrency(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ============================================
// Helper: format card number input
// ============================================
function formatCardNumber(value: string): string {
  const nums = value.replace(/\D/g, "").slice(0, 16);
  return nums.replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(value: string): string {
  const nums = value.replace(/\D/g, "").slice(0, 4);
  if (nums.length > 2) return `${nums.slice(0, 2)}/${nums.slice(2)}`;
  return nums;
}

function formatCPF(value: string): string {
  const nums = value.replace(/\D/g, "").slice(0, 11);
  if (nums.length <= 3) return nums;
  if (nums.length <= 6) return `${nums.slice(0, 3)}.${nums.slice(3)}`;
  if (nums.length <= 9) return `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6)}`;
  return `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6, 9)}-${nums.slice(9)}`;
}

function formatCPFOrCNPJ(value: string): string {
  const nums = value.replace(/\D/g, "");
  if (nums.length <= 11) return formatCPF(value);
  // CNPJ
  const cn = nums.slice(0, 14);
  if (cn.length <= 2) return cn;
  if (cn.length <= 5) return `${cn.slice(0, 2)}.${cn.slice(2)}`;
  if (cn.length <= 8) return `${cn.slice(0, 2)}.${cn.slice(2, 5)}.${cn.slice(5)}`;
  if (cn.length <= 12) return `${cn.slice(0, 2)}.${cn.slice(2, 5)}.${cn.slice(5, 8)}/${cn.slice(8)}`;
  return `${cn.slice(0, 2)}.${cn.slice(2, 5)}.${cn.slice(5, 8)}/${cn.slice(8, 12)}-${cn.slice(12)}`;
}

const SERVICE_LABELS: Record<string, string> = {
  completo: "Pacote Completo",
  diagramacao: "Diagramação",
  capa: "Design de Capa",
  revisao: "Revisão Textual",
  isbn: "ISBN e Ficha Catalográfica",
  ebook: "Versão E-book",
};

function getServiceLabel(key: string): string {
  return SERVICE_LABELS[key] || key;
}

// ============================================
// Shared styles
// ============================================
const inputClasses = "w-full px-4 py-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#EBBF74]/40 focus:border-[#EBBF74]";
const inputStyle = {
  fontFamily: "Inter, sans-serif",
  backgroundColor: "#FFFDF8",
  borderColor: "rgba(133,108,66,0.2)",
  color: "#052413",
};
const labelClasses = "block text-xs font-medium text-[#052413] mb-1.5";
const labelStyle = { fontFamily: "Inter, sans-serif" };

const SERVICE_MAP: Record<string, { label: string; desc: string }> = {
  completo: { label: "Pacote completo", desc: "Todos os servicos editoriais inclusos" },
  diagramacao: { label: "Diagramacao", desc: "Layout e composicao das paginas" },
  capa: { label: "Design de capa", desc: "Capa, lombada e contracapa" },
  revisao: { label: "Revisao textual", desc: "Ortografia, gramatica e estilo" },
  impressao: { label: "Impressao", desc: "Producao grafica do livro" },
  ficha_catalografica: { label: "Ficha catalografica", desc: "CIP e dados de catalogacao" },
  registro_isbn: { label: "Registro ISBN", desc: "Codigo ISBN e codigo de barras" },
};

// ============================================
// Payment Method Tab
// ============================================
function MethodTab({
  method,
  selected,
  onSelect,
  icon: Icon,
  label,
}: {
  method: PaymentMethod;
  selected: PaymentMethod;
  onSelect: (m: PaymentMethod) => void;
  icon: React.ComponentType<any>;
  label: string;
}) {
  const isActive = method === selected;
  return (
    <button
      onClick={() => onSelect(method)}
      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl border-2 text-sm font-medium transition-all cursor-pointer ${
        isActive
          ? "border-[#EBBF74] bg-gradient-to-br from-[#EBBF74]/10 to-[#856C42]/5 text-[#052413]"
          : "border-transparent bg-[#F0E8D4]/40 text-[#856C42] hover:bg-[#F0E8D4]/70"
      }`}
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <Icon className={`w-4.5 h-4.5 ${isActive ? "text-[#856C42]" : "text-[#856C42]/60"}`} />
      {label}
    </button>
  );
}

// ============================================
// MercadoPago.js v2 SDK loader
// ============================================
declare global {
  interface Window {
    MercadoPago: any;
  }
}

function useMercadoPagoSDK(publicKey: string | null) {
  const [mp, setMp] = useState<any>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkError, setSdkError] = useState("");

  useEffect(() => {
    if (!publicKey) return;

    // If SDK is already loaded
    if (window.MercadoPago) {
      try {
        const instance = new window.MercadoPago(publicKey, { locale: "pt-BR" });
        setMp(instance);
        setSdkReady(true);
      } catch (e: any) {
        setSdkError(`Erro ao inicializar SDK: ${e.message}`);
      }
      return;
    }

    // Load SDK script dynamically
    const existing = document.querySelector('script[src*="sdk.mercadopago.com"]');
    if (existing) {
      existing.addEventListener("load", () => {
        try {
          const instance = new window.MercadoPago(publicKey, { locale: "pt-BR" });
          setMp(instance);
          setSdkReady(true);
        } catch (e: any) {
          setSdkError(`Erro ao inicializar SDK: ${e.message}`);
        }
      });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://sdk.mercadopago.com/js/v2";
    script.async = true;
    script.onload = () => {
      try {
        const instance = new window.MercadoPago(publicKey, { locale: "pt-BR" });
        setMp(instance);
        setSdkReady(true);
      } catch (e: any) {
        setSdkError(`Erro ao inicializar SDK: ${e.message}`);
      }
    };
    script.onerror = () => setSdkError("Falha ao carregar SDK do Mercado Pago");
    document.head.appendChild(script);

    return () => {
      // Don't remove script on cleanup — it's cached for future use
    };
  }, [publicKey]);

  return { mp, sdkReady, sdkError };
}

// ============================================
// Credit Card Form (MercadoPago.js v2 SDK)
// ============================================
function CreditCardForm({
  price,
  publicKey,
  onSubmit,
  processing,
}: {
  price: number;
  publicKey: string | null;
  onSubmit: (data: any) => void;
  processing: boolean;
}) {
  const { mp, sdkReady, sdkError } = useMercadoPagoSDK(publicKey);
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [installments, setInstallments] = useState(1);
  const [installmentOptions, setInstallmentOptions] = useState<{ installments: number; recommended_message: string }[]>([]);
  const [detectedBrand, setDetectedBrand] = useState("");
  const [issuerId, setIssuerId] = useState("");
  const [error, setError] = useState("");
  const [tokenizing, setTokenizing] = useState(false);
  const binRef = useRef("");

  // Detect card brand & get installments when 6+ digits entered
  useEffect(() => {
    if (!mp || !sdkReady) return;
    const cleanCard = cardNumber.replace(/\s/g, "");
    const bin = cleanCard.slice(0, 6);
    if (bin.length < 6 || bin === binRef.current) return;
    binRef.current = bin;

    (async () => {
      try {
        // Get payment methods for this BIN
        const methods = await mp.getPaymentMethods({ bin });
        if (methods?.results?.length > 0) {
          const method = methods.results[0];
          setDetectedBrand(method.id);
          setIssuerId(method.issuer?.id ? String(method.issuer.id) : "");
        }

        // Get installment options
        const installRes = await mp.getInstallments({
          amount: String(price),
          bin,
          payment_type_id: "credit_card",
        });
        if (installRes?.length > 0 && installRes[0].payer_costs) {
          setInstallmentOptions(
            installRes[0].payer_costs.map((pc: any) => ({
              installments: pc.installments,
              recommended_message: pc.recommended_message,
            }))
          );
          if (installRes[0].issuer?.id) setIssuerId(String(installRes[0].issuer.id));
        }
      } catch (e) {
        console.warn("MercadoPago bin lookup error:", e);
      }
    })();
  }, [mp, sdkReady, cardNumber, price]);

  const maxInstallments = Math.min(12, Math.floor(price / 5));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanCard = cardNumber.replace(/\s/g, "");
    const cleanCpf = cpf.replace(/\D/g, "");
    const [month, year] = expiry.split("/");

    if (cleanCard.length < 13) { setError("Número do cartão inválido"); return; }
    if (!cardName.trim()) { setError("Nome no cartão é obrigatório"); return; }
    if (!month || !year || parseInt(month) < 1 || parseInt(month) > 12) { setError("Data de validade inválida"); return; }
    if (cvv.length < 3) { setError("CVV inválido"); return; }
    if (!email.includes("@")) { setError("E-mail inválido"); return; }
    if (cleanCpf.length !== 11 && cleanCpf.length !== 14) { setError("CPF ou CNPJ inválido"); return; }

    // If SDK is available, create a real card token
    if (mp && sdkReady) {
      setTokenizing(true);
      try {
        const fullYear = year.length === 2 ? `20${year}` : year;
        const idType = cleanCpf.length === 14 ? "CNPJ" : "CPF";
        const tokenResult = await mp.createCardToken({
          cardNumber: cleanCard,
          cardholderName: cardName,
          cardExpirationMonth: month,
          cardExpirationYear: fullYear,
          securityCode: cvv,
          identificationType: idType,
          identificationNumber: cleanCpf,
        });

        if (!tokenResult?.id) {
          setError("Erro ao tokenizar cartão. Verifique os dados e tente novamente.");
          setTokenizing(false);
          return;
        }

        onSubmit({
          payment_method_id: detectedBrand || "visa",
          token: tokenResult.id,
          installments,
          issuer_id: issuerId || undefined,
          payer: {
            email,
            first_name: cardName.split(" ")[0],
            last_name: cardName.split(" ").slice(1).join(" "),
            identification: { type: idType, number: cleanCpf },
          },
        });
      } catch (err: any) {
        console.error("Card tokenization error:", err);
        const msg = err?.message || err?.cause?.[0]?.description || "Erro ao processar cartão";
        setError(msg);
      } finally {
        setTokenizing(false);
      }
    } else {
      // Fallback: submit without SDK (will likely fail on server if token is required)
      setError("SDK do Mercado Pago não disponível. Recarregue a página e tente novamente.");
    }
  };

  const isProcessing = processing || tokenizing;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {sdkError && (
        <div className="flex items-center gap-2 text-xs text-amber-700 p-3 rounded-lg bg-amber-50 border border-amber-200">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span style={{ fontFamily: "Inter, sans-serif" }}>{sdkError}</span>
        </div>
      )}

      {!publicKey && (
        <div className="flex items-center gap-2 text-xs text-amber-700 p-3 rounded-lg bg-amber-50 border border-amber-200">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span style={{ fontFamily: "Inter, sans-serif" }}>Chave pública do Mercado Pago não configurada. Pagamento com cartão indisponível no momento.</span>
        </div>
      )}

      <div>
        <label className={labelClasses} style={labelStyle}>Número do cartão</label>
        <div className="relative">
          <input
            type="text"
            value={cardNumber}
            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
            placeholder="0000 0000 0000 0000"
            className={inputClasses + " pl-11"}
            style={inputStyle}
            maxLength={19}
          />
          <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#856C42]/40" />
          {detectedBrand && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[0.6rem] font-medium text-[#856C42] uppercase px-1.5 py-0.5 rounded bg-[#F0E8D4]/60">
              {detectedBrand}
            </span>
          )}
        </div>
      </div>

      <div>
        <label className={labelClasses} style={labelStyle}>Nome impresso no cartão</label>
        <input
          type="text"
          value={cardName}
          onChange={(e) => setCardName(e.target.value.toUpperCase())}
          placeholder="NOME COMPLETO"
          className={inputClasses}
          style={inputStyle}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClasses} style={labelStyle}>Validade</label>
          <input
            type="text"
            value={expiry}
            onChange={(e) => setExpiry(formatExpiry(e.target.value))}
            placeholder="MM/AA"
            className={inputClasses}
            style={inputStyle}
            maxLength={5}
          />
        </div>
        <div>
          <label className={labelClasses} style={labelStyle}>CVV</label>
          <input
            type="text"
            value={cvv}
            onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="000"
            className={inputClasses}
            style={inputStyle}
            maxLength={4}
          />
        </div>
      </div>

      <div>
        <label className={labelClasses} style={labelStyle}>E-mail</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          className={inputClasses}
          style={inputStyle}
        />
      </div>

      <div>
        <label className={labelClasses} style={labelStyle}>CPF ou CNPJ do titular</label>
        <input
          type="text"
          value={cpf}
          onChange={(e) => setCpf(formatCPFOrCNPJ(e.target.value))}
          placeholder="000.000.000-00 ou 00.000.000/0000-00"
          className={inputClasses}
          style={inputStyle}
          maxLength={18}
        />
      </div>

      {/* Installment picker — use SDK options if available, else fallback */}
      {(installmentOptions.length > 0 || maxInstallments > 1) && (
        <div>
          <label className={labelClasses} style={labelStyle}>Parcelas</label>
          <select
            value={installments}
            onChange={(e) => setInstallments(parseInt(e.target.value))}
            className={inputClasses + " cursor-pointer"}
            style={inputStyle}
          >
            {installmentOptions.length > 0
              ? installmentOptions.map((opt) => (
                  <option key={opt.installments} value={opt.installments}>
                    {opt.recommended_message}
                  </option>
                ))
              : Array.from({ length: maxInstallments }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n}x de {formatCurrency(price / n)} {n === 1 ? "(à vista)" : "sem juros"}
                  </option>
                ))}
          </select>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 p-3 rounded-lg bg-red-50">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span style={{ fontFamily: "Inter, sans-serif" }}>{error}</span>
        </div>
      )}

      <GoldButton type="submit" disabled={isProcessing || (!sdkReady && !!publicKey)} className="w-full px-6 py-3.5 text-sm font-semibold">
        {isProcessing ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            {tokenizing ? "Processando cartão..." : "Finalizando..."}
          </span>
        ) : !sdkReady && publicKey ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Carregando SDK...
          </span>
        ) : (
          <>
            <Lock className="w-4 h-4" />
            Pagar {formatCurrency(price)}
          </>
        )}
      </GoldButton>

      <div className="flex items-center justify-center gap-2 text-[0.65rem] text-[#856C42]/50" style={{ fontFamily: "Inter, sans-serif" }}>
        <Shield className="w-3 h-3" />
        Pagamento seguro processado pelo Mercado Pago
      </div>
    </form>
  );
}

// ============================================
// Pix Form
// ============================================
function PixForm({
  price,
  onSubmit,
  processing,
  result,
}: {
  price: number;
  onSubmit: (data: any) => void;
  processing: boolean;
  result: PaymentResult | null;
}) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [cpf, setCpf] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const qrCode = result?.point_of_interaction?.transaction_data?.qr_code;
  const qrCodeBase64 = result?.point_of_interaction?.transaction_data?.qr_code_base64;

  const handleCopy = async () => {
    if (!qrCode) return;
    try {
      await navigator.clipboard.writeText(qrCode);
      setCopied(true);
      toast.success("Código Pix copiado!");
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error("Erro ao copiar");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const cleanCpf = cpf.replace(/\D/g, "");
    if (!email.includes("@")) { setError("E-mail inválido"); return; }
    if (!firstName.trim()) { setError("Nome é obrigatório"); return; }
    if (!lastName.trim()) { setError("Sobrenome é obrigatório"); return; }
    if (cleanCpf.length !== 11 && cleanCpf.length !== 14) { setError("CPF ou CNPJ inválido"); return; }

    const idType = cleanCpf.length === 14 ? "CNPJ" : "CPF";
    onSubmit({
      payment_method_id: "pix",
      payer: {
        email,
        first_name: firstName,
        last_name: lastName,
        identification: { type: idType, number: cleanCpf },
      },
    });
  };

  // If we have a QR code result, show it
  if (result && result.status === "pending" && qrCode) {
    return (
      <div className="text-center space-y-5">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F0E8D4]/60 text-[#856C42] text-sm font-medium" style={{ fontFamily: "Inter, sans-serif" }}>
          <QrCode className="w-4 h-4" />
          Pix gerado com sucesso
        </div>

        {qrCodeBase64 && (
          <div className="flex justify-center">
            <div className="p-4 bg-white rounded-2xl shadow-lg border border-[#F0E8D4]">
              <img
                src={`data:image/png;base64,${qrCodeBase64}`}
                alt="QR Code Pix"
                className="w-48 h-48"
              />
            </div>
          </div>
        )}

        <div>
          <p className="text-xs text-[#856C42] mb-2" style={{ fontFamily: "Inter, sans-serif" }}>
            Ou copie o código Pix:
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={qrCode}
              className={inputClasses + " text-xs truncate"}
              style={inputStyle}
            />
            <button
              onClick={handleCopy}
              className="flex-shrink-0 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer"
              style={{
                background: copied ? "linear-gradient(135deg, #165B36, #052413)" : "linear-gradient(135deg, #EBBF74, #856C42)",
                color: copied ? "white" : "#052413",
                fontFamily: "Inter, sans-serif",
              }}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#165B36]/5 border border-[#165B36]/10">
          <p className="text-sm text-[#052413]" style={{ fontFamily: "Inter, sans-serif" }}>
            Abra o app do seu banco, escolha <strong>Pix Copia e Cola</strong> e cole o código acima.
            O pagamento será confirmado automaticamente.
          </p>
        </div>

        <div className="flex items-center justify-center gap-2.5 p-3.5 rounded-xl" style={{ backgroundColor: "rgba(235,191,116,0.1)", borderWidth: 1, borderColor: "rgba(235,191,116,0.25)" }}>
          <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(235,191,116,0.3)", borderTopColor: "#EBBF74" }} />
          <p className="text-xs font-medium text-[#856C42]" style={{ fontFamily: "Inter, sans-serif" }}>
            Aguardando confirmação do pagamento...
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 rounded-xl bg-[#165B36]/5 border border-[#165B36]/10 mb-2">
        <div className="flex items-center gap-2 mb-1.5">
          <QrCode className="w-4 h-4 text-[#165B36]" />
          <p className="text-sm font-medium text-[#052413]" style={{ fontFamily: "Inter, sans-serif" }}>
            Pagamento instantâneo
          </p>
        </div>
        <p className="text-xs text-[#856C42]" style={{ fontFamily: "Inter, sans-serif" }}>
          Após preencher seus dados, vamos gerar um QR Code e um código Pix Copia e Cola para pagamento imediato.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClasses} style={labelStyle}>Nome</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="João"
            className={inputClasses}
            style={inputStyle}
          />
        </div>
        <div>
          <label className={labelClasses} style={labelStyle}>Sobrenome</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Silva"
            className={inputClasses}
            style={inputStyle}
          />
        </div>
      </div>

      <div>
        <label className={labelClasses} style={labelStyle}>E-mail</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          className={inputClasses}
          style={inputStyle}
        />
      </div>

      <div>
        <label className={labelClasses} style={labelStyle}>CPF ou CNPJ</label>
        <input
          type="text"
          value={cpf}
          onChange={(e) => setCpf(formatCPFOrCNPJ(e.target.value))}
          placeholder="000.000.000-00 ou 00.000.000/0000-00"
          className={inputClasses}
          style={inputStyle}
          maxLength={18}
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 p-3 rounded-lg bg-red-50">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span style={{ fontFamily: "Inter, sans-serif" }}>{error}</span>
        </div>
      )}

      <GoldButton type="submit" disabled={processing} className="w-full px-6 py-3.5 text-sm font-semibold">
        {processing ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <QrCode className="w-4 h-4" />
            Gerar Pix — {formatCurrency(price)}
          </>
        )}
      </GoldButton>
    </form>
  );
}

// ============================================
// Boleto Form
// ============================================
function BoletoForm({
  price,
  onSubmit,
  processing,
  result,
}: {
  price: number;
  onSubmit: (data: any) => void;
  processing: boolean;
  result: PaymentResult | null;
}) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [cpf, setCpf] = useState("");
  const [error, setError] = useState("");

  const boletoUrl = result?.transaction_details?.external_resource_url;

  // If we have a boleto result
  if (result && boletoUrl) {
    return (
      <div className="text-center space-y-5">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F0E8D4]/60 text-[#856C42] text-sm font-medium" style={{ fontFamily: "Inter, sans-serif" }}>
          <FileText className="w-4 h-4" />
          Boleto gerado com sucesso
        </div>

        <div className="p-5 rounded-xl bg-white border border-[#F0E8D4] shadow-sm">
          <p className="text-sm text-[#052413] mb-4" style={{ fontFamily: "Inter, sans-serif" }}>
            Seu boleto foi gerado. Clique abaixo para visualizar e pagar:
          </p>
          <a
            href={boletoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, #165B36, #052413)",
              fontFamily: "Inter, sans-serif",
            }}
          >
            <FileText className="w-4 h-4" />
            Abrir boleto
          </a>
        </div>

        <div className="p-4 rounded-xl bg-[#EBBF74]/10 border border-[#EBBF74]/20">
          <p className="text-xs text-[#856C42]" style={{ fontFamily: "Inter, sans-serif" }}>
            O boleto pode levar até <strong>3 dias úteis</strong> para ser compensado.
            O pagamento será confirmado automaticamente.
          </p>
        </div>

        <div className="flex items-center justify-center gap-2.5 p-3.5 rounded-xl" style={{ backgroundColor: "rgba(235,191,116,0.1)", borderWidth: 1, borderColor: "rgba(235,191,116,0.25)" }}>
          <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(235,191,116,0.3)", borderTopColor: "#EBBF74" }} />
          <p className="text-xs font-medium text-[#856C42]" style={{ fontFamily: "Inter, sans-serif" }}>
            Aguardando confirmação do pagamento...
          </p>
        </div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const cleanCpf = cpf.replace(/\D/g, "");
    if (!email.includes("@")) { setError("E-mail inválido"); return; }
    if (!firstName.trim()) { setError("Nome é obrigatório"); return; }
    if (!lastName.trim()) { setError("Sobrenome é obrigatório"); return; }
    if (cleanCpf.length !== 11 && cleanCpf.length !== 14) { setError("CPF ou CNPJ inválido"); return; }

    const idType = cleanCpf.length === 14 ? "CNPJ" : "CPF";
    onSubmit({
      payment_method_id: "bolbradesco",
      payer: {
        email,
        first_name: firstName,
        last_name: lastName,
        identification: { type: idType, number: cleanCpf },
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 rounded-xl bg-[#EBBF74]/10 border border-[#EBBF74]/20 mb-2">
        <div className="flex items-center gap-2 mb-1.5">
          <FileText className="w-4 h-4 text-[#856C42]" />
          <p className="text-sm font-medium text-[#052413]" style={{ fontFamily: "Inter, sans-serif" }}>
            Boleto bancário
          </p>
        </div>
        <p className="text-xs text-[#856C42]" style={{ fontFamily: "Inter, sans-serif" }}>
          Após preencher seus dados, vamos gerar o boleto para pagamento. Prazo de compensação: até 3 dias úteis.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClasses} style={labelStyle}>Nome</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="João"
            className={inputClasses}
            style={inputStyle}
          />
        </div>
        <div>
          <label className={labelClasses} style={labelStyle}>Sobrenome</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Silva"
            className={inputClasses}
            style={inputStyle}
          />
        </div>
      </div>

      <div>
        <label className={labelClasses} style={labelStyle}>E-mail</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          className={inputClasses}
          style={inputStyle}
        />
      </div>

      <div>
        <label className={labelClasses} style={labelStyle}>CPF ou CNPJ</label>
        <input
          type="text"
          value={cpf}
          onChange={(e) => setCpf(formatCPFOrCNPJ(e.target.value))}
          placeholder="000.000.000-00 ou 00.000.000/0000-00"
          className={inputClasses}
          style={inputStyle}
          maxLength={18}
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 p-3 rounded-lg bg-red-50">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span style={{ fontFamily: "Inter, sans-serif" }}>{error}</span>
        </div>
      )}

      <GoldButton type="submit" disabled={processing} className="w-full px-6 py-3.5 text-sm font-semibold">
        {processing ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <FileText className="w-4 h-4" />
            Gerar Boleto — {formatCurrency(price)}
          </>
        )}
      </GoldButton>
    </form>
  );
}

// ============================================
// Main Payment Page
// ============================================
export function PaymentPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [info, setInfo] = useState<PaymentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("pix");
  const [processing, setProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Contract acceptance state
  const [contractAccepted, setContractAccepted] = useState(false);
  const [contractExpanded, setContractExpanded] = useState(false);
  const [contractName, setContractName] = useState("");
  const [contractEmail, setContractEmail] = useState("");
  const [contractCpf, setContractCpf] = useState("");
  const [contractChecked, setContractChecked] = useState(false);
  const [acceptingContract, setAcceptingContract] = useState(false);

  // Contract template from admin
  const [contractTemplate, setContractTemplate] = useState<any>(null);
  const [logoBase64, setLogoBase64] = useState<string>("");
  const CONTRACT_VERSION = contractTemplate?.version || "1.0";
  const COMPANY_NAME = contractTemplate?.companyName || "Epoca Editora de Livros";
  const COMPANY_DESC = contractTemplate?.companyDescription || "pessoa juridica de direito privado, com sede em territorio brasileiro";
  const CONTRACT_PREAMBLE = contractTemplate?.preamble || "Pelo presente instrumento particular, as partes abaixo qualificadas celebram o presente Contrato de Prestacao de Servicos Editoriais, que se regera pelas seguintes clausulas e condicoes:";

  // Helper to get clause content from template (fallback to null)
  const getClauseContent = useCallback((num: number): { title: string; content: string } | null => {
    if (!contractTemplate?.clauses) return null;
    return contractTemplate.clauses.find((c: any) => c.number === num) || null;
  }, [contractTemplate]);

  // Convert logo to base64 for print/download (new window can't access figma:asset URLs)
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          setLogoBase64(canvas.toDataURL("image/png"));
        }
      } catch { /* CORS or tainted canvas — fallback stays empty */ }
    };
    img.src = logoImg;
  }, []);

  // SEO
  useEffect(() => {
    document.title = "Pagamento — Época Editora de Livros";
    return () => { document.title = "Época Editora de Livros — Histórias que transformam"; };
  }, []);

  // Fetch payment info + contract template
  useEffect(() => {
    if (!projectId) {
      setError("ID do projeto não informado.");
      setLoading(false);
      return;
    }
    const fetchInfo = async () => {
      try {
        setLoading(true);
        setError("");
        console.log(`PaymentPage: fetching info for project ${projectId}`);
        const [data, tmplData] = await Promise.all([
          getPaymentInfo(projectId),
          getPublicContractTemplate().catch(() => ({ template: null })),
        ]);
        console.log("PaymentPage: received data", data);
        setInfo(data);
        if (tmplData.template) setContractTemplate(tmplData.template);
        if (data.budgetStatus === "paid" || data.budgetStatus === "fully_paid") {
          setPaymentSuccess(true);
        }
        if (data.contractAccepted) {
          setContractAccepted(true);
          if (data.contractAcceptorName) setContractName(data.contractAcceptorName);
          if (data.contractAcceptorEmail) setContractEmail(data.contractAcceptorEmail);
          if (data.contractAcceptorCpf) setContractCpf(formatCPFOrCNPJ(data.contractAcceptorCpf));
        }
      } catch (err: any) {
        console.error("PaymentPage: fetch error", err);
        setError(err.message || "Erro ao carregar informações de pagamento");
      } finally {
        setLoading(false);
      }
    };
    fetchInfo();
  }, [projectId]);

  // POLLING: check payment status after Pix/Boleto is generated
  // Uses dedicated check-status endpoint that queries MercadoPago API directly
  useEffect(() => {
    if (!projectId || !paymentResult || paymentSuccess) return;
    if (paymentResult.status !== "pending") return;

    console.log("PaymentPage: starting payment status polling (every 5s)...");
    let cancelled = false;
    let pollCount = 0;
    const MAX_POLLS = 360; // 30 minutes max polling

    const poll = async () => {
      pollCount++;
      if (pollCount > MAX_POLLS) {
        console.log("PaymentPage: max polling reached, stopping");
        return;
      }
      try {
        const data = await checkPaymentStatus(projectId);
        if (cancelled) return;
        console.log(`PaymentPage: poll #${pollCount} → status=${data.status}`);
        if (data.status === "paid") {
          console.log("PaymentPage: payment confirmed via polling!");
          // Refresh full info to get updated data
          try {
            const fullInfo = await getPaymentInfo(projectId);
            if (!cancelled) setInfo(fullInfo);
          } catch { /* use existing info */ }
          setPaymentSuccess(true);
          toast.success("Pagamento confirmado com sucesso!");
        }
      } catch (e) {
        console.error("PaymentPage: polling error", e);
      }
    };

    // First check after 3s, then every 5s
    const timeout = setTimeout(poll, 3000);
    const interval = setInterval(poll, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [projectId, paymentResult, paymentSuccess]);

  // Render a static clause from template or fallback to default content
  const renderStaticClause = useCallback((num: number, defaultTitle: string, defaultContent: string) => {
    const tmpl = getClauseContent(num);
    const title = tmpl?.title || defaultTitle;
    const content = tmpl?.content || defaultContent;
    const lines = content.split("\n").filter((l: string) => l.trim());
    return (
      <>
        <p className="font-semibold text-[#052413] mb-1 mt-4">CLAUSULA {num} — {title}</p>
        {lines.map((line: string, i: number) => {
          const isSubItem = /^[a-z]\)/.test(line.trim());
          const isLast = i === lines.length - 1;
          return (
            <p key={i} className={`${isSubItem ? "pl-3" : ""} ${isLast ? "mb-3" : "mb-1"}`}>
              {line}
            </p>
          );
        })}
      </>
    );
  }, [getClauseContent]);

  // Generate contract HTML string for printing/download (no DOM dependency)
  const generateContractHTML = useCallback(() => {
    if (!info) return "";

    const getClauseText = (num: number, defaultTitle: string, defaultContent: string) => {
      const tmpl = getClauseContent(num);
      const title = tmpl?.title || defaultTitle;
      const content = tmpl?.content || defaultContent;
      const lines = content.split("\n").filter((l: string) => l.trim());
      return `<p style="font-weight:700;margin-top:16px;margin-bottom:4px;color:#052413">CLAUSULA ${num} — ${title}</p>${lines.map((l: string) => `<p style="${/^[a-z]\)/.test(l.trim()) ? "padding-left:16px;" : ""}margin-bottom:4px">${l}</p>`).join("")}`;
    };

    const name = contractName.trim() || info.userName || "_______________";
    const cpf = contractCpf || "";
    const email = contractEmail.trim() || "";

    const printLogo = logoBase64 || logoImg;
    let html = `<div style="text-align:center;margin-bottom:20px;padding-bottom:15px;border-bottom:2px solid #EBBF74">`;
    html += `<img src="${printLogo}" alt="${COMPANY_NAME}" style="height:48px;margin:0 auto 8px;display:block" />`;
    html += `<p style="font-weight:700;font-size:13px;margin-bottom:2px;font-family:'Playfair Display',Georgia,serif;color:#052413;letter-spacing:0.5px">CONTRATO DE PRESTACAO DE SERVICOS EDITORIAIS</p>`;
    html += `<p style="font-size:9px;color:#856C42;text-transform:uppercase;letter-spacing:2px;margin-top:4px">Versao ${CONTRACT_VERSION}</p>`;
    html += `</div>`;
    html += `<p style="margin-bottom:8px">${CONTRACT_PREAMBLE}</p>`;

    // Clause 1
    html += `<p style="font-weight:700;margin-top:16px;margin-bottom:4px;color:#052413">CLAUSULA 1 — DAS PARTES</p>`;
    html += `<p style="margin-bottom:4px"><strong>EDITORA:</strong> ${COMPANY_NAME}, ${COMPANY_DESC}.</p>`;
    const cleanCpfDoc = cpf.replace(/\D/g, "");
    const docLabel = cleanCpfDoc.length === 14 ? "CNPJ" : "CPF";
    html += `<p style="margin-bottom:8px"><strong>CONTRATANTE:</strong> ${name}${cleanCpfDoc.length === 11 || cleanCpfDoc.length === 14 ? `, inscrito(a) no ${docLabel} sob o n. ${cpf}` : ""}${email.includes("@") ? `, e-mail ${email}` : ""}.</p>`;

    // Clause 2
    html += `<p style="font-weight:700;margin-top:16px;margin-bottom:4px;color:#052413">CLAUSULA 2 — DO OBJETO</p>`;
    html += `<p style="margin-bottom:4px">O presente contrato tem por objeto a prestacao dos seguintes servicos editoriais pela EDITORA ao CONTRATANTE:</p>`;
    if (info.services?.length > 0) {
      const svcMap: Record<string, string> = { completo: "Servico editorial completo", diagramacao: "Diagramacao", capa: "Design de capa", revisao: "Revisao textual", isbn: "Registro ISBN", impressao: "Impressao" };
      info.services.forEach((s: string) => { html += `<p style="padding-left:16px;margin-bottom:2px">• ${svcMap[s] || s}</p>`; });
    }
    html += `<p style="margin-bottom:4px;margin-top:8px">A obra objeto deste contrato e: <strong>"${info.title}"</strong>, de autoria de <strong>${info.author}</strong>.</p>`;
    if (info.format || info.pageCount) {
      html += `<p style="margin-bottom:8px">Especificacoes tecnicas: ${info.format ? `formato ${info.format}` : ""}${info.format && info.pageCount ? ", " : ""}${info.pageCount ? `com aproximadamente ${info.pageCount} paginas` : ""}.</p>`;
    }
    if (info.budgetDescription) {
      html += `<p style="margin-bottom:8px;padding:8px;background:#f0f7f0;border-left:3px solid #cde"><strong>Descricao do orcamento:</strong> ${info.budgetDescription}</p>`;
    }

    html += getClauseText(3, "DAS OBRIGACOES DA EDITORA", "A EDITORA se obriga a:\na) Executar os servicos contratados com qualidade profissional e dentro dos padroes editoriais vigentes;\nb) Manter sigilo sobre o conteudo da obra e informacoes pessoais do CONTRATANTE;\nc) Fornecer ao CONTRATANTE prova digital da obra para revisao e aprovacao antes da finalizacao;\nd) Realizar os ajustes solicitados pelo CONTRATANTE dentro do escopo contratado, limitados a uma rodada de revisao incluida no preco;\ne) Entregar o material finalizado no prazo acordado, a contar da aprovacao do orcamento e recebimento integral dos arquivos necessarios.");
    html += getClauseText(4, "DAS OBRIGACOES DO CONTRATANTE", "O CONTRATANTE se obriga a:\na) Fornecer todos os materiais necessarios para a execucao dos servicos em formato digital adequado;\nb) Efetuar o pagamento conforme as condicoes estipuladas neste contrato;\nc) Responder as solicitacoes da EDITORA em ate 10 (dez) dias uteis;\nd) Revisar e aprovar ou solicitar ajustes na prova digital em ate 15 (quinze) dias uteis apos o envio;\ne) Garantir que possui todos os direitos autorais sobre o conteudo fornecido, isentando a EDITORA de qualquer responsabilidade sobre plagio ou violacao de direitos de terceiros.");

    // Clause 5
    html += `<p style="font-weight:700;margin-top:16px;margin-bottom:4px;color:#052413">CLAUSULA 5 — DO PRECO E CONDICOES DE PAGAMENTO</p>`;
    html += `<p style="margin-bottom:4px">O valor total dos servicos e de <strong>${formatCurrency(info.price)}</strong>, conforme detalhado no orcamento apresentado.</p>`;
    if (info.depositPercent > 0 && info.depositPercent < 100) {
      html += `<p style="padding-left:16px;margin-bottom:2px">a) Entrada (${info.depositPercent}%): ${formatCurrency(info.chargeAmount)}, a ser paga no ato da contratacao;</p>`;
      html += `<p style="padding-left:16px;margin-bottom:8px">b) Saldo remanescente (${100 - info.depositPercent}%): ${formatCurrency(info.remainderAmount)}, a ser pago na entrega do material finalizado.</p>`;
    } else {
      html += `<p style="margin-bottom:8px">O pagamento integral no valor de <strong>${formatCurrency(info.price)}</strong> devera ser realizado no ato da contratacao.</p>`;
    }
    // Installment plan clause
    if (info.installmentPlan?.enabled && info.installmentPlan?.installments?.length > 0) {
      const ip = info.installmentPlan;
      html += `<p style="margin-top:8px;margin-bottom:4px;font-weight:600">Modalidade de pagamento parcelado via PIX:</p>`;
      html += `<p style="margin-bottom:4px">O CONTRATANTE opta pelo pagamento parcelado em <strong>${ip.totalInstallments} parcela(s)</strong> via PIX, conforme cronograma abaixo:</p>`;
      ip.installments.forEach((inst: any) => {
        const dueFormatted = new Date(inst.dueDate + "T12:00:00").toLocaleDateString("pt-BR");
        html += `<p style="padding-left:16px;margin-bottom:2px">${inst.number}ª parcela: ${formatCurrency(inst.amount)} — vencimento em ${dueFormatted};</p>`;
      });
      html += `<p style="margin-top:4px;margin-bottom:8px">O CONTRATANTE compromete-se a efetuar o pagamento de cada parcela ate a data de vencimento estipulada. O atraso no pagamento de qualquer parcela podera acarretar a suspensao dos servicos ate a regularizacao.</p>`;
    }

    // Clause 6
    html += `<p style="font-weight:700;margin-top:16px;margin-bottom:4px;color:#052413">CLAUSULA 6 — DO PRAZO</p>`;
    if (info.estimatedDeadline) {
      html += `<p style="margin-bottom:8px">O prazo estimado para a execucao dos servicos e de <strong>${info.estimatedDeadline}</strong>, contados a partir do recebimento integral dos arquivos necessarios e da confirmacao do pagamento.</p>`;
    } else {
      html += `<p style="margin-bottom:8px">O prazo estimado para a execucao dos servicos sera informado pela EDITORA apos a analise do material recebido.</p>`;
    }

    html += getClauseText(7, "DA REVISAO E APROVACAO", "A EDITORA disponibilizara ao CONTRATANTE uma prova digital para revisao. O CONTRATANTE tera uma rodada de revisao incluida no escopo contratado. Ajustes adicionais alem do escopo original poderao ser cobrados separadamente. A aprovacao da prova pelo CONTRATANTE autoriza a EDITORA a finalizar o trabalho.");
    html += getClauseText(8, "DA PROPRIEDADE INTELECTUAL", "Os direitos autorais sobre o conteudo da obra permanecem integralmente com o CONTRATANTE. A EDITORA detem os direitos sobre o projeto grafico criado especificamente para a obra, concedendo ao CONTRATANTE licenca de uso irrevogavel e exclusiva.");
    html += getClauseText(9, "DA RESCISAO", "a) Rescisao pelo CONTRATANTE antes do inicio: reembolso de 80% do valor pago;\nb) Rescisao pelo CONTRATANTE durante a execucao: cobranca proporcional aos servicos realizados;\nc) Rescisao pela EDITORA por forca maior: reembolso integral dos servicos nao realizados.");
    html += getClauseText(10, "DA PROTECAO DE DADOS PESSOAIS (LGPD)", "a) A EDITORA compromete-se a tratar os dados pessoais do CONTRATANTE em conformidade com a LGPD (Lei n. 13.709/2018);\nb) Os dados coletados tem como base legal a execucao deste contrato (art. 7, V) e obrigacao legal (art. 7, II);\nc) A finalidade e exclusivamente a prestacao dos servicos contratados, emissao de documentos fiscais e comunicacao;\nd) Os dados serao retidos por 5 anos apos a conclusao do contrato;\ne) O CONTRATANTE podera exercer seus direitos de titular (art. 18 da LGPD) mediante solicitacao por e-mail;\nf) A EDITORA nao compartilha dados com terceiros, exceto para pagamentos ou por determinacao legal.");
    html += getClauseText(11, "DO FORO E RESOLUCAO DE CONFLITOS", "a) As partes elegem o foro da Comarca de Maringa, Estado do Parana, com exclusao de qualquer outro;\nb) As partes buscarao resolucao amigavel no prazo de 30 dias antes de acao judicial;\nc) Persistindo o impasse, poderao recorrer a mediacao ou arbitragem (Lei n. 9.307/1996).");
    html += getClauseText(12, "DISPOSICOES GERAIS", "a) Este contrato entra em vigor na data do aceite eletronico e permanece vigente ate a conclusao dos servicos;\nb) O aceite eletronico tem validade juridica nos termos da MP n. 2.200-2/2001 e do Codigo Civil Brasileiro;\nc) O registro do aceite inclui data, hora, endereco IP, navegador, hash SHA-256 e, quando autorizado, geolocalizacao;\nd) Uma copia imutavel do contrato e armazenada no momento do aceite;\ne) Alteracoes somente serao validas mediante acordo escrito entre as partes;\nf) Casos omissos serao resolvidos pela legislacao brasileira vigente.");

    // Custom clauses
    if (info.customClauses) {
      try {
        const parsed = JSON.parse(info.customClauses);
        if (Array.isArray(parsed)) {
          parsed.forEach((clause: any, idx: number) => {
            html += `<p style="font-weight:700;margin-top:16px;margin-bottom:4px;color:#052413">CLAUSULA ${13 + idx} — ${clause.title ? clause.title.toUpperCase() : `DISPOSICOES ESPECIFICAS ${idx + 1}`}</p>`;
            html += `<p style="margin-bottom:8px;white-space:pre-wrap">${clause.content}</p>`;
          });
        } else {
          html += `<p style="font-weight:700;margin-top:16px;margin-bottom:4px;color:#052413">CLAUSULA 13 — DISPOSICOES ESPECIFICAS DESTE PROJETO</p>`;
          html += `<p style="margin-bottom:8px;white-space:pre-wrap">${info.customClauses}</p>`;
        }
      } catch {
        html += `<p style="font-weight:700;margin-top:16px;margin-bottom:4px;color:#052413">CLAUSULA 13 — DISPOSICOES ESPECIFICAS DESTE PROJETO</p>`;
        html += `<p style="margin-bottom:8px;white-space:pre-wrap">${info.customClauses}</p>`;
      }
    }

    return html;
  }, [info, contractName, contractCpf, contractEmail, COMPANY_NAME, COMPANY_DESC, CONTRACT_VERSION, CONTRACT_PREAMBLE, getClauseContent, logoBase64]);

  const handleContractDownload = useCallback(() => {
    const html = generateContractHTML();
    if (!html) { toast.error("Dados do contrato indisponiveis."); return; }
    const w = window.open("", "_blank");
    if (!w) { toast.error("Popup bloqueado. Permita popups para salvar o contrato."); return; }
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Contrato — ${COMPANY_NAME}</title><link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap" rel="stylesheet"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Inter,Arial,sans-serif;font-size:11px;line-height:1.6;color:#333;padding:40px 60px;max-width:800px;margin:auto}p{margin-bottom:6px}.footer{margin-top:30px;padding-top:15px;border-top:2px solid #EBBF74;font-size:9px;color:#856C42;text-align:center}@media print{body{padding:20px 40px}}</style></head><body>`);
    w.document.write(html);
    let footerHtml = `Contrato aceito eletronicamente em ${info?.contractAcceptedAt ? new Date(info.contractAcceptedAt).toLocaleString("pt-BR") : "data registrada"}. Documento gerado para arquivo pessoal.`;
    if (info?.contractHash) {
      footerHtml += `<br/>Integridade SHA-256: ${info.contractHash}`;
    }
    w.document.write(`<div class="footer">${footerHtml}</div>`);
    w.document.write(`</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 300);
  }, [generateContractHTML, COMPANY_NAME, info]);

  const handlePayment = useCallback(async (paymentData: any) => {
    if (!projectId) return;
    setProcessing(true);
    try {
      const result = await processPayment(projectId, paymentData);
      setPaymentResult(result);

      if (result.status === "approved") {
        setPaymentSuccess(true);
        toast.success("Pagamento aprovado com sucesso!");
      } else if (result.status === "pending") {
        toast.success("Pagamento gerado! Aguardando confirmação.");
      } else if (result.status === "rejected") {
        toast.error("Pagamento recusado. Tente outro método.");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao processar pagamento");
    } finally {
      setProcessing(false);
    }
  }, [projectId]);

  // Global noise filter (for GoldButton)
  const noiseFilter = (
    <svg className="absolute w-0 h-0" aria-hidden="true">
      <filter id="goldNoise">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch" />
      </filter>
    </svg>
  );

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: "linear-gradient(180deg, #052413 0%, #0a3320 40%, #0d4428 100%)",
      }}
    >
      {noiseFilter}

      {/* Header */}
      <header className="pt-8 pb-6 px-4 text-center">
        <Link
          to="/"
          className="inline-flex items-center gap-2 mb-6 text-[#EBBF74]/70 hover:text-[#EBBF74] transition-colors text-sm"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao site
        </Link>
        <div className="flex items-center justify-center gap-3 mb-2">
          <img
            src={footerLogoImg}
            alt="Época Editora"
            className="h-12"
            style={{ filter: "brightness(10) saturate(0)" }}
          />
        </div>
        <p className="text-sm text-[#EBBF74]/60" style={{ fontFamily: "Inter, sans-serif" }}>
          Checkout seguro
        </p>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center px-4 pb-12">
        <div className="w-full max-w-md">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-[#EBBF74] mb-3" />
              <p className="text-sm text-[#856C42]/60" style={{ fontFamily: "Inter, sans-serif" }}>
                Carregando informações de pagamento...
              </p>
            </div>
          ) : error ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-8 text-center"
              style={{ backgroundColor: "#FFFDF8", boxShadow: "0 8px 40px rgba(5,36,19,0.12)" }}
            >
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h2 className="text-lg text-[#052413] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                Pagamento indisponível
              </h2>
              <p className="text-sm text-[#856C42]" style={{ fontFamily: "Inter, sans-serif" }}>
                {error}
              </p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 mt-6 text-sm text-[#165B36] hover:underline"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar ao site
              </Link>
            </motion.div>
          ) : paymentSuccess ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl p-8 text-center"
              style={{ backgroundColor: "#FFFDF8", boxShadow: "0 8px 40px rgba(5,36,19,0.12)" }}
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ background: "linear-gradient(135deg, rgba(10,124,62,0.1), rgba(22,91,54,0.15))" }}
              >
                <CheckCircle className="w-8 h-8 text-[#0a7c3e]" />
              </div>
              <h2 className="text-xl text-[#052413] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                Pagamento confirmado!
              </h2>
              <p className="text-sm text-[#856C42] mb-1" style={{ fontFamily: "Inter, sans-serif" }}>
                {info?.title}
              </p>
              <p className="text-lg font-bold text-[#052413] tracking-tight mb-1" style={{ fontFamily: "Inter, sans-serif" }}>
                {info ? (info.depositPercent && info.depositPercent > 0 && info.depositPercent < 100
                  ? `${formatCurrency(info.chargeAmount)} (entrada ${info.depositPercent}%)`
                  : formatCurrency(info.price)) : ""}
              </p>
              {info?.depositPercent && info.depositPercent > 0 && info.depositPercent < 100 && info.remainderAmount ? (
                <p className="text-xs text-[#856C42] mb-4" style={{ fontFamily: "Inter, sans-serif" }}>
                  Valor total: {formatCurrency(info.price)} · Restante na entrega: {formatCurrency(info.remainderAmount)}
                </p>
              ) : null}
              {info?.paidAt && (
                <p className="text-xs text-[#856C42]/60 mb-6" style={{ fontFamily: "Inter, sans-serif" }}>
                  Pago em {formatDate(info.paidAt)}
                </p>
              )}
              <div className="p-4 rounded-xl bg-[#165B36]/5 border border-[#165B36]/10">
                <p className="text-sm text-[#052413]" style={{ fontFamily: "Inter, sans-serif" }}>
                  Seu pagamento foi recebido e a produção do seu projeto será iniciada em breve.
                  Acompanhe o andamento na sua <Link to="/minha-conta" className="text-[#165B36] font-medium hover:underline">área do cliente</Link>.
                </p>
              </div>
              {info?.depositPercent && info.depositPercent > 0 && info.depositPercent < 100 && info.remainderAmount ? (
                <div className="mt-3 p-3 rounded-xl border" style={{ backgroundColor: "rgba(235,191,116,0.06)", borderColor: "rgba(235,191,116,0.2)" }}>
                  <p className="text-xs text-[#856C42]" style={{ fontFamily: "Inter, sans-serif" }}>
                    O saldo restante de <strong className="text-[#052413]">{formatCurrency(info.remainderAmount)}</strong> será cobrado na entrega do projeto finalizado.
                  </p>
                </div>
              ) : null}
            </motion.div>
          ) : info ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* Project / Budget Info Card */}
              <div
                className="rounded-2xl p-6 mb-5"
                style={{
                  backgroundColor: "#FFFDF8",
                  boxShadow: "0 8px 40px rgba(5,36,19,0.12), 0 0 0 1px rgba(133,108,66,0.08)",
                }}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, rgba(22,91,54,0.1), rgba(235,191,116,0.15))" }}
                  >
                    <BookOpen className="w-6 h-6 text-[#165B36]" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg text-[#052413]" style={{ fontFamily: "'Playfair Display', serif" }}>
                      {info.title}
                    </h2>
                    <p className="text-sm text-[#856C42]" style={{ fontFamily: "Inter, sans-serif" }}>
                      {info.author}
                    </p>
                  </div>
                </div>

                {/* Project Details */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {info.format && (
                    <div className="flex items-center gap-1.5 text-xs text-[#856C42]/80" style={{ fontFamily: "Inter, sans-serif" }}>
                      <span className="text-[#856C42]/40">Formato:</span> {info.format}
                    </div>
                  )}
                  {info.pageCount && (
                    <div className="flex items-center gap-1.5 text-xs text-[#856C42]/80" style={{ fontFamily: "Inter, sans-serif" }}>
                      <span className="text-[#856C42]/40">Páginas:</span> ~{info.pageCount}
                    </div>
                  )}
                </div>

                {info.services && info.services.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {info.services.map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center px-2 py-0.5 rounded-md text-[0.65rem] font-medium"
                        style={{
                          fontFamily: "Inter, sans-serif",
                          backgroundColor: "rgba(22,91,54,0.08)",
                          color: "#165B36",
                        }}
                      >
                        {getServiceLabel(s)}
                      </span>
                    ))}
                  </div>
                )}

                <div className="p-3 rounded-xl mb-3" style={{ backgroundColor: "#F0E8D4" }}>
                  <p className="text-xs text-[#856C42] mb-0.5" style={{ fontFamily: "Inter, sans-serif" }}>
                    {info.budgetDescription}
                  </p>
                </div>

                {info.description && (
                  <p className="text-xs text-[#856C42]/60 mb-3 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
                    {info.description}
                  </p>
                )}

                {/* Pricing breakdown */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: "linear-gradient(135deg, rgba(235,191,116,0.15), rgba(133,108,66,0.08))" }}>
                    <span className="text-sm text-[#856C42]" style={{ fontFamily: "Inter, sans-serif" }}>
                      Valor total
                    </span>
                    <span className="text-2xl font-bold text-[#052413] tracking-tight" style={{ fontFamily: "Inter, sans-serif" }}>
                      {formatCurrency(info.price)}
                    </span>
                  </div>

                  {info.depositPercent > 0 && info.depositPercent < 100 && (
                    <>
                      <div className="flex items-center justify-between px-4 py-3 rounded-xl border-2 border-[#165B36]/20" style={{ backgroundColor: "rgba(22,91,54,0.04)" }}>
                        <span className="text-sm font-medium text-[#165B36]" style={{ fontFamily: "Inter, sans-serif" }}>
                          Entrada ({info.depositPercent}%) — pagar agora
                        </span>
                        <span className="text-xl font-bold text-[#165B36] tracking-tight" style={{ fontFamily: "Inter, sans-serif" }}>
                          {formatCurrency(info.chargeAmount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between px-4 py-2.5 rounded-xl" style={{ backgroundColor: "rgba(133,108,66,0.05)" }}>
                        <span className="text-xs text-[#856C42]/70" style={{ fontFamily: "Inter, sans-serif" }}>
                          Restante na entrega do projeto
                        </span>
                        <span className="text-sm font-semibold text-[#856C42]/70 tracking-tight" style={{ fontFamily: "Inter, sans-serif" }}>
                          {formatCurrency(info.remainderAmount)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Contract Acceptance Section */}
              <div
                className="rounded-2xl p-6 mb-5"
                style={{
                  backgroundColor: "#FFFDF8",
                  boxShadow: "0 8px 40px rgba(5,36,19,0.12), 0 0 0 1px rgba(133,108,66,0.08)",
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: contractAccepted ? "rgba(10,124,62,0.1)" : "linear-gradient(135deg, rgba(133,108,66,0.1), rgba(235,191,116,0.15))" }}
                  >
                    {contractAccepted ? (
                      <CheckCircle className="w-5 h-5 text-[#0a7c3e]" />
                    ) : (
                      <ScrollText className="w-5 h-5 text-[#856C42]" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base text-[#052413]" style={{ fontFamily: "'Playfair Display', serif" }}>
                      Contrato de prestacao de servicos
                    </h3>
                    <p className="text-[0.65rem] text-[#856C42]/60" style={{ fontFamily: "Inter, sans-serif" }}>
                      {contractAccepted
                        ? `Aceito em ${info.contractAcceptedAt ? formatDate(info.contractAcceptedAt) : "data registrada"}`
                        : `Versao ${CONTRACT_VERSION} — Personalizado com seus dados e servicos`}
                    </p>
                  </div>
                </div>

                {contractAccepted ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-3 rounded-xl text-sm text-[#0a7c3e]" style={{ backgroundColor: "rgba(10,124,62,0.06)", fontFamily: "Inter, sans-serif" }}>
                      <CheckCircle className="w-4 h-4 flex-shrink-0" />
                      <div>
                        <span className="font-medium">Contrato aceito eletronicamente</span>
                        <p className="text-[0.6rem] text-[#0a7c3e]/60 mt-0.5">O aceite acima refere-se ao contrato personalizado exibido nesta pagina, com seus dados, servicos e valores preenchidos automaticamente.</p>
                      </div>
                    </div>
                    {info.hasContractPdf && (
                      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(133,108,66,0.12)", backgroundColor: "rgba(235,191,116,0.05)" }}>
                        <button
                          onClick={async () => {
                            try {
                              const data = await getContractPdfUrl(projectId!);
                              window.open(data.url, "_blank");
                            } catch (err: any) {
                              toast.error(err.message || "Erro ao baixar contrato PDF");
                            }
                          }}
                          className="w-full flex items-center justify-center gap-2 p-2.5 text-xs font-medium text-[#856C42] transition-colors hover:bg-[#F0E8D4]/30 cursor-pointer"
                          style={{ fontFamily: "Inter, sans-serif" }}
                        >
                          <Download className="w-3.5 h-3.5" />
                          Documento complementar em PDF ({info.contractPdfName || "contrato.pdf"})
                        </button>
                        <p className="text-[0.55rem] text-[#856C42]/40 text-center pb-2 px-3" style={{ fontFamily: "Inter, sans-serif" }}>
                          Documento adicional fornecido pela editora para seu arquivo pessoal.
                        </p>
                      </div>
                    )}
                    {/* Discreet contract download link */}
                    <button
                      onClick={handleContractDownload}
                      className="flex items-center justify-center gap-1.5 w-full py-1.5 text-[0.6rem] text-[#856C42]/40 hover:text-[#856C42]/70 transition-colors cursor-pointer"
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      <Download className="w-2.5 h-2.5" />
                      Salvar copia do contrato
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Step 1: Identification fields FIRST so they appear live in contract */}
                    <div className="space-y-3 mb-4">
                      <p className="text-xs text-[#856C42]/70" style={{ fontFamily: "Inter, sans-serif" }}>
                        Preencha seus dados abaixo. Eles serao inseridos automaticamente no contrato.
                      </p>
                      <div>
                        <label className={labelClasses} style={labelStyle}>Nome completo do contratante</label>
                        <input type="text" value={contractName} onChange={(e) => setContractName(e.target.value)} placeholder="Nome completo" className={inputClasses} style={inputStyle} />
                      </div>
                      <div>
                        <label className={labelClasses} style={labelStyle}>E-mail do contratante</label>
                        <input type="email" value={contractEmail} onChange={(e) => setContractEmail(e.target.value)} placeholder="seu@email.com" className={inputClasses} style={inputStyle} />
                      </div>
                      <div>
                        <label className={labelClasses} style={labelStyle}>CPF ou CNPJ do contratante</label>
                        <input type="text" value={contractCpf} onChange={(e) => setContractCpf(formatCPFOrCNPJ(e.target.value))} placeholder="000.000.000-00 ou 00.000.000/0000-00" className={inputClasses} style={inputStyle} maxLength={18} />
                        {contractCpf.replace(/\D/g, "").length > 0 && contractCpf.replace(/\D/g, "").length < 11 && (
                          <p className="text-[0.6rem] text-[#856C42]/50 mt-1" style={{ fontFamily: "Inter, sans-serif" }}>CPF: 11 digitos | CNPJ: 14 digitos</p>
                        )}
                      </div>
                    </div>

                    {/* Step 2: Expandable contract — with live data */}
                    <button
                      onClick={() => setContractExpanded(!contractExpanded)}
                      className="w-full flex items-center justify-between p-3 rounded-xl mb-3 cursor-pointer transition-colors hover:bg-[#F0E8D4]/40"
                      style={{ backgroundColor: "#F0E8D4", fontFamily: "Inter, sans-serif" }}
                    >
                      <span className="text-xs font-medium text-[#052413]">
                        {contractExpanded ? "Ocultar contrato" : "Ler contrato completo"}
                      </span>
                      {contractExpanded ? <ChevronUp className="w-4 h-4 text-[#856C42]" /> : <ChevronDown className="w-4 h-4 text-[#856C42]" />}
                    </button>

                    <AnimatePresence>
                      {contractExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div
                            id="contract-full-text"
                            className="rounded-xl border p-4 mb-4 max-h-[400px] overflow-y-auto scrollbar-thin text-[0.7rem] leading-relaxed text-[#052413]/80"
                            style={{ borderColor: "rgba(133,108,66,0.15)", backgroundColor: "rgba(255,255,255,0.7)", fontFamily: "Inter, sans-serif" }}
                          >
                            {/* Branded header */}
                            <div className="text-center mb-5 pb-4 border-b" style={{ borderColor: "rgba(133,108,66,0.15)" }}>
                              <div className="flex items-center justify-center gap-3 mb-2">
                                <img src={logoImg} alt={COMPANY_NAME} className="h-10 object-contain" style={{ filter: "drop-shadow(0 1px 2px rgba(5,36,19,0.1))" }} />
                              </div>
                              <p className="font-bold text-xs text-[#052413] tracking-wide" style={{ fontFamily: "'Playfair Display', serif" }}>CONTRATO DE PRESTACAO DE SERVICOS EDITORIAIS</p>
                              <div className="flex items-center justify-center gap-2 mt-1.5">
                                <div className="h-px w-8" style={{ backgroundColor: "rgba(235,191,116,0.5)" }} />
                                <p className="text-[0.55rem] text-[#856C42]/80 uppercase tracking-widest">Versao {CONTRACT_VERSION}</p>
                                <div className="h-px w-8" style={{ backgroundColor: "rgba(235,191,116,0.5)" }} />
                              </div>
                            </div>

                            <p className="mb-3">{CONTRACT_PREAMBLE}</p>

                            <p className="font-semibold text-[#052413] mb-1 mt-4">CLAUSULA 1 — {getClauseContent(1)?.title || "DAS PARTES"}</p>
                            <p className="mb-3"><strong>CONTRATADA:</strong> {COMPANY_NAME}, {COMPANY_DESC}, doravante denominada simplesmente "EDITORA".</p>
                            <p className="mb-3">
                              <strong>CONTRATANTE:</strong>{" "}
                              {contractName.trim() ? (
                                <strong className="text-[#165B36] underline decoration-dotted">{contractName.trim()}</strong>
                              ) : (
                                <span className="italic text-[#856C42]/50">[preencha o nome acima]</span>
                              )}
                              {(contractCpf.replace(/\D/g, "").length === 11 || contractCpf.replace(/\D/g, "").length === 14) && (
                                <>, inscrito(a) no {contractCpf.replace(/\D/g, "").length === 14 ? "CNPJ" : "CPF"} sob o n. <strong className="text-[#165B36]">{contractCpf}</strong></>
                              )}
                              {contractEmail.includes("@") && (
                                <>, e-mail <strong className="text-[#165B36]">{contractEmail.trim()}</strong></>
                              )}
                              , doravante denominado(a) simplesmente "CONTRATANTE".
                            </p>

                            <p className="font-semibold text-[#052413] mb-1 mt-4">CLAUSULA 2 — DO OBJETO</p>
                            <p className="mb-2">O presente contrato tem por objeto a prestacao dos seguintes servicos editoriais pela EDITORA ao CONTRATANTE:</p>
                            <div className="mb-2 pl-3">
                              {info.services && info.services.length > 0 ? (
                                info.services.map((s) => {
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
                            <p className="mb-1">A obra objeto deste contrato e: <strong>"{info.title}"</strong>, de autoria de <strong>{info.author}</strong>.</p>
                            {(info.format || info.pageCount) && (
                              <p className="mb-2">
                                Especificacoes tecnicas:{" "}
                                {info.format && <>formato <strong>{info.format}</strong></>}
                                {info.format && info.pageCount && <>, </>}
                                {info.pageCount && <>com aproximadamente <strong>{info.pageCount} paginas</strong></>}
                                .
                              </p>
                            )}
                            {info.budgetDescription && (
                              <p className="mb-3 p-2 rounded-lg" style={{ backgroundColor: "rgba(22,91,54,0.04)", borderLeft: "3px solid rgba(22,91,54,0.2)" }}>
                                <strong>Descricao do orcamento:</strong> {info.budgetDescription}
                              </p>
                            )}

                            {renderStaticClause(3, "DAS OBRIGACOES DA EDITORA", "A EDITORA se obriga a:\na) Executar os servicos contratados com qualidade profissional e dentro dos padroes editoriais vigentes;\nb) Manter sigilo sobre o conteudo da obra e informacoes pessoais do CONTRATANTE;\nc) Fornecer ao CONTRATANTE prova digital da obra para revisao e aprovacao antes da finalizacao;\nd) Realizar os ajustes solicitados pelo CONTRATANTE dentro do escopo contratado, limitados a uma rodada de revisao incluida no preco;\ne) Entregar o material finalizado no prazo acordado, a contar da aprovacao do orcamento e recebimento integral dos arquivos necessarios.")}

                            {renderStaticClause(4, "DAS OBRIGACOES DO CONTRATANTE", "O CONTRATANTE se obriga a:\na) Fornecer todos os materiais necessarios para a execucao dos servicos em formato digital adequado;\nb) Efetuar o pagamento conforme as condicoes estipuladas neste contrato;\nc) Responder as solicitacoes da EDITORA em ate 10 (dez) dias uteis;\nd) Revisar e aprovar ou solicitar ajustes na prova digital em ate 15 (quinze) dias uteis apos o envio;\ne) Garantir que possui todos os direitos autorais sobre o conteudo fornecido, isentando a EDITORA de qualquer responsabilidade sobre plagio ou violacao de direitos de terceiros.")}

                            <p className="font-semibold text-[#052413] mb-1 mt-4">CLAUSULA 5 — DO PRECO E CONDICOES DE PAGAMENTO</p>
                            <p className="mb-2">O valor total dos servicos e de <strong>{formatCurrency(info.price)}</strong>, conforme detalhado no orcamento apresentado.</p>
                            {info.depositPercent > 0 && info.depositPercent < 100 ? (
                              <div className="mb-2 p-2 rounded-lg" style={{ backgroundColor: "rgba(22,91,54,0.04)", borderLeft: "3px solid rgba(22,91,54,0.2)" }}>
                                <p className="mb-1"><strong>Forma de pagamento parcelada:</strong></p>
                                <p className="mb-0.5 pl-3">a) <strong>Entrada ({info.depositPercent}%):</strong> {formatCurrency(info.chargeAmount)}, a ser paga no ato da contratacao;</p>
                                <p className="mb-0.5 pl-3">b) <strong>Saldo remanescente ({100 - info.depositPercent}%):</strong> {formatCurrency(info.remainderAmount)}, a ser pago na entrega do material finalizado.</p>
                              </div>
                            ) : (
                              <p className="mb-2">O pagamento integral no valor de <strong>{formatCurrency(info.price)}</strong> devera ser realizado no ato da contratacao.</p>
                            )}
                            <p className="mb-1">O pagamento podera ser realizado por meio das seguintes modalidades:</p>
                            <p className="mb-0.5 pl-3">a) <strong>Pix</strong> — transferencia instantanea via QR Code ou codigo;</p>
                            <p className="mb-0.5 pl-3">b) <strong>Cartao de credito</strong> — pagamento a vista ou parcelado em ate 12x;</p>
                            <p className="mb-2 pl-3">c) <strong>Boleto bancario</strong> — com vencimento em ate 3 dias uteis.</p>
                            <p className="mb-3">O nao pagamento nos prazos estipulados podera resultar na suspensao dos servicos sem aviso previo.</p>

                            {/* Installment plan clause */}
                            {info.installmentPlan?.enabled && info.installmentPlan?.installments?.length > 0 && (
                              <div className="mb-3 p-2 rounded-lg" style={{ backgroundColor: "rgba(235,191,116,0.06)", borderLeft: "3px solid rgba(235,191,116,0.4)" }}>
                                <p className="mb-1 font-semibold">Modalidade de pagamento parcelado via PIX:</p>
                                <p className="mb-1">O CONTRATANTE opta pelo pagamento parcelado em <strong>{info.installmentPlan.totalInstallments} parcela(s)</strong> via PIX, conforme cronograma abaixo:</p>
                                {info.installmentPlan.installments.map((inst: any) => (
                                  <p key={inst.number} className="mb-0.5 pl-3">
                                    {inst.number}ª parcela: <strong>{formatCurrency(inst.amount)}</strong> — vencimento em {new Date(inst.dueDate + "T12:00:00").toLocaleDateString("pt-BR")};
                                  </p>
                                ))}
                                <p className="mt-1">O CONTRATANTE compromete-se a efetuar o pagamento de cada parcela até a data de vencimento estipulada. O atraso no pagamento de qualquer parcela poderá acarretar a suspensão dos serviços até a regularização.</p>
                              </div>
                            )}

                            <p className="font-semibold text-[#052413] mb-1 mt-4">CLAUSULA 6 — DO PRAZO</p>
                            {info.estimatedDeadline ? (
                              <>
                                <p className="mb-2">O prazo estimado para a execucao dos servicos e de <strong className="text-[#165B36]">{info.estimatedDeadline}</strong>, contados a partir do recebimento integral dos arquivos necessarios e da confirmacao do pagamento.</p>
                                <p className="mb-3">Atrasos no fornecimento de materiais ou na aprovacao de etapas pelo CONTRATANTE prorrogarao o prazo proporcionalmente. O prazo podera ser revisto pela EDITORA mediante comunicacao previa ao CONTRATANTE.</p>
                              </>
                            ) : (
                              <p className="mb-3">O prazo estimado para a execucao dos servicos sera informado pela EDITORA apos a analise do material recebido. O prazo comeca a contar a partir do recebimento integral dos arquivos e da confirmacao do pagamento. Atrasos no fornecimento de materiais ou na aprovacao de etapas pelo CONTRATANTE prorrogarao o prazo proporcionalmente.</p>
                            )}

                            {renderStaticClause(7, "DA REVISAO E APROVACAO", "A EDITORA disponibilizara ao CONTRATANTE uma prova digital para revisao. O CONTRATANTE tera uma rodada de revisao incluida no escopo contratado. Ajustes adicionais alem do escopo original poderao ser cobrados separadamente. A aprovacao da prova pelo CONTRATANTE autoriza a EDITORA a finalizar o trabalho.")}

                            {renderStaticClause(8, "DA PROPRIEDADE INTELECTUAL", "Os direitos autorais sobre o conteudo da obra permanecem integralmente com o CONTRATANTE. A EDITORA detem os direitos sobre o projeto grafico criado especificamente para a obra, concedendo ao CONTRATANTE licenca de uso irrevogavel e exclusiva. A EDITORA podera utilizar imagens do projeto grafico para fins de divulgacao do seu portfolio, salvo oposicao expressa do CONTRATANTE.")}

                            {renderStaticClause(9, "DA RESCISAO", "a) Rescisao pelo CONTRATANTE antes do inicio: reembolso de 80% do valor pago;\nb) Rescisao pelo CONTRATANTE durante a execucao: cobranca proporcional aos servicos realizados;\nc) Rescisao pela EDITORA por forca maior: reembolso integral dos servicos nao realizados.")}

                            {renderStaticClause(10, "DA PROTECAO DE DADOS PESSOAIS (LGPD)", "a) A EDITORA compromete-se a tratar os dados pessoais do CONTRATANTE em conformidade com a LGPD (Lei n. 13.709/2018);\nb) Os dados coletados tem como base legal a execucao deste contrato (art. 7, V) e obrigacao legal (art. 7, II);\nc) A finalidade e exclusivamente a prestacao dos servicos contratados, emissao fiscal e comunicacao;\nd) Os dados serao retidos por 5 anos apos a conclusao do contrato;\ne) O CONTRATANTE podera exercer seus direitos de titular (art. 18 da LGPD) por e-mail;\nf) A EDITORA nao compartilha dados com terceiros, exceto para pagamentos ou por determinacao legal.")}

                            {renderStaticClause(11, "DO FORO E RESOLUCAO DE CONFLITOS", "a) As partes elegem o foro da Comarca de Maringa, Estado do Parana, com exclusao de qualquer outro;\nb) As partes buscarao resolucao amigavel no prazo de 30 dias antes de acao judicial;\nc) Persistindo o impasse, poderao recorrer a mediacao ou arbitragem (Lei n. 9.307/1996).")}

                            {renderStaticClause(12, "DISPOSICOES GERAIS", "a) Este contrato entra em vigor na data do aceite eletronico e permanece vigente ate a conclusao dos servicos;\nb) O aceite eletronico tem validade juridica nos termos da MP n. 2.200-2/2001 e do Codigo Civil Brasileiro;\nc) O registro do aceite inclui data, hora, IP, navegador, hash SHA-256 e, quando autorizado, geolocalizacao;\nd) Uma copia imutavel do contrato e armazenada no momento do aceite;\ne) Alteracoes somente serao validas mediante acordo escrito entre as partes;\nf) Casos omissos serao resolvidos pela legislacao brasileira vigente.")}

                            {info.customClauses && (() => {
                              let clauses: {title: string; content: string}[] = [];
                              try { const parsed = JSON.parse(info.customClauses); if (Array.isArray(parsed)) clauses = parsed; } catch {}
                              if (clauses.length === 0) {
                                return (
                                  <>
                                    <p className="font-semibold text-[#052413] mb-1 mt-4">CLAUSULA 13 — DISPOSICOES ESPECIFICAS DESTE PROJETO</p>
                                    <p className="mb-3 whitespace-pre-wrap">{info.customClauses}</p>
                                  </>
                                );
                              }
                              return clauses.map((clause, idx) => (
                                <div key={idx}>
                                  <p className="font-semibold text-[#052413] mb-1 mt-4">CLAUSULA {13 + idx} — {clause.title ? clause.title.toUpperCase() : `DISPOSICOES ESPECIFICAS ${idx + 1}`}</p>
                                  <p className="mb-3 whitespace-pre-wrap">{clause.content}</p>
                                </div>
                              ));
                            })()}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {info.hasContractPdf && (
                      <div className="rounded-xl mb-3 overflow-hidden" style={{ border: "1px solid rgba(133,108,66,0.12)", backgroundColor: "rgba(235,191,116,0.05)" }}>
                        <button
                          onClick={async () => {
                            try {
                              const data = await getContractPdfUrl(projectId!);
                              window.open(data.url, "_blank");
                            } catch (err: any) {
                              toast.error(err.message || "Erro ao baixar contrato PDF");
                            }
                          }}
                          className="w-full flex items-center justify-center gap-2 p-2.5 text-xs font-medium text-[#856C42] transition-colors hover:bg-[#F0E8D4]/30 cursor-pointer"
                          style={{ fontFamily: "Inter, sans-serif" }}
                        >
                          <Download className="w-3.5 h-3.5" />
                          Documento complementar em PDF ({info.contractPdfName || "contrato.pdf"})
                        </button>
                        <p className="text-[0.55rem] text-[#856C42]/40 text-center pb-2 px-3" style={{ fontFamily: "Inter, sans-serif" }}>
                          Documento adicional fornecido pela editora. O aceite juridico refere-se ao contrato acima.
                        </p>
                      </div>
                    )}

                    {/* Step 3: Checkbox + accept button */}
                    <div className="space-y-3">
                      <label className="flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors hover:bg-[#F0E8D4]/30" style={{ fontFamily: "Inter, sans-serif" }}>
                        <input type="checkbox" checked={contractChecked} onChange={(e) => setContractChecked(e.target.checked)} className="mt-0.5 w-4 h-4 rounded border-[#856C42]/30 text-[#165B36] focus:ring-[#EBBF74]/40 cursor-pointer" />
                        <span className="text-xs text-[#052413] leading-relaxed">
                          Eu, <strong>{contractName.trim() || "_______________"}</strong>, inscrito(a) no {contractCpf.replace(/\D/g, "").length === 14 ? "CNPJ" : "CPF"} n. <strong>{contractCpf || "___.___.___-__"}</strong>, declaro que li integralmente, compreendo e aceito todas as clausulas do <strong>Contrato de Prestacao de Servicos Editoriais</strong> da {COMPANY_NAME} (versao {CONTRACT_VERSION}), concordando com seus termos e condicoes.
                        </span>
                      </label>

                      <GoldButton
                        disabled={!contractChecked || !contractName.trim() || !contractEmail.includes("@") || (contractCpf.replace(/\D/g, "").length !== 11 && contractCpf.replace(/\D/g, "").length !== 14) || acceptingContract}
                        className="w-full px-6 py-3 text-sm font-semibold"
                        onClick={async () => {
                          if (!projectId) return;
                          setAcceptingContract(true);
                          try {
                            // Generate immutable snapshot of the contract HTML
                            const contractSnapshot = generateContractHTML();

                            // Generate SHA-256 hash of the contract for integrity verification
                            let contractHash = "";
                            try {
                              const encoder = new TextEncoder();
                              const data = encoder.encode(contractSnapshot);
                              const hashBuffer = await crypto.subtle.digest("SHA-256", data);
                              const hashArray = Array.from(new Uint8Array(hashBuffer));
                              contractHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
                            } catch { /* crypto API unavailable */ }

                            // Capture geolocation (with user consent, non-blocking)
                            let geo: { lat: number; lng: number; accuracy: number } | null = null;
                            try {
                              if (navigator.geolocation) {
                                const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
                                  navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000, maximumAge: 60000 });
                                });
                                geo = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy };
                              }
                            } catch { /* user denied or timeout — continue without geo */ }

                            await acceptContract(projectId, {
                              contractVersion: CONTRACT_VERSION,
                              acceptorName: contractName.trim(),
                              acceptorEmail: contractEmail.trim(),
                              acceptorCpf: contractCpf.replace(/\D/g, ""),
                              // Security enhancements
                              contractHash,
                              contractSnapshot,
                              geolocation: geo ? JSON.stringify(geo) : undefined,
                              screenResolution: `${window.screen.width}x${window.screen.height}`,
                            });
                            setContractAccepted(true);
                            toast.success("Contrato aceito com sucesso!");
                          } catch (err: any) {
                            toast.error(err.message || "Erro ao registrar aceite do contrato");
                          } finally {
                            setAcceptingContract(false);
                          }
                        }}
                      >
                        {acceptingContract ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            <ScrollText className="w-4 h-4" />
                            Aceitar contrato e prosseguir
                          </>
                        )}
                      </GoldButton>
                    </div>
                  </>
                )}
              </div>

              {/* Payment Methods — only visible after contract acceptance */}
              {contractAccepted && (
              <div
                className="rounded-2xl p-6"
                style={{
                  backgroundColor: "#FFFDF8",
                  boxShadow: "0 8px 40px rgba(5,36,19,0.12), 0 0 0 1px rgba(133,108,66,0.08)",
                }}
              >
                <h3 className="text-base text-[#052413] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Forma de pagamento
                </h3>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                  <MethodTab method="pix" selected={method} onSelect={setMethod} icon={QrCode} label="Pix" />
                  <MethodTab method="credit_card" selected={method} onSelect={setMethod} icon={CreditCard} label="Cartão" />
                  <MethodTab method="bolbradesco" selected={method} onSelect={setMethod} icon={FileText} label="Boleto" />
                </div>

                {/* Form */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={method}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    {method === "pix" && (
                      <PixForm
                        price={info.chargeAmount}
                        onSubmit={handlePayment}
                        processing={processing}
                        result={paymentResult}
                      />
                    )}
                    {method === "credit_card" && (
                      <CreditCardForm
                        price={info.chargeAmount}
                        publicKey={info.publicKey}
                        onSubmit={handlePayment}
                        processing={processing}
                      />
                    )}
                    {method === "bolbradesco" && (
                      <BoletoForm
                        price={info.chargeAmount}
                        onSubmit={handlePayment}
                        processing={processing}
                        result={paymentResult}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
              )}

              {/* Security Footer */}
              <div className="mt-5 text-center space-y-2">
                <div className="flex items-center justify-center gap-4 flex-wrap">
                  <div className="flex items-center gap-1.5 text-[0.65rem] text-[#856C42]/50" style={{ fontFamily: "Inter, sans-serif" }}>
                    <Shield className="w-3.5 h-3.5" />
                    Ambiente seguro
                  </div>
                  <div className="flex items-center gap-1.5 text-[0.65rem] text-[#856C42]/50" style={{ fontFamily: "Inter, sans-serif" }}>
                    <Lock className="w-3.5 h-3.5" />
                    Dados criptografados
                  </div>
                </div>
                <p className="text-[0.6rem] text-[#856C42]/30" style={{ fontFamily: "Inter, sans-serif" }}>
                  Processado por Mercado Pago — Plataforma de pagamentos segura
                </p>
              </div>
            </motion.div>
          ) : null}
        </div>
      </div>

      {/* Toaster for this standalone page */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            fontFamily: "Inter, sans-serif",
            borderRadius: "12px",
            border: "1px solid rgba(133, 108, 66, 0.15)",
            background: "#FFFDF8",
            color: "#052413",
            boxShadow: "0 8px 30px rgba(5, 36, 19, 0.12)",
          },
        }}
        richColors
        closeButton
      />
    </div>
  );
}