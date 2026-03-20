import { GoldButton } from "./GoldButton";
import { RevealOnScroll } from "./RevealOnScroll";
import { Link } from "react-router";
import { Lock } from "lucide-react";
import footerLogoImg from "figma:asset/36074aebf24684a213a02f0250350012b7c049a7.png";

export function Footer() {
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
                style={{ fontFamily: "Inter, sans-serif", lineHeight: 1.7 }}
              >
                Publicando histórias que transformam vidas desde 1987.
              </p>
            </div>

            {/* Links - Editora */}
            <div>
              <h4
                className="text-white mb-4 text-[0.875rem] tracking-[0.15em] uppercase"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Editora
              </h4>
              <ul
                className="space-y-2.5"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                {[
                  { label: "Sobre nós", href: "/#sobre" },
                  { label: "Equipe", href: "#" },
                  { label: "Carreiras", href: "#" },
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
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Publicações
              </h4>
              <ul
                className="space-y-2.5"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                {[
                  { label: "Catálogo", href: "/catalogo" },
                  { label: "Lançamentos", href: "#" },
                  { label: "Mais vendidos", href: "#" },
                  { label: "Autores", href: "/#autores" },
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
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Newsletter
              </h4>
              <p
                className="text-[0.875rem] mb-4"
                style={{ fontFamily: "Inter, sans-serif", lineHeight: 1.6 }}
              >
                Receba novidades e lançamentos diretamente no seu email.
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Seu email"
                  className="flex-1 min-w-0 px-4 py-2.5 rounded-lg bg-white/10 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#EBBF74]/40 focus:border-[#EBBF74]/30 text-[0.875rem] transition-all duration-300"
                  style={{ fontFamily: "Inter, sans-serif" }}
                />
                <GoldButton className="px-4 py-2.5 text-[0.875rem] shrink-0">
                  Assinar
                </GoldButton>
              </div>
            </div>
          </div>

          {/* Divider & copyright */}
          <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <p
              className="text-[0.8rem] text-center md:text-left"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              &copy; 2026 Época Editora de Livros. Todos os direitos reservados.
            </p>
            <div
              className="flex items-center gap-6"
              style={{ fontFamily: "Inter, sans-serif" }}
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