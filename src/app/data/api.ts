import { projectId, publicAnonKey } from "/utils/supabase/info";
import { supabase } from "./supabaseClient";
import { dedupeRequest } from "./apiCache";

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-e413165d`;

// ============================================
// ADMIN token helpers — with auto-refresh
// ============================================
export function getAdminToken(): string | null {
  return localStorage.getItem("admin_token");
}

export function setToken(token: string) {
  localStorage.setItem("admin_token", token);
}

export function setAdminRefreshToken(token: string) {
  localStorage.setItem("admin_refresh_token", token);
}

export function getAdminRefreshToken(): string | null {
  return localStorage.getItem("admin_refresh_token");
}

export function clearToken() {
  localStorage.removeItem("admin_token");
  localStorage.removeItem("admin_refresh_token");
}

/** Decode JWT payload without verification (client-side check only). */
function jwtExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    // Expire 60s before actual exp so we refresh proactively
    return Date.now() / 1000 > (payload.exp ?? 0) - 60;
  } catch {
    return true;
  }
}

/** Try to refresh the admin access token using the stored refresh token. */
async function tryRefreshAdminToken(): Promise<string | null> {
  const refreshToken = getAdminRefreshToken();
  if (!refreshToken) return null;
  try {
    const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
    if (error || !data.session) return null;
    setToken(data.session.access_token);
    if (data.session.refresh_token) setAdminRefreshToken(data.session.refresh_token);
    return data.session.access_token;
  } catch {
    return null;
  }
}

/** Get admin token, refreshing it if expired. Returns null if refresh fails (user must re-login). */
export async function getAdminTokenAsync(): Promise<string | null> {
  const token = getAdminToken();
  if (!token) return null;
  if (!jwtExpired(token)) return token;
  return tryRefreshAdminToken();
}

// ============================================
// USER token helpers — now backed by Supabase client session
// ============================================

/** Get the current access token from the Supabase session (auto-refreshed). */
export async function getUserTokenAsync(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

/** Synchronous fallback for backward compat — reads from Supabase's localStorage key. */
export function getUserToken(): string | null {
  // Supabase JS client stores the session in localStorage automatically.
  // We can peek at it synchronously for quick checks (e.g. initial render).
  try {
    const storageKey = `sb-${projectId}-auth-token`;
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.access_token ?? null;
  } catch {
    return null;
  }
}

export function getUserData(): { id: string; email: string; name: string; role: string } | null {
  const raw = localStorage.getItem("user_data");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setUserData(user: { id: string; email: string; name: string; role: string }) {
  localStorage.setItem("user_data", JSON.stringify(user));
}

export function clearUserData() {
  localStorage.removeItem("user_data");
}

// ============================================
// API helper (admin routes)
// ============================================
export async function api(
  path: string,
  options: {
    method?: string;
    body?: any;
    auth?: boolean;
  } = {}
) {
  const { method = "GET", body, auth = true } = options;
  const token = auth ? await getAdminTokenAsync() : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${publicAnonKey}`,
  };

  if (token) {
    headers["X-Access-Token"] = token;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    let data: any;
    try {
      data = await res.json();
    } catch {
      throw new Error(`Server returned non-JSON response (HTTP ${res.status}) for ${method} ${path}`);
    }
    if (!res.ok) {
      console.error(`API error [${method} ${path}]:`, data);
      throw new Error(data.error || "Erro desconhecido");
    }
    return data;
  } catch (err: any) {
    clearTimeout(timeout);
    if (err.name === "AbortError") throw new Error("Tempo limite excedido. Tente novamente.");
    throw err;
  }
}

