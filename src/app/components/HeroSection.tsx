import { useEffect, useRef, useCallback } from "react";
import { GoldButton } from "./GoldButton";
import { motion } from "motion/react";

export function HeroSection() {
  const bgRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const onScroll = useCallback(() => {
    const y = window.scrollY;
    if (bgRef.current) {
      const scale = 1 + y * 0.0003;
      bgRef.current.style.transform = `scale(${scale}) translateY(${y * 0.15}px)`;
    }
    if (overlayRef.current) {
      const opacity = Math.min(0.85, 0.5 + y * 0.0005);
      overlayRef.current.style.background = `linear-gradient(to bottom, rgba(5,36,19,${opacity}) 0%, rgba(5,36,19,0.45) 50%, rgba(5,36,19,${opacity}) 100%)`;
    }
  }, []);

  useEffect(() => {
    let ticking = false;
    const handler = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          onScroll();
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [onScroll]);

  return (
    <section
      id="hero"
      className="relative h-[70vh] min-h-[480px] flex items-center justify-center overflow-hidden mt-[72px]"
    >
      {/* Background image with parallax */}
      <div className="absolute inset-0">
        <div
          ref={bgRef}
          className="w-full h-full"
          style={{
            willChange: "transform",
          }}
        >
          <img
            src="https://images.unsplash.com/photo-1722977735215-d28f2ac6efba?crop=entropy&cs=tinysrgb&fit=max&fm=webp&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxib29rc3RvcmUlMjBsaWJyYXJ5JTIwc2hlbHZlcyUyMHdhcm18ZW58MXx8fHwxNzcyNDU3MzE2fDA&ixlib=rb-4.1.0&q=70&w=1400"
            srcSet="https://images.unsplash.com/photo-1722977735215-d28f2ac6efba?crop=entropy&cs=tinysrgb&fit=max&fm=webp&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxib29rc3RvcmUlMjBsaWJyYXJ5JTIwc2hlbHZlcyUyMHdhcm18ZW58MXx8fHwxNzcyNDU3MzE2fDA&ixlib=rb-4.1.0&q=65&w=800 800w, https://images.unsplash.com/photo-1722977735215-d28f2ac6efba?crop=entropy&cs=tinysrgb&fit=max&fm=webp&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxib29rc3RvcmUlMjBsaWJyYXJ5JTIwc2hlbHZlcyUyMHdhcm18ZW58MXx8fHwxNzcyNDU3MzE2fDA&ixlib=rb-4.1.0&q=70&w=1400 1400w"
            sizes="100vw"
            alt="Biblioteca"
            className="w-full h-full object-cover"
            fetchPriority="high"
          />
        </div>
        <div
          ref={overlayRef}
          className="absolute inset-0 transition-opacity duration-300"
          style={{
            background: `linear-gradient(to bottom, rgba(5,36,19,0.5) 0%, rgba(5,36,19,0.45) 50%, rgba(5,36,19,0.5) 100%)`,
          }}
        />
      </div>

      {/* Content with staggered entrance */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-[0.875rem] tracking-[0.3em] uppercase text-[#EBBF74] mb-4 font-sans"
        >
          Época Editora de Livros
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-[3rem] md:text-[4.5rem] text-white mb-4 font-serif leading-[1.1]"
        >
          Histórias que transformam,
          <br />
          <span className="italic text-[#EBBF74]">palavras que ficam</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-[1.125rem] text-white/80 mb-8 max-w-2xl mx-auto font-sans leading-[1.7]"
        >
          Publicamos obras que desafiam, encantam e inspiram leitores ao redor
          do mundo. Descubra nosso catálogo com mais de 500 títulos.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.95, ease: [0.25, 0.1, 0.25, 1] }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <GoldButton href="#catalogo" className="px-8 py-3.5">
            Explorar Catálogo
          </GoldButton>
          <a
            href="#sobre"
            className="border border-white/30 text-white px-8 py-3.5 rounded-full hover:bg-white/10 hover:border-white/50 transition-all duration-300 font-sans"
          >
            Conheça a Editora
          </a>
        </motion.div>
      </div>

    </section>
  );
}