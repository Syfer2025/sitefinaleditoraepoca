import { GoldButton } from "./GoldButton";
import { RevealOnScroll } from "./RevealOnScroll";
import { Feather } from "lucide-react";

export function CtaBanner() {
  return (
    <section className="py-14 px-6 bg-[#165B36] relative overflow-hidden">
      {/* Decorative pattern */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23EBBF74' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="max-w-4xl mx-auto relative z-10">
        <RevealOnScroll direction="up">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#EBBF74]/15 mb-4">
              <Feather className="w-6 h-6 text-[#EBBF74]" />
            </div>
            <h2
              className="text-[2rem] md:text-[2.75rem] text-white mb-3"
              style={{
                fontFamily: "'Playfair Display', serif",
                lineHeight: 1.2,
              }}
            >
              Tem um manuscrito esperando{" "}
              <span className="italic text-[#EBBF74]">para nascer?</span>
            </h2>
            <p
              className="text-white/70 max-w-xl mx-auto mb-6 text-[1.05rem]"
              style={{ fontFamily: "Inter, sans-serif", lineHeight: 1.7 }}
            >
              Conheça nosso plano Profissional — o mais escolhido pelos autores
              que buscam excelência editorial, distribuição nacional e suporte
              completo de marketing.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <GoldButton href="#planos" className="px-8 py-3.5">
                Conhecer planos
              </GoldButton>
              <a
                href="#contato"
                className="border border-white/30 text-white px-8 py-3.5 rounded-full hover:bg-white/10 hover:border-white/50 transition-all duration-300"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Enviar manuscrito
              </a>
            </div>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}