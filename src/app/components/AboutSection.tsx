import { ImageWithFallback } from "./figma/ImageWithFallback";
import { BookOpen, Award, Users, Globe } from "lucide-react";
import { RevealOnScroll } from "./RevealOnScroll";
import { useEffect, useRef, useState } from "react";
import { getAbout } from "../data/api";

const ICON_MAP: Record<string, any> = {
  titulos: BookOpen,
  premios: Award,
  autores: Users,
  paises: Globe,
};

const DEFAULT_ABOUT = {
  yearsOfHistory: 37,
  stats: [
    { key: "titulos", value: 500, suffix: "+", label: "Títulos publicados" },
    { key: "premios", value: 32, suffix: "", label: "Prêmios literários" },
    { key: "autores", value: 120, suffix: "+", label: "Autores parceiros" },
    { key: "paises", value: 15, suffix: "", label: "Países alcançados" },
  ],
};

function AnimatedCounter({
  target,
  suffix,
}: {
  target: number;
  suffix: string;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const duration = 1800;
          const start = performance.now();
          const step = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}

export function AboutSection() {
  const [about, setAbout] = useState(DEFAULT_ABOUT);

  useEffect(() => {
    getAbout()
      .then((data) => { if (data?.about) setAbout(data.about); })
      .catch(() => {});
  }, []);

  const stats = about.stats.map((s) => ({ ...s, icon: ICON_MAP[s.key] || BookOpen }));

  return (
    <section id="sobre" className="py-16 px-6 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Image */}
          <RevealOnScroll direction="left" duration={0.9}>
            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-xl">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1642057714794-22dc5f0f6323?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcGVuJTIwYm9vayUyMHJlYWRpbmclMjBhZXN0aGV0aWN8ZW58MXx8fHwxNzcyNDU3MzE3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="Livro aberto"
                  className="w-full h-[420px] object-cover"
                />
              </div>
              <div
                className="absolute -bottom-6 -right-6 bg-[#052413] text-[#EBBF74] px-8 py-5 rounded-xl shadow-lg hidden md:block"
                style={{
                  animation: "none",
                }}
              >
                <p
                  className="text-[2.25rem]"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {about.yearsOfHistory}
                </p>
                <p
                  className="text-[0.875rem] text-[#EBBF74]/80"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  anos de história
                </p>
              </div>
            </div>
          </RevealOnScroll>

          {/* Text */}
          <div>
            <RevealOnScroll direction="up" delay={0.1}>
              <p
                className="text-[0.75rem] tracking-[0.3em] uppercase text-primary mb-3"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Nossa História
              </p>
              <h2
                className="text-[2.5rem] md:text-[3rem] text-foreground mb-4"
                style={{
                  fontFamily: "'Playfair Display', serif",
                  lineHeight: 1.15,
                }}
              >
                Cultivando a literatura{" "}
                <span className="italic">brasileira</span>
              </h2>
            </RevealOnScroll>

            <RevealOnScroll direction="up" delay={0.25}>
              <p
                className="text-muted-foreground mb-4"
                style={{ fontFamily: "Inter, sans-serif", lineHeight: 1.8 }}
              >
                Fundada em 1987, a Época Editora nasceu do amor pela palavra
                escrita. Ao longo de quase quatro décadas, construímos um
                catálogo diversificado que abrange ficção contemporânea, poesia,
                ensaios e literatura infantil.
              </p>
              <p
                className="text-muted-foreground mb-8"
                style={{ fontFamily: "Inter, sans-serif", lineHeight: 1.8 }}
              >
                Nossa missão é dar voz a novos talentos e manter viva a chama da
                literatura de qualidade, conectando autores e leitores em uma
                experiência transformadora.
              </p>
            </RevealOnScroll>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              {stats.map((stat, i) => (
                <RevealOnScroll key={stat.label} direction="up" delay={0.3 + i * 0.1}>
                  <div className="flex items-start gap-3 bg-secondary/50 rounded-xl p-4 hover:bg-secondary/80 transition-colors duration-300 group">
                    <div className="bg-primary/10 p-2 rounded-lg group-hover:bg-primary/20 transition-colors duration-300">
                      <stat.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p
                        className="text-[1.5rem] text-foreground"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                      >
                        <AnimatedCounter
                          target={stat.value}
                          suffix={stat.suffix}
                        />
                      </p>
                      <p
                        className="text-[0.8rem] text-muted-foreground"
                        style={{ fontFamily: "Inter, sans-serif" }}
                      >
                        {stat.label}
                      </p>
                    </div>
                  </div>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}