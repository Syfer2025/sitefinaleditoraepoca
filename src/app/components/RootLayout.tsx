import { Outlet } from "react-router";
import { UserAuthProvider } from "./UserAuthContext";
import { Toaster } from "sonner";
import { useEffect } from "react";
import { CookieBanner } from "./CookieBanner";

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
  // Set default SEO meta tags
  useEffect(() => {
    document.title = "Época Editora de Livros — Histórias que transformam";

    const setMeta = (name: string, content: string, property?: boolean) => {
      const attr = property ? "property" : "name";
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    setMeta("description", "Época Editora de Livros — publicamos histórias que transformam vidas desde 1987. Catálogo com mais de 500 títulos de ficção, poesia, ensaios e literatura infantil.");
    setMeta("keywords", "editora, livros, publicação, literatura brasileira, autopublicação, diagramação, revisão, ISBN, Época Editora");
    setMeta("og:title", "Época Editora de Livros", true);
    setMeta("og:description", "Publicamos histórias que transformam vidas desde 1987. Conheça nosso catálogo e serviços editoriais.", true);
    setMeta("og:type", "website", true);
    setMeta("og:site_name", "Época Editora de Livros", true);
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", "Época Editora de Livros");
    setMeta("twitter:description", "Publicamos histórias que transformam vidas desde 1987.");
  }, []);

  return (
    <UserAuthProvider>
      <GoldNoiseFilter />
      <Outlet />
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