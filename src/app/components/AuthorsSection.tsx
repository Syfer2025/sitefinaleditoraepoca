import { RevealOnScroll } from "./RevealOnScroll";
import { useState, useEffect } from "react";
import { getAuthors, type VideoSection } from "../data/api";

const DEFAULT_VIDEO: VideoSection = {
  url: "",
  title: "Conheça a Época Editora",
  text: "Há mais de três décadas transformamos manuscritos em obras publicadas com excelência editorial. Assista ao vídeo e descubra como podemos dar vida à sua história.",
};

function getEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    let id = "";
    if (u.hostname.includes("youtu.be")) {
      id = u.pathname.slice(1).split("?")[0];
    } else if (u.hostname.includes("youtube.com")) {
      id = u.searchParams.get("v") || u.pathname.split("/embed/")[1]?.split("?")[0] || "";
    }
    if (!id) return null;
    return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&color=white`;
  } catch {
    return null;
  }
}

export function AuthorsSection() {
  const [video, setVideo] = useState<VideoSection>(DEFAULT_VIDEO);

  useEffect(() => {
    getAuthors()
      .then((data) => { if (data?.videoSection?.url) setVideo(data.videoSection); })
      .catch(() => {});
  }, []);

  const embedUrl = getEmbedUrl(video.url);

  return (
    <section id="autores" className="py-20 px-6 bg-background relative overflow-hidden" style={{ scrollMarginTop: "72px" }}>
      {/* Decorative glow */}
      <div
        className="absolute top-1/2 left-1/2 w-[700px] h-[700px] rounded-full opacity-[0.03] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{ background: "radial-gradient(circle, #165B36 0%, transparent 65%)" }}
      />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-center">

          {/* Vídeo — second on mobile, first on desktop */}
          <RevealOnScroll direction="left" className="order-2 md:order-1">
            <div
              className="relative w-full rounded-2xl overflow-hidden"
              style={{
                aspectRatio: "16/9",
                boxShadow: "0 16px 48px rgba(5,36,19,0.12)",
                border: "1px solid rgba(133,108,66,0.15)",
              }}
            >
              {embedUrl ? (
                <iframe
                  src={embedUrl}
                  title={video.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  loading="lazy"
                  className="absolute inset-0 w-full h-full"
                  style={{ border: "none" }}
                />
              ) : (
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center gap-3"
                  style={{ backgroundColor: "rgba(5,36,19,0.04)" }}
                >
                  <svg viewBox="0 0 68 48" className="w-16 opacity-20" fill="none">
                    <path d="M66.52 7.74A8.55 8.55 0 0 0 60.45 1.6C55.14 0 34 0 34 0S12.86 0 7.55 1.6A8.55 8.55 0 0 0 1.48 7.74 89.6 89.6 0 0 0 0 24a89.6 89.6 0 0 0 1.48 16.26 8.55 8.55 0 0 0 6.07 6.14C12.86 48 34 48 34 48s21.14 0 26.45-1.6a8.55 8.55 0 0 0 6.07-6.14A89.6 89.6 0 0 0 68 24a89.6 89.6 0 0 0-1.48-16.26Z" fill="#052413"/>
                    <path d="M27 34l18-10-18-10v20Z" fill="#F7F4EE"/>
                  </svg>
                  <p className="text-foreground/30 text-sm">
                    Configure o vídeo no painel admin → Autores
                  </p>
                </div>
              )}
            </div>
          </RevealOnScroll>

          {/* Texto lateral — first on mobile, second on desktop */}
          <RevealOnScroll direction="right" delay={0.1} className="order-1 md:order-2">
            <div className="text-center md:text-left">
              <p
                className="text-[0.75rem] tracking-[0.3em] uppercase text-primary mb-4"
              >
                Nossos Autores
              </p>
              <h2
                className="text-[2rem] md:text-[2.5rem] text-foreground mb-5 font-serif leading-[1.2]"
              >
                {video.title}
              </h2>
              <p
                className="text-muted-foreground leading-relaxed"
                style={{ fontSize: "1rem", lineHeight: 1.8 }}
              >
                {video.text}
              </p>
              <div
                className="mt-8 h-px w-16 mx-auto md:mx-0"
                style={{ background: "linear-gradient(90deg, #EBBF74, transparent)" }}
              />
            </div>
          </RevealOnScroll>

        </div>
      </div>
    </section>
  );
}