// ============================================
// User API helper (user routes) — now uses async token retrieval
// ============================================
export async function userApi(
  path: string,
  options: {
    method?: string;
    body?: any;
    auth?: boolean;
    signal?: AbortSignal;
  } = {}
) {
  const { method = "GET", body, auth = true, signal } = options;

  // Get a fresh (auto-refreshed) token from the Supabase client
  const token = auth ? await getUserTokenAsync() : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${publicAnonKey}`,
  };

  if (token) {
    headers["X-Access-Token"] = token;
  }

  const controller = signal ? null : new AbortController();
  const timeout = controller ? setTimeout(() => controller.abort(), 20000) : null;

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: signal ?? controller?.signal,
    });
    if (timeout) clearTimeout(timeout);

    let data: any;
    try {
      data = await res.json();
    } catch {
      throw new Error(`Server returned non-JSON response (HTTP ${res.status}) for ${method} ${path}`);
    }
    if (!res.ok) {
      console.error(`User API error [${method} ${path}]:`, data);
      throw new Error(data.error || `Erro HTTP ${res.status}`);
    }
    return data;
  } catch (err: any) {
    if (timeout) clearTimeout(timeout);
    if (err.name === "AbortError" && !signal) throw new Error("Tempo limite excedido. Tente novamente.");
    throw err;
  }
}

// ============================================
// Project (Diagramação) API helpers
// ============================================
export async function createProject(data: {
  title: string;
  author?: string;
  description?: string;
  pageCount?: number;
  format?: string;
  customFormat?: string;
  services?: string[];
  notes?: string;
}) {
  return userApi("/projects", { method: "POST", body: data });
}

// Upload file to a project
export async function uploadProjectFile(projectId: string, file: File): Promise<any> {
  const token = await getUserTokenAsync();
  const formData = new FormData();
  formData.append("file", file);

  const headers: Record<string, string> = {
    Authorization: `Bearer ${publicAnonKey}`,
  };
  if (token) {
    headers["X-Access-Token"] = token;
  }

  const res = await fetch(`${BASE_URL}/projects/${projectId}/upload`, {
    method: "POST",
    headers,
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    console.error(`Upload error [POST /projects/${projectId}/upload]:`, data);
    throw new Error(data.error || "Erro ao enviar arquivo");
  }
  return data;
}

export async function getUserProjects() {
  return userApi("/projects");
}

export async function getUserProject(id: string, signal?: AbortSignal) {
  return userApi(`/projects/${id}`, { signal });
}

// Admin project helpers
export async function getAdminProjects() {
  return api("/admin/projects");
}

export async function updateAdminProject(id: string, data: {
  status?: string;
  note?: string;
  fileUrl?: string;
  adminNotes?: string;
}) {
  return api(`/admin/projects/${id}`, { method: "PUT", body: data });
}

export async function deleteAdminProject(id: string) {
  return api(`/admin/projects/${id}`, { method: "DELETE" });
}

// Budget / Mercado Pago helpers
export async function createProjectBudget(id: string, data: { description: string; price: number; depositEnabled?: boolean; depositPercent?: number; customClauses?: any; estimatedDeadline?: string }) {
  return api(`/admin/projects/${id}/budget`, { method: "POST", body: { description: data.description, price: data.price, depositPercent: data.depositEnabled && data.depositPercent ? data.depositPercent : 0, customClauses: data.customClauses || null, estimatedDeadline: data.estimatedDeadline || null } });
}

export async function adminConfirmPayment(id: string) {
  return api(`/admin/projects/${id}/confirm-payment`, { method: "POST", body: {} });
}

export async function adminGenerateRemainder(id: string) {
  return api(`/admin/projects/${id}/generate-remainder`, { method: "POST", body: {} });
}

export async function adminConfirmRemainder(id: string) {
  return api(`/admin/projects/${id}/confirm-remainder`, { method: "POST", body: {} });
}

export async function deleteProjectBudget(id: string) {
  return api(`/admin/projects/${id}/budget`, { method: "DELETE" });
}

export async function updateBudgetClauses(id: string, customClauses: any, estimatedDeadline?: string) {
  return api(`/admin/projects/${id}/budget/clauses`, { method: "PUT", body: { customClauses, estimatedDeadline } });
}

export async function userConfirmPayment(id: string, status: string) {
  return userApi(`/projects/${id}/confirm-payment`, { method: "POST", body: { status } });
}

// Review files
export async function getReviewFiles(id: string, signal?: AbortSignal) {
  return userApi(`/projects/${id}/review-files`, { signal });
}

// User: approve review (with optional observations)
export async function approveReview(id: string, observations?: string) {
  return userApi(`/projects/${id}/approve-review`, { method: "POST", body: { observations: observations || "" } });
}

// Installment plan
export async function createInstallmentPlan(id: string, data: { totalInstallments: number; installments: { amount: number; dueDate: string }[]; requireContract?: boolean }) {
  return api(`/admin/projects/${id}/installment-plan`, { method: "POST", body: data });
}

export async function deleteInstallmentPlan(id: string) {
  return api(`/admin/projects/${id}/installment-plan`, { method: "DELETE" });
}

export async function generateInstallmentPix(id: string, num: number) {
  return api(`/admin/projects/${id}/installments/${num}/generate-pix`, { method: "POST", body: {} });
}

export async function confirmInstallment(id: string, num: number) {
  return api(`/admin/projects/${id}/installments/${num}/confirm`, { method: "POST", body: {} });
}

export async function getUserInstallments(id: string) {
  return userApi(`/projects/${id}/installments`);
}

export async function generateInstallmentPayoff(id: string) {
  return userApi(`/projects/${id}/installment-payoff`, { method: "POST", body: {} });
}

export async function regenerateInstallmentPix(id: string, installmentNum: number) {
  return userApi(`/projects/${id}/installments/${installmentNum}/regenerate-pix`, { method: "POST", body: {} });
}

export async function regeneratePayoffPix(id: string) {
  return userApi(`/projects/${id}/installment-payoff-regenerate`, { method: "POST", body: {} });
}

export async function getInstallmentCheckout(id: string) {
  const res = await fetch(`${BASE_URL}/installment-checkout/${id}`, {
    headers: { Authorization: `Bearer ${publicAnonKey}` },
  });
  if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || "Erro ao buscar dados"); }
  return res.json();
}

// Admin: upload review file
export async function uploadAdminReviewFile(projectId: string, file: File): Promise<any> {
  const token = getAdminToken();
  const formData = new FormData();
  formData.append("file", file);

  const headers: Record<string, string> = {
    Authorization: `Bearer ${publicAnonKey}`,
  };
  if (token) {
    headers["X-Access-Token"] = token;
  }

  const res = await fetch(`${BASE_URL}/admin/projects/${projectId}/review-upload`, {
    method: "POST",
    headers,
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    console.error(`Review upload error:`, data);
    throw new Error(data.error || "Erro ao enviar arquivo de revisão");
  }
  return data;
}

// Admin: delete a file (review or user-uploaded) from a project
export async function deleteAdminProjectFile(projectId: string, type: "review" | "uploaded", index: number) {
  return api(`/admin/projects/${projectId}/files`, { method: "DELETE", body: { type, index } });
}

// ============================================
// Transparent Checkout (public endpoints — no auth)
// ============================================
export async function getPaymentInfo(projectId: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

  try {
    const res = await fetch(`${BASE_URL}/payment/${projectId}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${publicAnonKey}`,
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const text = await res.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      console.error("getPaymentInfo: response is not JSON:", text.slice(0, 200));
      throw new Error("Servidor retornou uma resposta inválida. Tente novamente mais tarde.");
    }

    if (!res.ok) throw new Error(data.error || "Erro ao buscar informações de pagamento");
    return data;
  } catch (err: any) {
    clearTimeout(timeout);
    if (err.name === "AbortError") {
      throw new Error("Tempo limite excedido ao buscar informações de pagamento. Tente novamente.");
    }
    throw err;
  }
}

export async function processPayment(projectId: string, paymentData: {
  payment_method_id: string;
  token?: string;
  installments?: number;
  issuer_id?: string;
  payer: {
    email: string;
    first_name?: string;
    last_name?: string;
    identification?: { type: string; number: string };
  };
}) {
  const res = await fetch(`${BASE_URL}/payment/${projectId}/process`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${publicAnonKey}`,
    },
    body: JSON.stringify(paymentData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Erro ao processar pagamento");
  return data;
}

