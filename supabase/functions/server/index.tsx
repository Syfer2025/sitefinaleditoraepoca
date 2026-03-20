import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import * as kv from "./kv_store.tsx";

const app = new Hono();

app.use("/*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization", "X-Access-Token"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
}));

app.use("*", logger(console.log));

const P = "/make-server-e413165d";
const BUCKET = "make-e413165d-project-files";
const DEFAULT_ADMIN = "alexmeira@protonmail.com";

// Track init state
let initDone = false;

function getAdminClient() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
}

function getAnonClient() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
}

function getAccessToken(r: Request): string | null {
  const val = r.headers.get("X-Access-Token") || null;
  // Guard against "null", "undefined", or empty strings stored accidentally
  if (!val || val === "null" || val === "undefined" || val.trim() === "") return null;
  return val;
}

async function verifyAuth(r: Request): Promise<{ userId: string } | null> {
  const t = getAccessToken(r);
  if (!t) return null;
  const { data, error } = await getAdminClient().auth.getUser(t);
  if (error || !data?.user?.id) return null;
  return { userId: data.user.id };
}

async function getAdmins(): Promise<string[]> {
  try {
    const stored = await kv.get("admin_users");
    if (Array.isArray(stored) && stored.length > 0) return stored;
  } catch {}
  return [DEFAULT_ADMIN];
}

async function verifyAdmin(r: Request): Promise<{ userId: string; email: string } | null> {
  const t = getAccessToken(r);
  if (!t) return null;
  const { data, error } = await getAdminClient().auth.getUser(t);
  if (error || !data?.user?.id) return null;
  const admins = await getAdmins();
  if (!admins.includes(data.user.email || "")) return null;
  return { userId: data.user.id, email: data.user.email || "" };
}

function err(c: any, msg: string, status = 500) { return c.json({ error: msg }, status); }

// Health
app.get(`${P}/health`, (c) => c.json({ status: "ok", initDone, ts: new Date().toISOString(), version: "2026-03-03" }));

// AUTH
app.post(`${P}/auth/signin`, async (c) => {
  try {
    const { email, password } = await c.req.json();
    const { data, error } = await getAnonClient().auth.signInWithPassword({ email, password });
    if (error) return err(c, `Erro ao fazer login: ${error.message}`, 401);
    return c.json({ access_token: data.session?.access_token, user: { id: data.user?.id, email: data.user?.email, name: data.user?.user_metadata?.name || data.user?.email } });
  } catch (e) { return err(c, `Erro inesperado no login: ${e}`); }
});

app.get(`${P}/auth/me`, async (c) => {
  try {
    const token = getAccessToken(c.req.raw);
    if (!token) {
      console.log("auth/me: No X-Access-Token header found");
      return err(c, "Não autorizado — token não fornecido", 401);
    }

    const sb = getAdminClient();
    const { data, error } = await sb.auth.getUser(token);
    if (error) {
      console.log(`auth/me: getUser error: ${error.message}`);
      return err(c, `Não autorizado — token inválido: ${error.message}`, 401);
    }
    if (!data?.user?.id) {
      console.log("auth/me: getUser returned no user");
      return err(c, "Não autorizado — usuário não encontrado", 401);
    }

    const userEmail = data.user.email || "";
    console.log(`auth/me: user authenticated as ${userEmail}`);

    // Check admin list
    let admins: string[];
    try {
      const stored = await kv.get("admin_users");
      admins = stored || [];
      console.log(`auth/me: admin list from KV: ${JSON.stringify(admins)}`);
    } catch (kvErr) {
      console.log(`auth/me: KV error reading admin_users: ${kvErr}`);
      // Fallback to hardcoded admin
      admins = ["alexmeira@protonmail.com"];
    }

    // If admin list is empty, re-initialize it
    if (!admins || admins.length === 0) {
      admins = ["alexmeira@protonmail.com"];
      await kv.set("admin_users", admins);
      console.log("auth/me: admin list was empty, re-initialized with default");
    }

    if (!admins.includes(userEmail)) {
      console.log(`auth/me: ${userEmail} is NOT in admin list [${admins.join(", ")}]`);
      return err(c, `Acesso restrito — ${userEmail} não é administrador`, 401);
    }

    console.log(`auth/me: ${userEmail} verified as admin`);
    return c.json({ userId: data.user.id, email: userEmail });
  } catch (e) {
    console.log(`auth/me unexpected error: ${e}`);
    return err(c, `Erro ao verificar sessão: ${e}`);
  }
});

// USER AUTH

// Validate CNPJ via BrasilAPI (public, no key needed)
app.get(`${P}/user/validate-cnpj/:cnpj`, async (c) => {
  try {
    const cnpj = c.req.param("cnpj").replace(/\D/g, "");
    if (cnpj.length !== 14) return err(c, "CNPJ deve ter 14 dígitos", 400);
    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return err(c, body.message || "CNPJ não encontrado na Receita Federal", 404);
    }
    const data = await res.json();
    return c.json({
      cnpj: data.cnpj,
      razaoSocial: data.razao_social || "",
      nomeFantasia: data.nome_fantasia || "",
      situacao: data.descricao_situacao_cadastral || "",
      porte: data.porte || "",
      logradouro: data.logradouro || "",
      numero: data.numero || "",
      complemento: data.complemento || "",
      bairro: data.bairro || "",
      municipio: data.municipio || "",
      uf: data.uf || "",
      cep: data.cep || "",
      atividadePrincipal: data.cnae_fiscal_descricao || "",
      dataAbertura: data.data_inicio_atividade || "",
    });
  } catch (e) { return err(c, `Erro ao consultar CNPJ na Receita Federal: ${e}`); }
});

// Check if CPF/CNPJ already exists in the system
app.post(`${P}/user/check-document`, async (c) => {
  try {
    const { document } = await c.req.json();
    if (!document) return err(c, "Documento não informado", 400);
    const cleanDoc = document.replace(/\D/g, "");
    if (cleanDoc.length !== 11 && cleanDoc.length !== 14) return err(c, "CPF (11 dígitos) ou CNPJ (14 dígitos) inválido", 400);
    const sb = getAdminClient();
    const { data: usersData } = await sb.auth.admin.listUsers();
    if (!usersData?.users) return c.json({ exists: false });
    const found = usersData.users.find((u: any) => {
      const meta = u.user_metadata || {};
      const storedDoc = (meta.document || meta.cpf || "").replace(/\D/g, "");
      return storedDoc === cleanDoc;
    });
    if (found) {
      const email = found.email || "";
      const [local, domain] = email.split("@");
      const masked = local ? local[0] + "***@" + (domain || "") : "***";
      return c.json({ exists: true, maskedEmail: masked, documentType: cleanDoc.length === 11 ? "CPF" : "CNPJ" });
    }
    return c.json({ exists: false });
  } catch (e) { return err(c, `Erro ao verificar documento: ${e}`); }
});

app.post(`${P}/user/signup`, async (c) => {
  try {
    const { email, password, name, documentType, document, companyName, phone, address } = await c.req.json();
    if (!email || !password || !name) return err(c, "Nome, e-mail e senha são obrigatórios.", 400);
    if (password.length < 8) return err(c, "A senha deve ter no mínimo 8 caracteres.", 400);
    if (!phone || phone.replace(/\D/g, "").length < 10) return err(c, "Telefone é obrigatório (mínimo 10 dígitos com DDD).", 400);
    if (!address || !address.cep || !address.street || !address.city || !address.state) return err(c, "Endereço completo é obrigatório para envio de livros.", 400);

    const cleanDoc = (document || "").replace(/\D/g, "");
    if (documentType === "cnpj" && cleanDoc.length !== 14) return err(c, "CNPJ inválido (14 dígitos)", 400);
    if (documentType === "cpf" && cleanDoc.length !== 11) return err(c, "CPF inválido (11 dígitos)", 400);

    if (cleanDoc.length >= 11) {
      const sb = getAdminClient();
      const { data: usersData } = await sb.auth.admin.listUsers();
      if (usersData?.users) {
        const dup = usersData.users.find((u: any) => {
          const meta = u.user_metadata || {};
          const storedDoc = (meta.document || meta.cpf || "").replace(/\D/g, "");
          return storedDoc === cleanDoc;
        });
        if (dup) {
          const dupEmail = dup.email || "";
          const [local, domain] = dupEmail.split("@");
          const masked = local ? local[0] + "***@" + (domain || "") : "***";
          return err(c, `Já existe uma conta cadastrada com este ${documentType === "cnpj" ? "CNPJ" : "CPF"} (${masked}). Use a opção "Entrar" ou "Recuperar conta".`, 409);
        }
      }
    }

    const metadata: any = { name, role: "user", documentType: documentType || "cpf", document: cleanDoc, phone: phone?.replace(/\D/g, ""), address: address || null, termsAcceptedAt: new Date().toISOString() };
    if (documentType === "cnpj" && companyName) {
      metadata.companyName = companyName.trim();
    }

    const { data, error } = await getAdminClient().auth.admin.createUser({ email, password, user_metadata: metadata, email_confirm: true });
    if (error) {
      const em = error.message?.toLowerCase() || "";
      if (em.includes("already been registered") || em.includes("already registered")) return err(c, "Este e-mail já está cadastrado. Faça login ou recupere sua senha.", 409);
      if (em.includes("invalid email")) return err(c, "Formato de e-mail inválido.", 400);
      if (em.includes("password")) return err(c, "A senha informada não atende aos requisitos mínimos.", 400);
      return err(c, `Erro ao criar conta: ${error.message}`, 400);
    }
    const { data: si, error: se } = await getAnonClient().auth.signInWithPassword({ email, password });
    if (se) return err(c, "Conta criada com sucesso, porém houve um erro ao iniciar sessão. Tente fazer login.", 500);
    return c.json({ access_token: si.session?.access_token, user: { id: data.user?.id, email, name, role: "user", documentType: metadata.documentType, document: cleanDoc, companyName: metadata.companyName || null } });
  } catch (e) { return err(c, `Erro inesperado no cadastro: ${e}`); }
});

app.post(`${P}/user/signin`, async (c) => {
  try {
    const { email, password } = await c.req.json();
    if (!email || !password) return err(c, "E-mail e senha são obrigatórios.", 400);
    const { data, error } = await getAnonClient().auth.signInWithPassword({ email, password });
    if (error) {
      const em = error.message?.toLowerCase() || "";
      if (em.includes("invalid login credentials") || em.includes("invalid email or password")) return err(c, "E-mail ou senha incorretos. Verifique seus dados e tente novamente.", 401);
      if (em.includes("email not confirmed")) return err(c, "Seu e-mail ainda não foi confirmado.", 401);
      if (em.includes("rate limit")) return err(c, "Muitas tentativas. Aguarde alguns minutos e tente novamente.", 429);
      return err(c, `Erro ao fazer login: ${error.message}`, 401);
    }
    return c.json({ access_token: data.session?.access_token, user: { id: data.user?.id, email: data.user?.email, name: data.user?.user_metadata?.name || data.user?.email, role: data.user?.user_metadata?.role || "user" } });
  } catch (e) { return err(c, `Erro inesperado no login: ${e}`); }
});

app.get(`${P}/user/me`, async (c) => {
  try {
    const auth = await verifyAuth(c.req.raw);
    if (!auth) return err(c, "Não autenticado", 401);
    const { data, error } = await getAdminClient().auth.admin.getUserById(auth.userId);
    if (error || !data?.user) return err(c, "Usuário não encontrado", 404);
    const admins = await getAdmins();
    return c.json({ user: { id: data.user.id, email: data.user.email, name: data.user.user_metadata?.name || "", role: admins.includes(data.user.email || "") ? "admin" : (data.user.user_metadata?.role || "user"), createdAt: data.user.created_at } });
  } catch (e) { return err(c, `Erro ao buscar perfil: ${e}`); }
});

app.put(`${P}/user/me`, async (c) => {
  try {
    const auth = await verifyAuth(c.req.raw);
    if (!auth) return err(c, "Não autenticado", 401);
    const { name } = await c.req.json();
    const sb = getAdminClient();
    const { data: existing } = await sb.auth.admin.getUserById(auth.userId);
    const { error } = await sb.auth.admin.updateUserById(auth.userId, { user_metadata: { ...existing?.user?.user_metadata, name } });
    if (error) return err(c, `Erro ao atualizar perfil: ${error.message}`, 400);
    return c.json({ success: true });
  } catch (e) { return err(c, `Erro ao atualizar perfil: ${e}`); }
});

// MESSAGES
app.post(`${P}/messages`, async (c) => {
  try {
    const { name, email, subject, message } = await c.req.json();
    const id = crypto.randomUUID();
    await kv.set(`message:${id}`, { id, name, email, subject, message, read: false, createdAt: new Date().toISOString() });
    return c.json({ success: true, id });
  } catch (e) { return err(c, `Erro ao enviar mensagem: ${e}`); }
});

