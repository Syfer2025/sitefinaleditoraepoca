import { useState, useEffect } from "react";
import { Menu, X, LogIn, LogOut } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router";
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
  const [activeSection, setActiveSection] = useState("hero");
  const [logoImg, setLogoImg] = useState<string>(() => {
    try { return localStorage.getItem("epoca_logo_navbar") || "/assets/logo.png"; } catch { return "/assets/logo.png"; }
  });
  const { user, logout } = useUserAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isHomePage = location.pathname === "/";

  useEffect(() => {
    getLogos().then((logos) => {
      if (logos.logo_navbar) {
        setLogoImg(logos.logo_navbar);
        try { localStorage.setItem("epoca_logo_navbar", logos.logo_navbar); } catch {}
      }
    });
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
    <>
    <nav
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        backgroundColor: "rgba(247, 244, 238, 0.97)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(133, 108, 66, 0.15)",
        boxShadow: "0 1px 20px rgba(5, 36, 19, 0.06)",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to={isHomePage ? "#hero" : "/"} className="flex items-center">
          <img
            src={logoImg || LOGO_PLACEHOLDER}
            alt="Época Editora"
            className="h-10 w-auto"
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
                  color: isActive ? "#165B36" : "#856C42",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#165B36"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = isActive ? "#165B36" : "#856C42"; }}
              >
                {link.label}
                <span
                  className="absolute bottom-0 left-0 h-[1.5px] transition-all duration-300"
                  style={{ backgroundColor: "#165B36", width: isActive ? "100%" : "0%" }}
                />
              </a>
            );
          })}

          {/* User auth button */}
          {user ? (
            <Link
              to="/minha-conta"
              className="flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 hover:scale-105"
              style={{ background: "linear-gradient(135deg, #165B36, #052413)" }}
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[0.6rem] font-semibold"
                style={{ background: "linear-gradient(135deg, #EBBF74, #D4AF5A)", color: "#052413" }}
              >
                {user.name?.[0]?.toUpperCase() || user.email[0]?.toUpperCase()}
              </div>
              <span className="text-sm max-w-[80px] truncate" style={{ color: "#EBBF74" }}>
                {user.name?.split(" ")[0] || "Conta"}
              </span>
            </Link>
          ) : (
            <Link
              to="/entrar"
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm transition-all duration-300 hover:scale-105"
              style={{ background: "linear-gradient(135deg, #165B36, #052413)", color: "#EBBF74" }}
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
              style={{ background: "linear-gradient(135deg, #165B36, #052413)", color: "#EBBF74" }}
              aria-label="Minha conta"
            >
              {user.name?.[0]?.toUpperCase() || user.email[0]?.toUpperCase()}
            </Link>
          ) : (
            <Link
              to="/entrar"
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{ background: "linear-gradient(135deg, #165B36, #052413)", color: "#EBBF74" }}
            >
              <LogIn className="w-3.5 h-3.5" />
              Entrar
            </Link>
          )}

          <button
            className="text-[#052413]"
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

    {/* Mobile dropdown — wrapper div holds position:fixed, CSS transitions replace motion for performance */}
    <div
      className="fixed left-0 right-0 z-[45] md:hidden"
      style={{ top: 64, pointerEvents: isOpen ? "auto" : "none" }}
    >
      <div
        style={{
          opacity: isOpen ? 1 : 0,
          transform: isOpen ? "none" : "translateY(-6px)",
          transition: "opacity 0.15s ease-out, transform 0.15s ease-out",
          visibility: isOpen ? "visible" : "hidden",
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
              <div className="flex items-center gap-2 min-w-0">
                <Link
                  to="/minha-conta"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 min-w-0"
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
                <button
                  onClick={() => { logout(); setIsOpen(false); navigate("/entrar"); }}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-[#856C42] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer flex-shrink-0"
                  aria-label="Sair da conta"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sair
                </button>
              </div>
            ) : (
              <Link
                to="/entrar"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-1.5 text-xs text-[#165B36] font-medium"
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
              }}
            >
              Publicar meu livro
            </a>
          </div>
      </div>
    </div>
    </>
  );
}