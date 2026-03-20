import { ImageWithFallback } from "./figma/ImageWithFallback";
import { RevealOnScroll } from "./RevealOnScroll";
import { Quote } from "lucide-react";

const authors = [
  {
    id: 1,
    name: "Marina Alves",
    specialty: "Romance Contemporâneo",
    books: 12,
    image:
      "https://images.unsplash.com/photo-1680356475155-3ca8fa2192aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMGF1dGhvciUyMHdyaXRlciUyMHBvcnRyYWl0fGVufDF8fHx8MTc3MjM3ODM2OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    quote: "Escrever é encontrar a beleza no caos do cotidiano.",
  },
  {
    id: 2,
    name: "Rafael Mendes",
    specialty: "Contos e Crônicas",
    books: 8,
    image:
      "https://images.unsplash.com/photo-1686543972836-ad63f87f984b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMG1hbiUyMGF1dGhvciUyMHdyaXRlciUyMHBvcnRyYWl0fGVufDF8fHx8MTc3MjQ1NzMxOXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    quote: "Cada conto é um universo inteiro em poucas páginas.",
  },
  {
    id: 3,
    name: "Lúcia Ferreira",
    specialty: "Ficção Literária",
    books: 15,
    image:
      "https://images.unsplash.com/photo-1742179212941-9e2de84047bf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3cml0ZXIlMjBhdXRob3IlMjBwb3J0cmFpdCUyMHByb2Zlc3Npb25hbHxlbnwxfHx8fDE3NzI0NTczMTh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    quote: "A ficção nos ensina verdades que a realidade esconde.",
  },
];

export function AuthorsSection() {
  return (
    <section id="autores" className="py-16 px-6 bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <RevealOnScroll direction="up" className="text-center mb-10">
          <p
            className="text-[0.75rem] tracking-[0.3em] uppercase text-primary mb-3"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Nossos Autores
          </p>
          <h2
            className="text-[2.5rem] md:text-[3rem] text-foreground mb-4"
            style={{
              fontFamily: "'Playfair Display', serif",
              lineHeight: 1.15,
            }}
          >
            Vozes que <span className="italic">inspiram</span>
          </h2>
          <p
            className="text-muted-foreground max-w-xl mx-auto"
            style={{ fontFamily: "Inter, sans-serif", lineHeight: 1.7 }}
          >
            Conheça os talentos por trás das nossas obras mais celebradas.
          </p>
        </RevealOnScroll>

        {/* Authors grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {authors.map((author, i) => (
            <RevealOnScroll key={author.id} direction="up" delay={i * 0.15}>
              <div className="group text-center">
                <div className="relative w-40 h-40 mx-auto mb-5">
                  {/* Decorative ring */}
                  <div
                    className="absolute inset-[-4px] rounded-full transition-all duration-500 group-hover:inset-[-6px] group-hover:rotate-12"
                    style={{
                      background:
                        "linear-gradient(135deg, #EBBF74 0%, #856C42 50%, #EBBF74 100%)",
                      opacity: 0.5,
                    }}
                  />
                  <div className="relative w-full h-full rounded-full overflow-hidden">
                    <ImageWithFallback
                      src={author.image}
                      alt={author.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                    />
                  </div>
                </div>
                <h3
                  className="text-[1.375rem] text-foreground mb-1"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {author.name}
                </h3>
                <p
                  className="text-[0.875rem] text-primary mb-1"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  {author.specialty}
                </p>
                <p
                  className="text-[0.8rem] text-muted-foreground mb-4"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  {author.books} livros publicados
                </p>
                <div className="relative max-w-xs mx-auto">
                  <Quote className="w-4 h-4 text-[#EBBF74]/40 mb-2 mx-auto" />
                  <p
                    className="text-muted-foreground italic"
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      lineHeight: 1.6,
                    }}
                  >
                    {author.quote}
                  </p>
                </div>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}