import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Shield, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const COOKIE_KEY = "epoca_cookie_consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_KEY);
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = (type: "all" | "essential") => {
    localStorage.setItem(COOKIE_KEY, JSON.stringify({ type, date: new Date().toISOString() }));
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
            className="max-w-4xl mx-auto rounded-2xl p-5 md:p-6 shadow-2xl flex flex-col md:flex-row items-start md:items-center gap-4"
            style={{
              backgroundColor: "#052413",
              border: "1px solid rgba(235,191,116,0.15)",
              boxShadow: "0 -8px 40px rgba(5,36,19,0.3)",
            }}
          >
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <Shield className="w-5 h-5 text-[#EBBF74] flex-shrink-0 mt-0.5" />
              <div>
                <p
                  className="text-sm text-white/90 leading-relaxed"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Utilizamos cookies essenciais para o funcionamento do site e cookies analiticos para melhorar sua experiencia.
                  Ao continuar navegando, voce concorda com nossa{" "}
                  <Link to="/privacidade" className="text-[#EBBF74] hover:underline">
                    Politica de Privacidade
                  </Link>{" "}
                  e{" "}
                  <Link to="/termos" className="text-[#EBBF74] hover:underline">
                    Termos de Uso
                  </Link>
                  , em conformidade com a LGPD (Lei 13.709/2018).
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 w-full md:w-auto">
              <button
                onClick={() => accept("essential")}
                className="flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer border border-white/10"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Apenas essenciais
              </button>
              <button
                onClick={() => accept("all")}
                className="flex-1 md:flex-none px-5 py-2 rounded-lg text-xs font-semibold text-[#052413] transition-opacity hover:opacity-90 cursor-pointer"
                style={{
                  fontFamily: "Inter, sans-serif",
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}
