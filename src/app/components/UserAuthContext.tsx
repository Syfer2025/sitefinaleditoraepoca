import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { supabase } from "../data/supabaseClient";
import {
  getUserData,
  setUserData,
  clearUserData,
  userApi,
} from "../data/api";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { toast } from "sonner";

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-e413165d`;

function translateAuthError(msg: string): string {
  const map: Record<string, string> = {
    "Invalid login credentials": "E-mail ou senha incorretos. Verifique seus dados e tente novamente.",
    "Email not confirmed": "Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada.",
    "User not found": "Usuário não encontrado. Verifique o e-mail ou crie uma conta.",
    "Invalid email or password": "E-mail ou senha inválidos.",
    "Signup requires a valid password": "A senha informada não é válida. Use no mínimo 8 caracteres.",
    "User already registered": "Este e-mail já está cadastrado. Faça login ou recupere sua senha.",
    "Password should be at least 6 characters": "A senha deve ter no mínimo 6 caracteres.",
    "Unable to validate email address: invalid format": "O formato do e-mail é inválido.",
    "Email rate limit exceeded": "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
    "For security purposes, you can only request this after": "Por segurança, aguarde alguns segundos antes de tentar novamente.",
    "To signup, please provide your email": "Informe seu e-mail para criar a conta.",
  };
  for (const [en, pt] of Object.entries(map)) {
    if (msg.toLowerCase().includes(en.toLowerCase())) return pt;
  }
  if (msg.includes("rate limit")) return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
  if (msg.includes("network") || msg.includes("fetch")) return "Erro de conexão. Verifique sua internet e tente novamente.";
  return `Erro na autenticação: ${msg}`;
}

interface UserInfo {
  id: string;
  email: string;
  name: string;
  role: string;
  phone?: string;
}

interface UserAuthContextType {
  user: UserInfo | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, extra?: { documentType?: string; document?: string; companyName?: string; phone?: string; address?: any }) => Promise<void>;
  logout: () => void;
  updateProfile: (fields: { name?: string; email?: string; phone?: string }) => Promise<void>;
}

const defaultContext: UserAuthContextType = {
  user: null,
  loading: false,
  login: async () => {},
  signup: async () => {},
  logout: () => {},
  updateProfile: async () => {},
};

const UserAuthContext = createContext<UserAuthContextType>(defaultContext);

export function useUserAuth() {
  return useContext(UserAuthContext);
}

export function UserAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(getUserData());
  const [loading, setLoading] = useState(true);

  // On mount: check if there's an active Supabase session
  useEffect(() => {
    let cancelled = false;

    function buildFallbackUser(session: any) {
      return {
        id: session.user.id,
        email: session.user.email || "",
        name: session.user.user_metadata?.name || session.user.email || "",
        role: session.user.user_metadata?.role || "user",
        phone: session.user.user_metadata?.phone || "",
      };
    }

    async function fetchProfile(accessToken: string): Promise<Response | null> {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      try {
        const res = await fetch(`${BASE_URL}/user/me`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
            "X-Access-Token": accessToken,
          },
          signal: controller.signal,
        });
        clearTimeout(timeout);
        return res;
      } catch {
        clearTimeout(timeout);
        return null;
      }
    }

    async function init() {
      // Show cached data immediately — avoids loading flash for returning users
      const cached = getUserData();
      if (cached) {
        setUser(cached);
        setLoading(false);
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (cancelled) return;

        if (!session) {
          clearUserData();
          setUser(null);
          setLoading(false);
          return;
        }

        // Validate session with backend (4s timeout, no retries — fallback is fast)
        const res = await fetchProfile(session.access_token);
        if (cancelled) return;

        if (res && res.ok) {
          const data = await res.json();
          setUser(data.user);
          setUserData(data.user);
        } else if (res && (res.status === 401 || res.status === 403)) {
          await supabase.auth.signOut();
          clearUserData();
          setUser(null);
        } else {
          // Server unreachable — use cached/fallback data
          if (!cached) {
            const u = buildFallbackUser(session);
            setUser(u);
            setUserData(u);
          }
        }
      } catch {
        if (!cached) {
          clearUserData();
          setUser(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();

    // Listen for auth state changes (e.g. token refresh, sign out from another tab)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_OUT" || !session) {
          clearUserData();
          setUser(null);
        } else if (event === "TOKEN_REFRESHED" && session) {
          // Atualiza o cache do perfil silenciosamente quando o token é renovado
          try {
            const res = await fetch(`${BASE_URL}/user/me`, {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${publicAnonKey}`,
                "X-Access-Token": session.access_token,
              },
            });
            if (res.ok) {
              const data = await res.json();
              setUser(data.user);
              setUserData(data.user);
            }
          } catch {
            // Silencioso — mantém dados do cache
          }
        }
      }
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    // Sign in directly via the Supabase client — handles session + refresh automatically
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      const msg = translateAuthError(error.message);
      toast.error(msg);
      throw new Error(msg);
    }
    if (!data.session) {
      throw new Error("Sessão não disponível após login.");
    }

    // Fetch profile from our backend with 3s timeout — fallback to auth data if slow/down
    const fallbackUser: UserInfo = {
      id: data.user.id,
      email: data.user.email || "",
      name: data.user.user_metadata?.name || data.user.email || "",
      role: data.user.user_metadata?.role || "user",
    };

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const profileRes = await fetch(`${BASE_URL}/user/me`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
          "X-Access-Token": data.session.access_token,
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setUser(profileData.user);
        setUserData(profileData.user);
      } else {
        setUser(fallbackUser);
        setUserData(fallbackUser);
      }
    } catch {
      // Timeout or network error — login still succeeds with auth data
      setUser(fallbackUser);
      setUserData(fallbackUser);
    }
  }, []);

  const signup = useCallback(async (email: string, password: string, name: string, extra?: { documentType?: string; document?: string; companyName?: string; phone?: string; address?: any }) => {
    // Signup still goes through the server (needs admin.createUser for email_confirm: true)
    const res = await fetch(`${BASE_URL}/user/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify({ email, password, name, documentType: extra?.documentType || "cpf", document: extra?.document || "", companyName: extra?.companyName || "", phone: extra?.phone || "", address: extra?.address || null }),
    });

    const responseData = await res.json();
    if (!res.ok) {
      const msg = translateAuthError(responseData.error || "Erro ao criar conta");
      toast.error(msg);
      throw new Error(msg);
    }

    // Now sign in via the Supabase client to establish a proper session
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !signInData.session) {
      throw new Error("Conta criada, mas erro ao iniciar sessão. Tente fazer login.");
    }

    const u: UserInfo = {
      id: responseData.user?.id || signInData.user.id,
      email,
      name,
      role: "user",
    };
    setUser(u);
    setUserData(u);
  }, []);

  const logout = useCallback(async () => {
    // scope: 'global' revokes all sessions/refresh tokens on the server
    await supabase.auth.signOut({ scope: "global" });
    clearUserData();
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (fields: { name?: string; email?: string; phone?: string }) => {
    try {
      await userApi("/user/me", { method: "PUT", body: fields });
      setUser((prev) => prev ? { ...prev, ...fields } : null);
      const current = getUserData();
      if (current) setUserData({ ...current, ...fields });
      toast.success("Perfil atualizado com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar perfil.");
      throw err;
    }
  }, []);

  return (
    <UserAuthContext.Provider value={{ user, loading, login, signup, logout, updateProfile }}>
      {children}
    </UserAuthContext.Provider>
  );
}