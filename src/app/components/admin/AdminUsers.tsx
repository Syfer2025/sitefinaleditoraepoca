import { useEffect, useState } from "react";
import {
  Users,
  Plus,
  Trash2,
  Shield,
  User,
  X,
  Eye,
  EyeOff,
  Search,
  Phone,
  MapPin,
  FileText,
  Clock,
  ChevronDown,
  ChevronUp,
  Mail,
  Building2,
  CheckCircle,
  Copy,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { api } from "../../data/api";

const F = "Inter, sans-serif";
const FP = "'Playfair Display', serif";

interface Address {
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}

interface AppUser {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  lastSignIn: string | null;
  emailConfirmed: boolean;
  phone: string;
  documentType: string;
  document: string;
  companyName: string;
  address: Address | null;
  termsAcceptedAt: string | null;
}

function formatDoc(type: string, doc: string): string {
  if (!doc) return "—";
  if (type === "cnpj" && doc.length === 14) {
    return doc.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
  }
  if (doc.length === 11) {
    return doc.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
  }
  return doc;
}

function formatPhone(phone: string): string {
  if (!phone) return "—";
  const d = phone.replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return phone;
}

function formatDate(d: string | null | undefined): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return d;
  }
}

function formatAddress(addr: Address | null): string {
  if (!addr) return "—";
  const parts: string[] = [];
  if (addr.street) {
    let line = addr.street;
    if (addr.number) line += `, ${addr.number}`;
    if (addr.complement) line += ` — ${addr.complement}`;
    parts.push(line);
  }
  if (addr.neighborhood) parts.push(addr.neighborhood);
  if (addr.city && addr.state) parts.push(`${addr.city}/${addr.state}`);
  if (addr.cep) parts.push(`CEP: ${addr.cep.replace(/^(\d{5})(\d{3})$/, "$1-$2")}`);
  return parts.join(", ") || "—";
}

