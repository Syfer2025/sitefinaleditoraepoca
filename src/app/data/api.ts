import { projectId, publicAnonKey } from "/utils/supabase/info";
import { supabase } from "./supabaseClient";

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-e413165d`;

// ============================================
// ADMIN token helpers (unchanged — manual localStorage)
// ============================================
export function getAdminToken(): string | null {
  return localStorage.getItem("admin_token");
}

export function setToken(token: string) {
  localStorage.setItem("admin_token", token);
}

export function clearToken() {
  localStorage.removeItem("admin_token");
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

// Legacy helpers kept for backward compatibility but they now also
// update the Supabase session when called.
export function setUserToken(_token: string) {
  // No-op: session is managed by the Supabase client now
}

export function clearUserToken() {
  // No-op: use supabase.auth.signOut() instead
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
  const token = auth ? getAdminToken() : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${publicAnonKey}`,
  };

  if (token) {
    headers["X-Access-Token"] = token;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

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

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });

  let data: any;
  try {
    data = await res.json();
  } catch {
    // Response is not JSON (e.g. 403 HTML page from edge function)
    throw new Error(`Server returned non-JSON response (HTTP ${res.status}) for ${method} ${path}`);
  }
  if (!res.ok) {
    console.error(`User API error [${method} ${path}]:`, data);
    throw new Error(data.error || `Erro HTTP ${res.status}`);
  }
  return data;
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