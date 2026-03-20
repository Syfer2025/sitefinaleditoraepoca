import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { RevealOnScroll } from "./RevealOnScroll";

const faqs = [
  {
    question: "Como posso submeter um manuscrito para avaliação?",
    answer:
      "Você pode enviar seu manuscrito pelo nosso formulário de contato ou diretamente para o email manuscritos@epocaeditora.com.br. Aceitamos obras de ficção, não-ficção, poesia e literatura infantojuvenil. O prazo médio de avaliação é de 45 a 60 dias úteis.",
  },
  {
    question: "A Época Editora trabalha com autopublicação?",
    answer:
      "Sim, oferecemos um programa completo de autopublicação assistida que inclui revisão, diagramação, design de capa, registro de ISBN, distribuição em livrarias físicas e digitais, e suporte de marketing. Entre em contato para conhecer os planos disponíveis.",
  },
  {
    question: "Quais gêneros literários vocês publicam?",
    answer:
      "Nosso catálogo abrange ficção literária, romance, fantasia, poesia, ensaios, biografias, literatura infantojuvenil e não-ficção. Valorizamos especialmente vozes brasileiras contemporâneas e obras que dialoguem com a diversidade cultural do país.",
  },
  {
    question: "Como funciona o processo editorial após a aprovação?",
    answer:
      "Após a aprovação, o autor recebe uma proposta de contrato detalhada. O processo inclui reuniões de alinhamento, revisão estrutural e gramatical, diagramação, criação de capa, aprovação final do autor, impressão e lançamento. Todo o ciclo leva em média de 6 a 9 meses.",
  },
  {
    question: "Vocês organizam eventos e lançamentos de livros?",
    answer:
      "Sim! Organizamos sessões de autógrafos, noites de lançamento, clubes de leitura, participamos de feiras literárias nacionais como a Bienal do Livro e a FLIP, além de eventos exclusivos em livrarias parceiras em todo o Brasil.",
  },
  {
    question: "Como posso adquirir livros da Época Editora?",
    answer:
      "Nossos livros estão disponíveis em livrarias físicas parceiras em todo o Brasil, além de plataformas online como Amazon, Estante Virtual e nosso próprio site. Para compras em atacado ou institucionais, entre em contato conosco diretamente.",
  },
];

function FaqItem({
  faq,
  isOpen,
  onToggle,
}: {
  faq: (typeof faqs)[0];
  isOpen: boolean;
  onToggle: () => void;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
    }
  }, [isOpen]);

  return (
    <div
      className="border border-border rounded-xl overflow-hidden transition-all duration-400"
      style={{
        backgroundColor: isOpen ? "rgba(22, 91, 54, 0.04)" : "var(--card)",
        boxShadow: isOpen ? "0 4px 20px rgba(5, 36, 19, 0.06)" : "none",
      }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-6 py-5 text-left cursor-pointer"
      >
        <span
          className="text-foreground pr-4 transition-colors duration-300"
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "1.05rem",
            color: isOpen ? "#165B36" : "var(--foreground)",
          }}
        >
          {faq.question}
        </span>
        <span
          className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-400"
          style={{
            backgroundColor: isOpen
              ? "var(--primary)"
              : "rgba(22, 91, 54, 0.1)",
            transform: isOpen ? "rotate(0deg)" : "rotate(0deg)",
          }}
        >
          <ChevronDown
            className="w-4 h-4 transition-transform duration-400"
            style={{
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
              color: isOpen ? "var(--primary-foreground)" : "var(--primary)",
            }}
          />
        </span>
      </button>

      <div
        ref={contentRef}
        className="overflow-hidden transition-all duration-400 ease-in-out"
        style={{
          maxHeight: isOpen ? `${height}px` : "0px",
          opacity: isOpen ? 1 : 0,
        }}
      >
        <p
          className="px-6 pb-5 text-muted-foreground"
          style={{
            fontFamily: "Inter, sans-serif",
            lineHeight: 1.8,
            fontSize: "0.925rem",
          }}
        >
          {faq.answer}
        </p>
      </div>
    </div>
  );
}

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => {
    setOpenIndex(openIndex === i ? null : i);
  };

  return (
    <section id="faq" className="py-16 px-6 bg-background">
      <div className="max-w-3xl mx-auto">
        <RevealOnScroll direction="up" className="text-center mb-10">
          <p
            className="text-[0.75rem] tracking-[0.3em] uppercase text-primary mb-3"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Dúvidas
          </p>
          <h2
            className="text-[2.5rem] md:text-[3rem] text-foreground"
            style={{
              fontFamily: "'Playfair Display', serif",
              lineHeight: 1.15,
            }}
          >
            Perguntas <span className="italic">frequentes</span>
          </h2>
        </RevealOnScroll>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <RevealOnScroll key={i} direction="up" delay={i * 0.07}>
              <FaqItem
                faq={faq}
                isOpen={openIndex === i}
                onToggle={() => toggle(i)}
              />
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}