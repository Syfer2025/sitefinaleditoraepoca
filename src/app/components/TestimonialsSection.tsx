import { ImageWithFallback } from "./figma/ImageWithFallback";
import { RevealOnScroll } from "./RevealOnScroll";
import { Star, Quote } from "lucide-react";
import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { getTestimonials } from "../data/api";

const DEFAULT_TESTIMONIALS = [
  { id: 1, name: "Isabela Nascimento", role: "Autora de 'Caminhos da Alma'", image: "https://images.unsplash.com/photo-1770808499289-88e2d7e70beb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxicmF6aWxpYW4lMjB3b21hbiUyMHdyaXRlciUyMHBvcnRyYWl0JTIwd2FybXxlbnwxfHx8fDE3NzI0NjEyNTJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", quote: "A Época Editora transformou meu manuscrito em algo que eu jamais imaginei possível. O cuidado editorial e a atenção aos detalhes foram excepcionais.", rating: 5, featured: false },
  { id: 2, name: "Fernando Rios", role: "Autor de 'Horizontes Perdidos'", image: "https://images.unsplash.com/photo-1750809411300-915ca4928f83?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBhdXRob3IlMjBsaXRlcmFyeSUyMHBvcnRyYWl0JTIwc3R1ZGlvfGVufDF8fHx8MTc3MjQ2MTI1M3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", quote: "Publicar com a Época foi uma das melhores decisões da minha carreira. A equipe entendeu a essência da minha história e o resultado foi um livro premiado.", rating: 5, featured: true },
  { id: 3, name: "Helena Barbosa", role: "Leitora fiel há 20 anos", image: "https://images.unsplash.com/photo-1753286437694-5695d648698b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwZWxkZXJseSUyMHdvbWFuJTIwcmVhZGluZyUyMHBvcnRyYWl0fGVufDF8fHx8MTc3MjQ2MTI1NHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", quote: "A qualidade dos livros, a curadoria impecável e o compromisso com a literatura brasileira fazem da Época uma das editoras mais importantes do país.", rating: 5, featured: false },
];

export function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState(DEFAULT_TESTIMONIALS);

  useEffect(() => {
    getTestimonials()
      .then((data) => { if (Array.isArray(data?.testimonials) && data.testimonials.length > 0) setTestimonials(data.testimonials); })
      .catch(() => {});
  }, []);
  return (
    <section className="py-16 px-6 bg-[#052413] relative overflow-hidden">
      {/* Decorative glows */}
      <div
        className="absolute top-1/2 left-1/2 w-[600px] h-[600px] rounded-full opacity-[0.04] -translate-x-1/2 -translate-y-1/2"
        style={{
          background: "radial-gradient(circle, #EBBF74 0%, transparent 65%)",
        }}
      />

      <div className="max-w-6xl mx-auto relative z-10">
        <RevealOnScroll direction="up" className="text-center mb-12">
          <p
            className="text-[0.75rem] tracking-[0.3em] uppercase text-[#EBBF74] mb-3"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Depoimentos
          </p>
          <h2
            className="text-[2.5rem] md:text-[3rem] text-white"
            style={{
              fontFamily: "'Playfair Display', serif",
              lineHeight: 1.15,
            }}
          >
            Vozes que confiam na{" "}
            <span className="italic text-[#EBBF74]">Época</span>
          </h2>
        </RevealOnScroll>

        {/* Cards grid */}
        <div className="grid md:grid-cols-3 gap-5 items-stretch">
          {testimonials.map((t, i) => (
            <RevealOnScroll key={t.id} direction="up" delay={i * 0.12}>
              <motion.div
                className="relative h-full rounded-2xl p-6 flex flex-col border group cursor-default"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.04)",
                  borderColor: t.featured
                    ? "rgba(235, 191, 116, 0.25)"
                    : "rgba(255, 255, 255, 0.08)",
                  backdropFilter: "blur(8px)",
                }}
                whileHover={{
                  backgroundColor: "rgba(255, 255, 255, 0.07)",
                  borderColor: "rgba(235, 191, 116, 0.3)",
                  y: -4,
                  transition: { duration: 0.3 },
                }}
              >
                {/* Accent glow on featured */}
                {t.featured && (
                  <div
                    className="absolute -top-px left-1/2 -translate-x-1/2 h-[2px] w-2/3 rounded-full"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent, #EBBF74, transparent)",
                    }}
                  />
                )}

                {/* Quote icon */}
                <Quote
                  className="w-8 h-8 mb-4 shrink-0"
                  style={{ color: "rgba(235, 191, 116, 0.2)" }}
                />

                {/* Quote text */}
                <p
                  className="text-white/80 mb-6 flex-1"
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontStyle: "italic",
                    lineHeight: 1.75,
                    fontSize: "0.95rem",
                  }}
                >
                  &ldquo;{t.quote}&rdquo;
                </p>

                {/* Stars */}
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, s) => (
                    <Star
                      key={s}
                      className="w-3.5 h-3.5 fill-[#EBBF74] text-[#EBBF74]"
                    />
                  ))}
                </div>

                {/* Author info */}
                <div className="flex items-center gap-3 pt-4 border-t border-white/8">
                  <div className="w-11 h-11 rounded-full overflow-hidden ring-1 ring-[#EBBF74]/25 shrink-0">
                    <ImageWithFallback
                      src={t.image}
                      alt={t.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div>
                    <p
                      className="text-white text-[0.9rem]"
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                      {t.name}
                    </p>
                    <p
                      className="text-[0.78rem] text-[#EBBF74]/60"
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      {t.role}
                    </p>
                  </div>
                </div>
              </motion.div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
