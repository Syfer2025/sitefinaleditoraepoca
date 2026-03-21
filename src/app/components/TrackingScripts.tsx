import { useEffect } from "react";
import { getTrackingSettings, type TrackingSettings } from "../data/trackingService";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

const COOKIE_KEY = "epoca_cookie_consent";

function hasAnalyticsConsent(): boolean {
  try {
    const stored = localStorage.getItem(COOKIE_KEY);
    if (!stored) return false;
    return JSON.parse(stored).analytics === true;
  } catch {
    return false;
  }
}

function loadGtag(gaId: string, adsId?: string) {
  if (document.querySelector(`script[src*="googletagmanager.com/gtag"]`)) return;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function (...args: unknown[]) {
    window.dataLayer.push(args);
  };
  window.gtag("js", new Date());
  window.gtag("config", gaId, { anonymize_ip: true });

  if (adsId) {
    window.gtag("config", adsId);
  }
}

function injectVerificationMetas(ids: (string | undefined)[]) {
  ids.filter(Boolean).forEach((content) => {
    if (document.querySelector(`meta[name="google-site-verification"][content="${content}"]`)) return;
    const meta = document.createElement("meta");
    meta.name = "google-site-verification";
    meta.content = content!;
    document.head.appendChild(meta);
  });
}

function injectLocalBusiness(s: Partial<TrackingSettings>) {
  const existing = document.getElementById("schema-local-business");
  if (existing) existing.remove();
  if (!s.business_name) return;

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: s.business_name,
    url: "https://editoraepoca.com.br",
  };

  if (s.business_phone) schema.telephone = s.business_phone;
  if (s.business_hours) schema.openingHours = s.business_hours;
  if (s.business_address) {
    schema.address = {
      "@type": "PostalAddress",
      streetAddress: s.business_address,
      addressLocality: s.business_city,
      addressRegion: s.business_state,
      postalCode: s.business_zip,
      addressCountry: "BR",
    };
  }

  const el = document.createElement("script");
  el.id = "schema-local-business";
  el.type = "application/ld+json";
  el.textContent = JSON.stringify(schema);
  document.head.appendChild(el);
}

export function TrackingScripts() {
  useEffect(() => {
    let settings: Partial<TrackingSettings> = {};

    getTrackingSettings().then((s) => {
      settings = s;

      // Structured data — always OK (no personal data)
      injectLocalBusiness(s);

      // Verification meta tags — always OK
      injectVerificationMetas([s.search_console_id, s.merchant_verification_id]);

      // Analytics — only if user gave consent
      if (hasAnalyticsConsent() && s.ga4_id) {
        loadGtag(s.ga4_id, s.google_ads_id);
      }
    });

    // Listen for consent given in the same tab (custom event from CookieBanner)
    const handleConsent = () => {
      if (hasAnalyticsConsent() && settings.ga4_id) {
        loadGtag(settings.ga4_id, settings.google_ads_id);
      }
    };

    window.addEventListener("epoca_cookie_consent_changed", handleConsent);
    return () => window.removeEventListener("epoca_cookie_consent_changed", handleConsent);
  }, []);

  return null;
}