app.get(`${P}/admin/messages`, async (c) => {
  try {
    const auth = await verifyAdmin(c.req.raw);
    if (!auth) return err(c, "Não autorizado", 401);
    const msgs = await kv.getByPrefix("message:");
    return c.json({ messages: msgs.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) });
  } catch (e) { return err(c, `Erro ao buscar mensagens: ${e}`); }
});

app.put(`${P}/admin/messages/:id/read`, async (c) => {
  try {
    const auth = await verifyAdmin(c.req.raw);
    if (!auth) return err(c, "Não autorizado", 401);
    const msg = await kv.get(`message:${c.req.param("id")}`);
    if (!msg) return err(c, "Mensagem não encontrada", 404);
    msg.read = true;
    await kv.set(`message:${c.req.param("id")}`, msg);
    return c.json({ success: true });
  } catch (e) { return err(c, `Erro ao atualizar mensagem: ${e}`); }
});

app.delete(`${P}/admin/messages/:id`, async (c) => {
  try {
    const auth = await verifyAdmin(c.req.raw);
    if (!auth) return err(c, "Não autorizado", 401);
    await kv.del(`message:${c.req.param("id")}`);
    return c.json({ success: true });
  } catch (e) { return err(c, `Erro ao excluir mensagem: ${e}`); }
});

// USERS
app.get(`${P}/admin/users`, async (c) => {
  try {
    const auth = await verifyAdmin(c.req.raw);
    if (!auth) return err(c, "Não autorizado", 401);
    const { data, error } = await getAdminClient().auth.admin.listUsers();
    if (error) return err(c, `Erro ao listar usuários: ${error.message}`);
    const admins = await getAdmins();
    return c.json({ users: data.users.map((u: any) => {
      const meta = u.user_metadata || {};
      return {
        id: u.id, email: u.email, name: meta.name || "",
        role: admins.includes(u.email || "") ? "admin" : (meta.role || "user"),
        createdAt: u.created_at, lastSignIn: u.last_sign_in_at, emailConfirmed: !!u.email_confirmed_at,
        phone: meta.phone || "", documentType: meta.documentType || "cpf", document: meta.document || "",
        companyName: meta.companyName || "", address: meta.address || null, termsAcceptedAt: meta.termsAcceptedAt || null,
      };
    }) });
  } catch (e) { return err(c, `Erro ao listar usuários: ${e}`); }
});

app.post(`${P}/admin/users`, async (c) => {
  try {
    const auth = await verifyAdmin(c.req.raw);
    if (!auth) return err(c, "Não autorizado", 401);
    const { email, password, name, role } = await c.req.json();
    const { data, error } = await getAdminClient().auth.admin.createUser({ email, password, user_metadata: { name, role: role || "user" }, email_confirm: true });
    if (error) return err(c, `Erro ao criar usuário: ${error.message}`, 400);
    if (role === "admin") {
      const admins = await getAdmins();
      if (!admins.includes(email)) { admins.push(email); await kv.set("admin_users", admins); }
    }
    return c.json({ success: true, user: { id: data.user?.id, email, name, role: role || "user" } });
  } catch (e) { return err(c, `Erro ao criar usuário: ${e}`); }
});

app.put(`${P}/admin/users/:id`, async (c) => {
  try {
    const auth = await verifyAdmin(c.req.raw);
    if (!auth) return err(c, "Não autorizado", 401);
    const { name, role } = await c.req.json();
    const { data, error } = await getAdminClient().auth.admin.updateUserById(c.req.param("id"), { user_metadata: { name, role } });
    if (error) return err(c, `Erro ao atualizar usuário: ${error.message}`, 400);
    const admins = await getAdmins();
    const email = data.user?.email || "";
    if (role === "admin" && !admins.includes(email)) { admins.push(email); await kv.set("admin_users", admins); }
    else if (role !== "admin" && admins.includes(email)) { await kv.set("admin_users", admins.filter((a: string) => a !== email)); }
    return c.json({ success: true });
  } catch (e) { return err(c, `Erro ao atualizar usuário: ${e}`); }
});

app.delete(`${P}/admin/users/:id`, async (c) => {
  try {
    const auth = await verifyAdmin(c.req.raw);
    if (!auth) return err(c, "Não autorizado", 401);
    const sb = getAdminClient();
    const { data: ud } = await sb.auth.admin.getUserById(c.req.param("id"));
    const ue = ud?.user?.email || "";
    if (ue === auth.email) return err(c, "Você não pode excluir sua própria conta", 400);
    const { error } = await sb.auth.admin.deleteUser(c.req.param("id"));
    if (error) return err(c, `Erro ao excluir usuário: ${error.message}`, 400);
    const admins = await getAdmins();
    if (admins.includes(ue)) await kv.set("admin_users", admins.filter((a: string) => a !== ue));
    return c.json({ success: true });
  } catch (e) { return err(c, `Erro ao excluir usuário: ${e}`); }
});

// STATS
app.get(`${P}/admin/stats`, async (c) => {
  try {
    const auth = await verifyAdmin(c.req.raw);
    if (!auth) return err(c, "Não autorizado", 401);
    const { data: usersData } = await getAdminClient().auth.admin.listUsers();
    const messages = await kv.getByPrefix("message:");
    const projects = await kv.getByPrefix("project:");
    const subscribers = await kv.getByPrefix("newsletter:");
    return c.json({ totalUsers: usersData?.users?.length || 0, totalMessages: messages.length, unreadMessages: messages.filter((m: any) => !m.read).length, totalSubscribers: subscribers.length, totalProjects: projects.length, activeProjects: projects.filter((p: any) => p.status !== "concluido").length });
  } catch (e) { return err(c, `Erro ao buscar estatísticas: ${e}`); }
});

// NEWSLETTER
app.post(`${P}/newsletter`, async (c) => {
  try {
    const { email } = await c.req.json();
    await kv.set(`newsletter:${email}`, { email, subscribedAt: new Date().toISOString() });
    return c.json({ success: true });
  } catch (e) { return err(c, `Erro ao inscrever: ${e}`); }
});

app.get(`${P}/admin/subscribers`, async (c) => {
  try {
    const auth = await verifyAdmin(c.req.raw);
    if (!auth) return err(c, "Não autorizado", 401);
    return c.json({ subscribers: await kv.getByPrefix("newsletter:") });
  } catch (e) { return err(c, `Erro ao listar inscritos: ${e}`); }
});

// PROJECTS
const ALLOWED_EXT = [".doc",".docx",".pdf",".txt",".rtf",".odt",".epub",".indd",".idml",".psd",".ai",".jpg",".jpeg",".png",".tiff",".tif",".svg",".zip",".rar",".7z"];

app.post(`${P}/projects`, async (c) => {
  try {
    const auth = await verifyAuth(c.req.raw);
    if (!auth) return err(c, "Não autenticado", 401);
    const sb = getAdminClient();
    const { data: ud } = await sb.auth.admin.getUserById(auth.userId);
    const userEmail = ud?.user?.email || "";
    const userName = ud?.user?.user_metadata?.name || userEmail;
    const { title, author, description, pageCount, format, customFormat, services, notes } = await c.req.json();
    if (!title || !title.trim()) return err(c, "O título da obra é obrigatório", 400);
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const project = { id, userId: auth.userId, userEmail, userName, title: title.trim(), author: author?.trim() || userName, description: description?.trim() || "", pageCount: pageCount || null, format: format || "A5", customFormat: customFormat?.trim() || "", services: services || ["completo"], notes: notes?.trim() || "", status: "analise", steps: [{ status: "solicitado", date: now, note: "Solicitação recebida" }, { status: "analise", date: now, note: "Em análise pela equipe" }], fileUrl: null, uploadedFiles: [] as string[], adminNotes: "", budget: null as any, reviewFiles: [] as any[], createdAt: now, updatedAt: now };
    await kv.set(`project:${id}`, project);
    return c.json({ success: true, project });
  } catch (e) { return err(c, `Erro ao criar solicitação: ${e}`); }
});

app.post(`${P}/projects/:id/upload`, async (c) => {
  try {
    const auth = await verifyAuth(c.req.raw);
    if (!auth) return err(c, "Não autenticado", 401);
    const pid = c.req.param("id");
    const project = await kv.get(`project:${pid}`);
    if (!project) return err(c, "Projeto não encontrado", 404);
    if (project.userId !== auth.userId) return err(c, "Acesso negado", 403);
    const formData = await c.req.raw.formData();
    const file = formData.get("file") as File | null;
    if (!file) return err(c, "Nenhum arquivo enviado", 400);
    if (file.size > 50 * 1024 * 1024) return err(c, "O arquivo excede o limite de 50 MB", 400);
    const ext = "." + file.name.toLowerCase().split(".").pop();
    if (!ALLOWED_EXT.includes(ext)) return err(c, `Tipo de arquivo não permitido: ${ext}`, 400);
    const sb = getAdminClient();
    const sp = `${auth.userId}/${pid}/${Date.now()}_${file.name}`;
    const ab = await file.arrayBuffer();
    const { error: ue } = await sb.storage.from(BUCKET).upload(sp, ab, { contentType: file.type || "application/octet-stream", upsert: false });
    if (ue) return err(c, `Erro ao enviar arquivo: ${ue.message}`);
    const { data: sd } = await sb.storage.from(BUCKET).createSignedUrl(sp, 60 * 60 * 24 * 7);
    if (!project.uploadedFiles) project.uploadedFiles = [];
    project.uploadedFiles.push({ name: file.name, size: file.size, path: sp, uploadedAt: new Date().toISOString() });
    project.updatedAt = new Date().toISOString();
    await kv.set(`project:${pid}`, project);
    return c.json({ success: true, file: { name: file.name, size: file.size, url: sd?.signedUrl, path: sp } });
  } catch (e) { return err(c, `Erro ao enviar arquivo: ${e}`); }
});

app.get(`${P}/projects`, async (c) => {
  try {
    const auth = await verifyAuth(c.req.raw);
    if (!auth) return err(c, "Não autenticado", 401);
    const all = await kv.getByPrefix("project:");
    return c.json({ projects: all.filter((p: any) => p.userId === auth.userId).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) });
  } catch (e) { return err(c, `Erro ao buscar projetos: ${e}`); }
});

app.get(`${P}/projects/:id`, async (c) => {
  try {
    const auth = await verifyAuth(c.req.raw);
    if (!auth) return err(c, "Não autenticado", 401);
    const project = await kv.get(`project:${c.req.param("id")}`);
    if (!project) return err(c, "Projeto não encontrado", 404);
    if (project.userId !== auth.userId) return err(c, "Acesso negado", 403);
    if (project.uploadedFiles?.length > 0) {
      const sb = getAdminClient();
      project.uploadedFiles = await Promise.all(project.uploadedFiles.map(async (f: any) => {
        try { const { data } = await sb.storage.from(BUCKET).createSignedUrl(f.path, 7200); return { ...f, url: data?.signedUrl || null }; }
        catch { return { ...f, url: null }; }
      }));
    }
    return c.json({ project });
  } catch (e) { return err(c, `Erro ao buscar projeto: ${e}`); }
});

app.get(`${P}/admin/projects`, async (c) => {
  try {
    const auth = await verifyAdmin(c.req.raw);
    if (!auth) return err(c, "Não autorizado", 401);
    const all = await kv.getByPrefix("project:");
    return c.json({ projects: all.sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()) });
  } catch (e) { return err(c, `Erro ao buscar projetos: ${e}`); }
});

app.put(`${P}/admin/projects/:id`, async (c) => {
  try {
    const auth = await verifyAdmin(c.req.raw);
    if (!auth) return err(c, "Não autorizado", 401);
    const id = c.req.param("id");
    const project = await kv.get(`project:${id}`);
    if (!project) return err(c, "Projeto não encontrado", 404);
    const { status, note, fileUrl, adminNotes } = await c.req.json();
    const now = new Date().toISOString();
    if (status && status !== project.status) {
      // Server-side validation: block "concluido" if remainder is pending
      const hasPartialDeposit = project.budget?.depositPercent > 0 && project.budget?.depositPercent < 100;
      const isRemainderPending = hasPartialDeposit && (project.budget?.status === "paid" || project.budget?.status === "fully_paid") && project.budget?.remainderStatus !== "paid";
      if (status === "concluido" && isRemainderPending) {
        return err(c, "Não é possível finalizar o projeto com pagamento do restante pendente.", 400);
      }
      // Block "concluido" if installments are pending
      const hasInstallments = project.budget?.installmentPlan?.enabled && project.budget?.installmentPlan?.installments?.length > 0;
      const hasPendingInstallments = hasInstallments && project.budget.installmentPlan.installments.some((inst: any) => inst.status !== "paid");
      if (status === "concluido" && hasPendingInstallments) {
        return err(c, "Não é possível finalizar o projeto com parcelas pendentes.", 400);
      }
      const VALID_STATUSES = ["solicitado", "analise", "orcamento", "producao", "revisao", "ajustes", "concluido"];
      if (!VALID_STATUSES.includes(status)) {
        return err(c, `Status inválido: ${status}`, 400);
      }
      project.status = status;
      project.steps.push({ status, date: now, note: note || "" });
    }
    if (fileUrl !== undefined) project.fileUrl = fileUrl;
    if (adminNotes !== undefined) project.adminNotes = adminNotes;
    project.updatedAt = now;
    await kv.set(`project:${id}`, project);
    return c.json({ success: true, project });
  } catch (e) { return err(c, `Erro ao atualizar projeto: ${e}`); }
});

