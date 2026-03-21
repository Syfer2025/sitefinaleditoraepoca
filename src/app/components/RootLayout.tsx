import { Outlet, useLocation } from "react-router";
import { UserAuthProvider } from "./UserAuthContext";
import { Toaster } from "sonner";
import { useEffect } from "react";
import { CookieBanner } from "./CookieBanner";
import { ErrorBoundary } from "./ErrorBoundary";
import { getLogos } from "../data/api";

const SITE_URL = "https://editoraepoca.com.br";
const PRIVATE_ROUTES = [
  "/minha-conta",
  "/pagamento/",
  "/parcelas/",
  "/contrato/",
  "/nova-solicitacao",
  "/meus-dados",
  "/recuperar-senha",
  "/admin",
];

/**
 * Global SVG filter for GoldButton noise effect.
 * Rendered once here instead of duplicated per button.
 */
function GoldNoiseFilter() {
  return (
    <svg className="absolute w-0 h-0" aria-hidden="true">
      <filter id="goldNoise">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.85"
          numOctaves="4"
          stitchTiles="stitch"
        />
      </filter>
    </svg>
  );
}

export function RootLayout() {
  const { pathname } = useLocation();

  // Update canonical URL and robots on every navigation
  useEffect(() => {
    const isPrivate = PRIVATE_ROUTES.some((r) => pathname === r || pathname.startsWith(r));

    let canonical = document.querySelector("link[rel='canonical']") as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = `${SITE_URL}${pathname}`;

    let robots = document.querySelector("meta[name='robots']") as HTMLMetaElement | null;
    if (!robots) {
      robots = document.createElement("meta");
      robots.setAttribute("name", "robots");
      document.head.appendChild(robots);
    }
    robots.content = isPrivate ? "noindex, nofollow" : "index, follow";
  }, [pathname]);

  // Load favicon from CMS on mount
  useEffect(() => {
    getLogos().then((logos) => {
      const favicon = logos.logo_favicon;
      if (!favicon) return;
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = favicon;
    });
  }, []);

  return (
    <UserAuthProvider>
      <GoldNoiseFilter />
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
      <CookieBanner />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            fontFamily: "Inter, sans-serif",
            borderRadius: "12px",
            border: "1px solid rgba(133, 108, 66, 0.15)",
            background: "#FFFDF8",
            color: "#052413",
            boxShadow: "0 8px 30px rgba(5, 36, 19, 0.12)",
          },
        }}
        richColors
        closeButton
      />
    </UserAuthProvider>
  );
}