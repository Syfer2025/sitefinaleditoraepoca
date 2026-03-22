import { Link } from "react-router";
import { BookX, Home, ArrowLeft } from "lucide-react";
import { GoldButton } from "./GoldButton";
import { motion } from "motion/react";

export function NotFoundPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{
        background: "linear-gradient(135deg, #052413 0%, #165B36 50%, #052413 100%)",
      }}
    >
      {/* Decorative glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/3 -left-20 w-72 h-72 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #EBBF74, transparent)" }}
        />
        <div
          className="absolute bottom-1/3 -right-20 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #EBBF74, transparent)" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
        className="relative text-center max-w-lg"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6"
          style={{ background: "rgba(235, 191, 116, 0.1)" }}
        >
          <BookX className="w-10 h-10 text-[#EBBF74]" />
        </div>

        <h1
          className="text-[5rem] md:text-[7rem] text-[#EBBF74] mb-2 leading-none font-serif"
        >
          404
        </h1>

        <h2
          className="text-2xl md:text-3xl text-white mb-4 font-serif"
        >
          Página não <span className="italic text-[#EBBF74]">encontrada</span>
        </h2>

        <p
          className="text-white/60 mb-8 max-w-md mx-auto"
          style={{ lineHeight: 1.7 }}
        >
          A página que você procura não existe ou foi movida.
          Que tal voltar ao início e explorar nosso catálogo?
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/">
            <GoldButton className="px-8 py-3.5">
              <Home className="w-4 h-4" />
              Voltar ao início
            </GoldButton>
          </Link>
          <button
            onClick={() => window.history.back()}
            className="border border-white/30 text-white px-8 py-3.5 rounded-full hover:bg-white/10 hover:border-white/50 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
        </div>
      </motion.div>
    </div>
  );
}