app.delete(`${P}/admin/projects/:id`, async (c) => {
  try {
    const auth = await verifyAdmin(c.req.raw);
    if (!auth) return err(c, "Não autorizado", 401);
    await kv.del(`project:${c.req.param("id")}`);
    return c.json({ success: true });
  } catch (e) { return err(c, `Erro ao excluir projeto: ${e}`); }
});

app.delete(`${P}/admin/projects/:id/files`, async (c) => {
  try {
    const admin = await verifyAdmin(c.req.raw);
    if (!admin) return err(c, "Não autorizado", 401);
    const pid = c.req.param("id");
    const project = await kv.get(`project:${pid}`);
    if (!project) return err(c, "Projeto não encontrado", 404);
    const { type, index } = await c.req.json();
    if (!type || index === undefined || index === null) return err(c, "Parâmetros inválidos", 400);
    const key = type === "review" ? "reviewFiles" : "uploadedFiles";
    const files = project[key] || [];
    if (index < 0 || index >= files.length) return err(c, "Índice inválido", 400);
    const fp = files[index].path;
    if (fp) { try { await getAdminClient().storage.from(BUCKET).remove([fp]); } catch {} }
    files.splice(index, 1);
    project[key] = files;
    project.updatedAt = new Date().toISOString();
    await kv.set(`project:${pid}`, project);
    return c.json({ success: true });
  } catch (e) { return err(c, `Erro ao excluir arquivo: ${e}`); }
});

// MERCADO PAGO
app.post(`${P}/admin/projects/:id/budget`, async (c) => {
  try {
    const auth = await verifyAdmin(c.req.raw);
    if (!auth) return err(c, "Não autorizado", 401);
    const id = c.req.param("id");
    const project = await kv.get(`project:${id}`);
    if (!project) return err(c, "Projeto não encontrado", 404);
    const { description, price, depositPercent, customClauses, estimatedDeadline } = await c.req.json();
    if (!price || price <= 0) return err(c, "Valor inválido", 400);
    const totalPrice = parseFloat(price);
    const dp = depositPercent ? Math.min(100, Math.max(0, parseInt(depositPercent))) : 0;
    const chargeAmount = dp > 0 && dp < 100 ? Math.round(totalPrice * dp) / 100 : totalPrice;
    const mpToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!mpToken) return err(c, "Token do Mercado Pago não configurado");
    const siteUrl = "https://editoraepoca.com.br";
    const itemDesc = dp > 0 && dp < 100 ? `Entrada (${dp}%) — ${description || `Serviço editorial para "${project.title}"`}` : (description || `Serviço editorial para "${project.title}"`);
    const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${mpToken}` },
      body: JSON.stringify({
        items: [{ title: `Época Editora — ${project.title}`, description: itemDesc, quantity: 1, currency_id: "BRL", unit_price: chargeAmount }],
        back_urls: { success: `${siteUrl}/minha-conta?payment=success&project=${id}`, failure: `${siteUrl}/minha-conta?payment=failure&project=${id}`, pending: `${siteUrl}/minha-conta?payment=pending&project=${id}` },
        auto_return: "approved", external_reference: id,
        notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/${P.slice(1)}/webhooks/mercadopago?apikey=${Deno.env.get("SUPABASE_ANON_KEY")}`,
      }),
    });
    const mpData = await mpRes.json();
    if (!mpRes.ok) return err(c, `Erro ao criar link de pagamento: ${mpData.message || JSON.stringify(mpData)}`);
    const now = new Date().toISOString();
    project.budget = { description: description || `Serviço editorial para "${project.title}"`, price: totalPrice, depositPercent: dp, chargeAmount, paymentUrl: mpData.init_point, sandboxUrl: mpData.sandbox_init_point, preferenceId: mpData.id, status: "pending", createdAt: now, paidAt: null, customClauses: customClauses?.trim() || null, estimatedDeadline: estimatedDeadline?.trim() || null };
    const notePrice = dp > 0 && dp < 100 ? `Orçamento enviado: R$ ${totalPrice.toFixed(2).replace(".", ",")} (entrada ${dp}%: R$ ${chargeAmount.toFixed(2).replace(".", ",")})` : `Orçamento enviado: R$ ${totalPrice.toFixed(2).replace(".", ",")}`;
    if (project.status === "analise") { project.status = "orcamento"; project.steps.push({ status: "orcamento", date: now, note: notePrice }); }
    project.updatedAt = now;
    await kv.set(`project:${id}`, project);
    return c.json({ success: true, project, paymentUrl: mpData.init_point });
  } catch (e) { return err(c, `Erro ao criar orçamento: ${e}`); }
});

// UPDATE CLAUSES ON EXISTING BUDGET
app.put(`${P}/admin/projects/:id/budget/clauses`, async (c) => {
  try {
    const auth = await verifyAdmin(c.req.raw);
    if (!auth) return err(c, "Não autorizado", 401);
    const id = c.req.param("id");
    const project = await kv.get(`project:${id}`);
    if (!project) return err(c, "Projeto não encontrado", 404);
    if (!project.budget) return err(c, "Orçamento não encontrado", 404);
    const { customClauses, estimatedDeadline } = await c.req.json();
    if (customClauses !== undefined) project.budget.customClauses = customClauses || null;
    if (estimatedDeadline !== undefined) project.budget.estimatedDeadline = estimatedDeadline?.trim() || null;
    project.updatedAt = new Date().toISOString();
    await kv.set(`project:${id}`, project);
    return c.json({ success: true });
  } catch (e) { return err(c, `Erro ao atualizar cláusulas: ${e}`); }
});

app.delete(`${P}/admin/projects/:id/budget`, async (c) => {
  try {
    const auth = await verifyAdmin(c.req.raw);
    if (!auth) return err(c, "Não autorizado", 401);
    const id = c.req.param("id");
    const project = await kv.get(`project:${id}`);
    if (!project) return err(c, "Projeto não encontrado", 404);
    if (!project.budget) return err(c, "Este projeto não possui orçamento", 400);
    if (project.budget.status === "paid" || project.budget.status === "fully_paid") return err(c, "Não é possível apagar um orçamento já pago", 400);
    const now = new Date().toISOString();
    project.budget = null;
    if (project.status === "orcamento") { project.status = "analise"; project.steps.push({ status: "analise", date: now, note: "Orçamento removido — retornando para análise" }); }
    project.updatedAt = now;
    await kv.set(`project:${id}`, project);
    return c.json({ success: true, project });
  } catch (e) { return err(c, `Erro ao apagar orçamento: ${e}`); }
});

app.post(`${P}/webhooks/mercadopago`, async (c) => {
  try {
    const body = await c.req.json();
    console.log(`Webhook MP received: type=${body.type}, action=${body.action}, data_id=${body.data?.id}`);
    if (body.type === "payment") {
      const paymentId = body.data?.id;
      const mpToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
      if (!paymentId || !mpToken) { console.log("Webhook MP: missing paymentId or token"); return c.json({ ok: true }); }
      const pr = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, { headers: { Authorization: `Bearer ${mpToken}` } });
      const pd = await pr.json();
      console.log(`Webhook MP: payment ${paymentId} status=${pd.status} ext_ref=${pd.external_reference}`);
      if (pd.status === "approved" && pd.external_reference) {
        const extRef = pd.external_reference;
        const isPayoff = extRef.endsWith("-payoff");
        const isRemainder = extRef.endsWith("-remainder");
        const installmentMatch = extRef.match(/^(.+)-installment-(\d+)$/);
        const isInstallment = !!installmentMatch;
        const projectId = isPayoff ? extRef.replace("-payoff", "") : isInstallment ? installmentMatch![1] : isRemainder ? extRef.replace("-remainder", "") : extRef;
        const project = await kv.get(`project:${projectId}`);
        if (project) {
          const now = new Date().toISOString();
          if (isInstallment) {
            const instNum = parseInt(installmentMatch![2], 10);
            if (project.budget?.installmentPlan?.installments) {
              const inst = project.budget.installmentPlan.installments.find((i: any) => i.number === instNum);
              if (inst && inst.status !== "paid") {
                inst.status = "paid";
                inst.paidAt = now;
                inst.paymentId = String(paymentId);
                const paidCount = project.budget.installmentPlan.installments.filter((i: any) => i.status === "paid").length;
                const allPaid = paidCount === project.budget.installmentPlan.totalInstallments;
                if (allPaid) {
                  project.budget.status = "fully_paid";
                  project.steps.push({ status: project.status, date: now, note: `Todas as ${project.budget.installmentPlan.totalInstallments} parcelas PIX foram pagas — pagamento total concluído` });
                } else {
                  project.steps.push({ status: project.status, date: now, note: `Parcela ${instNum}/${project.budget.installmentPlan.totalInstallments} (R$ ${inst.amount.toFixed(2).replace(".", ",")}) confirmada via PIX (${paidCount}/${project.budget.installmentPlan.totalInstallments} pagas)` });
                }
                // Move to producao on first installment paid
                if (project.status === "orcamento" && paidCount >= 1) {
                  project.budget.status = project.budget.status === "fully_paid" ? "fully_paid" : "paid";
                  project.budget.paidAt = project.budget.paidAt || now;
                  project.status = "producao";
                  project.steps.push({ status: "producao", date: now, note: "Primeira parcela PIX confirmada — produção iniciada" });
                }
                console.log(`Webhook: Installment ${instNum} confirmed for project ${projectId}. (${paidCount}/${project.budget.installmentPlan.totalInstallments} paid)`);
                // AUTO-GENERATE NEXT PIX
                if (!allPaid) {
                  try {
                    const nextInst = project.budget.installmentPlan.installments.find((i: any) => i.status !== "paid" && !i.pixCode);
                    if (nextInst) {
                      const mpTokenW = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
                      if (mpTokenW) {
                        const descW = `Época Editora — ${project.title} — Parcela ${nextInst.number}/${project.budget.installmentPlan.totalInstallments}`;
                        const expDateW = new Date(nextInst.dueDate + "T23:59:59-03:00").toISOString();
                        const pixBodyW = { transaction_amount: nextInst.amount, description: descW, payment_method_id: "pix", payer: { email: project.userEmail || "cliente@email.com" }, external_reference: `${projectId}-installment-${nextInst.number}`, date_of_expiration: expDateW, notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/${P.slice(1)}/webhooks/mercadopago?apikey=${Deno.env.get("SUPABASE_ANON_KEY")}` };
                        const mpResW = await fetch("https://api.mercadopago.com/v1/payments", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${mpTokenW}`, "X-Idempotency-Key": `${projectId}-inst-${nextInst.number}-auto-${Date.now()}` }, body: JSON.stringify(pixBodyW) });
                        const mpDataW = await mpResW.json();
                        if (mpResW.ok) {
                          nextInst.pixCode = mpDataW.point_of_interaction?.transaction_data?.qr_code || null;
                          nextInst.pixQrCode = mpDataW.point_of_interaction?.transaction_data?.qr_code_base64 || null;
                          nextInst.paymentId = String(mpDataW.id);
                          nextInst.generatedAt = now;
                          console.log(`Webhook: Auto-generated PIX for next installment ${nextInst.number} of project ${projectId}`);
                        } else {
                          console.log(`Webhook: Failed to auto-generate next PIX: ${mpDataW.message || JSON.stringify(mpDataW)}`);
                        }
                      }
                    }
                  } catch (autoPixErr) { console.log(`Webhook: Error auto-generating next PIX: ${autoPixErr}`); }
                }
              }
            }
          } else if (isPayoff) {
            // Payoff: mark all pending installments as paid
            if (project.budget?.installmentPlan?.installments) {
              const pendingInsts = project.budget.installmentPlan.installments.filter((i: any) => i.status !== "paid");
              for (const pi of pendingInsts) {
                pi.status = "paid";
                pi.paidAt = now;
                pi.paymentId = String(paymentId);
              }
              project.budget.installmentPlan.payoff = { ...(project.budget.installmentPlan.payoff || {}), status: "paid", paidAt: now };
              project.budget.status = "fully_paid";
              const payoffAmt = pendingInsts.reduce((s: number, i: any) => s + i.amount, 0);
              project.steps.push({ status: project.status, date: now, note: `Quitação antecipada de ${pendingInsts.length} parcela(s) (R$ ${payoffAmt.toFixed(2).replace(".", ",")}) via PIX — pagamento total concluído` });
              if (project.status === "orcamento") {
                project.budget.paidAt = project.budget.paidAt || now;
                project.status = "producao";
                project.steps.push({ status: "producao", date: now, note: "Quitação confirmada — produção iniciada" });
              }
              console.log(`Webhook: Payoff confirmed for project ${projectId}. All ${pendingInsts.length} remaining installments marked paid.`);
            }
          } else if (isRemainder) {
            if (project.budget) {
              project.budget.remainderStatus = "paid";
              project.budget.remainderPaidAt = now;
              project.budget.remainderPaymentId = paymentId;
              project.budget.status = "fully_paid";
            }
            const rv = project.budget?.remainderAmount || Math.round((project.budget?.price - (project.budget?.chargeAmount || 0)) * 100) / 100;
            project.steps.push({ status: project.status, date: now, note: `Pagamento do restante (R$ ${rv.toFixed(2).replace(".", ",")}) confirmado automaticamente — pagamento total concluído` });
            console.log(`Webhook: Remainder payment confirmed for project ${projectId}. Budget fully paid.`);
          } else {
            if (project.budget) { project.budget.status = "paid"; project.budget.paidAt = now; project.budget.paymentId = paymentId; }
            if (project.status === "orcamento") { project.status = "producao"; project.steps.push({ status: "producao", date: now, note: "Pagamento confirmado — produção iniciada" }); }
          }
          project.updatedAt = now;
          await kv.set(`project:${projectId}`, project);
          console.log(`Webhook MP: project ${projectId} updated successfully (isRemainder=${isRemainder}, isInstallment=${isInstallment})`);
        } else {
          console.log(`Webhook MP: project not found for id ${projectId}`);
        }
      } else {
        console.log(`Webhook MP: payment not approved or no ext_ref. status=${pd.status}`);
      }
    }
    return c.json({ ok: true });
  } catch (e) { console.log(`Webhook MP error: ${e}`); return c.json({ ok: true }); }
});

