/**
 * Cloudflare R2 Storage Module (S3-compatible API)
 *
 * Uses AWS Signature V4 for authentication. No external dependencies.
 * Set environment variables: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME
 */

const encoder = new TextEncoder();

function getR2Config() {
  const accountId = Deno.env.get("R2_ACCOUNT_ID");
  const accessKeyId = Deno.env.get("R2_ACCESS_KEY_ID");
  const secretAccessKey = Deno.env.get("R2_SECRET_ACCESS_KEY");
  const bucket = Deno.env.get("R2_BUCKET_NAME") || "epoca-editora-files";
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 credentials not configured (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY)");
  }
  return { accountId, accessKeyId, secretAccessKey, bucket, endpoint: `https://${accountId}.r2.cloudflarestorage.com` };
}

// ── AWS Signature V4 helpers ────────────────────────────────────────────────

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function hmacSHA256(key: ArrayBuffer | Uint8Array, data: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(data));
}

async function sha256(data: string | ArrayBuffer): Promise<string> {
  const buf = typeof data === "string" ? encoder.encode(data) : data;
  return toHex(await crypto.subtle.digest("SHA-256", buf));
}

async function getSigningKey(secretKey: string, dateStamp: string, region: string, service: string): Promise<ArrayBuffer> {
  let key = await hmacSHA256(encoder.encode("AWS4" + secretKey), dateStamp);
  key = await hmacSHA256(key, region);
  key = await hmacSHA256(key, service);
  key = await hmacSHA256(key, "aws4_request");
  return key;
}

function getAmzDate(): { amzDate: string; dateStamp: string } {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  return { amzDate, dateStamp };
}

interface SignedRequestOptions {
  method: string;
  path: string;
  queryParams?: Record<string, string>;
  headers?: Record<string, string>;
  body?: ArrayBuffer | string;
  contentType?: string;
}

async function signRequest(opts: SignedRequestOptions): Promise<{ url: string; headers: Record<string, string> }> {
  const cfg = getR2Config();
  const region = "auto";
  const service = "s3";
  const { amzDate, dateStamp } = getAmzDate();
  const host = `${cfg.bucket}.${cfg.accountId}.r2.cloudflarestorage.com`;
  const canonicalUri = "/" + opts.path.replace(/^\//, "");

  // Query string
  const qp = opts.queryParams || {};
  const sortedQS = Object.keys(qp).sort().map(k => `${encodeURIComponent(k)}=${encodeURIComponent(qp[k])}`).join("&");

  // Headers
  const payloadHash = opts.body ? await sha256(opts.body) : await sha256("");
  const hdrs: Record<string, string> = {
    host,
    "x-amz-date": amzDate,
    "x-amz-content-sha256": payloadHash,
    ...opts.headers,
  };
  if (opts.contentType) hdrs["content-type"] = opts.contentType;

  const signedHeaderKeys = Object.keys(hdrs).sort().map(k => k.toLowerCase());
  const signedHeaders = signedHeaderKeys.join(";");
  const canonicalHeaders = signedHeaderKeys.map(k => `${k}:${hdrs[k]}\n`).join("");

  const canonicalRequest = [opts.method, canonicalUri, sortedQS, canonicalHeaders, signedHeaders, payloadHash].join("\n");

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, credentialScope, await sha256(canonicalRequest)].join("\n");

  const signingKey = await getSigningKey(cfg.secretAccessKey, dateStamp, region, service);
  const signature = toHex(await hmacSHA256(signingKey, stringToSign));

  hdrs["authorization"] = `AWS4-HMAC-SHA256 Credential=${cfg.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const url = `https://${host}${canonicalUri}${sortedQS ? "?" + sortedQS : ""}`;
  return { url, headers: hdrs };
}

// ── Presigned URL generation (no request body needed) ───────────────────────

async function generatePresignedUrl(key: string, expiresInSeconds: number, method = "GET"): Promise<string> {
  const cfg = getR2Config();
  const region = "auto";
  const service = "s3";
  const { amzDate, dateStamp } = getAmzDate();
  const host = `${cfg.bucket}.${cfg.accountId}.r2.cloudflarestorage.com`;
  const canonicalUri = "/" + key.replace(/^\//, "");
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;

  const qp: Record<string, string> = {
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${cfg.accessKeyId}/${credentialScope}`,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": String(expiresInSeconds),
    "X-Amz-SignedHeaders": "host",
  };
  const sortedQS = Object.keys(qp).sort().map(k => `${encodeURIComponent(k)}=${encodeURIComponent(qp[k])}`).join("&");

  const canonicalRequest = [method, canonicalUri, sortedQS, `host:${host}\n`, "host", "UNSIGNED-PAYLOAD"].join("\n");
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, credentialScope, await sha256(canonicalRequest)].join("\n");

  const signingKey = await getSigningKey(cfg.secretAccessKey, dateStamp, region, service);
  const signature = toHex(await hmacSHA256(signingKey, stringToSign));

  return `https://${host}${canonicalUri}?${sortedQS}&X-Amz-Signature=${signature}`;
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Upload a file to R2
 */
export async function r2Upload(key: string, data: ArrayBuffer, contentType: string): Promise<void> {
  const { url, headers } = await signRequest({
    method: "PUT",
    path: key,
    body: data,
    contentType,
  });
  const res = await fetch(url, { method: "PUT", headers, body: data });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`R2 upload failed (${res.status}): ${text}`);
  }
}

/**
 * Delete one or more files from R2
 */
export async function r2Delete(keys: string[]): Promise<void> {
  for (const key of keys) {
    const { url, headers } = await signRequest({ method: "DELETE", path: key });
    const res = await fetch(url, { method: "DELETE", headers });
    if (!res.ok && res.status !== 404) {
      console.warn(`R2 delete warning for ${key}: ${res.status}`);
    }
  }
}

/**
 * Generate a presigned download URL
 */
export async function r2SignedUrl(key: string, expiresInSeconds: number): Promise<string> {
  return generatePresignedUrl(key, expiresInSeconds, "GET");
}

/**
 * Check if R2 is configured (env vars present)
 */
export function isR2Configured(): boolean {
  try {
    getR2Config();
    return true;
  } catch {
    return false;
  }
}
