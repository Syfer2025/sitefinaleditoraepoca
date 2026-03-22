import { useState, useEffect } from "react";
import { GoldButton } from "./GoldButton";
import { RevealOnScroll } from "./RevealOnScroll";
import { Link } from "react-router";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import footerLogoFallback from "/assets/36074aebf24684a213a02f0250350012b7c049a7.png";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { getLogos } from "../data/api";

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-e413165d`;

export function Footer() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [consentNewsletter, setConsentNewsletter] = useState(false);
  const [footerLogoImg, setFooterLogoImg] = useState<string>(footerLogoFallback);

  useEffect(() => {
    getLogos().then((logos) => { if (logos.logo_footer) setFooterLogoImg(logos.logo_footer); });
  }, []);

  async function handleNewsletter() {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Informe um e-mail válido.");
      return;
    }
    if (!consentNewsletter) {
      toast.error("Marque o consentimento para receber a newsletter.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/newsletter`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${publicAnonKey}` },
        body: JSON.stringify({ email, consent: true }),
      });
      if (!res.ok) throw new Error();
      setSubscribed(true);
      setEmail("");
    } catch {
      toast.error("Erro ao se inscrever. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <footer className="bg-[#052413] text-white/70 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <RevealOnScroll direction="up" amount={0.1}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 mb-8">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="mb-4">
                <Link to="/">
                  <img
                    src={footerLogoImg}
                    alt="Época Editora"
                    className="h-8"
                  />
                </Link>
              </div>
              <p
                className="text-[0.875rem]"
                style={{ lineHeight: 1.7 }}
              >
                Publicando histórias que transformam vidas desde 1987.
              </p>
            </div>

            {/* Links - Editora */}
            <div>
              <h4
                className="text-white mb-4 text-[0.875rem] tracking-[0.15em] uppercase"
              >
                Editora
              </h4>
              <ul
                className="space-y-2.5"
              >
                {[
                  { label: "Sobre nós", href: "/#sobre" },
                  { label: "Autores", href: "/#autores" },
                  { label: "Planos", href: "/#planos" },
                  { label: "Contato", href: "/#contato" },
                ].map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-[0.875rem] hover:text-[#EBBF74] transition-colors duration-300 hover:pl-1"
                      style={{ transitionProperty: "color, padding-left" }}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Links - Publicações */}
            <div>
              <h4
                className="text-white mb-4 text-[0.875rem] tracking-[0.15em] uppercase"
              >
                Publicações
              </h4>
              <ul
                className="space-y-2.5"
              >
                {[
                  { label: "Catálogo", href: "/catalogo" },
                  { label: "Lançamentos", href: "/catalogo" },
                  { label: "Mais vendidos", href: "/catalogo" },
                  { label: "Depoimentos", href: "/#depoimentos" },
                ].map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-[0.875rem] hover:text-[#EBBF74] transition-colors duration-300 hover:pl-1"
                      style={{ transitionProperty: "color, padding-left" }}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Newsletter */}
            <div className="sm:col-span-2 lg:col-span-1">
              <h4
                className="text-white mb-4 text-[0.875rem] tracking-[0.15em] uppercase"
              >
                Newsletter
              </h4>
              <p
                className="text-[0.875rem] mb-4"
                style={{ lineHeight: 1.6 }}
              >
                Receba novidades e lançamentos diretamente no seu email.
              </p>
              {subscribed ? (
                <div className="space-y-1">
                  <p className="text-[0.875rem] text-[#EBBF74]">
                    ✓ Quase lá! Confirme em sua caixa de entrada.
                  </p>
                  <p className="text-[0.75rem] text-white/40">
                    Enviamos um e-mail de confirmação. Verifique sua caixa de entrada (e o spam).
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder="Seu email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleNewsletter()}
                      disabled={loading}
                      className="flex-1 min-w-0 px-4 py-2.5 rounded-lg bg-white/10 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#EBBF74]/40 focus:border-[#EBBF74]/30 text-[0.875rem] transition-all duration-300 disabled:opacity-50"
                    />
                    <GoldButton
                      className="px-4 py-2.5 text-[0.875rem] shrink-0 disabled:opacity-50"
                      onClick={handleNewsletter}
                      disabled={loading || !consentNewsletter}
                    >
                      {loading ? "..." : "Assinar"}
                    </GoldButton>
                  </div>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consentNewsletter}
                      onChange={(e) => setConsentNewsletter(e.target.checked)}
                      className="w-3.5 h-3.5 rounded accent-[#EBBF74] mt-0.5 flex-shrink-0"
                    />
                    <span className="text-[0.7rem] text-white/40 leading-relaxed">
                      Concordo em receber comunicações da Época Editora por e-mail e posso cancelar a qualquer momento.
                    </span>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Divider & copyright */}
          <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left space-y-1">
              <p
                className="text-[0.8rem]"
              >
                &copy; {new Date().getFullYear()} Época Editora de Livros. Todos os direitos reservados.
              </p>
              <p className="text-[0.7rem] text-white/30">
                Encarregado de dados (DPO):{" "}
                <a href="mailto:privacidade@epocaeditora.com.br" className="hover:text-[#EBBF74] transition-colors">
                  privacidade@epocaeditora.com.br
                </a>
              </p>
            </div>
            <div
              className="flex items-center gap-6"
            >
              {[
                { label: "Privacidade", href: "/privacidade" },
                { label: "Termos", href: "/termos" },
              ].map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  className="text-[0.8rem] hover:text-[#EBBF74] transition-colors duration-300"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                to="/admin"
                className="flex items-center gap-1 text-[0.7rem] text-white/20 hover:text-white/50 transition-colors duration-300"
                title="Painel Administrativo"
              >
                <Lock className="w-3 h-3" />
                Admin
              </Link>
            </div>
          </div>
        </RevealOnScroll>
      </div>
    </footer>
  );
}