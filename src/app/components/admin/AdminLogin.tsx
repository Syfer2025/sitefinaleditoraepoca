import { useState } from "react";
import { useNavigate } from "react-router";
import { Eye, EyeOff, LogIn, BookOpen } from "lucide-react";
import { motion } from "motion/react";
import { api, setToken, clearToken } from "../../data/api";

export function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await api("/auth/signin", {
        method: "POST",
        body: { email, password },
        auth: false,
      });

      if (!data.access_token) {
        setError("Resposta inválida do servidor — token não recebido.");
        setLoading(false);
        return;
      }

      setToken(data.access_token);

      // Small delay to ensure localStorage is synced
      await new Promise((r) => setTimeout(r, 100));

      // Verify admin access
      try {
        await api("/auth/me");
        navigate("/admin/dashboard");
      } catch (adminErr: any) {
        clearToken();
        console.error("Admin /auth/me failed:", adminErr);
        setError(adminErr.message || "Acesso restrito a administradores.");
      }
    } catch (err: any) {
      clearToken();
      console.error("Admin signin failed:", err);
      setError(err.message || "Email ou senha inválidos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: "linear-gradient(135deg, #052413 0%, #165B36 50%, #052413 100%)",
      }}
    >
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 -left-20 w-60 h-60 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #EBBF74, transparent)" }}
        />
        <div
          className="absolute bottom-1/4 -right-20 w-80 h-80 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #EBBF74, transparent)" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        className="relative w-full max-w-md"
      >
        <div
          className="rounded-2xl p-8 shadow-2xl border"
          style={{
            backgroundColor: "rgba(255, 253, 248, 0.97)",
            borderColor: "rgba(133, 108, 66, 0.2)",
          }}
        >
          {/* Logo / Header */}
          <div className="text-center mb-8">
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
              style={{
                background: "linear-gradient(135deg, #165B36, #052413)",
              }}
            >
              <BookOpen className="w-8 h-8 text-[#EBBF74]" />
            </div>
            <h1
              className="text-2xl text-[#052413]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Painel Administrativo
            </h1>
            <p
              className="text-sm text-[#856C42] mt-1"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Época Editora de Livros
            </p>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-lg text-sm text-center"
              style={{
                backgroundColor: "rgba(212, 24, 61, 0.08)",
                color: "#d4183d",
                fontFamily: "Inter, sans-serif",
              }}
            >
              {error}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                className="block text-sm text-[#052413] mb-1.5"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@epocaeditora.com.br"
                required
                className="w-full px-4 py-3 rounded-lg border text-[#052413] placeholder:text-[#856C42]/40 focus:outline-none focus:ring-2 transition-all duration-300"
                style={{
                  fontFamily: "Inter, sans-serif",
                  backgroundColor: "#F0E8D4",
                  borderColor: "rgba(133, 108, 66, 0.2)",
                  focusRingColor: "rgba(22, 91, 54, 0.3)",
                }}
              />
            </div>

            <div>
              <label
                className="block text-sm text-[#052413] mb-1.5"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 pr-12 rounded-lg border text-[#052413] placeholder:text-[#856C42]/40 focus:outline-none focus:ring-2 transition-all duration-300"
                  style={{
                    fontFamily: "Inter, sans-serif",
                    backgroundColor: "#F0E8D4",
                    borderColor: "rgba(133, 108, 66, 0.2)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#856C42] hover:text-[#052413] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-full text-white font-medium flex items-center justify-center gap-2 transition-all duration-300 hover:opacity-90 disabled:opacity-60 cursor-pointer"
              style={{
                background: "linear-gradient(135deg, #165B36, #052413)",
                fontFamily: "Inter, sans-serif",
              }}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Entrar
                </>
              )}
            </button>
          </form>

          {/* Back link */}
          <div className="text-center mt-6">
            <a
              href="/"
              className="text-sm text-[#856C42] hover:text-[#165B36] transition-colors"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              ← Voltar ao site
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}