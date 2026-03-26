import { FileText, Search, CreditCard, BookOpen } from "lucide-react";
import { RevealOnScroll } from "./RevealOnScroll";
import { GoldButton } from "./GoldButton";

const STEPS = [
  {
    icon: FileText,
    title: "Preencha o formulário",
    desc: "Conte sobre sua obra, escolha os serviços e envie seu manuscrito. Leva menos de 3 minutos.",
  },
  {
    icon: Search,
    title: "Análise da equipe",
    desc: "Nossa equipe avalia seu projeto e prepara um orçamento personalizado para você.",
  },
  {
    icon: CreditCard,
    title: "Aprovação e pagamento",
    desc: "Revise o orçamento, aceite o contrato e escolha a forma de pagamento que preferir.",
  },
  {
    icon: BookOpen,
    title: "Produção e entrega",
    desc: "Acompanhe cada etapa pela sua área do cliente. Ao final, você recebe 1 exemplar de teste para aprovar antes da impressão definitiva.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="como-funciona" className="py-16 px-6">
      <div className="max-w-5xl mx-auto">
        <RevealOnScroll direction="up" className="text-center mb-10">
          <p className="text-[0.75rem] tracking-[0.3em] uppercase text-primary mb-3">
            Como funciona
          </p>
          <h2 className="text-[2.5rem] md:text-[3rem] text-foreground mb-4 font-serif leading-[1.15]">
            Do manuscrito ao <span className="italic">livro pronto</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto" style={{ lineHeight: 1.7 }}>
            Publicar seu livro é mais simples do que você imagina. Veja o passo a passo e comece agora:
          </p>
        </RevealOnScroll>

        {/* Steps */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {STEPS.map((step, i) => (
            <RevealOnScroll key={step.title} direction="up" delay={i * 0.1}>
              <div className="relative text-center group">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-transform group-hover:scale-110"
                  style={{ background: "linear-gradient(135deg, #165B36, #052413)" }}
                >
                  <step.icon className="w-6 h-6 text-[#EBBF74]" />
                </div>

                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-7 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-[1.5px]" style={{ backgroundColor: "rgba(133,108,66,0.15)" }}>
                    <div
                      className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: "#EBBF74" }}
                    />
                  </div>
                )}

                <span
                  className="inline-block text-[0.6rem] font-bold tracking-widest uppercase mb-2"
                  style={{ color: "#EBBF74" }}
                >
                  Passo {i + 1}
                </span>
                <h3 className="text-[1rem] text-foreground mb-2 font-serif">{step.title}</h3>
                <p className="text-[0.85rem] text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            </RevealOnScroll>
          ))}
        </div>

        {/* CTA */}
        <RevealOnScroll direction="up" delay={0.4}>
          <div className="text-center">
            <GoldButton to="/nova-solicitacao" className="px-8 py-3.5 text-sm font-semibold">
              Solicitar orçamento
            </GoldButton>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