app.post(`${P}/projects/:id/confirm-payment`, async (c) => {
  try {
    const auth = await verifyAuth(c.req.raw);
    if (!auth) return err(c, "Não autenticado", 401);
    const pid = c.req.param("id");
    const project = await kv.get(`project:${pid}`);
    if (!project) return err(c, "Projeto não encontrado", 404);
    if (project.userId !== auth.userId) return err(c, "Acesso negado", 403);
    const { status: ps } = await c.req.json();
    if (ps === "success" && project.budget && project.status === "orcamento") {
      const now = new Date().toISOString();
      project.budget.status = "paid"; project.budget.paidAt = now;
      project.status = "producao"; project.steps.push({ status: "producao", date: now, note: "Pagamento confirmado — produção iniciada" });
      project.updatedAt = now;
      await kv.set(`project:${pid}`, project);
    }
    return c.json({ success: true, project });
  } catch (e) { return err(c, `Erro ao confirmar pagamento: ${e}`); }
});

app.post(`${P}/admin/projects/:id/confirm-payment`, async (c) => {
  try {
    const auth = await verifyAdmin(c.req.raw);
    if (!auth) return err(c, "Não autorizado", 401);
    const id = c.req.param("id");
    const project = await kv.get(`project:${id}`);
    if (!project) return err(c, "Projeto não encontrado", 404);
    const now = new Date().toISOString();
    if (project.budget) { project.budget.status = "paid"; project.budget.paidAt = now; }
    if (project.status === "orcamento") { project.status = "producao"; project.steps.push({ status: "producao", date: now, note: "Pagamento confirmado manualmente pelo administrador" }); }
    project.updatedAt = now;
    await kv.set(`project:${id}`, project);
    return c.json({ success: true, project });
  } catch (e) { return err(c, `Erro ao confirmar pagamento: ${e}`); }
});

// GENERATE REMAINDER PAYMENT (for partial deposit projects)
app.post(`${P}/admin/projects/:id/generate-remainder`, async (c) => {
  try {
    const auth = await verifyAdmin(c.req.raw);
    if (!auth) return err(c, "Não autorizado", 401);
    const id = c.req.param("id");
    const project = await kv.get(`project:${id}`);
    if (!project) return err(c, "Projeto não encontrado", 404);
    if (!project.budget) return err(c, "Orçamento não encontrado", 404);
    const dp = project.budget.depositPercent || 0;
    if (dp <= 0 || dp >= 100) return err(c, "Este projeto não possui entrada parcial", 400);
    if (project.budget.remainderStatus === "paid") return err(c, "O restante já foi pago", 400);
    const chargeAmount = project.budget.chargeAmount || 0;
    const remainderAmount = Math.round((project.budget.price - chargeAmount) * 100) / 100;
    if (remainderAmount <= 0) return err(c, "Valor restante inválido", 400);
    const mpToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!mpToken) return err(c, "Token do Mercado Pago não configurado");
    const siteUrl = "https://editoraepoca.com.br";
    const itemDesc = `Saldo restante (${100 - dp}%) — ${project.budget.description || `Serviço editorial para "${project.title}"`}`;
    const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${mpToken}` },
      body: JSON.stringify({
        items: [{ title: `Época Editora — ${project.title} (Saldo)`, description: itemDesc, quantity: 1, currency_id: "BRL", unit_price: remainderAmount }],
        back_urls: { success: `${siteUrl}/minha-conta?payment=remainder-success&project=${id}`, failure: `${siteUrl}/minha-conta?payment=remainder-failure&project=${id}`, pending: `${siteUrl}/minha-conta?payment=remainder-pending&project=${id}` },
        auto_return: "approved", external_reference: `${id}-remainder`,
        notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/${P.slice(1)}/webhooks/mercadopago?apikey=${Deno.env.get("SUPABASE_ANON_KEY")}`,
      }),
    });
    const mpData = await mpRes.json();
    if (!mpRes.ok) return err(c, `Erro ao criar link de pagamento do restante: ${mpData.message || JSON.stringify(mpData)}`);
    const now = new Date().toISOString();
    project.budget.remainderStatus = "pending";
    project.budget.remainderPaymentUrl = mpData.init_point;
    project.budget.remainderSandboxUrl = mpData.sandbox_init_point;
    project.budget.remainderPreferenceId = mpData.id;
    project.budget.remainderAmount = remainderAmount;
    project.budget.remainderGeneratedAt = now;
    project.budget.remainderGeneratedBy = auth.email;
    project.steps.push({ status: project.status, date: now, note: `Cobrança do restante gerada: R$ ${remainderAmount.toFixed(2).replace(".", ",")}` });
    project.updatedAt = now;
    await kv.set(`project:${id}`, project);
    console.log(`Remainder payment generated for project ${id}: R$ ${remainderAmount.toFixed(2)} by ${auth.email}`);
    return c.json({ success: true, project, remainderPaymentUrl: mpData.init_point, remainderAmount });
  } catch (e) { return err(c, `Erro ao gerar cobrança do restante: ${e}`); }
});

// CONFIRM REMAINDER PAYMENT (admin manual)
app.post(`${P}/admin/projects/:id/confirm-remainder`, async (c) => {
  try {
    const auth = await verifyAdmin(c.req.raw);
    if (!auth) return err(c, "Não autorizado", 401);
    const id = c.req.param("id");
    const project = await kv.get(`project:${id}`);
    if (!project) return err(c, "Projeto não encontrado", 404);
    if (!project.budget) return err(c, "Orçamento não encontrado", 404);
    const now = new Date().toISOString();
    project.budget.remainderStatus = "paid";
    project.budget.remainderPaidAt = now;
    project.budget.status = "fully_paid";
    const remainderVal = project.budget.remainderAmount || Math.round((project.budget.price - (project.budget.chargeAmount || 0)) * 100) / 100;
    project.steps.push({ status: project.status, date: now, note: `Pagamento do restante (R$ ${remainderVal.toFixed(2).replace(".", ",")}) confirmado manualmente — pagamento total concluído` });
    project.updatedAt = now;
    await kv.set(`project:${id}`, project);
    console.log(`Remainder payment confirmed for project ${id} by ${auth.email}. Budget fully paid.`);
    return c.json({ success: true, project });
  } catch (e) { return err(c, `Erro ao confirmar pagamento do restante: ${e}`); }
});

// ============================================
// INSTALLMENT PLAN (PIX)
// ============================================
app.post(`${P}/admin/projects/:id/installment-plan`, async (c) => {
  try {
    const auth = await verifyAdmin(c.req.raw);
    if (!auth) return err(c, "Não autorizado", 401);
    const id = c.req.param("id");
    const project = await kv.get(`project:${id}`);
    if (!project) return err(c, "Projeto não encontrado", 404);
    if (!project.budget) return err(c, "Orçamento não encontrado", 404);
    const body = await c.req.json();
    const { totalInstallments, installments, requireContract } = body;
    if (!totalInstallments || !installments || !Array.isArray(installments) || installments.length !== totalInstallments) {
      return err(c, "Dados de parcelamento inválidos", 400);
    }
    // Validate each installment
    for (const inst of installments) {
      if (!inst.amount || inst.amount <= 0 || !inst.dueDate) {
        return err(c, "Cada parcela deve ter valor e data de vencimento", 400);
      }
    }
    const now = new Date().toISOString();
    project.budget.installmentPlan = {
      enabled: true,
      totalInstallments,
      requireContract: !!requireContract,
      installments: installments.map((inst: any, idx: number) => ({
        number: idx + 1,
        amount: Math.round(inst.amount * 100) / 100,
        dueDate: inst.dueDate,
        status: "pending",
      })),
      createdAt: now,
      createdBy: auth.email,
    };
    project.steps.push({ status: project.status, date: now, note: `Plano de parcelamento PIX criado: ${totalInstallments}x parcelas` });
    project.updatedAt = now;
    await kv.set(`project:${id}`, project);
    console.log(`Installment plan created for project ${id}: ${totalInstallments} installments by ${auth.email}`);

    // AUTO-GENERATE PIX for first installment
    let firstPixResult: any = null;
    try {
      const mpToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
      if (mpToken) {
        const firstInst = project.budget.installmentPlan.installments[0];
        const desc = `Época Editora — ${project.title} — Parcela 1/${totalInstallments}`;
        const expDate = new Date(firstInst.dueDate + "T23:59:59-03:00").toISOString();
        const pixBody = {
          transaction_amount: firstInst.amount,
          description: desc,
          payment_method_id: "pix",
          payer: { email: project.userEmail || "cliente@email.com" },
          external_reference: `${id}-installment-1`,
          date_of_expiration: expDate,
          notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/${P.slice(1)}/webhooks/mercadopago?apikey=${Deno.env.get("SUPABASE_ANON_KEY")}`,
        };
        const mpRes = await fetch("https://api.mercadopago.com/v1/payments", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${mpToken}`, "X-Idempotency-Key": `${id}-inst-1-auto-${Date.now()}` },
          body: JSON.stringify(pixBody),
        });
        const mpData = await mpRes.json();
        if (mpRes.ok) {
          firstInst.pixCode = mpData.point_of_interaction?.transaction_data?.qr_code || null;
          firstInst.pixQrCode = mpData.point_of_interaction?.transaction_data?.qr_code_base64 || null;
          firstInst.paymentId = String(mpData.id);
          firstInst.generatedAt = now;
          await kv.set(`project:${id}`, project);
          firstPixResult = { pixCode: firstInst.pixCode, pixQrCode: firstInst.pixQrCode };
          console.log(`Auto-generated PIX for first installment of project ${id}: paymentId=${mpData.id}`);
        } else {
          console.log(`Failed to auto-generate first PIX for project ${id}: ${mpData.message || JSON.stringify(mpData)}`);
        }
      }
    } catch (pixErr) {
      console.log(`Error auto-generating first PIX for project ${id}: ${pixErr}`);
    }

    return c.json({ success: true, project, firstPix: firstPixResult });
  } catch (e) { return err(c, `Erro ao criar plano de parcelamento: ${e}`); }
});

