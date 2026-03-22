import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { Eye, EyeOff, ArrowLeft, CheckCircle, AlertCircle, Loader2, KeyRound, Mail } from "lucide-react";
import { motion } from "motion/react";
import { GoldButton } from "./GoldButton";
import { supabase } from "../data/supabaseClient";
import { projectId, publicAnonKey } from "/utils/supabase/info";

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-e413165d`;

const inputClasses = "w-full px-4 py-3 rounded-lg border text-sm text-[#052413] placeholder:text-[#856C42]/40 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20 transition-all duration-300";
const inputStyle = { backgroundColor: "#F0E8D4", borderColor: "rgba(133,108,66,0.2)" };
const labelClasses = "block text-sm font-medium text-[#052413] mb-1.5";

function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;
  if (score <= 1) return { score, label: "Fraca", color: "#dc2626" };
  if (score <= 2) return { score, label: "Razoável", color: "#f59e0b" };
  if (score <= 3) return { score, label: "Boa", color: "#EBBF74" };
  return { score, label: "Forte", color: "#0a7c3e" };
}

export function PasswordResetPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"request" | "set">("request");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Recuperar senha — Época Editora de Livros";
    return () => { document.title = "Época Editora de Livros — Histórias que transformam"; };
  }, []);

  // Detect Supabase PASSWORD_RECOVERY event (triggered when user clicks the link in the email)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setMode("set");
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !email.includes("@")) {
      setError("Informe um e-mail válido.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/request-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${publicAnonKey}` },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao enviar e-mail de recuperação.");
      setDone(true);
    } catch (e: any) {
      setError(e.message || "Erro ao enviar e-mail de recuperação. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError("A senha deve ter no mínimo 8 caracteres."); return; }
    if (password !== confirmPassword) { setError("As senhas não coincidem."); return; }
    const pwStrength = getPasswordStrength(password);
    if (pwStrength.score < 2) { setError("Senha muito fraca. Use letras maiúsculas, minúsculas, números e símbolos."); return; }
    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setDone(true);
      setTimeout(() => navigate("/entrar"), 2500);
    } catch (e: any) {
      setError(e.message || "Erro ao redefinir senha. O link pode ter expirado.");
    } finally {
      setLoading(false);
    }
  };

  const pwStrength = getPasswordStrength(password);
  const passwordsMatch = !confirmPassword || password === confirmPassword;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="pt-8 pb-10 relative" style={{ background: "linear-gradient(135deg, #052413 0%, #165B36 60%, #052413 100%)" }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 right-1/4 w-72 h-72 rounded-full opacity-[0.07]" style={{ background: "radial-gradient(circle, #EBBF74, transparent)" }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 w-full">
          <Link to="/entrar" className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white/80 transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" /> Voltar ao login
          </Link>
          <h1 className="text-3xl md:text-4xl text-white font-serif leading-[1.2]">
            {mode === "request" ? "Recuperar " : "Nova "}
            <span className="italic text-[#EBBF74]">{mode === "request" ? "conta" : "senha"}</span>
          </h1>
          <p className="text-white/50 mt-2 text-sm">
            {mode === "request"
              ? "Informe seu e-mail e enviaremos um link para redefinir sua senha."
              : "Escolha uma nova senha para sua conta."
            }
          </p>
        </div>
      </div>

      {/* Card */}
      <div className="max-w-md mx-auto px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-2xl p-6 md:p-8 shadow-lg border"
          style={{ backgroundColor: "#FFFDF8", borderColor: "rgba(133,108,66,0.15)" }}
        >
          {/* Success state */}
          {done ? (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "rgba(22,91,54,0.1)" }}>
                <CheckCircle className="w-7 h-7 text-[#165B36]" />
              </div>
              <div>
                <p className="text-base font-semibold text-[#052413] font-serif">
                  {mode === "request" ? "Solicitação enviada!" : "Senha redefinida!"}
                </p>
                <p className="text-sm text-[#856C42] mt-1">
                  {mode === "request"
                    ? `Se o endereço ${email} estiver cadastrado em nossa plataforma, você receberá um link para redefinir sua senha em instantes. Verifique também a pasta de spam.`
                    : "Sua senha foi atualizada. Redirecionando para o login..."
                  }
                </p>
              </div>
              {mode === "request" && (
                <Link to="/entrar" className="text-sm text-[#165B36] font-medium hover:underline">
                  Voltar ao login
                </Link>
              )}
            </div>
          ) : (
            <>
              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mb-4 p-3 rounded-lg text-sm overflow-hidden"
                  style={{ backgroundColor: "rgba(212,24,61,0.08)", color: "#d4183d" }}
                >
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                </motion.div>
              )}

              {mode === "request" ? (
                <form onSubmit={handleRequestReset} className="space-y-4">
                  <div>
                    <label className={labelClasses}>
                      <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-[#856C42]/60" /> E-mail cadastrado *</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      required
                      className={inputClasses}
                      style={inputStyle}
                    />
                  </div>
                  <GoldButton type="submit" className="w-full py-3.5 mt-2" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Mail className="w-4 h-4" /> Enviar link de recuperação</>}
                  </GoldButton>
                  <p className="text-center text-xs text-[#856C42]/60 mt-2">
                    Lembrou a senha?{" "}
                    <Link to="/entrar" className="text-[#165B36] font-medium hover:underline">
                      Entrar
                    </Link>
                  </p>
                </form>
              ) : (
                <form onSubmit={handleSetPassword} className="space-y-4">
                  <div>
                    <label className={labelClasses}>
                      <span className="flex items-center gap-1.5"><KeyRound className="w-3.5 h-3.5 text-[#856C42]/60" /> Nova senha *</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mínimo 8 caracteres"
                        required
                        minLength={8}
                        className={inputClasses + " pr-12"}
                        style={inputStyle}
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#856C42] hover:text-[#052413] transition-colors cursor-pointer">
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {password.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300" style={{ backgroundColor: i <= pwStrength.score ? pwStrength.color : "rgba(133,108,66,0.15)" }} />
                          ))}
                        </div>
                        <p className="text-[0.65rem] font-medium" style={{ color: pwStrength.color }}>
                          Força: {pwStrength.label}
                        </p>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className={labelClasses}>Confirmar nova senha *</label>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repita a nova senha"
                      className={inputClasses}
                      style={{ ...inputStyle, borderColor: confirmPassword && !passwordsMatch ? "rgba(212,24,61,0.4)" : inputStyle.borderColor }}
                    />
                    {confirmPassword && !passwordsMatch && (
                      <p className="text-xs text-red-500 mt-1">As senhas não coincidem.</p>
                    )}
                  </div>
                  <GoldButton type="submit" className="w-full py-3.5 mt-2" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><KeyRound className="w-4 h-4" /> Redefinir senha</>}
                  </GoldButton>
                </form>
              )}
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
