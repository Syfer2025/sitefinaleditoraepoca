import { useState, useEffect } from "react";
import { Menu, X, LogIn, ChevronRight } from "lucide-react";
import { Link, useLocation } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { useUserAuth } from "./UserAuthContext";
import { getLogos } from "../data/api";

// 1×1 transparent placeholder — evita o ícone de imagem quebrada enquanto a logo carrega
const LOGO_PLACEHOLDER = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

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
  const [logoImg, setLogoImg] = useState<string>("");
  const { user } = useUserAuth();
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  useEffect(() => {
    getLogos().then((logos) => { if (logos.logo_navbar) setLogoImg(logos.logo_navbar); });
  }, []);

  useEffect(() => {
    if (!isHomePage) {
      setScrolled(true);
      return;
    }
    setScrolled(window.scrollY > 40);
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHomePage]);

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
    <>
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-[background-color,border-color,box-shadow] duration-300"
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
        <Link to={isHomePage ? "#hero" : "/"} className="flex items-center">
          <img
            src={logoImg || LOGO_PLACEHOLDER}
            alt="Época Editora"
            className="h-10 transition-all duration-300"
            style={{
              filter: scrolled ? "none" : "brightness(0) invert(1)",
              opacity: logoImg ? 1 : 0,
              transition: "opacity 0.25s ease, filter 0.3s ease",
            }}
          />
        </Link>

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

        {/* Mobile: login + toggle */}
        <div className="md:hidden flex items-center gap-2">
          {user ? (
            <Link
              to="/minha-conta"
              className="w-8 h-8 rounded-full flex items-center justify-center text-[0.6rem] font-semibold"
              style={{
                background: scrolled
                  ? "linear-gradient(135deg, #165B36, #052413)"
                  : "rgba(255,255,255,0.15)",
                color: scrolled ? "#EBBF74" : "#ffffff",
                border: scrolled ? "none" : "1px solid rgba(255,255,255,0.3)",
                fontFamily: "Inter, sans-serif",
              }}
              aria-label="Minha conta"
            >
              {user.name?.[0]?.toUpperCase() || user.email[0]?.toUpperCase()}
            </Link>
          ) : (
            <Link
              to="/entrar"
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors duration-300"
              style={{
                fontFamily: "Inter, sans-serif",
                background: scrolled
                  ? "linear-gradient(135deg, #165B36, #052413)"
                  : "rgba(255,255,255,0.12)",
                color: scrolled ? "#EBBF74" : "rgba(255,255,255,0.9)",
                border: scrolled ? "none" : "1px solid rgba(255,255,255,0.2)",
              }}
            >
              <LogIn className="w-3.5 h-3.5" />
              Entrar
            </Link>
          )}

          <button
            className="transition-colors duration-300"
            style={{ color: scrolled ? "#052413" : "#ffffff" }}
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={isOpen}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

    </nav>

    {/* Backdrop — fecha ao tocar fora */}
    {isOpen && (
      <div
        className="fixed inset-0 z-[44] md:hidden"
        onClick={() => setIsOpen(false)}
      />
    )}

    {/* Mobile dropdown — wrapper div holds position:fixed, motion.div is non-fixed (iOS Safari fix) */}
    <div
      className="fixed left-0 right-0 z-[45] md:hidden"
      style={{ top: 64, pointerEvents: isOpen ? "auto" : "none" }}
    >
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          style={{
            backgroundColor: "rgba(247, 244, 238, 0.98)",
            backdropFilter: "blur(16px)",
            borderBottom: "1px solid rgba(133,108,66,0.14)",
            boxShadow: "0 8px 24px rgba(5,36,19,0.10)",
          }}
        >
          {/* Links */}
          <div className="px-3 pt-2 pb-1">
            {navLinks.map((link) => {
              const isActive = activeSection === link.sectionId;
              return (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-colors"
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "0.875rem",
                    color: isActive ? "#165B36" : "#856C42",
                    backgroundColor: isActive ? "rgba(22,91,54,0.06)" : "transparent",
                    fontWeight: isActive ? 500 : 400,
                  }}
                >
                  <span
                    className="w-[2.5px] h-[14px] rounded-full flex-shrink-0"
                    style={{ backgroundColor: isActive ? "#165B36" : "transparent" }}
                  />
                  {link.label}
                </a>
              );
            })}
          </div>

          {/* Divisor + auth */}
          <div
            className="mx-4 px-3 py-2.5 flex items-center justify-between"
            style={{ borderTop: "1px solid rgba(133,108,66,0.1)" }}
          >
            {user ? (
              <Link
                to="/minha-conta"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 min-w-0"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[0.6rem] font-semibold flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #165B36, #052413)", color: "#EBBF74" }}
                >
                  {user.name?.[0]?.toUpperCase() || user.email[0]?.toUpperCase()}
                </div>
                <span className="text-xs text-[#052413] font-medium truncate">
                  {user.name?.split(" ")[0] || "Minha Conta"}
                </span>
              </Link>
            ) : (
              <Link
                to="/entrar"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-1.5 text-xs text-[#165B36] font-medium"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                <LogIn className="w-3.5 h-3.5" />
                Entrar
              </Link>
            )}

            <a
              href="#planos"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center px-4 py-1.5 rounded-full text-[#1a1206] text-xs font-semibold ml-3"
              style={{
                background: "linear-gradient(90deg, #8B6914 0%, #BF953F 12%, #D4AF5A 25%, #E8CC73 40%, #F5DFA0 50%, #E8CC73 60%, #D4AF5A 75%, #BF953F 88%, #8B6914 100%)",
                fontFamily: "Inter, sans-serif",
              }}
            >
              Publicar meu livro
            </a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
    </div>
    </>
  );
}