app.delete(`${P}/admin/projects/:id/installment-plan`, async (c) => {
  try {
    const auth = await verifyAdmin(c.req.raw);
    if (!auth) return err(c, "Não autorizado", 401);
    const id = c.req.param("id");
    const project = await kv.get(`project:${id}`);
    if (!project) return err(c, "Projeto não encontrado", 404);
    if (!project.budget?.installmentPlan) return err(c, "Sem plano de parcelamento", 400);
    const hasPaidInst = project.budget.installmentPlan.installments?.some((i: any) => i.status === "paid");
    if (hasPaidInst) return err(c, "Não é possível excluir um plano com parcelas já pagas", 400);
    const now = new Date().toISOString();
    project.budget.installmentPlan = null;
    project.steps.push({ status: project.status, date: now, note: "Plano de parcelamento PIX removido" });
    project.updatedAt = now;
    await kv.set(`project:${id}`, project);
    return c.json({ success: true, project });
  } catch (e) { return err(c, `Erro ao excluir plano de parcelamento: ${e}`); }
});

app.post(`${P}/admin/projects/:id/installments/:num/generate-pix`, async (c) => {
  try {
    const auth = await verifyAdmin(c.req.raw);
    if (!auth) return err(c, "Não autorizado", 401);
    const id = c.req.param("id");
    const num = parseInt(c.req.param("num"), 10);
    const project = await kv.get(`project:${id}`);
    if (!project) return err(c, "Projeto não encontrado", 404);
    if (!project.budget?.installmentPlan?.installments) return err(c, "Sem plano de parcelamento", 400);
    const inst = project.budget.installmentPlan.installments.find((i: any) => i.number === num);
    if (!inst) return err(c, `Parcela ${num} não encontrada`, 404);
    if (inst.status === "paid") return err(c, "Parcela já paga", 400);
    const mpToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!mpToken) return err(c, "Token do Mercado Pago não configurado");
    // Create PIX payment via MP
    const desc = `Época Editora — ${project.title} — Parcela ${num}/${project.budget.installmentPlan.totalInstallments}`;
    const expDate = new Date(inst.dueDate + "T23:59:59-03:00").toISOString();
    const pixBody = {
      transaction_amount: inst.amount,
      description: desc,
      payment_method_id: "pix",
      payer: { email: project.userEmail || "cliente@email.com" },
      external_reference: `${id}-installment-${num}`,
      date_of_expiration: expDate,
      notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/${P.slice(1)}/webhooks/mercadopago?apikey=${Deno.env.get("SUPABASE_ANON_KEY")}`,
    };
    const mpRes = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${mpToken}`, "X-Idempotency-Key": `${id}-inst-${num}-${Date.now()}` },
      body: JSON.stringify(pixBody),
    });
    const mpData = await mpRes.json();
    if (!mpRes.ok) return err(c, `Erro ao gerar PIX: ${mpData.message || JSON.stringify(mpData)}`);
    const now = new Date().toISOString();
    inst.pixCode = mpData.point_of_interaction?.transaction_data?.qr_code || null;
    inst.pixQrCode = mpData.point_of_interaction?.transaction_data?.qr_code_base64 || null;
    inst.paymentId = String(mpData.id);
    inst.generatedAt = now;
    project.updatedAt = now;
    await kv.set(`project:${id}`, project);
    console.log(`PIX generated for project ${id} installment ${num}: paymentId=${mpData.id}`);
    return c.json({ success: true, project, pixCode: inst.pixCode, pixQrCode: inst.pixQrCode });
  } catch (e) { return err(c, `Erro ao gerar PIX da parcela: ${e}`); }
});

app.post(`${P}/admin/projects/:id/installments/:num/confirm`, async (c) => {
  try {
    const auth = await verifyAdmin(c.req.raw);
    if (!auth) return err(c, "Não autorizado", 401);
    const id = c.req.param("id");
    const num = parseInt(c.req.param("num"), 10);
    const project = await kv.get(`project:${id}`);
    if (!project) return err(c, "Projeto não encontrado", 404);
    if (!project.budget?.installmentPlan?.installments) return err(c, "Sem plano de parcelamento", 400);
    const inst = project.budget.installmentPlan.installments.find((i: any) => i.number === num);
    if (!inst) return err(c, `Parcela ${num} não encontrada`, 404);
    if (inst.status === "paid") return err(c, "Parcela já paga", 400);
    const now = new Date().toISOString();
    inst.status = "paid";
    inst.paidAt = now;
    const total = project.budget.installmentPlan.totalInstallments;
    const paidCount = project.budget.installmentPlan.installments.filter((i: any) => i.status === "paid").length;
    const allPaid = paidCount === total;
    if (allPaid) {
      project.budget.status = "fully_paid";
      project.steps.push({ status: project.status, date: now, note: `Todas as ${total} parcelas PIX foram pagas — pagamento total concluído` });
    } else {
      project.steps.push({ status: project.status, date: now, note: `Parcela ${num}/${total} (R$ ${inst.amount.toFixed(2).replace(".", ",")}) confirmada manualmente (${paidCount}/${total} pagas)` });
    }
    // Move to producao if still in orcamento and at least first installment is paid
    if (project.status === "orcamento" && paidCount >= 1) {
      project.budget.status = project.budget.status === "fully_paid" ? "fully_paid" : "paid";
      project.budget.paidAt = project.budget.paidAt || now;
      project.status = "producao";
      project.steps.push({ status: "producao", date: now, note: "Primeira parcela confirmada — produção iniciada" });
    }
    project.updatedAt = now;
    await kv.set(`project:${id}`, project);
    console.log(`Installment ${num}/${total} confirmed for project ${id} by ${auth.email}. (${paidCount}/${total} paid)`);
    return c.json({ success: true, project });
  } catch (e) { return err(c, `Erro ao confirmar parcela: ${e}`); }
});

// Client: get installments for their project
app.get(`${P}/projects/:id/installments`, async (c) => {
  try {
    const auth = await verifyAuth(c.req.raw);
    if (!auth) return err(c, "Não autenticado", 401);
    const pid = c.req.param("id");
    const project = await kv.get(`project:${pid}`);
    if (!project) return err(c, "Projeto não encontrado", 404);
    if (project.userId !== auth.userId) return err(c, "Acesso negado", 403);
    if (!project.budget?.installmentPlan?.enabled) return c.json({ installments: null });
    return c.json({
      installmentPlan: {
        ...project.budget.installmentPlan,
        totalPrice: project.budget.price,
      },
    });
  } catch (e) { return err(c, `Erro ao buscar parcelas: ${e}`); }
});

// Client: generate payoff PIX (quitar saldo restante de uma vez)
app.post(`${P}/projects/:id/installment-payoff`, async (c) => {
  try {
    const auth = await verifyAuth(c.req.raw);
    if (!auth) return err(c, "Não autenticado", 401);
    const pid = c.req.param("id");
    const project = await kv.get(`project:${pid}`);
    if (!project) return err(c, "Projeto não encontrado", 404);
    if (project.userId !== auth.userId) return err(c, "Acesso negado", 403);
    if (!project.budget?.installmentPlan?.enabled) return err(c, "Sem plano de parcelamento", 400);
    const pendingInsts = project.budget.installmentPlan.installments.filter((i: any) => i.status !== "paid");
    if (pendingInsts.length === 0) return err(c, "Todas as parcelas já estão pagas", 400);
    const payoffAmount = Math.round(pendingInsts.reduce((s: number, i: any) => s + i.amount, 0) * 100) / 100;
    if (payoffAmount <= 0) return err(c, "Valor de quitação inválido", 400);
    const mpToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!mpToken) return err(c, "Token do Mercado Pago não configurado");
    const now = new Date().toISOString();
    const desc = `Época Editora — ${project.title} — Quitação de ${pendingInsts.length} parcela(s) restante(s)`;
    // Use last pending installment due date as expiration
    const lastDueDate = pendingInsts[pendingInsts.length - 1].dueDate;
    const expDate = new Date(lastDueDate + "T23:59:59-03:00").toISOString();
    const pixBody = {
      transaction_amount: payoffAmount,
      description: desc,
      payment_method_id: "pix",
      payer: { email: project.userEmail || "cliente@email.com" },
      external_reference: `${pid}-payoff`,
      date_of_expiration: expDate,
      notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/${P.slice(1)}/webhooks/mercadopago?apikey=${Deno.env.get("SUPABASE_ANON_KEY")}`,
    };
    const mpRes = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${mpToken}`, "X-Idempotency-Key": `${pid}-payoff-${Date.now()}` },
      body: JSON.stringify(pixBody),
    });
    const mpData = await mpRes.json();
    if (!mpRes.ok) return err(c, `Erro ao gerar PIX de quitação: ${mpData.message || JSON.stringify(mpData)}`);
    // Store payoff info
    project.budget.installmentPlan.payoff = {
      amount: payoffAmount,
      installmentsCovered: pendingInsts.map((i: any) => i.number),
      pixCode: mpData.point_of_interaction?.transaction_data?.qr_code || null,
      pixQrCode: mpData.point_of_interaction?.transaction_data?.qr_code_base64 || null,
      paymentId: String(mpData.id),
      generatedAt: now,
      status: "pending",
    };
    project.updatedAt = now;
    await kv.set(`project:${pid}`, project);
    console.log(`Payoff PIX generated for project ${pid}: R$${payoffAmount} covering ${pendingInsts.length} installments, paymentId=${mpData.id}`);
    return c.json({ success: true, payoff: project.budget.installmentPlan.payoff });
  } catch (e) { return err(c, `Erro ao gerar PIX de quitação: ${e}`); }
});

// Client: regenerate PIX for a specific installment (if expired or broken)
app.post(`${P}/projects/:id/installments/:num/regenerate-pix`, async (c) => {
  try {
    const auth = await verifyAuth(c.req.raw);
    if (!auth) return err(c, "Não autenticado", 401);
    const pid = c.req.param("id");
    const num = parseInt(c.req.param("num"), 10);
    const project = await kv.get(`project:${pid}`);
    if (!project) return err(c, "Projeto não encontrado", 404);
    if (project.userId !== auth.userId) return err(c, "Acesso negado", 403);
    if (!project.budget?.installmentPlan?.installments) return err(c, "Sem plano de parcelamento", 400);
    const inst = project.budget.installmentPlan.installments.find((i: any) => i.number === num);
    if (!inst) return err(c, `Parcela ${num} não encontrada`, 404);
    if (inst.status === "paid") return err(c, "Parcela já paga", 400);
    const mpToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!mpToken) return err(c, "Token do Mercado Pago não configurado");
    const total = project.budget.installmentPlan.totalInstallments;
    const desc = `Época Editora — ${project.title} — Parcela ${num}/${total}`;
    const dueDateMs = new Date(inst.dueDate + "T23:59:59-03:00").getTime();
    const in24h = Date.now() + 24 * 60 * 60 * 1000;
    const expDate = new Date(Math.max(dueDateMs, in24h)).toISOString();
    const pixBody = {
      transaction_amount: inst.amount,
      description: desc,
      payment_method_id: "pix",
      payer: { email: project.userEmail || "cliente@email.com" },
      external_reference: `${pid}-installment-${num}`,
      date_of_expiration: expDate,
      notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/${P.slice(1)}/webhooks/mercadopago?apikey=${Deno.env.get("SUPABASE_ANON_KEY")}`,
    };
    const mpRes = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${mpToken}`, "X-Idempotency-Key": `${pid}-inst-${num}-regen-${Date.now()}` },
      body: JSON.stringify(pixBody),
    });
    const mpData = await mpRes.json();
    if (!mpRes.ok) return err(c, `Erro ao regenerar PIX: ${mpData.message || JSON.stringify(mpData)}`);
    const now = new Date().toISOString();
    inst.pixCode = mpData.point_of_interaction?.transaction_data?.qr_code || null;
    inst.pixQrCode = mpData.point_of_interaction?.transaction_data?.qr_code_base64 || null;
    inst.paymentId = String(mpData.id);
    inst.generatedAt = now;
    inst.regeneratedAt = now;
    project.updatedAt = now;
    await kv.set(`project:${pid}`, project);
    console.log(`PIX regenerated for project ${pid} installment ${num} by user ${auth.userId}: paymentId=${mpData.id}`);
    return c.json({ success: true, pixCode: inst.pixCode, pixQrCode: inst.pixQrCode });
  } catch (e) { return err(c, `Erro ao regenerar PIX da parcela: ${e}`); }
});

