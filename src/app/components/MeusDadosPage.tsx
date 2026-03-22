import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { ArrowLeft, Shield, CheckCircle, Loader2 } from "lucide-react";
import { GoldButton } from "./GoldButton";
import { submitDataRightsRequest } from "../data/api";
import { toast } from "sonner";


const REQUEST_TYPES = [
  { value: "acesso", label: "Acesso aos meus dados", desc: "Quero saber quais dados pessoais vocês possuem sobre mim." },
  { value: "correcao", label: "Correção de dados", desc: "Quero corrigir dados incompletos, inexatos ou desatualizados." },
  { value: "exclusao", label: "Exclusão de dados", desc: "Quero solicitar a eliminação dos meus dados pessoais." },
  { value: "portabilidade", label: "Portabilidade", desc: "Quero receber meus dados em formato estruturado para transferência." },
  { value: "revogacao", label: "Revogação de consentimento", desc: "Quero revogar o consentimento dado para uso dos meus dados." },
  { value: "informacao", label: "Informação sobre compartilhamento", desc: "Quero saber com quais entidades meus dados foram compartilhados." },
];

export function MeusDadosPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [requestType, setRequestType] = useState("acesso");
  const [details, setDetails] = useState("");
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    document.title = "Meus Dados — Época Editora de Livros";
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error("Preencha nome e e-mail.");
      return;
    }
    setSending(true);
    try {
      await submitDataRightsRequest({ name: name.trim(), email: email.trim(), requestType, details: details.trim() });
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err?.message || "Erro ao enviar solicitação. Tente novamente.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16 px-4 md:px-6" style={{ backgroundColor: "#FFFDF8" }}>
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-sm text-[#856C42] hover:text-[#165B36] transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #165B36, #052413)" }}>
              <Shield className="w-5 h-5 text-[#EBBF74]" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold text-[#052413] font-serif">
                Meus Dados
              </h1>
              <p className="text-xs text-[#856C42]">Privacidade e dados pessoais</p>
            </div>
          </div>

          <p className="text-sm text-[#052413]/70 mb-8 leading-relaxed">
            Você pode solicitar acesso, correção, exclusão ou portabilidade dos seus dados pessoais,
            bem como revogar consentimentos dados anteriormente. Responderemos em até <strong>15 dias úteis</strong>.
          </p>

          {submitted ? (
            <div
              className="rounded-2xl p-8 text-center"
              style={{ backgroundColor: "rgba(22,91,54,0.04)", border: "1px solid rgba(22,91,54,0.12)" }}
            >
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "rgba(22,91,54,0.1)" }}>
                <CheckCircle className="w-7 h-7 text-[#165B36]" />
              </div>
              <h2 className="text-xl font-semibold text-[#052413] mb-2 font-serif">
                Solicitação enviada!
              </h2>
              <p className="text-sm text-[#052413]/70 leading-relaxed">
                Recebemos sua solicitação e entraremos em contato pelo e-mail informado em até{" "}
                <strong>15 dias úteis</strong>. Você também pode contatar nosso DPO diretamente
                em{" "}
                <a href="mailto:privacidade@epocaeditora.com.br" className="text-[#165B36] hover:underline">
                  privacidade@epocaeditora.com.br
                </a>
                .
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl p-6 space-y-5 shadow-sm"
              style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(133,108,66,0.12)" }}
            >
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#052413] mb-1.5">
                    Nome completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    required
                    className="w-full px-3.5 py-2.5 rounded-lg text-sm text-[#052413] placeholder:text-[#856C42]/40 focus:outline-none focus:ring-2 transition-all"
                    style={{ backgroundColor: "#FFFDF8", border: "1px solid rgba(133,108,66,0.2)", focusRingColor: "rgba(22,91,54,0.3)" }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#052413] mb-1.5">
                    E-mail <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                    className="w-full px-3.5 py-2.5 rounded-lg text-sm text-[#052413] placeholder:text-[#856C42]/40 focus:outline-none focus:ring-2 transition-all"
                    style={{ backgroundColor: "#FFFDF8", border: "1px solid rgba(133,108,66,0.2)" }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#052413] mb-2">
                  Tipo de solicitação <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {REQUEST_TYPES.map((rt) => (
                    <label
                      key={rt.value}
                      className="flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors"
                      style={{
                        backgroundColor: requestType === rt.value ? "rgba(22,91,54,0.06)" : "rgba(133,108,66,0.03)",
                        border: `1px solid ${requestType === rt.value ? "rgba(22,91,54,0.2)" : "rgba(133,108,66,0.1)"}`,
                      }}
                    >
                      <input
                        type="radio"
                        name="requestType"
                        value={rt.value}
                        checked={requestType === rt.value}
                        onChange={() => setRequestType(rt.value)}
                        className="mt-0.5 accent-[#165B36]"
                      />
                      <div>
                        <p className="text-sm font-medium text-[#052413]">{rt.label}</p>
                        <p className="text-xs text-[#856C42]/80 mt-0.5">{rt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#052413] mb-1.5">
                  Detalhes adicionais (opcional)
                </label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={3}
                  placeholder="Descreva sua solicitação com mais detalhes, se necessário..."
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm text-[#052413] placeholder:text-[#856C42]/40 focus:outline-none focus:ring-2 transition-all resize-none"
                  style={{ backgroundColor: "#FFFDF8", border: "1px solid rgba(133,108,66,0.2)" }}
                />
              </div>

              <div
                className="flex items-start gap-2 p-3 rounded-lg text-xs leading-relaxed"
                style={{ backgroundColor: "rgba(22,91,54,0.04)", border: "1px solid rgba(22,91,54,0.08)" }}
              >
                <Shield className="w-3.5 h-3.5 text-[#165B36] flex-shrink-0 mt-0.5" />
                <span className="text-[#052413]/70">
                  Sua solicitação será tratada de forma confidencial e respondida em até 15 dias úteis.
                </span>
              </div>

              <GoldButton type="submit" className="w-full py-3" disabled={sending}>
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {sending ? "Enviando..." : "Enviar solicitação"}
              </GoldButton>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
