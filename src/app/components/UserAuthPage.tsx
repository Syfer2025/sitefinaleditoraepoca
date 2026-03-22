import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router";
import { Eye, EyeOff, LogIn, UserPlus, ArrowLeft, Building2, User, Search, CheckCircle, AlertCircle, Loader2, Phone, MapPin, Shield } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { GoldButton } from "./GoldButton";
import { useUserAuth } from "./UserAuthContext";
import { projectId, publicAnonKey } from "/utils/supabase/info";

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-e413165d`;
const F = "Inter, sans-serif";
const PF = "'Playfair Display', serif";

// ============================================
// Formatters & Validators
// ============================================
function formatCPF(value: string): string {
  const nums = value.replace(/\D/g, "").slice(0, 11);
  if (nums.length <= 3) return nums;
  if (nums.length <= 6) return `${nums.slice(0, 3)}.${nums.slice(3)}`;
  if (nums.length <= 9) return `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6)}`;
  return `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6, 9)}-${nums.slice(9)}`;
}

function formatCNPJ(value: string): string {
  const nums = value.replace(/\D/g, "").slice(0, 14);
  if (nums.length <= 2) return nums;
  if (nums.length <= 5) return `${nums.slice(0, 2)}.${nums.slice(2)}`;
  if (nums.length <= 8) return `${nums.slice(0, 2)}.${nums.slice(2, 5)}.${nums.slice(5)}`;
  if (nums.length <= 12) return `${nums.slice(0, 2)}.${nums.slice(2, 5)}.${nums.slice(5, 8)}/${nums.slice(8)}`;
  return `${nums.slice(0, 2)}.${nums.slice(2, 5)}.${nums.slice(5, 8)}/${nums.slice(8, 12)}-${nums.slice(12)}`;
}

function formatPhone(value: string): string {
  const nums = value.replace(/\D/g, "").slice(0, 11);
  if (nums.length <= 2) return nums.length ? `(${nums}` : "";
  if (nums.length <= 7) return `(${nums.slice(0, 2)}) ${nums.slice(2)}`;
  if (nums.length <= 10) return `(${nums.slice(0, 2)}) ${nums.slice(2, 6)}-${nums.slice(6)}`;
  return `(${nums.slice(0, 2)}) ${nums.slice(2, 7)}-${nums.slice(7)}`;
}

function formatCEP(value: string): string {
  const nums = value.replace(/\D/g, "").slice(0, 8);
  if (nums.length <= 5) return nums;
  return `${nums.slice(0, 5)}-${nums.slice(5)}`;
}

function validateCPF(cpf: string): boolean {
  const nums = cpf.replace(/\D/g, "");
  if (nums.length !== 11 || /^(\d)\1+$/.test(nums)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(nums[i]) * (10 - i);
  let d1 = 11 - (sum % 11);
  if (d1 >= 10) d1 = 0;
  if (parseInt(nums[9]) !== d1) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(nums[i]) * (11 - i);
  let d2 = 11 - (sum % 11);
  if (d2 >= 10) d2 = 0;
  return parseInt(nums[10]) === d2;
}

function validateCNPJ(cnpj: string): boolean {
  const nums = cnpj.replace(/\D/g, "");
  if (nums.length !== 14 || /^(\d)\1+$/.test(nums)) return false;
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += parseInt(nums[i]) * w1[i];
  let d1 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (parseInt(nums[12]) !== d1) return false;
  sum = 0;
  for (let i = 0; i < 13; i++) sum += parseInt(nums[i]) * w2[i];
  let d2 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return parseInt(nums[13]) === d2;
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;
  if (score <= 1) return { score, label: "Fraca", color: "#dc2626" };
  if (score <= 2) return { score, label: "Razoavel", color: "#f59e0b" };
  if (score <= 3) return { score, label: "Boa", color: "#EBBF74" };
  return { score, label: "Forte", color: "#0a7c3e" };
}

const inputClasses = "w-full px-4 py-3 rounded-lg border text-sm text-[#052413] placeholder:text-[#856C42]/40 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20 transition-all duration-300";
const inputStyle = { fontFamily: F, backgroundColor: "#F0E8D4", borderColor: "rgba(133,108,66,0.2)" };
const labelClasses = "block text-sm font-medium text-[#052413] mb-1.5";

// ============================================
// Terms Modal
// ============================================
function TermsModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl"
      >
        <div className="sticky top-0 bg-white px-6 py-4 border-b z-10" style={{ borderColor: "rgba(133,108,66,0.1)" }}>
          <h3 className="text-base font-semibold text-[#052413]" style={{ fontFamily: PF }}>Termos de Uso da Plataforma</h3>
          <p className="text-[0.65rem] text-[#856C42]/60 mt-0.5" style={{ fontFamily: F }}>Epoca Editora de Livros - Ultima atualizacao: Fevereiro de 2026</p>
        </div>
        <div className="px-6 py-5 space-y-4 text-xs text-[#052413]/80 leading-relaxed" style={{ fontFamily: F }}>
          <div className="space-y-3">
            <p><strong>1. Aceitacao dos Termos</strong></p>
            <p>Ao criar uma conta na plataforma da Epoca Editora de Livros, o usuario declara ter lido, compreendido e aceito integralmente estes Termos de Uso. O uso da plataforma implica na aceitacao automatica de todas as condicoes aqui estabelecidas.</p>

            <p><strong>2. Cadastro e Responsabilidade</strong></p>
            <p>O usuario e inteiramente responsavel pela veracidade das informacoes fornecidas no cadastro (nome, CPF/CNPJ, e-mail, telefone e endereco). A Editora reserva-se o direito de suspender ou cancelar contas com informacoes falsas ou incompletas, sem aviso previo e sem direito a reembolso de valores ja pagos.</p>

            <p><strong>3. Uso da Plataforma</strong></p>
            <p>A plataforma destina-se exclusivamente a solicitacao, acompanhamento e gestao de servicos editoriais. E vedado ao usuario: (a) utilizar a plataforma para fins ilicitos; (b) compartilhar credenciais de acesso com terceiros; (c) tentar acessar areas restritas ou dados de outros usuarios; (d) enviar conteudo que viole direitos autorais, conteudo ilegal, difamatorio ou que incite violencia.</p>

            <p><strong>4. Propriedade Intelectual</strong></p>
            <p>Todo o conteudo da plataforma (layout, design, logotipos, textos institucionais) pertence a Epoca Editora de Livros e e protegido pela legislacao de direitos autorais (Lei 9.610/98). O conteudo editorial enviado pelo usuario para diagramacao permanece de propriedade exclusiva do usuario.</p>

            <p><strong>5. Pagamentos e Reembolsos</strong></p>
            <p>Os pagamentos sao processados via Mercado Pago. A Editora nao armazena dados de cartao de credito. Pedidos de reembolso devem ser solicitados por e-mail em ate 7 dias apos o pagamento, sendo aplicadas as condicoes previstas no contrato de prestacao de servicos.</p>

            <p><strong>6. Privacidade e Protecao de Dados (LGPD)</strong></p>
            <p>Os dados pessoais coletados (nome, e-mail, CPF/CNPJ, telefone, endereco) sao utilizados exclusivamente para: (a) prestacao dos servicos contratados; (b) envio de livros fisicos ao endereco cadastrado; (c) emissao de documentos fiscais; (d) comunicacao sobre o andamento dos projetos. Os dados sao tratados conforme a LGPD (Lei 13.709/2018) e a Politica de Privacidade da Editora, disponivel em /privacidade.</p>

            <p><strong>7. Limitacao de Responsabilidade</strong></p>
            <p>A Editora nao se responsabiliza por: (a) indisponibilidade temporaria da plataforma por manutencao ou fatores externos; (b) perda de dados causada por falha do usuario; (c) conteudo fornecido pelo usuario que viole direitos de terceiros; (d) atrasos decorrentes de informacoes incompletas ou incorretas fornecidas pelo usuario.</p>

            <p><strong>8. Comunicacoes</strong></p>
            <p>Ao cadastrar-se, o usuario autoriza o envio de comunicacoes por e-mail e WhatsApp relacionadas aos servicos contratados. O usuario pode solicitar a interrupcao de comunicacoes nao essenciais a qualquer momento.</p>

            <p><strong>9. Alteracao dos Termos</strong></p>
            <p>A Editora pode alterar estes Termos a qualquer momento, comunicando as alteracoes por e-mail ou pela plataforma. O uso continuado apos a alteracao constitui aceitacao dos novos termos.</p>

            <p><strong>10. Foro</strong></p>
            <p>Fica eleito o foro da Comarca de Maringa, Estado do Parana, para dirimir quaisquer controversias decorrentes destes Termos, com renncia a qualquer outro, por mais privilegiado que seja.</p>
          </div>
        </div>
        <div className="sticky bottom-0 bg-white px-6 py-3 border-t" style={{ borderColor: "rgba(133,108,66,0.1)" }}>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-lg text-sm font-medium text-white cursor-pointer"
            style={{ background: "linear-gradient(135deg, #165B36, #052413)", fontFamily: F }}
          >
            Entendi
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================
// Main Component
// ============================================
export function UserAuthPage() {
  const navigate = useNavigate();
  const { login, signup, user } = useUserAuth();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // PF/PJ fields
  const [personType, setPersonType] = useState<"pf" | "pj">("pf");
  const [docNumber, setDocNumber] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [cnpjLoading, setCnpjLoading] = useState(false);
  const [cnpjData, setCnpjData] = useState<any>(null);
  const [cnpjError, setCnpjError] = useState("");
  const [docCheckResult, setDocCheckResult] = useState<{ exists: boolean } | null>(null);
  const [docChecking, setDocChecking] = useState(false);
  const [emailCheckResult, setEmailCheckResult] = useState<{ exists: boolean } | null>(null);
  const [emailChecking, setEmailChecking] = useState(false);
  const [phoneCheckResult, setPhoneCheckResult] = useState<{ exists: boolean } | null>(null);
  const [phoneChecking, setPhoneChecking] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const emailDebounceRef = useRef<ReturnType<typeof setTimeout>>();
  const phoneDebounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Phone
  const [phone, setPhone] = useState("");

  // Address
  const [cep, setCep] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState("");

  // Terms and consents
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptNewsletter, setAcceptNewsletter] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  useEffect(() => {
    document.title = mode === "login" ? "Entrar - Epoca Editora de Livros" : "Cadastro - Epoca Editora de Livros";
    return () => { document.title = "Epoca Editora de Livros - Historias que transformam"; };
  }, [mode]);

  useEffect(() => {
    if (user) navigate("/minha-conta");
  }, [user, navigate]);

  // Reset fields when switching mode
  useEffect(() => {
    setDocNumber(""); setCompanyName(""); setCnpjData(null); setCnpjError("");
    setDocCheckResult(null); setPhone(""); setCep(""); setStreet(""); setNumber("");
    setComplement(""); setNeighborhood(""); setCity(""); setState("");
    setCepError(""); setAcceptTerms(false); setAcceptNewsletter(false); setConfirmEmail(""); setConfirmPassword("");
    setEmailCheckResult(null); setPhoneCheckResult(null);
    setError("");
  }, [mode, personType]);

  // Auto-check document for duplicates (debounced)
  const checkDocumentDuplicate = useCallback(async (doc: string) => {
    const clean = doc.replace(/\D/g, "");
    if ((personType === "pf" && clean.length !== 11) || (personType === "pj" && clean.length !== 14)) {
      setDocCheckResult(null); return;
    }
    if (personType === "pf" && !validateCPF(clean)) { setDocCheckResult(null); return; }
    if (personType === "pj" && !validateCNPJ(clean)) { setDocCheckResult(null); return; }

    setDocChecking(true);
    try {
      const res = await fetch(`${BASE_URL}/user/check-document`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${publicAnonKey}` },
        body: JSON.stringify({ document: clean }),
      });
      const data = await res.json();
      setDocCheckResult(data);
    } catch { setDocCheckResult(null); }
    finally { setDocChecking(false); }
  }, [personType]);

  const checkEmailDuplicate = useCallback(async (emailVal: string) => {
    if (!validateEmail(emailVal)) { setEmailCheckResult(null); return; }
    setEmailChecking(true);
    try {
      const res = await fetch(`${BASE_URL}/user/check-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${publicAnonKey}` },
        body: JSON.stringify({ email: emailVal }),
      });
      const data = await res.json();
      setEmailCheckResult(data);
    } catch { setEmailCheckResult(null); }
    finally { setEmailChecking(false); }
  }, []);

  const checkPhoneDuplicate = useCallback(async (phoneVal: string) => {
    const clean = phoneVal.replace(/\D/g, "");
    if (clean.length < 10) { setPhoneCheckResult(null); return; }
    setPhoneChecking(true);
    try {
      const res = await fetch(`${BASE_URL}/user/check-phone`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${publicAnonKey}` },
        body: JSON.stringify({ phone: clean }),
      });
      const data = await res.json();
      setPhoneCheckResult(data);
    } catch { setPhoneCheckResult(null); }
    finally { setPhoneChecking(false); }
  }, []);

  const handleDocumentChange = useCallback((value: string) => {
    const formatted = personType === "pf" ? formatCPF(value) : formatCNPJ(value);
    setDocNumber(formatted); setCnpjData(null); setCnpjError(""); setDocCheckResult(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => checkDocumentDuplicate(formatted), 600);
  }, [personType, checkDocumentDuplicate]);

  // Validate CNPJ via Receita Federal
  const handleValidateCNPJ = useCallback(async () => {
    const clean = docNumber.replace(/\D/g, "");
    if (clean.length !== 14) { setCnpjError("CNPJ deve ter 14 digitos."); return; }
    if (!validateCNPJ(clean)) { setCnpjError("CNPJ invalido (digitos verificadores incorretos)."); return; }
    setCnpjLoading(true); setCnpjError(""); setCnpjData(null);
    try {
      const res = await fetch(`${BASE_URL}/user/validate-cnpj/${clean}`, { headers: { Authorization: `Bearer ${publicAnonKey}` } });
      const data = await res.json();
      if (!res.ok) { setCnpjError(data.error || "CNPJ nao encontrado."); return; }
      setCnpjData(data);
      if (data.razaoSocial) setCompanyName(data.razaoSocial);
      if (data.situacao && data.situacao !== "ATIVA") {
        setCnpjError(`Situacao cadastral: ${data.situacao}. Apenas CNPJs com situacao ATIVA sao aceitos.`);
      }
    } catch (e: any) { setCnpjError(e.message || "Erro ao consultar CNPJ."); }
    finally { setCnpjLoading(false); }
  }, [docNumber]);

  // CEP lookup
  const handleCepChange = useCallback(async (value: string) => {
    const formatted = formatCEP(value);
    setCep(formatted);
    setCepError("");
    const clean = formatted.replace(/\D/g, "");
    if (clean.length === 8) {
      setCepLoading(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
        const data = await res.json();
        if (data.erro) {
          setCepError("CEP nao encontrado. Verifique e tente novamente.");
        } else {
          setStreet(data.logradouro || "");
          setNeighborhood(data.bairro || "");
          setCity(data.localidade || "");
          setState(data.uf || "");
        }
      } catch {
        setCepError("Erro ao consultar CEP. Tente novamente.");
      } finally {
        setCepLoading(false);
      }
    }
  }, []);

  if (user) return null;

  const pwStrength = getPasswordStrength(password);
  const emailValid = email ? validateEmail(email) : true;
  const emailsMatch = !confirmEmail || email === confirmEmail;
  const passwordsMatch = !confirmPassword || password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        if (!email.trim()) { setError("Informe seu e-mail."); setLoading(false); return; }
        if (!password) { setError("Informe sua senha."); setLoading(false); return; }
        await login(email, password);
      } else {
        // Validations
        if (!name.trim()) { setError("Informe seu nome completo."); setLoading(false); return; }

        const cleanDoc = docNumber.replace(/\D/g, "");
        if (personType === "pf") {
          if (cleanDoc.length !== 11) { setError("CPF e obrigatorio (11 digitos)."); setLoading(false); return; }
          if (!validateCPF(cleanDoc)) { setError("CPF invalido. Verifique os digitos."); setLoading(false); return; }
        } else {
          if (cleanDoc.length !== 14) { setError("CNPJ e obrigatorio (14 digitos)."); setLoading(false); return; }
          if (!validateCNPJ(cleanDoc)) { setError("CNPJ invalido. Verifique os digitos."); setLoading(false); return; }
          if (!companyName.trim()) { setError("Razao social e obrigatoria para PJ."); setLoading(false); return; }
          if (cnpjData?.situacao && cnpjData.situacao !== "ATIVA") { setError("CNPJ com situacao inativa na Receita Federal."); setLoading(false); return; }
        }

        if (docCheckResult?.exists) {
          setError(`Ja existe uma conta com este ${personType === "pf" ? "CPF" : "CNPJ"}. Use "Entrar" ou recupere sua conta.`);
          setLoading(false); return;
        }

        if (!email.trim() || !validateEmail(email)) { setError("Informe um e-mail valido."); setLoading(false); return; }

        if (emailCheckResult?.exists) {
          setError("Este e-mail ja esta cadastrado. Faca login ou recupere sua senha em /recuperar-senha.");
          setLoading(false); return;
        }

        if (phoneCheckResult?.exists) {
          setError("Ja existe uma conta com este telefone. Faca login ou recupere sua senha.");
          setLoading(false); return;
        }
        if (email !== confirmEmail) { setError("Os e-mails nao coincidem. Verifique e tente novamente."); setLoading(false); return; }
        if (password.length < 8) { setError("A senha deve ter no minimo 8 caracteres."); setLoading(false); return; }
        if (password !== confirmPassword) { setError("As senhas nao coincidem. Verifique e tente novamente."); setLoading(false); return; }
        if (pwStrength.score < 2) { setError("Sua senha e muito fraca. Use letras maiusculas, minusculas, numeros e simbolos."); setLoading(false); return; }

        const cleanPhone = phone.replace(/\D/g, "");
        if (cleanPhone.length < 10) { setError("Telefone e obrigatorio (DDD + numero)."); setLoading(false); return; }

        const cleanCep = cep.replace(/\D/g, "");
        if (cleanCep.length !== 8) { setError("CEP e obrigatorio (8 digitos)."); setLoading(false); return; }
        if (!street.trim() || !city.trim() || !state.trim()) { setError("Endereco incompleto. Preencha rua, cidade e estado."); setLoading(false); return; }
        if (!number.trim()) { setError("Numero do endereco e obrigatorio."); setLoading(false); return; }

        if (!acceptTerms) { setError("Voce precisa aceitar os Termos de Uso para criar sua conta."); setLoading(false); return; }

        await signup(email, password, name, {
          documentType: personType === "pf" ? "cpf" : "cnpj",
          document: cleanDoc,
          companyName: personType === "pj" ? companyName.trim() : undefined,
          phone: cleanPhone,
          address: { cep: cleanCep, street: street.trim(), number: number.trim(), complement: complement.trim(), neighborhood: neighborhood.trim(), city: city.trim(), state: state.trim() },
        });
      }
      navigate("/minha-conta");
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="pt-8 pb-10 relative" style={{ background: "linear-gradient(135deg, #052413 0%, #165B36 60%, #052413 100%)" }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 right-1/4 w-72 h-72 rounded-full opacity-[0.07]" style={{ background: "radial-gradient(circle, #EBBF74, transparent)" }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 w-full">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white/80 transition-colors mb-6" style={{ fontFamily: F }}>
            <ArrowLeft className="w-4 h-4" /> Voltar ao site
          </Link>
          <Link to="/" className="block mb-5">
            <img src="/assets/logo.png" alt="Época Editora" className="h-10 brightness-0 invert" />
          </Link>
          <h1 className="text-3xl md:text-4xl text-white" style={{ fontFamily: PF, lineHeight: 1.2 }}>
            {mode === "login" ? "Bem-vindo " : "Crie sua "}
            <span className="italic text-[#EBBF74]">{mode === "login" ? "de volta" : "conta"}</span>
          </h1>
          <p className="text-white/50 mt-2 text-sm" style={{ fontFamily: F }}>
            {mode === "login" ? "Entre na sua conta para acompanhar seus projetos." : "Cadastre-se como pessoa fisica ou juridica para solicitar servicos editoriais."}
          </p>
        </div>
      </div>

      {/* Form card */}
      <div className={`mx-auto px-6 py-10 ${mode === "signup" ? "max-w-xl" : "max-w-md"}`}>
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-2xl p-6 md:p-8 shadow-lg border"
          style={{ backgroundColor: "#FFFDF8", borderColor: "rgba(133,108,66,0.15)" }}
        >
          {/* Tab switcher */}
          <div className="flex rounded-lg p-1 mb-6" style={{ backgroundColor: "#F0E8D4" }}>
            {([
              { key: "login", label: "Entrar", icon: LogIn },
              { key: "signup", label: "Cadastrar", icon: UserPlus },
            ] as const).map((tab) => (
              <button
                key={tab.key}
                onClick={() => { setMode(tab.key); setError(""); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm transition-all duration-300 cursor-pointer ${mode === tab.key ? "text-[#052413] shadow-sm" : "text-[#856C42] hover:text-[#052413]"}`}
                style={{ fontFamily: F, backgroundColor: mode === tab.key ? "#FFFDF8" : "transparent" }}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-3 rounded-lg text-sm overflow-hidden"
                style={{ backgroundColor: "rgba(212, 24, 61, 0.08)", color: "#d4183d", fontFamily: F }}
              >
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {mode === "signup" && (
                <motion.div
                  key="signup-fields"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  {/* PF/PJ Toggle */}
                  <div>
                    <label className={labelClasses} style={{ fontFamily: F }}>Tipo de conta</label>
                    <div className="flex rounded-lg p-1" style={{ backgroundColor: "#F0E8D4" }}>
                      <button type="button" onClick={() => setPersonType("pf")} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm transition-all duration-300 cursor-pointer ${personType === "pf" ? "text-[#052413] shadow-sm" : "text-[#856C42] hover:text-[#052413]"}`} style={{ fontFamily: F, backgroundColor: personType === "pf" ? "#FFFDF8" : "transparent" }}>
                        <User className="w-4 h-4" /> Pessoa Fisica
                      </button>
                      <button type="button" onClick={() => setPersonType("pj")} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm transition-all duration-300 cursor-pointer ${personType === "pj" ? "text-[#052413] shadow-sm" : "text-[#856C42] hover:text-[#052413]"}`} style={{ fontFamily: F, backgroundColor: personType === "pj" ? "#FFFDF8" : "transparent" }}>
                        <Building2 className="w-4 h-4" /> Pessoa Juridica
                      </button>
                    </div>
                  </div>

                  {/* Name */}
                  <div>
                    <label className={labelClasses} style={{ fontFamily: F }}>{personType === "pf" ? "Nome completo *" : "Nome do responsavel *"}</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={personType === "pf" ? "Seu nome completo" : "Nome do responsavel legal"} className={inputClasses} style={inputStyle} />
                  </div>

                  {/* CPF / CNPJ */}
                  <div>
                    <label className={labelClasses} style={{ fontFamily: F }}>{personType === "pf" ? "CPF *" : "CNPJ *"}</label>
                    <div className="relative">
                      <input type="text" value={docNumber} onChange={(e) => handleDocumentChange(e.target.value)} placeholder={personType === "pf" ? "000.000.000-00" : "00.000.000/0000-00"} className={inputClasses + " pr-12"} style={inputStyle} maxLength={personType === "pf" ? 14 : 18} />
                      {docChecking && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#856C42] animate-spin" />}
                      {!docChecking && docCheckResult?.exists === false && docNumber.replace(/\D/g, "").length >= 11 && (
                        <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                      )}
                    </div>
                    {docCheckResult?.exists && (
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mt-2 p-2.5 rounded-lg text-xs flex items-start gap-2" style={{ backgroundColor: "rgba(217,119,6,0.08)", border: "1px solid rgba(217,119,6,0.15)", fontFamily: F }}>
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="text-amber-800">
                          <p className="font-medium">Documento ja cadastrado</p>
                          <p className="mt-0.5">Ja existe uma conta com este {personType === "pf" ? "CPF" : "CNPJ"}. <button type="button" onClick={() => { setMode("login"); setError(""); }} className="text-[#165B36] font-semibold underline cursor-pointer">Faca login</button> ou recupere sua conta.</p>
                        </div>
                      </motion.div>
                    )}
                    {personType === "pf" && docNumber.replace(/\D/g, "").length === 11 && !validateCPF(docNumber) && (
                      <p className="text-xs text-red-500 mt-1" style={{ fontFamily: F }}>CPF invalido (digitos verificadores incorretos).</p>
                    )}
                  </div>

                  {/* PJ: CNPJ Validation + Company Name */}
                  {personType === "pj" && (
                    <>
                      {docNumber.replace(/\D/g, "").length === 14 && !cnpjData && (
                        <div className="space-y-1.5">
                          <p className="text-[0.65rem] text-[#856C42]/70 leading-relaxed" style={{ fontFamily: F }}>
                            Ao consultar, seu CNPJ sera enviado a API publica da Receita Federal (ReceitaWS) para validacao. Nenhum dado e armazenado por terceiros.
                          </p>
                          <button type="button" onClick={handleValidateCNPJ} disabled={cnpjLoading} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer disabled:opacity-50" style={{ fontFamily: F, backgroundColor: "rgba(22,91,54,0.08)", color: "#165B36", border: "1px solid rgba(22,91,54,0.15)" }}>
                            {cnpjLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                            Consultar CNPJ na Receita Federal
                          </button>
                        </div>
                      )}
                      {cnpjError && <p className="text-xs text-red-500" style={{ fontFamily: F }}>{cnpjError}</p>}
                      {cnpjData && (
                        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="p-3 rounded-xl space-y-2" style={{ backgroundColor: "rgba(22,91,54,0.04)", border: "1px solid rgba(22,91,54,0.12)" }}>
                          <div className="flex items-center gap-2 mb-1.5">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-xs font-semibold text-green-700" style={{ fontFamily: F }}>CNPJ validado na Receita Federal</span>
                          </div>
                          <div className="grid grid-cols-1 gap-1.5 text-xs" style={{ fontFamily: F }}>
                            <div><span className="text-gray-400">Razao social:</span> <span className="text-[#052413] font-medium">{cnpjData.razaoSocial}</span></div>
                            {cnpjData.nomeFantasia && <div><span className="text-gray-400">Fantasia:</span> <span className="text-[#052413]">{cnpjData.nomeFantasia}</span></div>}
                            <div><span className="text-gray-400">Situacao:</span> <span className={`font-medium ${cnpjData.situacao === "ATIVA" ? "text-green-600" : "text-red-500"}`}>{cnpjData.situacao}</span></div>
                          </div>
                        </motion.div>
                      )}
                      <div>
                        <label className={labelClasses} style={{ fontFamily: F }}>Razao social *</label>
                        <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Razao social da empresa" className={inputClasses} style={inputStyle} />
                      </div>
                    </>
                  )}

                  {/* Phone */}
                  <div>
                    <label className={labelClasses} style={{ fontFamily: F }}>
                      <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-[#856C42]/60" /> Telefone / WhatsApp *</span>
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => {
                          const formatted = formatPhone(e.target.value);
                          setPhone(formatted);
                          setPhoneCheckResult(null);
                          if (phoneDebounceRef.current) clearTimeout(phoneDebounceRef.current);
                          phoneDebounceRef.current = setTimeout(() => checkPhoneDuplicate(formatted), 700);
                        }}
                        placeholder="(00) 00000-0000"
                        className={inputClasses + " pr-10"}
                        style={inputStyle}
                        maxLength={15}
                      />
                      {phoneChecking && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#856C42] animate-spin" />}
                      {!phoneChecking && phoneCheckResult?.exists === false && phone.replace(/\D/g, "").length >= 10 && (
                        <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                      )}
                    </div>
                    {phoneCheckResult?.exists && (
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mt-2 p-2.5 rounded-lg text-xs flex items-start gap-2" style={{ backgroundColor: "rgba(217,119,6,0.08)", border: "1px solid rgba(217,119,6,0.15)", fontFamily: F }}>
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="text-amber-800">
                          <p className="font-medium">Telefone ja cadastrado</p>
                          <p className="mt-0.5">
                            Ja existe uma conta com este telefone.{" "}
                            <button type="button" onClick={() => { setMode("login"); setError(""); }} className="text-[#165B36] font-semibold underline cursor-pointer">Faca login</button>
                            {" "}ou{" "}
                            <Link to="/recuperar-senha" className="text-[#165B36] font-semibold underline">recupere sua senha</Link>.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Address Section */}
                  <div className="pt-2 border-t" style={{ borderColor: "rgba(133,108,66,0.1)" }}>
                    <label className={labelClasses} style={{ fontFamily: F }}>
                      <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-[#856C42]/60" /> Endereco para recebimento *</span>
                    </label>
                    <p className="text-[0.65rem] text-[#856C42]/50 mb-3 -mt-0.5" style={{ fontFamily: F }}>
                      Utilizado para envio de livros impressos. Voce podera alterar depois.
                    </p>

                    {/* CEP */}
                    <div className="relative mb-3">
                      <input type="text" value={cep} onChange={(e) => handleCepChange(e.target.value)} placeholder="00000-000" className={inputClasses + " pr-12"} style={inputStyle} maxLength={9} />
                      {cepLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#856C42] animate-spin" />}
                      {!cepLoading && city && cep.replace(/\D/g, "").length === 8 && (
                        <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                      )}
                    </div>
                    {cepError && <p className="text-xs text-red-500 mb-2" style={{ fontFamily: F }}>{cepError}</p>}

                    {/* Street + Number */}
                    <div className="grid grid-cols-[1fr_100px] gap-2 mb-2">
                      <input type="text" value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Rua / Avenida" className={inputClasses} style={inputStyle} />
                      <input type="text" value={number} onChange={(e) => setNumber(e.target.value)} placeholder="Numero" className={inputClasses} style={inputStyle} />
                    </div>

                    {/* Complement + Neighborhood */}
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <input type="text" value={complement} onChange={(e) => setComplement(e.target.value)} placeholder="Complemento" className={inputClasses} style={inputStyle} />
                      <input type="text" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="Bairro" className={inputClasses} style={inputStyle} />
                    </div>

                    {/* City + State */}
                    <div className="grid grid-cols-[1fr_80px] gap-2">
                      <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Cidade" className={inputClasses} style={inputStyle} />
                      <input type="text" value={state} onChange={(e) => setState(e.target.value.toUpperCase().slice(0, 2))} placeholder="UF" className={inputClasses} style={inputStyle} maxLength={2} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email */}
            <div>
              <label className={labelClasses} style={{ fontFamily: F }}>E-mail *</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (mode === "signup") {
                      setEmailCheckResult(null);
                      if (emailDebounceRef.current) clearTimeout(emailDebounceRef.current);
                      emailDebounceRef.current = setTimeout(() => checkEmailDuplicate(e.target.value), 700);
                    }
                  }}
                  placeholder="seu@email.com"
                  required
                  className={inputClasses + " pr-10"}
                  style={{ ...inputStyle, borderColor: email && !emailValid ? "rgba(212,24,61,0.4)" : inputStyle.borderColor }}
                />
                {mode === "signup" && emailChecking && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#856C42] animate-spin" />}
                {mode === "signup" && !emailChecking && emailCheckResult?.exists === false && emailValid && email && (
                  <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                )}
              </div>
              {email && !emailValid && (
                <p className="text-xs text-red-500 mt-1" style={{ fontFamily: F }}>Formato de e-mail invalido.</p>
              )}
              {mode === "signup" && emailCheckResult?.exists && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mt-2 p-2.5 rounded-lg text-xs flex items-start gap-2" style={{ backgroundColor: "rgba(217,119,6,0.08)", border: "1px solid rgba(217,119,6,0.15)", fontFamily: F }}>
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-amber-800">
                    <p className="font-medium">E-mail ja cadastrado</p>
                    <p className="mt-0.5">
                      Ja existe uma conta com este e-mail.{" "}
                      <button type="button" onClick={() => { setMode("login"); setError(""); }} className="text-[#165B36] font-semibold underline cursor-pointer">Faca login</button>
                      {" "}ou{" "}
                      <Link to="/recuperar-senha" className="text-[#165B36] font-semibold underline">recupere sua senha</Link>.
                    </p>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Confirm Email (signup only) */}
            {mode === "signup" && (
              <div>
                <label className={labelClasses} style={{ fontFamily: F }}>Confirmar e-mail *</label>
                <input
                  type="email"
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
                  placeholder="Repita seu e-mail"
                  className={inputClasses}
                  style={{ ...inputStyle, borderColor: confirmEmail && !emailsMatch ? "rgba(212,24,61,0.4)" : inputStyle.borderColor }}
                />
                {confirmEmail && !emailsMatch && (
                  <p className="text-xs text-red-500 mt-1" style={{ fontFamily: F }}>Os e-mails nao coincidem.</p>
                )}
              </div>
            )}

            {/* Password */}
            <div>
              <label className={labelClasses} style={{ fontFamily: F }}>Senha *</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "signup" ? "Minimo 8 caracteres" : "--------"}
                  required
                  minLength={mode === "signup" ? 8 : 1}
                  className={inputClasses + " pr-12"}
                  style={inputStyle}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#856C42] hover:text-[#052413] transition-colors cursor-pointer">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Password strength indicator (signup only) */}
              {mode === "signup" && password.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300" style={{ backgroundColor: i <= pwStrength.score ? pwStrength.color : "rgba(133,108,66,0.15)" }} />
                    ))}
                  </div>
                  <p className="text-[0.65rem] font-medium" style={{ fontFamily: F, color: pwStrength.color }}>
                    Forca: {pwStrength.label}
                    {pwStrength.score < 3 && <span className="text-[#856C42]/50 font-normal"> — Use maiusculas, numeros e simbolos</span>}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password (signup only) */}
            {mode === "signup" && (
              <div>
                <label className={labelClasses} style={{ fontFamily: F }}>Confirmar senha *</label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita sua senha"
                  className={inputClasses}
                  style={{ ...inputStyle, borderColor: confirmPassword && !passwordsMatch ? "rgba(212,24,61,0.4)" : inputStyle.borderColor }}
                />
                {confirmPassword && !passwordsMatch && (
                  <p className="text-xs text-red-500 mt-1" style={{ fontFamily: F }}>As senhas nao coincidem.</p>
                )}
              </div>
            )}

            {/* Terms acceptance (signup only) */}
            {mode === "signup" && (
              <div className="space-y-2.5 pt-2">
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#165B36] mt-0.5 flex-shrink-0"
                    id="accept-terms"
                  />
                  <label htmlFor="accept-terms" className="text-xs text-[#052413] cursor-pointer leading-relaxed" style={{ fontFamily: F }}>
                    Li e aceito os{" "}
                    <button type="button" onClick={() => setShowTerms(true)} className="text-[#165B36] font-semibold underline underline-offset-2 hover:text-[#0a7c3e] cursor-pointer">
                      Termos de Uso
                    </button>{" "}
                    e a{" "}
                    <Link to="/privacidade" target="_blank" className="text-[#165B36] font-semibold underline underline-offset-2 hover:text-[#0a7c3e]">
                      Politica de Privacidade
                    </Link>{" "}
                    da Epoca Editora de Livros. *
                  </label>
                </div>
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={acceptNewsletter}
                    onChange={(e) => setAcceptNewsletter(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#165B36] mt-0.5 flex-shrink-0"
                    id="accept-newsletter"
                  />
                  <label htmlFor="accept-newsletter" className="text-xs text-[#052413]/70 cursor-pointer leading-relaxed" style={{ fontFamily: F }}>
                    Desejo receber novidades, lancamentos e promocoes da Epoca Editora por e-mail. (opcional)
                  </label>
                </div>
              </div>
            )}

            <GoldButton type="submit" className="w-full py-3.5 mt-2" disabled={loading || (mode === "signup" && (!!docCheckResult?.exists || !!emailCheckResult?.exists || !!phoneCheckResult?.exists || !acceptTerms))}>
              {loading ? (
                <div className="w-5 h-5 border-2 border-[#1a1206]/30 border-t-[#1a1206] rounded-full animate-spin" />
              ) : mode === "login" ? (
                <><LogIn className="w-4 h-4" /> Entrar</>
              ) : (
                <><Shield className="w-4 h-4" /> Criar conta</>
              )}
            </GoldButton>
          </form>

          {/* Switch mode text */}
          <p className="text-center text-sm text-[#856C42] mt-5" style={{ fontFamily: F }}>
            {mode === "login" ? "Ainda nao tem conta? " : "Ja tem uma conta? "}
            <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }} className="text-[#165B36] font-medium hover:underline cursor-pointer">
              {mode === "login" ? "Cadastre-se" : "Entrar"}
            </button>
          </p>

          {mode === "login" && (
            <p className="text-center text-xs text-[#856C42]/60 mt-3" style={{ fontFamily: F }}>
              Esqueceu a senha?{" "}
              <Link to="/recuperar-senha" className="text-[#165B36] font-medium hover:underline">
                Recuperar acesso
              </Link>
            </p>
          )}
        </motion.div>
      </div>

      {/* Terms Modal */}
      <AnimatePresence>
        {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}
      </AnimatePresence>
    </div>
  );
}