// Client: regenerate payoff PIX (if expired or broken)
app.post(`${P}/projects/:id/installment-payoff-regenerate`, async (c) => {
  try {
    const auth = await verifyAuth(c.req.raw);
    if (!auth) return err(c, "Não autenticado", 401);
    const pid = c.req.param("id");
    const project = await kv.get(`project:${pid}`);
    if (!project) return err(c, "Projeto não encontrado", 404);
    if (project.userId !== auth.userId) return err(c, "Acesso negado", 403);
    if (!project.budget?.installmentPlan?.enabled) return err(c, "Sem plano de parcelamento", 400);
    const pendingInsts = project.budget.installmentPlan.installments.filter((i: any) => i.status !== "paid");
    if (pendingInsts.length === 0) return err(c, "Todas as parcelas já estão pagas", 400);
    const payoffAmount = Math.round(pendingInsts.reduce((s: number, i: any) => s + i.amount, 0) * 100) / 100;
    if (payoffAmount <= 0) return err(c, "Valor de quitação inválido", 400);
    const mpToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!mpToken) return err(c, "Token do Mercado Pago não configurado");
    const now = new Date().toISOString();
    const desc = `Época Editora — ${project.title} — Quitação de ${pendingInsts.length} parcela(s) restante(s)`;
    const lastDueDate = pendingInsts[pendingInsts.length - 1].dueDate;
    const dueDateMs = new Date(lastDueDate + "T23:59:59-03:00").getTime();
    const in24h = Date.now() + 24 * 60 * 60 * 1000;
    const expDate = new Date(Math.max(dueDateMs, in24h)).toISOString();
    const pixBody = {
      transaction_amount: payoffAmount,
      description: desc,
      payment_method_id: "pix",
      payer: { email: project.userEmail || "cliente@email.com" },
      external_reference: `${pid}-payoff`,
      date_of_expiration: expDate,
      notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/${P.slice(1)}/webhooks/mercadopago?apikey=${Deno.env.get("SUPABASE_ANON_KEY")}`,
    };
    const mpRes = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${mpToken}`, "X-Idempotency-Key": `${pid}-payoff-regen-${Date.now()}` },
      body: JSON.stringify(pixBody),
    });
    const mpData = await mpRes.json();
    if (!mpRes.ok) return err(c, `Erro ao regenerar PIX de quitação: ${mpData.message || JSON.stringify(mpData)}`);
    project.budget.installmentPlan.payoff = {
      amount: payoffAmount,
      installmentsCovered: pendingInsts.map((i: any) => i.number),
      pixCode: mpData.point_of_interaction?.transaction_data?.qr_code || null,
      pixQrCode: mpData.point_of_interaction?.transaction_data?.qr_code_base64 || null,
      paymentId: String(mpData.id),
      generatedAt: now,
      regeneratedAt: now,
      status: "pending",
    };
    project.updatedAt = now;
    await kv.set(`project:${pid}`, project);
    console.log(`Payoff PIX regenerated for project ${pid} by user ${auth.userId}: R$${payoffAmount}, paymentId=${mpData.id}`);
    return c.json({ success: true, payoff: project.budget.installmentPlan.payoff });
  } catch (e) { return err(c, `Erro ao regenerar PIX de quitação: ${e}`); }
});

// Public: get installment checkout info (no auth needed, like payment page)
app.get(`${P}/installment-checkout/:id`, async (c) => {
  try {
    const id = c.req.param("id");
    const project = await kv.get(`project:${id}`);
    if (!project) return err(c, "Projeto não encontrado", 404);
    if (!project.budget) return err(c, "Orçamento não disponível", 404);
    if (!project.budget.installmentPlan?.enabled) return err(c, "Sem plano de parcelamento ativo", 404);
    const plan = project.budget.installmentPlan;
    const installmentTotal = plan.installments.reduce((s: number, i: any) => s + i.amount, 0);
    const paidAmount = plan.installments.filter((i: any) => i.status === "paid").reduce((s: number, i: any) => s + i.amount, 0);
    const pendingAmount = Math.round((installmentTotal - paidAmount) * 100) / 100;
    const contract = project.budget.contractAcceptance || null;
    const dp = project.budget.depositPercent || 0;
    const chargeAmt = project.budget.chargeAmount || project.budget.price;
    return c.json({
      projectId: id,
      title: project.title,
      author: project.author,
      userName: project.userName || "",
      description: project.description || "",
      format: project.format || "",
      pageCount: project.pageCount || null,
      services: project.services || [],
      notes: project.notes || "",
      fullPrice: project.budget.price,
      totalPrice: Math.round(installmentTotal * 100) / 100,
      depositPercent: dp,
      chargeAmount: chargeAmt,
      depositStatus: (dp > 0 && dp < 100) ? (project.budget.status === "paid" || project.budget.status === "fully_paid" ? "paid" : "pending") : null,
      depositPaidAt: (dp > 0 && dp < 100) ? (project.budget.paidAt || null) : null,
      depositPaymentUrl: (dp > 0 && dp < 100) ? (project.budget.paymentUrl || null) : null,
      depositSandboxUrl: (dp > 0 && dp < 100) ? (project.budget.sandboxUrl || null) : null,
      paidAmount: Math.round(paidAmount * 100) / 100,
      pendingAmount,
      budgetStatus: project.budget.status,
      budgetDescription: project.budget.description || "",
      customClauses: project.budget.customClauses || null,
      estimatedDeadline: project.budget.estimatedDeadline || null,
      requireContract: !!plan.requireContract,
      contractAccepted: !!contract,
      contractAcceptedAt: contract?.acceptedAt || null,
      contractAcceptorName: contract?.acceptorName || null,
      contractAcceptorEmail: contract?.acceptorEmail || null,
      contractAcceptorCpf: contract?.acceptorCpf || null,
      contractHash: contract?.contractHash || null,
      installmentPlan: {
        totalInstallments: plan.totalInstallments,
        requireContract: !!plan.requireContract,
        installments: plan.installments.map((i: any) => ({
          number: i.number,
          amount: i.amount,
          dueDate: i.dueDate,
          status: i.status,
          paidAt: i.paidAt || null,
          pixCode: i.pixCode || null,
          pixQrCode: i.pixQrCode || null,
          generatedAt: i.generatedAt || null,
        })),
        payoff: plan.payoff || null,
        createdAt: plan.createdAt,
      },
    });
  } catch { return err(c, "Erro ao buscar dados de parcelamento"); }
});

// TRANSPARENT CHECKOUT
app.get(`${P}/payment/:id`, async (c) => {
  try {
    const id = c.req.param("id");
    const project = await kv.get(`project:${id}`);
    if (!project) return err(c, "Projeto não encontrado", 404);
    if (!project.budget) return err(c, "Orçamento não disponível", 404);
    const dp = project.budget.depositPercent || 0;
    const chargeAmount = project.budget.chargeAmount || project.budget.price;
    const remainderAmount = dp > 0 && dp < 100 ? Math.round((project.budget.price - chargeAmount) * 100) / 100 : 0;
    const contract = project.budget.contractAcceptance || null;
    return c.json({
      projectId: id, title: project.title, author: project.author,
      description: project.description || "", format: project.format || "",
      pageCount: project.pageCount || null, services: project.services || [],
      notes: project.notes || "", userName: project.userName || "",
      budgetDescription: project.budget.description,
      price: project.budget.price, depositPercent: dp, chargeAmount, remainderAmount,
      budgetStatus: project.budget.status, paidAt: project.budget.paidAt,
      publicKey: Deno.env.get("MERCADO_PAGO_PUBLIC_KEY") || null,
      preferenceId: project.budget.preferenceId,
      contractAccepted: !!contract,
      contractAcceptedAt: contract?.acceptedAt || null,
      contractAcceptorName: contract?.acceptorName || null,
      contractAcceptorEmail: contract?.acceptorEmail || null,
      contractAcceptorCpf: contract?.acceptorCpf || null,
      customClauses: project.budget.customClauses || null,
      estimatedDeadline: project.budget.estimatedDeadline || null,
      contractPdfName: project.budget.contractPdfName || null,
      hasContractPdf: !!project.budget.contractPdfPath,
      contractHash: contract?.contractHash || null,
      installmentPlan: project.budget.installmentPlan || null,
    });
  } catch { return err(c, "Erro ao buscar informações de pagamento"); }
});

// CONTRACT ACCEPTANCE
app.post(`${P}/payment/:id/accept-contract`, async (c) => {
  try {
    const id = c.req.param("id");
    const project = await kv.get(`project:${id}`);
    if (!project) return err(c, "Projeto não encontrado", 404);
    if (!project.budget) return err(c, "Orçamento não disponível", 404);
    const body = await c.req.json();
    const { contractVersion, acceptorName, acceptorEmail, acceptorCpf, contractHash, contractSnapshot, geolocation, screenResolution } = body;
    if (!contractVersion || !acceptorName || !acceptorEmail) return err(c, "Dados de aceite incompletos", 400);
    const now = new Date().toISOString();
    const ip = c.req.header("x-forwarded-for") || c.req.header("cf-connecting-ip") || "unknown";
    const ua = c.req.header("user-agent") || "unknown";
    project.budget.contractAcceptance = {
      contractVersion,
      acceptedAt: now,
      acceptorName: acceptorName.trim(),
      acceptorEmail: acceptorEmail.trim().toLowerCase(),
      acceptorCpf: acceptorCpf || null,
      ip,
      userAgent: ua,
      // Security enhancements
      contractHash: contractHash || null,
      geolocation: geolocation || null,
      screenResolution: screenResolution || null,
    };
    project.updatedAt = now;

    // Store immutable contract snapshot separately (can be large)
    if (contractSnapshot) {
      await kv.set(`contract-snapshot:${id}`, {
        projectId: id,
        html: contractSnapshot,
        hash: contractHash || null,
        acceptedAt: now,
        acceptorName: acceptorName.trim(),
        acceptorEmail: acceptorEmail.trim().toLowerCase(),
        acceptorCpf: acceptorCpf || null,
        ip,
        userAgent: ua,
        geolocation: geolocation || null,
        screenResolution: screenResolution || null,
      });
    }

    await kv.set(`project:${id}`, project);
    console.log(`Contract accepted for project ${id} by ${acceptorEmail} at ${now} from IP ${ip} | hash=${contractHash || "n/a"}`);
    return c.json({ success: true, acceptedAt: now, contractHash: contractHash || null });
  } catch (e) { return err(c, `Erro ao registrar aceite do contrato: ${e}`); }
});

// CONTRACT SNAPSHOT (admin: view stored snapshot)
app.get(`${P}/admin/contract-snapshot/:id`, async (c) => {
  try {
    const id = c.req.param("id");
    const snapshot = await kv.get(`contract-snapshot:${id}`);
    if (!snapshot) return err(c, "Snapshot do contrato não encontrado", 404);
    return c.json(snapshot);
  } catch (e) { return err(c, `Erro ao buscar snapshot do contrato: ${e}`); }
});

app.post(`${P}/payment/:id/process`, async (c) => {
  try {
    const id = c.req.param("id");
    const project = await kv.get(`project:${id}`);
    if (!project) return err(c, "Projeto não encontrado", 404);
    if (!project.budget) return err(c, "Orçamento não disponível", 404);
    if (project.budget.status === "paid" || project.budget.status === "fully_paid") return err(c, "Pagamento já realizado", 400);
    if (!project.budget.contractAcceptance) return err(c, "É necessário aceitar o contrato de prestação de serviços antes de efetuar o pagamento", 400);
    const mpToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!mpToken) return err(c, "Token do Mercado Pago não configurado");
    const body = await c.req.json();
    const { payment_method_id, token, installments, payer, issuer_id } = body;
    if (!payment_method_id || !payer?.email) return err(c, "Dados incompletos", 400);
    const actualAmount = project.budget.chargeAmount || project.budget.price;
    const pb: any = { transaction_amount: actualAmount, description: project.budget.description || `Época Editora — ${project.title}`, payment_method_id, installments: installments || 1, payer: { email: payer.email, first_name: payer.first_name || undefined, last_name: payer.last_name || undefined, identification: payer.identification || undefined }, external_reference: id, notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/${P.slice(1)}/webhooks/mercadopago?apikey=${Deno.env.get("SUPABASE_ANON_KEY")}` };
    if (token) pb.token = token;
    if (issuer_id) pb.issuer_id = issuer_id;
    const mpRes = await fetch("https://api.mercadopago.com/v1/payments", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${mpToken}`, "X-Idempotency-Key": `${id}-${Date.now()}` }, body: JSON.stringify(pb) });
    const mpData = await mpRes.json();
    if (!mpRes.ok) return err(c, mpData.message || "Erro ao processar pagamento");
    // Always save the paymentId so check-status can find it later
    if (mpData.id && !project.budget.paymentId) {
      project.budget.paymentId = String(mpData.id);
    }
    if (mpData.status === "approved") {
      const now = new Date().toISOString();
      project.budget.status = "paid"; project.budget.paidAt = now;
      if (project.status === "orcamento") { project.status = "producao"; project.steps.push({ status: "producao", date: now, note: "Pagamento confirmado — produção iniciada" }); }
    }
    project.updatedAt = new Date().toISOString();
    await kv.set(`project:${id}`, project);
    console.log(`ProcessPayment: project ${id} paymentId=${mpData.id} status=${mpData.status}`);
    return c.json({ status: mpData.status, status_detail: mpData.status_detail, id: mpData.id, payment_method_id: mpData.payment_method_id, point_of_interaction: mpData.point_of_interaction || null, transaction_details: mpData.transaction_details || null, date_of_expiration: mpData.date_of_expiration || null });
  } catch (e) { return err(c, `Erro ao processar pagamento: ${e}`); }
});

