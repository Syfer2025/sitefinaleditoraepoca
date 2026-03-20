import { Check, Star } from "lucide-react";
import { GoldButton } from "./GoldButton";
import { RevealOnScroll } from "./RevealOnScroll";

const plans = [
  {
    name: "Essencial",
    description: "Para autores que estão começando sua jornada literária.",
    price: "2.490",
    featured: false,
    features: [
      "Revisão gramatical completa",
      "Diagramação padrão",
      "Capa com design profissional",
      "Registro de ISBN",
      "Distribuição em e-book",
      "5 exemplares impressos",
    ],
  },
  {
    name: "Profissional",
    description: "O plano mais popular para autores que buscam excelência.",
    price: "4.990",
    featured: true,
    features: [
      "Tudo do plano Essencial",
      "Revisão estrutural e de estilo",
      "Capa personalizada premium",
      "Distribuição física e digital",
      "30 exemplares impressos",
      "Sessão de lançamento inclusa",
      "Assessoria de marketing básica",
      "Ficha catalográfica",
    ],
  },
  {
    name: "Premium",
    description: "Experiência completa para projetos editoriais ambiciosos.",
    price: "9.490",
    featured: false,
    features: [
      "Tudo do plano Profissional",
      "Editor dedicado ao projeto",
      "Capa ilustrada sob medida",
      "100 exemplares impressos",
      "Campanha de marketing completa",
      "Presença em feiras literárias",
      "Book trailer promocional",
      "Audiobook (narração profissional)",
      "Consultoria de carreira autoral",
    ],
  },
];

export function PricingSection() {
  return (
    <section id="planos" className="py-16 px-6 bg-secondary/30">
      <div className="max-w-7xl mx-auto">
        <RevealOnScroll direction="up" className="text-center mb-10">
          <p
            className="text-[0.75rem] tracking-[0.3em] uppercase text-primary mb-3"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Planos
          </p>
          <h2
            className="text-[2.5rem] md:text-[3rem] text-foreground mb-4"
            style={{
              fontFamily: "'Playfair Display', serif",
              lineHeight: 1.15,
            }}
          >
            Publique seu <span className="italic">livro</span>
          </h2>
          <p
            className="text-muted-foreground max-w-2xl mx-auto"
            style={{ fontFamily: "Inter, sans-serif", lineHeight: 1.7 }}
          >
            Escolha o plano ideal para transformar seu manuscrito em uma obra
            publicada. Todos incluem acompanhamento editorial personalizado.
          </p>
        </RevealOnScroll>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 items-start">
          {plans.map((plan, i) => (
            <RevealOnScroll key={plan.name} direction="up" delay={i * 0.12}>
              <div
                className="relative rounded-2xl border overflow-hidden transition-all duration-500 hover:-translate-y-2 group"
                style={{
                  backgroundColor: plan.featured
                    ? "var(--foreground)"
                    : "var(--card)",
                  borderColor: plan.featured
                    ? "var(--primary)"
                    : "var(--border)",
                  boxShadow: plan.featured
                    ? "0 20px 60px rgba(5, 36, 19, 0.25)"
                    : "0 2px 12px rgba(0,0,0,0.04)",
                }}
              >
                {plan.featured && (
                  <div
                    className="flex items-center justify-center gap-1.5 py-2.5"
                    style={{
                      background:
                        "linear-gradient(90deg, #8B6914 0%, #D4AF5A 50%, #8B6914 100%)",
                      fontFamily: "Inter, sans-serif",
                      fontSize: "0.75rem",
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      color: "#1a1206",
                    }}
                  >
                    <Star className="w-3.5 h-3.5 fill-current" />
                    Mais popular
                  </div>
                )}

                <div className="p-6">
                  <h3
                    className="text-[1.25rem] mb-2"
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      color: plan.featured
                        ? "var(--primary-foreground)"
                        : "var(--foreground)",
                    }}
                  >
                    {plan.name}
                  </h3>
                  <p
                    className="text-[0.875rem] mb-4"
                    style={{
                      fontFamily: "Inter, sans-serif",
                      lineHeight: 1.6,
                      color: plan.featured
                        ? "rgba(247, 244, 238, 0.6)"
                        : "var(--muted-foreground)",
                    }}
                  >
                    {plan.description}
                  </p>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span
                        className="text-[0.875rem]"
                        style={{
                          fontFamily: "Inter, sans-serif",
                          color: plan.featured
                            ? "rgba(247, 244, 238, 0.5)"
                            : "var(--muted-foreground)",
                        }}
                      >
                        R$
                      </span>
                      <span
                        className="text-[2.75rem]"
                        style={{
                          fontFamily: "'Playfair Display', serif",
                          lineHeight: 1,
                          color: plan.featured ? "#EBBF74" : "var(--foreground)",
                        }}
                      >
                        {plan.price}
                      </span>
                    </div>
                    <p
                      className="text-[0.8rem] mt-1"
                      style={{
                        fontFamily: "Inter, sans-serif",
                        color: plan.featured
                          ? "rgba(247, 244, 238, 0.4)"
                          : "var(--muted-foreground)",
                      }}
                    >
                      por projeto editorial
                    </p>
                  </div>

                  {plan.featured ? (
                    <GoldButton className="w-full py-3 mb-6">
                      Começar agora
                    </GoldButton>
                  ) : (
                    <button
                      className="w-full py-3 mb-6 rounded-full border transition-all duration-300 cursor-pointer group-hover:shadow-md"
                      style={{
                        fontFamily: "Inter, sans-serif",
                        borderColor: "var(--primary)",
                        color: "var(--primary)",
                        backgroundColor: "transparent",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "var(--primary)";
                        e.currentTarget.style.color = "var(--primary-foreground)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = "var(--primary)";
                      }}
                    >
                      Escolher plano
                    </button>
                  )}

                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <span
                          className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5"
                          style={{
                            backgroundColor: plan.featured
                              ? "rgba(22, 91, 54, 0.8)"
                              : "rgba(22, 91, 54, 0.1)",
                          }}
                        >
                          <Check
                            className="w-3 h-3"
                            style={{
                              color: plan.featured
                                ? "#EBBF74"
                                : "var(--primary)",
                            }}
                          />
                        </span>
                        <span
                          className="text-[0.9rem]"
                          style={{
                            fontFamily: "Inter, sans-serif",
                            lineHeight: 1.5,
                            color: plan.featured
                              ? "rgba(247, 244, 238, 0.85)"
                              : "var(--foreground)",
                          }}
                        >
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </RevealOnScroll>
          ))}
        </div>

        <RevealOnScroll direction="up" delay={0.3}>
          <p
            className="text-center mt-8 text-[0.85rem] text-muted-foreground"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Todos os planos incluem contrato transparente e suporte dedicado.{" "}
            <a
              href="#contato"
              className="text-primary underline underline-offset-4 hover:no-underline"
            >
              Fale conosco
            </a>{" "}
            para planos personalizados.
          </p>
        </RevealOnScroll>
      </div>
    </section>
  );
}