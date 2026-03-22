import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router";
import { useSEO } from "../hooks/useSEO";
import { ArrowLeft, Star, MessageCircle, Images, ZoomIn, ZoomOut, X, RotateCw } from "lucide-react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { WhatsAppButton } from "./WhatsAppButton";
import { BackToTop } from "./BackToTop";
import { GoldButton } from "./GoldButton";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { motion, AnimatePresence } from "motion/react";
import { getBookBySlug } from "../data/api";
import { allBooks, Book } from "../data/books";
import { buildWhatsAppUrl, useWhatsAppNumber } from "../data/constants";

export function BookDetailPage() {
  const whatsappNumber = useWhatsAppNumber();
  const { slug } = useParams<{ slug: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const lightboxRef = useRef<HTMLDivElement>(null);

  useSEO({
    title: book ? `${book.title} — Época Editora de Livros` : "Livro não encontrado — Época Editora",
    description: book
      ? `${book.title}${book.author ? ` — ${book.author}` : ""}. ${book.description ? book.description.slice(0, 140) : "Conheça este título no catálogo da Época Editora de Livros."}`
      : "Conheça este título no catálogo da Época Editora de Livros.",
    canonical: `https://editoraepoca.com.br/livros/${slug}`,
    ogImage: book?.cover || undefined,
  });

  useEffect(() => {
    // Inject Book JSON-LD when book data is available
    const scriptId = "book-jsonld";
    document.getElementById(scriptId)?.remove();
    if (book) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.type = "application/ld+json";
      script.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Book",
        "name": book.title,
        "author": book.author ? { "@type": "Person", "name": book.author } : undefined,
        "image": book.cover || undefined,
        "description": book.description || undefined,
        "datePublished": book.year ? String(book.year) : undefined,
        "inLanguage": "pt-BR",
        "publisher": {
          "@type": "Organization",
          "@id": "https://editoraepoca.com.br/#organization",
          "name": "Época Editora de Livros",
        },
        "offers": {
          "@type": "Offer",
          "url": `https://editoraepoca.com.br/livros/${slug}`,
          "availability": "https://schema.org/InStock",
          "seller": { "@type": "Organization", "name": "Época Editora de Livros" },
        },
        "url": `https://editoraepoca.com.br/livros/${slug}`,
      });
      document.head.appendChild(script);
    }
    return () => { document.getElementById(scriptId)?.remove(); };
  }, [book, slug]);

  useEffect(() => {
    if (!selectedPhoto) return;
    setLightboxZoom(1);
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedPhoto(null);
      if (e.key === "+" || e.key === "=") setLightboxZoom((z) => Math.min(z + 0.25, 4));
      if (e.key === "-") setLightboxZoom((z) => Math.max(z - 0.25, 0.5));
      if (e.key === "0") setLightboxZoom(1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedPhoto]);

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);

    getBookBySlug(slug!)
      .then((data) => { setBook(data.book); })
      .catch(() => {
        const found = allBooks.find((b) => b.slug === slug);
        if (found) setBook(found);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center pt-[72px]">
          <div
            className="w-10 h-10 border-3 rounded-full animate-spin"
            style={{ borderColor: "rgba(22,91,54,0.2)", borderTopColor: "#165B36" }}
          />
        </div>
        <Footer />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center py-20 px-6 text-center pt-[92px]">
          <p
            className="text-[2rem] text-foreground mb-4 font-serif"
          >
            Livro não encontrado
          </p>
          <p className="text-muted-foreground mb-8">
            O livro que você procura não está disponível.
          </p>
          <Link
            to="/catalogo"
            className="inline-flex items-center gap-2 text-primary underline underline-offset-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao catálogo
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const photos: string[] = book.photos || [];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 pt-[72px]">
        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-6 pt-6 pb-2">
          <Link
            to="/catalogo"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao catálogo
          </Link>
        </div>

        {/* Book hero */}
        <section className="py-10 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-start">
              {/* Cover */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="rounded-2xl overflow-hidden shadow-xl"
                style={{ maxHeight: "560px" }}
              >
                <ImageWithFallback
                  src={book.image}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
              </motion.div>

              {/* Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="space-y-5"
              >
                <div>
                  <span
                    className="inline-block bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs mb-3"
                  >
                    {book.genre}
                  </span>
                  <h1
                    className="text-[2.5rem] md:text-[3rem] text-foreground leading-tight font-serif"
                  >
                    {book.title}
                  </h1>
                  <p
                    className="text-muted-foreground mt-2"
                  >
                    por {book.author} · {book.year}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 fill-[#EBBF74] text-[#EBBF74]" />
                  <span
                    className="text-lg font-semibold text-foreground"
                  >
                    {book.rating}
                  </span>
                  <span
                    className="text-sm text-muted-foreground"
                  >
                    / 5.0
                  </span>
                </div>

                {book.description && (
                  <p
                    className="text-foreground/80 leading-relaxed text-[1.05rem]"
                    style={{ lineHeight: 1.8 }}
                  >
                    {book.description}
                  </p>
                )}

                <GoldButton
                  href={buildWhatsAppUrl(`Olá! Gostaria de saber mais sobre o livro "${book.title}".`, whatsappNumber)}
                  target="_blank"
                  className="inline-flex items-center gap-2 px-8 py-3.5"
                >
                  <MessageCircle className="w-4 h-4" />
                  Falar sobre este livro
                </GoldButton>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Photo gallery (diagramation portfolio) */}
        {photos.length > 0 && (
          <section className="py-14 px-6 bg-secondary/30">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-10">
                <p
                  className="text-[0.75rem] tracking-[0.3em] uppercase text-primary mb-3"
                >
                  Projeto Gráfico
                </p>
                <h2
                  className="text-[2rem] md:text-[2.5rem] text-foreground font-serif leading-[1.15]"
                >
                  <span className="italic">Diagramação</span> e layout
                </h2>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.map((url, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: i * 0.06 }}
                    onClick={() => setSelectedPhoto(url)}
                    className="aspect-[3/4] rounded-xl overflow-hidden border border-border group cursor-pointer"
                    style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
                  >
                    <ImageWithFallback
                      src={url}
                      alt={`Foto de diagramação ${i + 1} — ${book.title}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </motion.button>
                ))}
              </div>
            </div>
          </section>
        )}

        {photos.length === 0 && (
          <section className="py-10 px-6 bg-secondary/20">
            <div className="max-w-7xl mx-auto text-center">
              <Images className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Fotos de diagramação ainda não adicionadas.
              </p>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="py-16 px-6 text-center">
          <div className="max-w-2xl mx-auto">
            <h2
              className="text-[2rem] text-foreground mb-4 font-serif"
            >
              Quer publicar o seu livro?
            </h2>
            <p
              className="text-muted-foreground mb-8"
              style={{ lineHeight: 1.7 }}
            >
              Quer publicar sua obra? Entre em contato e transforme seu manuscrito em um livro publicado.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <GoldButton to="/nova-solicitacao" className="px-8 py-3.5">
                Publicar minha obra
              </GoldButton>
              <Link
                to="/catalogo"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg border text-foreground hover:bg-secondary/50 transition-colors text-sm"
                style={{ borderColor: "var(--border)" }}
              >
                Mais livros
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            ref={lightboxRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex flex-col"
            onClick={() => setSelectedPhoto(null)}
          >
            {/* Toolbar */}
            <div
              className="flex items-center justify-between px-4 py-3 flex-shrink-0"
              style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setLightboxZoom((z) => Math.max(z - 0.25, 0.5))}
                  className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  aria-label="Diminuir zoom"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs text-white/50 min-w-[3rem] text-center">
                  {Math.round(lightboxZoom * 100)}%
                </span>
                <button
                  onClick={() => setLightboxZoom((z) => Math.min(z + 0.25, 4))}
                  className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  aria-label="Aumentar zoom"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setLightboxZoom(1)}
                  className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer hidden sm:flex"
                  aria-label="Redefinir zoom"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Image area */}
            <div
              className="flex-1 overflow-auto flex items-center justify-center p-4"
              onClick={() => setSelectedPhoto(null)}
            >
              <motion.img
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.92, opacity: 0 }}
                transition={{ duration: 0.22 }}
                src={selectedPhoto}
                alt="Foto ampliada"
                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl transition-transform duration-200"
                style={{ transform: `scale(${lightboxZoom})`, transformOrigin: "center center", cursor: lightboxZoom > 1 ? "zoom-out" : "zoom-in" }}
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxZoom((z) => z > 1 ? 1 : 2);
                }}
              />
            </div>

            {/* Mobile hint */}
            <p className="text-center text-[0.65rem] text-white/25 pb-3 sm:hidden">
              Toque na imagem para ampliar · Toque fora para fechar
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
      <WhatsAppButton />
      <BackToTop />
    </div>
  );
}
