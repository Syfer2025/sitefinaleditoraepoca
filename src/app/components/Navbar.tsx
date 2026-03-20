import { useState, useEffect } from "react";
import { Menu, X, LogIn } from "lucide-react";
import { Link } from "react-router";
import logoImg from "figma:asset/866134e81312444c262030ef8ad8f59cefad5b17.png";
import { useUserAuth } from "./UserAuthContext";

const navLinks = [
  { label: "Início", href: "#hero", sectionId: "hero" },
  { label: "Sobre", href: "#sobre", sectionId: "sobre" },
  { label: "Catálogo", href: "#catalogo", sectionId: "catalogo" },
  { label: "Autores", href: "#autores", sectionId: "autores" },
  { label: "Planos", href: "#planos", sectionId: "planos" },
  { label: "FAQ", href: "#faq", sectionId: "faq" },
  { label: "Contato", href: "#contato", sectionId: "contato" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");
  const { user } = useUserAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Active section detection via IntersectionObserver
  useEffect(() => {
    const sectionIds = navLinks.map((l) => l.sectionId);
    const observers: IntersectionObserver[] = [];

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveSection(id);
          }
        },
        { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
      );

      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={{
        backgroundColor: scrolled
          ? "rgba(247, 244, 238, 0.95)"
          : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled
          ? "1px solid rgba(133, 108, 66, 0.15)"
          : "1px solid transparent",
        boxShadow: scrolled ? "0 1px 20px rgba(5, 36, 19, 0.06)" : "none",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <a href="#hero" className="flex items-center">
          <img
            src={logoImg}
            alt="Época Editora"
            className="h-10 transition-all duration-300"
            style={{
              filter: scrolled ? "none" : "brightness(10) saturate(0)",
            }}
          />
        </a>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive = activeSection === link.sectionId;
            return (
              <a
                key={link.href}
                href={link.href}
                className="relative py-1 transition-colors duration-300 group"
                style={{
                  fontFamily: "Inter, sans-serif",
                  color: isActive
                    ? scrolled
                      ? "#165B36"
                      : "#EBBF74"
                    : scrolled
                      ? "#856C42"
                      : "rgba(255,255,255,0.75)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = scrolled
                    ? "#165B36"
                    : "#EBBF74";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = scrolled
                      ? "#856C42"
                      : "rgba(255,255,255,0.75)";
                  } else {
                    e.currentTarget.style.color = scrolled
                      ? "#165B36"
                      : "#EBBF74";
                  }
                }}
              >
                {link.label}
                <span
                  className="absolute bottom-0 left-0 h-[1.5px] transition-all duration-300"
                  style={{
                    backgroundColor: scrolled ? "#165B36" : "#EBBF74",
                    width: isActive ? "100%" : "0%",
                  }}
                />
              </a>
            );
          })}

          {/* User auth button */}
          {user ? (
            <Link
              to="/minha-conta"
              className="flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 hover:scale-105"
              style={{
                background: scrolled
                  ? "linear-gradient(135deg, #165B36, #052413)"
                  : "rgba(255,255,255,0.12)",
                border: scrolled
                  ? "none"
                  : "1px solid rgba(255,255,255,0.15)",
              }}
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[0.6rem] font-semibold"
                style={{
                  background: "linear-gradient(135deg, #EBBF74, #D4AF5A)",
                  color: "#052413",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                {user.name?.[0]?.toUpperCase() || user.email[0]?.toUpperCase()}
              </div>
              <span
                className="text-sm max-w-[80px] truncate"
                style={{
                  fontFamily: "Inter, sans-serif",
                  color: scrolled ? "#EBBF74" : "rgba(255,255,255,0.9)",
                }}
              >
                {user.name?.split(" ")[0] || "Conta"}
              </span>
            </Link>
          ) : (
            <Link
              to="/entrar"
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm transition-all duration-300 hover:scale-105"
              style={{
                fontFamily: "Inter, sans-serif",
                background: scrolled
                  ? "linear-gradient(135deg, #165B36, #052413)"
                  : "rgba(255,255,255,0.1)",
                color: scrolled ? "#EBBF74" : "rgba(255,255,255,0.85)",
                border: scrolled
                  ? "none"
                  : "1px solid rgba(255,255,255,0.15)",
              }}
            >
              <LogIn className="w-3.5 h-3.5" />
              Entrar
            </Link>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden transition-colors duration-300"
          style={{ color: scrolled ? "#052413" : "#ffffff" }}
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
          aria-expanded={isOpen}
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className="md:hidden overflow-hidden transition-all duration-400 ease-in-out"
        style={{
          maxHeight: isOpen ? "500px" : "0px",
          opacity: isOpen ? 1 : 0,
          backgroundColor: "rgba(247, 244, 238, 0.98)",
          borderBottom: isOpen
            ? "1px solid rgba(133, 108, 66, 0.15)"
            : "none",
        }}
      >
        <div className="px-6 pb-4 pt-2 flex flex-col gap-1">
          {navLinks.map((link, i) => {
            const isActive = activeSection === link.sectionId;
            return (
              <a
                key={link.href}
                href={link.href}
                className="transition-colors py-2.5 hover:pl-2"
                style={{
                  fontFamily: "Inter, sans-serif",
                  transitionProperty: "color, padding-left",
                  transitionDuration: "300ms",
                  transitionDelay: isOpen ? `${i * 40}ms` : "0ms",
                  color: isActive ? "#165B36" : "var(--muted-foreground)",
                  borderLeft: isActive
                    ? "2px solid #165B36"
                    : "2px solid transparent",
                  paddingLeft: isActive ? "0.5rem" : undefined,
                }}
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </a>
            );
          })}

          {/* Mobile user button */}
          <div className="border-t border-border/30 mt-2 pt-2">
            {user ? (
              <Link
                to="/minha-conta"
                className="flex items-center gap-3 py-2.5"
                style={{ fontFamily: "Inter, sans-serif" }}
                onClick={() => setIsOpen(false)}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[0.6rem] font-semibold"
                  style={{
                    background: "linear-gradient(135deg, #EBBF74, #D4AF5A)",
                    color: "#052413",
                  }}
                >
                  {user.name?.[0]?.toUpperCase() || user.email[0]?.toUpperCase()}
                </div>
                <span className="text-sm text-[#052413]">
                  {user.name || "Minha Conta"}
                </span>
              </Link>
            ) : (
              <Link
                to="/entrar"
                className="flex items-center gap-2 py-2.5 text-[#165B36]"
                style={{ fontFamily: "Inter, sans-serif" }}
                onClick={() => setIsOpen(false)}
              >
                <LogIn className="w-4 h-4" />
                <span className="text-sm font-medium">Entrar / Cadastrar</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}