// CHECK PAYMENT STATUS (polls MercadoPago directly — fallback when webhook doesn't arrive)
app.get(`${P}/payment/:id/check-status`, async (c) => {
  try {
    const id = c.req.param("id");
    const project = await kv.get(`project:${id}`);
    if (!project) return err(c, "Projeto não encontrado", 404);
    if (!project.budget) return err(c, "Orçamento não disponível", 404);

    // Already paid? Return immediately
    if (project.budget.status === "paid" || project.budget.status === "fully_paid") {
      return c.json({ status: "paid", paidAt: project.budget.paidAt });
    }

    // No paymentId yet? Try searching by external_reference
    const mpToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!mpToken) return c.json({ status: project.budget.status });

    // If we have a paymentId, check that specific payment
    if (project.budget.paymentId) {
      const pr = await fetch(`https://api.mercadopago.com/v1/payments/${project.budget.paymentId}`, {
        headers: { Authorization: `Bearer ${mpToken}` },
      });
      const pd = await pr.json();
      console.log(`Check-status: payment ${project.budget.paymentId} status=${pd.status}`);

      if (pd.status === "approved" && project.budget.status !== "paid" && project.budget.status !== "fully_paid") {
        const now = new Date().toISOString();
        project.budget.status = "paid";
        project.budget.paidAt = now;
        if (project.status === "orcamento") {
          project.status = "producao";
          project.steps.push({ status: "producao", date: now, note: "Pagamento confirmado — produção iniciada" });
        }
        project.updatedAt = now;
        await kv.set(`project:${id}`, project);
        console.log(`Check-status: project ${id} updated to paid`);
        return c.json({ status: "paid", paidAt: now });
      }
      return c.json({ status: pd.status, status_detail: pd.status_detail });
    }

    // Search for payments by external_reference
    const searchUrl = `https://api.mercadopago.com/v1/payments/search?external_reference=${id}&sort=date_created&criteria=desc&limit=5`;
    const sr = await fetch(searchUrl, { headers: { Authorization: `Bearer ${mpToken}` } });
    const sd = await sr.json();
    console.log(`Check-status: search for ref=${id} found ${sd.results?.length || 0} payments`);

    if (sd.results && sd.results.length > 0) {
      const approved = sd.results.find((p: any) => p.status === "approved");
      if (approved) {
        const now = new Date().toISOString();
        project.budget.status = "paid";
        project.budget.paidAt = now;
        project.budget.paymentId = String(approved.id);
        if (project.status === "orcamento") {
          project.status = "producao";
          project.steps.push({ status: "producao", date: now, note: "Pagamento confirmado — produção iniciada" });
        }
        project.updatedAt = now;
        await kv.set(`project:${id}`, project);
        console.log(`Check-status: project ${id} updated to paid via search (paymentId=${approved.id})`);
        return c.json({ status: "paid", paidAt: now });
      }
      const latest = sd.results[0];
      return c.json({ status: latest.status, status_detail: latest.status_detail });
    }

    return c.json({ status: project.budget.status });
  } catch (e) { return err(c, `Erro ao verificar status: ${e}`); }
});

// CONTRACT PDF MANAGEMENT
app.post(`${P}/admin/projects/:id/contract-pdf`, async (c) => {
  try {
    const auth = await verifyAdmin(c.req.raw);
    if (!auth) return err(c, "Não autorizado", 401);
    const pid = c.req.param("id");
    const project = await kv.get(`project:${pid}`);
    if (!project) return err(c, "Projeto não encontrado", 404);
    if (!project.budget) return err(c, "Projeto não possui orçamento", 400);
    const formData = await c.req.raw.formData();
    const file = formData.get("file") as File | null;
    if (!file) return err(c, "Nenhum arquivo enviado", 400);
    if (!file.name.toLowerCase().endsWith(".pdf")) return err(c, "Apenas arquivos PDF são permitidos", 400);
    if (file.size > 50 * 1024 * 1024) return err(c, "Arquivo excede 50 MB", 400);
    // Remove old contract PDF if exists
    if (project.budget.contractPdfPath) {
      try { await getAdminClient().storage.from(BUCKET).remove([project.budget.contractPdfPath]); } catch {}
    }
    const sp = `contracts/${pid}/${Date.now()}_${file.name}`;
    const ab = await file.arrayBuffer();
    const { error: ue } = await getAdminClient().storage.from(BUCKET).upload(sp, ab, { contentType: "application/pdf", upsert: false });
    if (ue) return err(c, `Erro ao enviar contrato: ${ue.message}`);
    project.budget.contractPdfPath = sp;
    project.budget.contractPdfName = file.name;
    project.budget.contractPdfSize = file.size;
    project.budget.contractPdfUploadedAt = new Date().toISOString();
    project.updatedAt = new Date().toISOString();
    await kv.set(`project:${pid}`, project);
    console.log(`Contract PDF uploaded for project ${pid}: ${file.name}`);
    return c.json({ success: true, name: file.name, size: file.size });
  } catch (e) { return err(c, `Erro ao enviar contrato PDF: ${e}`); }
});

app.delete(`${P}/admin/projects/:id/contract-pdf`, async (c) => {
  try {
    const auth = await verifyAdmin(c.req.raw);
    if (!auth) return err(c, "Não autorizado", 401);
    const pid = c.req.param("id");
    const project = await kv.get(`project:${pid}`);
    if (!project) return err(c, "Projeto não encontrado", 404);
    if (!project.budget?.contractPdfPath) return err(c, "Nenhum contrato PDF encontrado", 400);
    try { await getAdminClient().storage.from(BUCKET).remove([project.budget.contractPdfPath]); } catch {}
    delete project.budget.contractPdfPath;
    delete project.budget.contractPdfName;
    delete project.budget.contractPdfSize;
    delete project.budget.contractPdfUploadedAt;
    project.updatedAt = new Date().toISOString();
    await kv.set(`project:${pid}`, project);
    return c.json({ success: true });
  } catch (e) { return err(c, `Erro ao excluir contrato PDF: ${e}`); }
});

// Public: get signed URL for contract PDF download
app.get(`${P}/payment/:id/contract-pdf`, async (c) => {
  try {
    const id = c.req.param("id");
    const project = await kv.get(`project:${id}`);
    if (!project) return err(c, "Projeto não encontrado", 404);
    if (!project.budget?.contractPdfPath) return err(c, "Contrato PDF não disponível", 404);
    const sb = getAdminClient();
    const { data } = await sb.storage.from(BUCKET).createSignedUrl(project.budget.contractPdfPath, 3600);
    if (!data?.signedUrl) return err(c, "Erro ao gerar URL do contrato");
    return c.json({ url: data.signedUrl, name: project.budget.contractPdfName || "contrato.pdf" });
  } catch (e) { return err(c, `Erro ao buscar contrato PDF: ${e}`); }
});

// REVIEW FILES
app.post(`${P}/admin/projects/:id/review-upload`, async (c) => {
  try {
    const auth = await verifyAdmin(c.req.raw);
    if (!auth) return err(c, "Não autorizado", 401);
    const pid = c.req.param("id");
    const project = await kv.get(`project:${pid}`);
    if (!project) return err(c, "Projeto não encontrado", 404);
    const formData = await c.req.raw.formData();
    const file = formData.get("file") as File | null;
    if (!file) return err(c, "Nenhum arquivo enviado", 400);
    if (file.size > 100 * 1024 * 1024) return err(c, "Arquivo excede 100 MB", 400);
    const sp = `review/${pid}/${Date.now()}_${file.name}`;
    const ab = await file.arrayBuffer();
    const { error: ue } = await getAdminClient().storage.from(BUCKET).upload(sp, ab, { contentType: file.type || "application/octet-stream", upsert: false });
    if (ue) return err(c, `Erro ao enviar arquivo: ${ue.message}`);
    if (!project.reviewFiles) project.reviewFiles = [];
    project.reviewFiles.push({ name: file.name, size: file.size, path: sp, uploadedAt: new Date().toISOString(), uploadedBy: auth.email });
    project.updatedAt = new Date().toISOString();
    await kv.set(`project:${pid}`, project);
    return c.json({ success: true });
  } catch (e) { return err(c, `Erro ao enviar arquivo de revisão: ${e}`); }
});

app.get(`${P}/projects/:id/review-files`, async (c) => {
  try {
    const auth = await verifyAuth(c.req.raw);
    if (!auth) return err(c, "Não autenticado", 401);
    const pid = c.req.param("id");
    const project = await kv.get(`project:${pid}`);
    if (!project) return err(c, "Projeto não encontrado", 404);
    if (project.userId !== auth.userId) return err(c, "Acesso negado", 403);
    const rf = project.reviewFiles || [];
    if (rf.length === 0) return c.json({ files: [] });
    const sb = getAdminClient();
    const files = await Promise.all(rf.map(async (f: any) => {
      const { data } = await sb.storage.from(BUCKET).createSignedUrl(f.path, 604800);
      return { name: f.name, size: f.size, uploadedAt: f.uploadedAt, url: data?.signedUrl || null };
    }));
    return c.json({ files });
  } catch (e) { return err(c, `Erro ao buscar arquivos de revisão: ${e}`); }
});

app.post(`${P}/projects/:id/approve-review`, async (c) => {
  try {
    const auth = await verifyAuth(c.req.raw);
    if (!auth) return err(c, "Não autenticado", 401);
    const pid = c.req.param("id");
    const project = await kv.get(`project:${pid}`);
    if (!project) return err(c, "Projeto não encontrado", 404);
    if (project.userId !== auth.userId) return err(c, "Acesso negado", 403);
    if (project.status !== "revisao") return err(c, "Projeto não está na etapa de revisão", 400);
    const body = await c.req.json().catch(() => ({}));
    const observations = body.observations?.trim() || "";
    const now = new Date().toISOString();
    const noteText = observations
      ? `Revisão aprovada pelo autor. Observações: "${observations}"`
      : "Revisão aprovada pelo autor";
    project.status = "ajustes";
    project.steps.push({ status: "ajustes", date: now, note: noteText });
    if (observations) {
      project.reviewObservations = project.reviewObservations || [];
      project.reviewObservations.push({ text: observations, date: now, by: "client" });
    }
    project.reviewApprovedAt = now;
    project.reviewAcceptanceTerms = { acceptedAt: now, userId: auth.userId };
    project.updatedAt = now;
    await kv.set(`project:${pid}`, project);
    return c.json({ success: true, project });
  } catch (e) { return err(c, `Erro ao aprovar revisão: ${e}`); }
});

// INVOICES (Notas Fiscais)
app.post(`${P}/admin/projects/:id/invoice-upload`, async (c) => {
  try {
    const auth = await verifyAdmin(c.req.raw);
    if (!auth) return err(c, "Não autorizado", 401);
    const pid = c.req.param("id");
    const project = await kv.get(`project:${pid}`);
    if (!project) return err(c, "Projeto não encontrado", 404);
    const formData = await c.req.raw.formData();
    const file = formData.get("file") as File | null;
    const description = formData.get("description") as string || "";
    if (!file) return err(c, "Nenhum arquivo enviado", 400);
    if (file.size > 50 * 1024 * 1024) return err(c, "Arquivo excede 50 MB", 400);
    const sp = `invoices/${pid}/${Date.now()}_${file.name}`;
    const ab = await file.arrayBuffer();
    const { error: ue } = await getAdminClient().storage.from(BUCKET).upload(sp, ab, { contentType: file.type || "application/octet-stream", upsert: false });
    if (ue) return err(c, `Erro ao enviar nota fiscal: ${ue.message}`);
    if (!project.invoices) project.invoices = [];
    project.invoices.push({
      name: file.name,
      size: file.size,
      path: sp,
      description: description.trim(),
      uploadedAt: new Date().toISOString(),
      uploadedBy: auth.email,
    });
    project.updatedAt = new Date().toISOString();
    await kv.set(`project:${pid}`, project);
    console.log(`Invoice uploaded for project ${pid}: ${file.name} by ${auth.email}`);
    return c.json({ success: true });
  } catch (e) { return err(c, `Erro ao enviar nota fiscal: ${e}`); }
});

