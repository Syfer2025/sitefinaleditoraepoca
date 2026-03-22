import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Shield, X, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const COOKIE_KEY = "epoca_cookie_consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [managing, setManaging] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_KEY);
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const save = (type: "all" | "essential" | "custom", analytics?: boolean) => {
    const analyticsVal = type === "all" ? true : type === "essential" ? false : (analytics ?? analyticsEnabled);
    localStorage.setItem(COOKIE_KEY, JSON.stringify({
      type,
      essential: true,
      analytics: analyticsVal,
      date: new Date().toISOString(),
    }));
    window.dispatchEvent(new CustomEvent("epoca_cookie_consent_changed"));
    setVisible(false);
  };

  
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
        >
          <div
            className="max-w-4xl mx-auto rounded-2xl shadow-2xl overflow-hidden"
            style={{
              backgroundColor: "#052413",
              border: "1px solid rgba(235,191,116,0.15)",
              boxShadow: "0 -8px 40px rgba(5,36,19,0.3)",
            }}
          >
            <div className="p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <Shield className="w-5 h-5 text-[#EBBF74] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-white/90 leading-relaxed">
                    Utilizamos cookies essenciais para o funcionamento do site e cookies analíticos para melhorar sua experiência.
                    Ao continuar navegando, você concorda com nossa{" "}
                    <Link to="/privacidade" className="text-[#EBBF74] hover:underline">
                      Política de Privacidade
                    </Link>{" "}
                    e{" "}
                    <Link to="/termos" className="text-[#EBBF74] hover:underline">
                      Termos de Uso
                    </Link>
                    .
                  </p>
                  <button
                    type="button"
                    onClick={() => setManaging((v) => !v)}
                    className="mt-2 flex items-center gap-1 text-xs text-[#EBBF74]/70 hover:text-[#EBBF74] transition-colors cursor-pointer"
                  >
                    {managing ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    Gerenciar preferências
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 w-full md:w-auto">
                <button
                  onClick={() => save("essential")}
                  className="flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer border border-white/10"
                >
                  Rejeitar tudo
                </button>
                <button
                  onClick={() => save("all")}
                  className="flex-1 md:flex-none px-5 py-2 rounded-lg text-xs font-semibold text-[#052413] transition-opacity hover:opacity-90 cursor-pointer"
                  style={{
                    background: "linear-gradient(135deg, #EBBF74, #D4AF5A)",
                  }}
                >
                  Aceitar todos
                </button>
                <button
                  onClick={() => setVisible(false)}
                  className="p-1.5 rounded-lg text-white/30 hover:text-white/60 transition-colors cursor-pointer md:hidden"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Granular management panel */}
            <AnimatePresence>
              {managing && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 md:px-6 pb-5 border-t border-white/10 pt-4 space-y-3">
                    {/* Essential */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-white/90">
                          Cookies essenciais
                        </p>
                        <p className="text-[0.65rem] text-white/40 mt-0.5">
                          Necessários para autenticação, sessão e segurança. Não podem ser desativados.
                        </p>
                      </div>
                      <div
                        className="px-2.5 py-1 rounded-full text-[0.6rem] font-semibold text-[#052413]"
                        style={{ background: "linear-gradient(135deg, #EBBF74, #D4AF5A)" }}
                      >
                        Sempre ativo
                      </div>
                    </div>
                    {/* Analytics */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-white/90">
                          Cookies analíticos
                        </p>
                        <p className="text-[0.65rem] text-white/40 mt-0.5">
                          Nos ajudam a entender como você usa o site para melhorar a experiência.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAnalyticsEnabled((v) => !v)}
                        className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer flex-shrink-0 ${analyticsEnabled ? "" : "bg-white/20"}`}
                        style={analyticsEnabled ? { background: "linear-gradient(135deg, #EBBF74, #D4AF5A)" } : {}}
                        aria-label={analyticsEnabled ? "Desativar cookies analíticos" : "Ativar cookies analíticos"}
                      >
                        <span
                          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${analyticsEnabled ? "translate-x-5" : "translate-x-0.5"}`}
                        />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => save("custom", analyticsEnabled)}
                      className="w-full py-2 rounded-lg text-xs font-semibold text-[#052413] transition-opacity hover:opacity-90 cursor-pointer mt-1"
                      style={{
                        background: "linear-gradient(135deg, #EBBF74, #D4AF5A)",
                      }}
                    >
                      Salvar preferências
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