export function AdminUsers() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Create form
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("user");
  const [showPwd, setShowPwd] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const loadUsers = async () => {
    try {
      const data = await api("/admin/users");
      setUsers(data.users || []);
    } catch (err) {
      console.error("Load users error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    setCreating(true);
    try {
      await api("/admin/users", {
        method: "POST",
        body: { email: newEmail, password: newPassword, name: newName, role: newRole },
      });
      setShowCreate(false);
      setNewEmail("");
      setNewPassword("");
      setNewName("");
      setNewRole("user");
      await loadUsers();
    } catch (err: any) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const deleteUser = async (user: AppUser) => {
    if (!confirm(`Excluir o usuario ${user.email}?`)) return;
    try {
      await api(`/admin/users/${user.id}`, { method: "DELETE" });
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const toggleRole = async (user: AppUser) => {
    const newRoleVal = user.role === "admin" ? "user" : "admin";
    try {
      await api(`/admin/users/${user.id}`, {
        method: "PUT",
        body: { name: user.name, role: newRoleVal },
      });
      await loadUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCopy = (text: string, userId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(userId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      u.name.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q) ||
      u.phone.includes(q) ||
      u.document.includes(q) ||
      (u.companyName && u.companyName.toLowerCase().includes(q)) ||
      (u.address?.city && u.address.city.toLowerCase().includes(q))
    );
  });

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div
          className="w-8 h-8 border-3 rounded-full animate-spin"
          style={{ borderColor: "rgba(22,91,54,0.2)", borderTopColor: "#165B36" }}
        />
      </div>
    );
  }

  // Info row helper
  const InfoRow = ({ icon: Icon, label, value, mono }: { icon: any; label: string; value: string; mono?: boolean }) => (
    <div className="flex items-start gap-2.5 py-1.5">
      <Icon className="w-3.5 h-3.5 text-[#856C42]/50 flex-shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1">
        <span className="text-[0.6rem] text-[#856C42]/60 uppercase tracking-wider block" style={{ fontFamily: F }}>{label}</span>
        <span className={`text-xs text-[#052413] ${mono ? "font-mono" : ""}`} style={{ fontFamily: mono ? undefined : F }}>{value || "—"}</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#856C42]/50" />
          <input
            type="text"
            placeholder="Buscar por nome, email, CPF/CNPJ, telefone, cidade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm text-[#052413] placeholder:text-[#856C42]/40 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20"
            style={{ fontFamily: F, backgroundColor: "#FFFDF8", borderColor: "rgba(133,108,66,0.15)" }}
          />
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-[#856C42]/60" style={{ fontFamily: F }}>
            {filtered.length} usuario{filtered.length !== 1 ? "s" : ""}
          </span>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm transition-opacity hover:opacity-90 cursor-pointer"
            style={{ fontFamily: F, background: "linear-gradient(135deg, #165B36, #052413)" }}
          >
            <Plus className="w-4 h-4" />
            Novo Usuario
          </button>
        </div>
      </div>

      {/* Users list */}
      <div className="space-y-2">
        {filtered.map((user) => {
          const isExpanded = expandedId === user.id;
          const hasDetails = !!(user.phone || user.document || user.address || user.companyName);

          return (
            <motion.div
              key={user.id}
              layout
              className="rounded-xl border overflow-hidden"
              style={{ backgroundColor: "#FFFDF8", borderColor: "rgba(133,108,66,0.12)" }}
            >
              {/* Main row — always visible */}
              <button
                onClick={() => toggleExpand(user.id)}
                className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-[#F0E8D4]/20 transition-colors cursor-pointer"
              >
                {/* Avatar */}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                  style={{
                    background: user.role === "admin" ? "linear-gradient(135deg, #EBBF74, #856C42)" : "rgba(133,108,66,0.12)",
                    color: user.role === "admin" ? "#052413" : "#856C42",
                    fontFamily: FP,
                  }}
                >
                  {(user.name || user.email)[0]?.toUpperCase()}
                </div>

                {/* Name + email */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-[#052413] font-medium truncate" style={{ fontFamily: F }}>
                      {user.name || "Sem nome"}
                    </p>
                    <span
                      className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[0.6rem] font-medium flex-shrink-0"
                      style={{
                        fontFamily: F,
                        backgroundColor: user.role === "admin" ? "rgba(235,191,116,0.25)" : "rgba(22,91,54,0.08)",
                        color: user.role === "admin" ? "#052413" : "#165B36",
                      }}
                    >
                      {user.role === "admin" ? <Shield className="w-2.5 h-2.5" /> : <User className="w-2.5 h-2.5" />}
                      {user.role === "admin" ? "Admin" : "Usuario"}
                    </span>
                  </div>
                  <p className="text-xs text-[#856C42] truncate" style={{ fontFamily: F }}>{user.email}</p>
                </div>

                {/* Quick info badges */}
                <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                  {user.phone && (
                    <span className="text-[0.6rem] text-[#856C42]/50 flex items-center gap-0.5" style={{ fontFamily: F }}>
                      <Phone className="w-2.5 h-2.5" />
                      {formatPhone(user.phone)}
                    </span>
                  )}
                  {user.document && (
                    <span className="text-[0.6rem] text-[#856C42]/50 flex items-center gap-0.5 font-mono">
                      <FileText className="w-2.5 h-2.5" />
                      {user.documentType === "cnpj" ? "CNPJ" : "CPF"}
                    </span>
                  )}
                  {user.address?.city && (
                    <span className="text-[0.6rem] text-[#856C42]/50 flex items-center gap-0.5" style={{ fontFamily: F }}>
                      <MapPin className="w-2.5 h-2.5" />
                      {user.address.city}/{user.address.state}
                    </span>
                  )}
                </div>

                {/* Date + expand */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[0.6rem] text-[#856C42]/40 hidden sm:block" style={{ fontFamily: F }}>
                    {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-[#856C42]/40" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#856C42]/40" />
                  )}
                </div>
              </button>

              {/* Expanded details */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-1 border-t" style={{ borderColor: "rgba(133,108,66,0.08)" }}>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-0.5">
                        {/* Identity */}
                        <InfoRow icon={Mail} label="Email" value={user.email} />
                        <InfoRow icon={Phone} label="Telefone" value={formatPhone(user.phone)} />
                        <InfoRow
                          icon={FileText}
                          label={user.documentType === "cnpj" ? "CNPJ" : "CPF"}
                          value={formatDoc(user.documentType, user.document)}
                          mono
                        />
                        {user.documentType === "cnpj" && user.companyName && (
                          <InfoRow icon={Building2} label="Razao Social" value={user.companyName} />
                        )}

                        {/* Address */}
                        <div className="sm:col-span-2 lg:col-span-3">
                          <InfoRow icon={MapPin} label="Endereco (envio de livros)" value={formatAddress(user.address)} />
                        </div>

                        {/* Meta */}
                        <InfoRow icon={Clock} label="Criado em" value={formatDate(user.createdAt)} />
                        <InfoRow icon={Clock} label="Ultimo acesso" value={formatDate(user.lastSignIn)} />
                        <InfoRow
                          icon={CheckCircle}
                          label="Termos aceitos em"
                          value={user.termsAcceptedAt ? formatDate(user.termsAcceptedAt) : "Nao aceitou"}
                        />
                      </div>

                      {/* Actions bar */}
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t" style={{ borderColor: "rgba(133,108,66,0.08)" }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCopy(user.email, user.id); }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-[#856C42] bg-[#F0E8D4]/50 hover:bg-[#F0E8D4] transition-colors cursor-pointer"
                          style={{ fontFamily: F }}
                        >
                          {copiedId === user.id ? <Check className="w-3 h-3 text-[#0a7c3e]" /> : <Copy className="w-3 h-3" />}
                          {copiedId === user.id ? "Copiado!" : "Copiar email"}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleRole(user); }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
                          style={{
                            fontFamily: F,
                            backgroundColor: user.role === "admin" ? "rgba(22,91,54,0.08)" : "rgba(235,191,116,0.15)",
                            color: user.role === "admin" ? "#165B36" : "#856C42",
                          }}
                          title={user.role === "admin" ? "Rebaixar para usuario" : "Promover a admin"}
                        >
                          <Shield className="w-3 h-3" />
                          {user.role === "admin" ? "Rebaixar" : "Promover"}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteUser(user); }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-red-500 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer"
                          style={{ fontFamily: F }}
                        >
                          <Trash2 className="w-3 h-3" />
                          Excluir
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-16 rounded-xl border" style={{ backgroundColor: "#FFFDF8", borderColor: "rgba(133,108,66,0.12)" }}>
            <Users className="w-10 h-10 text-[#856C42]/30 mx-auto mb-3" />
            <p className="text-sm text-[#856C42]" style={{ fontFamily: F }}>
              Nenhum usuario encontrado
            </p>
          </div>
        )}
      </div>

      {/* Create user modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md rounded-xl p-6 border"
              style={{ backgroundColor: "#FFFDF8", borderColor: "rgba(133,108,66,0.15)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg text-[#052413]" style={{ fontFamily: FP }}>
                  Novo Usuario
                </h3>
                <button
                  onClick={() => setShowCreate(false)}
                  className="p-1 text-[#856C42] hover:text-[#052413] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {createError && (
                <div
                  className="mb-4 p-3 rounded-lg text-sm text-center"
                  style={{ backgroundColor: "rgba(212,24,61,0.08)", color: "#d4183d", fontFamily: F }}
                >
                  {createError}
                </div>
              )}

              <form onSubmit={createUser} className="space-y-4">
                <div>
                  <label className="block text-sm text-[#052413] mb-1" style={{ fontFamily: F }}>Nome</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Nome completo"
                    required
                    className="w-full px-4 py-2.5 rounded-lg border text-sm text-[#052413] placeholder:text-[#856C42]/40 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20"
                    style={{ fontFamily: F, backgroundColor: "#F0E8D4", borderColor: "rgba(133,108,66,0.2)" }}
                  />
                </div>

                <div>
                  <label className="block text-sm text-[#052413] mb-1" style={{ fontFamily: F }}>Email</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                    required
                    className="w-full px-4 py-2.5 rounded-lg border text-sm text-[#052413] placeholder:text-[#856C42]/40 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20"
                    style={{ fontFamily: F, backgroundColor: "#F0E8D4", borderColor: "rgba(133,108,66,0.2)" }}
                  />
                </div>

                <div>
                  <label className="block text-sm text-[#052413] mb-1" style={{ fontFamily: F }}>Senha</label>
                  <div className="relative">
                    <input
                      type={showPwd ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimo 6 caracteres"
                      required
                      minLength={6}
                      className="w-full px-4 py-2.5 pr-12 rounded-lg border text-sm text-[#052413] placeholder:text-[#856C42]/40 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20"
                      style={{ fontFamily: F, backgroundColor: "#F0E8D4", borderColor: "rgba(133,108,66,0.2)" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#856C42] hover:text-[#052413] transition-colors cursor-pointer"
                    >
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-[#052413] mb-1" style={{ fontFamily: F }}>Funcao</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border text-sm text-[#052413] focus:outline-none focus:ring-2 focus:ring-[#165B36]/20"
                    style={{ fontFamily: F, backgroundColor: "#F0E8D4", borderColor: "rgba(133,108,66,0.2)" }}
                  >
                    <option value="user">Usuario</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreate(false)}
                    className="flex-1 py-2.5 rounded-lg text-sm text-[#856C42] border hover:bg-[#F0E8D4] transition-colors cursor-pointer"
                    style={{ fontFamily: F, borderColor: "rgba(133,108,66,0.2)" }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 py-2.5 rounded-lg text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
                    style={{ fontFamily: F, background: "linear-gradient(135deg, #165B36, #052413)" }}
                  >
                    {creating ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Criar
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
