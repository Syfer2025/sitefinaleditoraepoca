import { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  BookOpen,
  LogOut,
  Menu,
  X,
  ChevronRight,
  FolderKanban,
  ScrollText,
  HelpCircle,
  Mail,
  DollarSign,
  UserRound,
  Quote,
  BarChart2,
  ImageIcon,
  CreditCard,
  Phone,
  Plug,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { api, clearToken, getAdminToken, getAdminRefreshToken } from "../../data/api";
import { Toaster } from "sonner";

const navItems = [
  { path: "/admin/dashboard", label: "Visão Geral", icon: LayoutDashboard },
  { path: "/admin/projetos", label: "Projetos", icon: FolderKanban },
  { path: "/admin/contratos", label: "Contratos", icon: ScrollText },
  { path: "/admin/mensagens", label: "Mensagens", icon: MessageSquare },
  { path: "/admin/usuarios", label: "Usuários", icon: Users },
  { path: "/admin/livros", label: "Livros", icon: BookOpen },
  { path: "/admin/planos", label: "Planos", icon: DollarSign },
  { path: "/admin/newsletter", label: "Newsletter", icon: Mail },
  { path: "/admin/autores", label: "Autores", icon: UserRound },
  { path: "/admin/depoimentos", label: "Depoimentos", icon: Quote },
  { path: "/admin/sobre", label: "Sobre", icon: BarChart2 },
  { path: "/admin/faq", label: "FAQ", icon: HelpCircle },
  { path: "/admin/logo", label: "Logo", icon: ImageIcon },
  { path: "/admin/pagamentos", label: "Pagamentos", icon: CreditCard },
  { path: "/admin/contato", label: "Contato", icon: Phone },
  { path: "/admin/integracoes", label: "Integrações", icon: Plug },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const token = getAdminToken();
    const hasRefresh = !!getAdminRefreshToken();
    // If no token AND no refresh token, redirect immediately
    if (!token && !hasRefresh) {
      clearToken();
      navigate("/admin");
      return;
    }

    // api() auto-refreshes the token if expired before calling /auth/me
    api("/auth/me")
      .then((data) => {
        setUserEmail(data.email);
        setLoading(false);
      })
      .catch((err) => {
        console.error("AdminLayout auth check failed:", err.message || err);
        clearToken();
        navigate("/admin");
      });
  }, [navigate]);

  const handleLogout = () => {
    clearToken();
    navigate("/admin");
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#F7F4EE" }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-10 h-10 border-3 rounded-full animate-spin"
            style={{ borderColor: "rgba(22,91,54,0.2)", borderTopColor: "#165B36" }}
          />
          <p className="text-sm text-[#856C42]" style={{ fontFamily: "Inter, sans-serif" }}>
            Carregando painel...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ background: "#F7F4EE" }}>
      {/* Global SVG filter for GoldButton (admin is outside RootLayout) */}
      <svg className="absolute w-0 h-0" aria-hidden="true">
        <filter id="goldNoise">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch" />
        </filter>
      </svg>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ background: "#052413" }}
      >
        {/* Sidebar header */}
        <div className="p-5 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #EBBF74, #856C42)" }}
            >
              <BookOpen className="w-5 h-5 text-[#052413]" />
            </div>
            <div>
              <p
                className="text-sm font-semibold text-white"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Época Editora
              </p>
              <p className="text-[0.65rem] text-white/40" style={{ fontFamily: "Inter, sans-serif" }}>
                Painel Admin
              </p>
            </div>
          </div>
          <button
            className="lg:hidden text-white/60 hover:text-white transition-colors cursor-pointer"
            onClick={() => setSidebarOpen(false)}
            aria-label="Fechar menu lateral"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group ${
                  active
                    ? "text-[#052413]"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
                style={{
                  fontFamily: "Inter, sans-serif",
                  ...(active
                    ? {
                        background: "linear-gradient(135deg, #EBBF74, #D4AF5A)",
                      }
                    : {}),
                }}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
                {active && <ChevronRight className="w-3 h-3 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* User / Logout */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-[#052413]"
              style={{ background: "linear-gradient(135deg, #EBBF74, #D4AF5A)" }}
            >
              {userEmail[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-xs text-white/80 truncate"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                {userEmail}
              </p>
              <p
                className="text-[0.6rem] text-[#EBBF74]"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Administrador
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs text-white/50 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            <LogOut className="w-3.5 h-3.5" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header
          className="sticky top-0 z-30 h-14 flex items-center px-4 lg:px-6 border-b"
          style={{
            background: "rgba(247, 244, 238, 0.9)",
            backdropFilter: "blur(12px)",
            borderColor: "rgba(133, 108, 66, 0.15)",
          }}
        >
          <button
            className="lg:hidden mr-3 text-[#052413] cursor-pointer"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menu lateral"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h2
            className="text-lg text-[#052413]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {navItems.find((i) => i.path === location.pathname)?.label || "Painel"}
          </h2>
          <div className="ml-auto">
            <a
              href="/"
              className="text-xs text-[#856C42] hover:text-[#165B36] transition-colors flex items-center gap-1"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Ver site →
            </a>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
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