export async function checkPaymentStatus(projectId: string) {
  const res = await fetch(`${BASE_URL}/payment/${projectId}/check-status`, {
    headers: { Authorization: `Bearer ${publicAnonKey}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Erro ao verificar status");
  return data;
}

export async function acceptContract(projectId: string, contractData: {
  contractVersion: string;
  acceptorName: string;
  acceptorEmail: string;
  acceptorCpf?: string;
  contractHash?: string;
  contractSnapshot?: string;
  geolocation?: string;
  screenResolution?: string;
}) {
  const res = await fetch(`${BASE_URL}/payment/${projectId}/accept-contract`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${publicAnonKey}`,
    },
    body: JSON.stringify(contractData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Erro ao registrar aceite do contrato");
  return data;
}

// Admin: upload contract PDF for a project
export async function uploadContractPdf(projectId: string, file: File): Promise<any> {
  const token = getAdminToken();
  const formData = new FormData();
  formData.append("file", file);
  const headers: Record<string, string> = { Authorization: `Bearer ${publicAnonKey}` };
  if (token) headers["X-Access-Token"] = token;
  const res = await fetch(`${BASE_URL}/admin/projects/${projectId}/contract-pdf`, { method: "POST", headers, body: formData });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Erro ao enviar contrato PDF");
  return data;
}

export async function deleteContractPdf(projectId: string) {
  return api(`/admin/projects/${projectId}/contract-pdf`, { method: "DELETE" });
}

// Public: get contract PDF download URL
export async function getContractPdfUrl(projectId: string) {
  const res = await fetch(`${BASE_URL}/payment/${projectId}/contract-pdf`, {
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${publicAnonKey}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Erro ao buscar contrato PDF");
  return data;
}

// Contract template management
export async function getContractTemplate() {
  return api("/admin/contract-template");
}

export async function saveContractTemplate(template: any) {
  return api("/admin/contract-template", { method: "PUT", body: { template } });
}

export async function getContractTemplateHistory() {
  return api("/admin/contract-template-history");
}

export async function getPublicContractTemplate() {
  const res = await fetch(`${BASE_URL}/contract-template`, {
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${publicAnonKey}` },
  });
  const data = await res.json();
  return data;
}

// Invoice management (Notas Fiscais)
export async function uploadInvoice(projectId: string, file: File, description: string): Promise<any> {
  const token = getAdminToken();
  const formData = new FormData();
  formData.append("file", file);
  formData.append("description", description);
  const headers: Record<string, string> = { Authorization: `Bearer ${publicAnonKey}` };
  if (token) headers["X-Access-Token"] = token;
  const res = await fetch(`${BASE_URL}/admin/projects/${projectId}/invoice-upload`, { method: "POST", headers, body: formData });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Erro ao enviar nota fiscal");
  return data;
}

export async function deleteInvoice(projectId: string, index: number) {
  return api(`/admin/projects/${projectId}/invoice`, { method: "DELETE", body: { index } });
}

export async function getUserInvoices(projectId: string) {
  return userApi(`/projects/${projectId}/invoices`);
}

// FAQ
export function getFaqs() {
  return dedupeRequest("faqs", () => api("/faqs", { auth: false }));
}

export async function updateAdminFaqs(faqs: { id: string; question: string; answer: string }[]) {
  return api("/admin/faqs", { method: "PUT", body: { faqs } });
}

// BOOKS
export function getBooks() {
  return dedupeRequest("books", () => api("/books", { auth: false }));
}

export async function getBookBySlug(slug: string) {
  const res = await fetch(`${BASE_URL}/books/slug/${slug}`, {
    headers: { Authorization: `Bearer ${publicAnonKey}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Livro não encontrado");
  return data;
}

export async function createAdminBook(data: { title: string; author: string; genre: string; rating: number; year: number; description: string; image: string; photos?: string[] }) {
  return api("/admin/books", { method: "POST", body: data });
}

export async function updateAdminBook(id: number, data: { title: string; author: string; genre: string; rating: number; year: number; description: string; image: string; photos?: string[] }) {
  return api(`/admin/books/${id}`, { method: "PUT", body: data });
}

export async function deleteAdminBook(id: number) {
  return api(`/admin/books/${id}`, { method: "DELETE" });
}

// PLANS
export function getPlans() {
  return dedupeRequest("plans", () => api("/plans", { auth: false }));
}

export interface ServicesCard {
  active: boolean;
  title: string;
  subtitle: string;
  services: string[];
}

export async function updateAdminPlans(
  plans: { id: string; name: string; description: string; price: string; featured: boolean; features: string[] }[],
  servicesCard?: ServicesCard,
) {
  return api("/admin/plans", { method: "PUT", body: { plans, servicesCard } });
}

// PAYMENT CONFIG
export async function getAdminPaymentConfig() {
  return api("/admin/payment-config");
}
export async function updateAdminPaymentConfig(data: { access_token?: string; public_key?: string; methods?: { pix: boolean; credit_card: boolean; boleto: boolean } }) {
  return api("/admin/payment-config", { method: "PUT", body: data });
}
export async function testAdminPaymentConfig() {
  return api("/admin/payment-config/test", { method: "POST", body: {} });
}

// NEWSLETTER
export async function getAdminSubscribers() {
  return api("/admin/subscribers");
}

// AUTHORS
export interface VideoSection {
  url: string;
  title: string;
  text: string;
}

export function getAuthors() {
  return dedupeRequest("authors", () => api("/authors", { auth: false }));
}

export async function updateAdminAuthors(
  authors: { id: number; name: string; specialty: string; books: number; image: string; quote: string }[],
  videoSection?: VideoSection,
) {
  return api("/admin/authors", { method: "PUT", body: { authors, videoSection } });
}

// TESTIMONIALS
export function getTestimonials() {
  return dedupeRequest("testimonials", () => api("/testimonials", { auth: false }));
}

export async function updateAdminTestimonials(testimonials: { id: number; name: string; role: string; image: string; quote: string; rating: number; featured: boolean }[]) {
  return api("/admin/testimonials", { method: "PUT", body: { testimonials } });
}

// MEDIA UPLOAD (admin — uploads to public Supabase Storage bucket)
export async function uploadFile(file: File, folder: "logos" | "books" | "authors" | "misc" = "misc"): Promise<string> {
  const token = getAdminToken();
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);
  const headers: Record<string, string> = { Authorization: `Bearer ${publicAnonKey}` };
  if (token) headers["X-Access-Token"] = token;
  const res = await fetch(`${BASE_URL}/admin/upload`, { method: "POST", headers, body: formData });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Erro ao enviar arquivo");
  return data.url as string;
}

// LOGO
export async function getLogo(): Promise<string | null> {
  try {
    const data = await api("/logo", { auth: false });
    return data.logo || null;
  } catch { return null; }
}

export function getLogos(): Promise<{ logo_navbar: string | null; logo_footer: string | null; logo_favicon: string | null }> {
  return dedupeRequest("logos", async () => {
    try {
      const data = await api("/logos", { auth: false });
      return { logo_navbar: data.logo_navbar || null, logo_footer: data.logo_footer || null, logo_favicon: data.logo_favicon || null };
    } catch { return { logo_navbar: null, logo_footer: null, logo_favicon: null }; }
  });
}

export async function updateAdminLogo(logo: string): Promise<void> {
  await api("/admin/logo", { method: "POST", body: { logo } });
}

export async function updateAdminLogoKey(key: "navbar" | "footer" | "favicon", logo: string): Promise<void> {
  await api(`/admin/logo/${key}`, { method: "POST", body: { logo } });
}

// ABOUT STATS
export function getAbout() {
  return dedupeRequest("about", () => api("/about", { auth: false }));
}

export async function updateAdminAbout(about: { yearsOfHistory: number; stats: { key: string; value: number; suffix: string; label: string }[] }) {
  return api("/admin/about", { method: "PUT", body: { about } });
}

export interface ContactInfo {
  phone: string;
  address: string;
  city: string;
  email: string;
  whatsapp: string;
  mapUrl: string;
}

export function getContactInfo(): Promise<ContactInfo> {
  return dedupeRequest("contact-info", async () => {
    try {
      const data = await api("/contact-info", { auth: false });
      return data.contactInfo || { phone: "", address: "", city: "", email: "", whatsapp: "", mapUrl: "" };
    } catch { return { phone: "", address: "", city: "", email: "", whatsapp: "", mapUrl: "" }; }
  });
}

export async function updateAdminContactInfo(info: Partial<ContactInfo>): Promise<void> {
  await api("/admin/contact-info", { method: "PUT", body: info });
}

// ── HERO SECTION ───────────────────────────────────────────────────────────────
export interface HeroContent {
  title: string;
  titleHighlight: string;
  subtitle: string;
  ctaPrimary: string;
  ctaSecondary: string;
  imageUrl: string;
}

export function getHero(): Promise<HeroContent | null> {
  return dedupeRequest("hero", async () => {
    try {
      const data = await api("/hero", { auth: false });
      return data.hero || null;
    } catch { return null; }
  });
}

export async function updateAdminHero(hero: HeroContent): Promise<void> {
  await api("/admin/hero", { method: "PUT", body: { hero } });
}

// ── ABOUT CONTENT (text + image) ───────────────────────────────────────────────
export interface AboutContent {
  paragraph1: string;
  paragraph2: string;
  imageUrl: string;
  sectionLabel: string;
  heading: string;
  headingHighlight: string;
}

export function getAboutContent(): Promise<AboutContent | null> {
  return dedupeRequest("about-content", async () => {
    try {
      const data = await api("/about-content", { auth: false });
      return data.content || null;
    } catch { return null; }
  });
}

export async function updateAdminAboutContent(content: AboutContent): Promise<void> {
  await api("/admin/about-content", { method: "PUT", body: { content } });
}

// ── CTA BANNER ─────────────────────────────────────────────────────────────────
export interface CtaBannerContent {
  title: string;
  titleHighlight: string;
  subtitle: string;
  ctaPrimary: string;
  ctaPrimaryLink: string;
  ctaSecondary: string;
  ctaSecondaryLink: string;
}

export function getCtaBanner(): Promise<CtaBannerContent | null> {
  return dedupeRequest("cta-banner", async () => {
    try {
      const data = await api("/cta-banner", { auth: false });
      return data.cta || null;
    } catch { return null; }
  });
}

export async function updateAdminCtaBanner(cta: CtaBannerContent): Promise<void> {
  await api("/admin/cta-banner", { method: "PUT", body: { cta } });
}

// ── FOOTER CONTENT ─────────────────────────────────────────────────────────────
export interface FooterContent {
  brandText: string;
  newsletterText: string;
  copyrightText: string;
}

export function getFooterContent(): Promise<FooterContent | null> {
  return dedupeRequest("footer-content", async () => {
    try {
      const data = await api("/footer", { auth: false });
      return data.footer || null;
    } catch { return null; }
  });
}

export async function updateAdminFooterContent(footer: FooterContent): Promise<void> {
  await api("/admin/footer", { method: "PUT", body: { footer } });
}

export async function submitDataRightsRequest(body: { name: string; email: string; requestType: string; details?: string }): Promise<void> {
  const res = await fetch(`${BASE_URL}/user/data-rights`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${publicAnonKey}` },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Erro ao enviar solicitação");
}

// ── EMAIL CONFIG ───────────────────────────────────────────────────────────────
export async function getAdminEmailConfig() {
  return api("/admin/email-config");
}
export async function updateAdminEmailConfig(data: {
  host?: string; port?: string; encryption?: string;
  user?: string; password?: string;
  from_name?: string; from_email?: string; reply_to?: string;
}) {
  return api("/admin/email-config", { method: "PUT", body: data });
}
export async function testAdminEmailConfig(to?: string) {
  return api("/admin/email-config/test", { method: "POST", body: { to } });
}

export async function testAdminEmailTemplate(template: string, to?: string) {
  return api("/admin/email-config/test-template", { method: "POST", body: { template, to } });
}

export async function getAdminEmailSignature(): Promise<{ name: string; tagline: string; extra_line: string; show_logo: boolean }> {
  return api("/admin/email-signature");
}

export async function updateAdminEmailSignature(sig: { name: string; tagline: string; extra_line: string; show_logo: boolean }) {
  return api("/admin/email-signature", { method: "PUT", body: sig });
}

export async function adminSendEmail(payload: { to: string[]; subject: string; body: string; replyTo?: string }) {
  return api("/admin/compose-email", { method: "POST", body: payload });
}

export async function getAdminInbox(page = 1) {
  return api(`/admin/inbox?page=${page}`);
}

export async function getAdminEmail(uid: number) {
  return api(`/admin/inbox/${uid}`);
}

export async function deleteAdminEmail(uid: number) {
  return api(`/admin/inbox/${uid}`, { method: "DELETE" });
}

// ── EMAIL MARKETING ────────────────────────────────────────────────────────────
export interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  html: string;
  text: string;
  status: "draft" | "sent";
  sentCount: number;
  sentAt?: string;
  lastErrors?: string[];
  createdAt: string;
  updatedAt: string;
}
export async function getAdminEmailCampaigns(): Promise<{ campaigns: EmailCampaign[] }> {
  return api("/admin/email-campaigns");
}
export async function createAdminEmailCampaign(data: { name: string; subject: string; html: string; text?: string }) {
  return api("/admin/email-campaigns", { method: "POST", body: data });
}
export async function updateAdminEmailCampaign(id: string, data: Partial<EmailCampaign>) {
  return api(`/admin/email-campaigns/${id}`, { method: "PUT", body: data });
}
export async function deleteAdminEmailCampaign(id: string) {
  return api(`/admin/email-campaigns/${id}`, { method: "DELETE" });
}
export async function sendAdminEmailCampaign(id: string) {
  return api(`/admin/email-campaigns/${id}/send`, { method: "POST", body: {} });
}

// ── PROJECT CHAT ──────────────────────────────────────────────────────────────
export async function getProjectChat(projectId: string, signal?: AbortSignal) {
  return userApi(`/projects/${projectId}/chat`, { signal });
}
export async function sendProjectChatMessage(projectId: string, text: string) {
  return userApi(`/projects/${projectId}/chat`, { method: "POST", body: { text } });
}
export async function getAdminProjectChat(projectId: string) {
  return api(`/projects/${projectId}/chat`);
}
export async function sendAdminProjectChatMessage(projectId: string, text: string) {
  return api(`/projects/${projectId}/chat`, { method: "POST", body: { text } });
}

// ── FINANCIAL STATS ───────────────────────────────────────────────────────────
export async function getAdminFinancialStats() {
  return api("/admin/financial-stats");
}

// ── INSTALLMENT REMINDERS ─────────────────────────────────────────────────────
export async function sendInstallmentReminders(daysBefore = 3) {
  return api("/admin/installment-reminders", { method: "POST", body: { daysBefore } });
}

// ── PROJECT SURVEY ────────────────────────────────────────────────────────────
export async function submitProjectSurvey(projectId: string, data: { rating: number; comment?: string; allowTestimonial?: boolean }) {
  return userApi(`/projects/${projectId}/survey`, { method: "POST", body: data });
}
export async function getProjectSurvey(projectId: string) {
  return userApi(`/projects/${projectId}/survey`);
}