app.delete(`${P}/admin/projects/:id/invoice`, async (c) => {
  try {
    const auth = await verifyAdmin(c.req.raw);
    if (!auth) return err(c, "Não autorizado", 401);
    const pid = c.req.param("id");
    const project = await kv.get(`project:${pid}`);
    if (!project) return err(c, "Projeto não encontrado", 404);
    const { index } = await c.req.json();
    if (typeof index !== "number" || !project.invoices?.[index]) return err(c, "Índice inválido", 400);
    const inv = project.invoices[index];
    await getAdminClient().storage.from(BUCKET).remove([inv.path]);
    project.invoices.splice(index, 1);
    project.updatedAt = new Date().toISOString();
    await kv.set(`project:${pid}`, project);
    console.log(`Invoice deleted for project ${pid}: ${inv.name} by ${auth.email}`);
    return c.json({ success: true });
  } catch (e) { return err(c, `Erro ao excluir nota fiscal: ${e}`); }
});

// Public: user gets invoices for their project
app.get(`${P}/projects/:id/invoices`, async (c) => {
  try {
    const auth = await verifyAuth(c.req.raw);
    if (!auth) return err(c, "Não autenticado", 401);
    const pid = c.req.param("id");
    const project = await kv.get(`project:${pid}`);
    if (!project) return err(c, "Projeto não encontrado", 404);
    if (project.userId !== auth.userId) return err(c, "Acesso negado", 403);
    const invoices = project.invoices || [];
    if (invoices.length === 0) return c.json({ invoices: [] });
    const sb = getAdminClient();
    const result = await Promise.all(invoices.map(async (inv: any) => {
      const { data } = await sb.storage.from(BUCKET).createSignedUrl(inv.path, 3600);
      return { name: inv.name, size: inv.size, description: inv.description, uploadedAt: inv.uploadedAt, url: data?.signedUrl || null };
    }));
    return c.json({ invoices: result });
  } catch (e) { return err(c, `Erro ao buscar notas fiscais: ${e}`); }
});

// Init
(async () => {
  try {
    const al = await kv.get("admin_users");
    if (!al) await kv.set("admin_users", ["alexmeira@protonmail.com"]);
    const sb = getAdminClient();
    const { data: buckets } = await sb.storage.listBuckets();
    if (!buckets?.some((b: any) => b.name === BUCKET)) await sb.storage.createBucket(BUCKET, { public: false });
    initDone = true;
  } catch {}
})();

// CONTRACT TEMPLATE MANAGEMENT
const CONTRACT_TEMPLATE_KEY = "contract_template";

app.get(`${P}/admin/contract-template`, async (c) => {
  try {
    const auth = await verifyAdmin(c.req.raw);
    if (!auth) return err(c, "Não autorizado", 401);
    const template = await kv.get(CONTRACT_TEMPLATE_KEY);
    return c.json({ template: template || null });
  } catch (e) { return err(c, `Erro ao buscar template: ${e}`); }
});

app.put(`${P}/admin/contract-template`, async (c) => {
  try {
    const auth = await verifyAdmin(c.req.raw);
    if (!auth) return err(c, "Não autorizado", 401);
    const { template } = await c.req.json();
    if (!template) return err(c, "Template inválido", 400);
    const now = new Date().toISOString();

    // Auditable versioning: save previous version to history before overwriting
    const previousTemplate = await kv.get(CONTRACT_TEMPLATE_KEY);
    if (previousTemplate) {
      const historyKey = `contract-template-history:${now}`;
      await kv.set(historyKey, {
        template: previousTemplate,
        replacedAt: now,
        replacedBy: auth.email,
        version: previousTemplate.version || "unknown",
      });
    }

    template.updatedAt = now;
    template.updatedBy = auth.email;
    await kv.set(CONTRACT_TEMPLATE_KEY, template);
    console.log(`Contract template updated to v${template.version} by ${auth.email} at ${now}`);
    return c.json({ success: true });
  } catch (e) { return err(c, `Erro ao salvar template: ${e}`); }
});

// Contract template version history (auditable)
app.get(`${P}/admin/contract-template-history`, async (c) => {
  try {
    const auth = await verifyAdmin(c.req.raw);
    if (!auth) return err(c, "Não autorizado", 401);
    const entries = await kv.getByPrefix("contract-template-history:");
    // Sort by most recent first
    const sorted = (entries || []).sort((a: any, b: any) =>
      (b.replacedAt || "").localeCompare(a.replacedAt || "")
    );
    return c.json({ history: sorted });
  } catch (e) { return err(c, `Erro ao buscar histórico: ${e}`); }
});

// Public endpoint for PaymentPage to load contract template
app.get(`${P}/contract-template`, async (c) => {
  try {
    const template = await kv.get(CONTRACT_TEMPLATE_KEY);
    return c.json({ template: template || null });
  } catch { return c.json({ template: null }); }
});

// ============================================
// AUTO-MIGRATION: Seed/update contract template with latest clauses (LGPD, Foro, Disposicoes)
// ============================================
(async () => {
  try {
    const UPDATED_CLAUSES: Record<number, { title: string; content: string }> = {
      10: {
        title: "DA PROTECAO DE DADOS PESSOAIS (LGPD)",
        content: "a) A EDITORA compromete-se a tratar os dados pessoais do CONTRATANTE em conformidade com a Lei Geral de Protecao de Dados Pessoais (Lei n. 13.709/2018);\nb) Os dados pessoais coletados (nome, CPF/CNPJ, e-mail, endereco IP, geolocalizacao e dados de navegacao) tem como base legal a execucao deste contrato (art. 7, V, LGPD) e o cumprimento de obrigacao legal (art. 7, II, LGPD);\nc) A finalidade do tratamento e exclusivamente a prestacao dos servicos editoriais contratados, emissao de documentos fiscais e comunicacao sobre o andamento do projeto;\nd) Os dados serao retidos pelo periodo de 5 (cinco) anos apos a conclusao do contrato, para fins de cumprimento de obrigacoes legais e fiscais, sendo eliminados apos este periodo;\ne) O CONTRATANTE podera, a qualquer momento, exercer seus direitos de titular previstos no art. 18 da LGPD, incluindo: acesso, correcao, eliminacao, portabilidade e revogacao do consentimento, mediante solicitacao por e-mail;\nf) A EDITORA adota medidas tecnicas e administrativas adequadas para proteger os dados pessoais contra acesso nao autorizado, destruicao, perda ou alteracao;\ng) A EDITORA nao compartilha dados pessoais com terceiros, exceto quando necessario para processamento de pagamentos (Mercado Pago), emissao de notas fiscais ou por determinacao legal;\nh) O Encarregado de Dados (DPO) da EDITORA pode ser contactado pelo e-mail informado na secao de contato do site.",
      },
      11: {
        title: "DO FORO E RESOLUCAO DE CONFLITOS",
        content: "a) As partes elegem o foro da Comarca de Maringa, Estado do Parana, para dirimir quaisquer controversias oriundas deste contrato, com exclusao de qualquer outro, por mais privilegiado que seja;\nb) As partes concordam em buscar primeiramente a resolucao amigavel de eventuais conflitos, por meio de negociacao direta, no prazo de 30 (trinta) dias a contar da notificacao da parte interessada;\nc) Persistindo o impasse, as partes poderao recorrer a mediacao ou arbitragem, nos termos da Lei n. 9.307/1996, antes de ingressar com acao judicial.",
      },
      12: {
        title: "DISPOSICOES GERAIS",
        content: "a) Este contrato entra em vigor na data do aceite eletronico e permanece vigente ate a conclusao dos servicos;\nb) O aceite eletronico tem validade juridica nos termos da MP n. 2.200-2/2001 e do Codigo Civil Brasileiro;\nc) O registro do aceite inclui data, hora, endereco IP, identificacao do navegador, hash SHA-256 do conteudo e, quando autorizado, geolocalizacao do signatario;\nd) Uma copia imutavel do contrato e armazenada no momento do aceite para fins de comprovacao de integridade;\ne) Alteracoes neste contrato somente serao validas mediante acordo escrito entre as partes;\nf) Os casos omissos serao resolvidos de acordo com a legislacao brasileira vigente, em especial o Codigo Civil e o Codigo de Defesa do Consumidor, quando aplicavel.",
      },
    };

    const existing = await kv.get(CONTRACT_TEMPLATE_KEY);
    if (!existing) {
      const defaultTemplate = {
        version: "1.0",
        companyName: "Epoca Editora de Livros",
        companyDescription: "pessoa juridica de direito privado, com sede em territorio brasileiro",
        preamble: "Pelo presente instrumento particular, as partes abaixo qualificadas celebram o presente Contrato de Prestacao de Servicos Editoriais, que se regera pelas seguintes clausulas e condicoes:",
        clauses: [
          { number: 1, title: "DAS PARTES", content: "CONTRATADA: {{nome_editora}}, {{descricao_editora}}.\n\nCONTRATANTE: {{nome_contratante}}, inscrito(a) no CPF/CNPJ sob o n. {{cpf_contratante}}, e-mail {{email_contratante}}.", type: "dynamic" },
          { number: 2, title: "DO OBJETO", content: "{{servicos_lista}}\n\nObra: \"{{titulo_obra}}\", autoria de {{autor}}. Formato {{formato}}, {{paginas}} paginas.\n\n{{descricao_orcamento}}", type: "dynamic" },
          { number: 3, title: "DAS OBRIGACOES DA EDITORA", content: "a) Executar os servicos com qualidade profissional;\nb) Manter sigilo sobre conteudo e dados pessoais;\nc) Fornecer prova digital para revisao;\nd) Realizar ajustes dentro do escopo (uma rodada incluida);\ne) Entregar no prazo acordado.", type: "static" },
          { number: 4, title: "DAS OBRIGACOES DO CONTRATANTE", content: "a) Fornecer materiais em formato digital adequado;\nb) Efetuar pagamento conforme estipulado;\nc) Responder solicitacoes em ate 10 dias uteis;\nd) Revisar e aprovar prova digital em ate 15 dias uteis;\ne) Garantir direitos autorais sobre o conteudo.", type: "static" },
          { number: 5, title: "DO PRECO E CONDICOES DE PAGAMENTO", content: "Valor total: {{preco_total}}.\n\n{{detalhes_pagamento}}\n\nModalidades: Pix, cartao de credito (ate 12x) ou boleto bancario.", type: "dynamic" },
          { number: 6, title: "DO PRAZO", content: "{{prazo_conteudo}}", type: "dynamic" },
          { number: 7, title: "DA REVISAO E APROVACAO", content: "A EDITORA disponibilizara prova digital. Uma rodada de revisao incluida. Ajustes adicionais poderao ser cobrados separadamente.", type: "static" },
          { number: 8, title: "DA PROPRIEDADE INTELECTUAL", content: "Direitos autorais do conteudo permanecem com o CONTRATANTE. A EDITORA detem direitos sobre o projeto grafico, concedendo licenca irrevogavel e exclusiva.", type: "static" },
          { number: 9, title: "DA RESCISAO", content: "a) Antes do inicio: reembolso de 80%;\nb) Durante execucao: cobranca proporcional;\nc) Forca maior: reembolso integral dos servicos nao realizados.", type: "static" },
          { number: 10, ...UPDATED_CLAUSES[10], type: "static" },
          { number: 11, ...UPDATED_CLAUSES[11], type: "static" },
          { number: 12, ...UPDATED_CLAUSES[12], type: "static" },
        ],
        updatedAt: new Date().toISOString(),
        updatedBy: "sistema (migracao automatica)",
      };
      await kv.set(CONTRACT_TEMPLATE_KEY, defaultTemplate);
      console.log("[MIGRATION] Contract template seeded with LGPD/Foro/Disposicoes clauses.");
    } else if (existing.clauses) {
      const c10 = existing.clauses.find((c: any) => c.number === 10);
      const needsUpdate = c10 && (c10.title === "DA CONFIDENCIALIDADE" || !c10.title.includes("LGPD"));
      if (needsUpdate) {
        const now = new Date().toISOString();
        await kv.set(`contract-template-history:${now}`, {
          template: existing,
          replacedAt: now,
          replacedBy: "sistema (migracao automatica)",
          version: existing.version || "pre-LGPD",
        });
        existing.clauses = existing.clauses.map((c: any) => {
          if (UPDATED_CLAUSES[c.number as number]) {
            return { ...c, ...UPDATED_CLAUSES[c.number as number] };
          }
          return c;
        });
        existing.updatedAt = now;
        existing.updatedBy = "sistema (migracao LGPD/Foro)";
        await kv.set(CONTRACT_TEMPLATE_KEY, existing);
        console.log("[MIGRATION] Contract template clauses 10-12 updated (LGPD, Foro Maringa, Disposicoes).");
      } else {
        console.log("[MIGRATION] Contract template already up-to-date.");
      }
    }
  } catch (e) {
    console.log("[MIGRATION] Error during contract template migration:", e);
  }
})();

Deno.serve(app.fetch);