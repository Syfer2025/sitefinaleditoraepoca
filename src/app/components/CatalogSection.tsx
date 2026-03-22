import { useState, useEffect, useMemo } from "react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { LoadingSpinner } from "./LoadingSpinner";
import { BookX } from "lucide-react";
import { GoldButton } from "./GoldButton";
import { RevealOnScroll } from "./RevealOnScroll";
import { motion, AnimatePresence } from "motion/react";
import { featuredBooks } from "../data/books";
import { getBooks } from "../data/api";
import { buildWhatsAppUrl, useWhatsAppNumber } from "../data/constants";

export function CatalogSection() {
  const whatsappNumber = useWhatsAppNumber();
  const [activeGenre, setActiveGenre] = useState("Todos");
  const [allBooks, setAllBooks] = useState(featuredBooks);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBooks()
      .then((data) => { if (Array.isArray(data?.books) && data.books.length > 0) setAllBooks(data.books); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const featured = useMemo(() => allBooks.slice(0, 9), [allBooks]);
  const genres = useMemo(
    () => ["Todos", ...Array.from(new Set(featured.map((b) => b.genre)))],
    [featured]
  );
  const filteredBooks = useMemo(
    () => activeGenre === "Todos" ? featured : featured.filter((b) => b.genre === activeGenre),
    [featured, activeGenre]
  );

  return (
    <section id="catalogo" className="py-16 px-6 bg-secondary/30">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <RevealOnScroll direction="up" className="text-center mb-10">
          <p
            className="text-[0.75rem] tracking-[0.3em] uppercase text-primary mb-3"
          >
            Nosso Catálogo
          </p>
          <h2
            className="text-[2.5rem] md:text-[3rem] text-foreground mb-4 font-serif leading-[1.15]"
          >
            Destaques <span className="italic">editoriais</span>
          </h2>
          <p
            className="text-muted-foreground max-w-xl mx-auto"
            style={{ lineHeight: 1.7 }}
          >
            Confira nossas obras mais aclamadas pela crítica e amadas pelos
            leitores.
          </p>
        </RevealOnScroll>

        {/* Genre filters */}
        <RevealOnScroll direction="up" delay={0.15}>
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {genres.map((genre) => (
              <button
                key={genre}
                onClick={() => setActiveGenre(genre)}
                aria-label={`Filtrar por ${genre}`}
                aria-pressed={activeGenre === genre}
                className="px-5 py-2 rounded-full transition-all duration-300 cursor-pointer"
                style={{
                  backgroundColor:
                    activeGenre === genre ? "#165B36" : "var(--background)",
                  color:
                    activeGenre === genre
                      ? "var(--primary-foreground)"
                      : "var(--muted-foreground)",
                  border:
                    activeGenre === genre
                      ? "1px solid #165B36"
                      : "1px solid var(--border)",
                  transform: activeGenre === genre ? "scale(1.05)" : "scale(1)",
                }}
              >
                {genre}
              </button>
            ))}
          </div>
        </RevealOnScroll>

        {/* Books grid */}
        <div className="grid md:grid-cols-3 gap-6" aria-live="polite">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-card rounded-2xl overflow-hidden border border-border animate-pulse">
                <div className="h-64 bg-muted" />
                <div className="p-5 space-y-3">
                  <div className="h-3 bg-muted rounded w-1/4" />
                  <div className="h-5 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                  <div className="h-10 bg-muted rounded" />
                </div>
              </div>
            ))
          ) : (
          <AnimatePresence mode="popLayout">
            {filteredBooks.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
                className="md:col-span-3 flex flex-col items-center justify-center py-20"
              >
                <BookX className="w-12 h-12 text-muted-foreground/40 mb-4" />
                <p
                  className="text-muted-foreground text-[1.1rem]"
                >
                  Nenhum livro encontrado neste gênero.
                </p>
              </motion.div>
            ) : (
              filteredBooks.map((book, i) => (
                <motion.div
                  key={book.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{
                    duration: 0.45,
                    delay: i * 0.08,
                    ease: [0.25, 0.1, 0.25, 1],
                  }}
                  className="group bg-card rounded-2xl overflow-hidden border border-border"
                  style={{
                    boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                  }}
                  whileHover={{
                    y: -6,
                    boxShadow: "0 16px 40px rgba(5, 36, 19, 0.12)",
                    transition: { duration: 0.3 },
                  }}
                >
                  <div className="relative h-64 overflow-hidden">
                    <ImageWithFallback
                      src={book.image}
                      alt={book.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute top-4 left-4">
                      <span
                        className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-[0.75rem]"
                      >
                        {book.genre}
                      </span>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3
                      className="text-[1.375rem] text-foreground mb-1 font-serif"
                    >
                      {book.title}
                    </h3>
                    <p
                      className="text-[0.875rem] text-muted-foreground mb-3"
                    >
                      por {book.author}
                    </p>
                    <GoldButton
                      className="w-full py-2.5 block"
                      {...(book.slug
                        ? { to: `/livros/${book.slug}` }
                        : { href: buildWhatsAppUrl(`Olá! Gostaria de saber mais sobre o livro "${book.title}".`, whatsappNumber), target: "_blank" }
                      )}
                    >
                      Ver detalhes
                    </GoldButton>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
          )}
        </div>

      </div>
    </section>
  );
}