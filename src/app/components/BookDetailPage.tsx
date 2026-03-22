import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { useSEO } from "../hooks/useSEO";
import { ArrowLeft, Star, MessageCircle, Images } from "lucide-react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { WhatsAppButton } from "./WhatsAppButton";
import { BackToTop } from "./BackToTop";
import { GoldButton } from "./GoldButton";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { motion, AnimatePresence } from "motion/react";
import { getBookBySlug } from "../data/api";
import { allBooks, Book } from "../data/books";
import { buildWhatsAppUrl } from "../data/constants";

export function BookDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

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
            className="text-[2rem] text-foreground mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Livro não encontrado
          </p>
          <p className="text-muted-foreground mb-8" style={{ fontFamily: "Inter, sans-serif" }}>
            O livro que você procura não está disponível.
          </p>
          <Link
            to="/catalogo"
            className="inline-flex items-center gap-2 text-primary underline underline-offset-4"
            style={{ fontFamily: "Inter, sans-serif" }}
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
            style={{ fontFamily: "Inter, sans-serif" }}
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
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    {book.genre}
                  </span>
                  <h1
                    className="text-[2.5rem] md:text-[3rem] text-foreground leading-tight"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {book.title}
                  </h1>
                  <p
                    className="text-muted-foreground mt-2"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    por {book.author} · {book.year}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 fill-[#EBBF74] text-[#EBBF74]" />
                  <span
                    className="text-lg font-semibold text-foreground"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    {book.rating}
                  </span>
                  <span
                    className="text-sm text-muted-foreground"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    / 5.0
                  </span>
                </div>

                {book.description && (
                  <p
                    className="text-foreground/80 leading-relaxed text-[1.05rem]"
                    style={{ fontFamily: "Inter, sans-serif", lineHeight: 1.8 }}
                  >
                    {book.description}
                  </p>
                )}

                <GoldButton
                  href={buildWhatsAppUrl(`Olá! Gostaria de saber mais sobre o livro "${book.title}".`)}
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
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Projeto Gráfico
                </p>
                <h2
                  className="text-[2rem] md:text-[2.5rem] text-foreground"
                  style={{ fontFamily: "'Playfair Display', serif", lineHeight: 1.15 }}
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
              <p className="text-sm text-muted-foreground" style={{ fontFamily: "Inter, sans-serif" }}>
                Fotos de diagramação ainda não adicionadas.
              </p>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="py-16 px-6 text-center">
          <div className="max-w-2xl mx-auto">
            <h2
              className="text-[2rem] text-foreground mb-4"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Quer publicar o seu livro?
            </h2>
            <p
              className="text-muted-foreground mb-8"
              style={{ fontFamily: "Inter, sans-serif", lineHeight: 1.7 }}
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
                style={{ fontFamily: "Inter, sans-serif", borderColor: "var(--border)" }}
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="max-w-3xl max-h-[90vh] rounded-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedPhoto}
                alt="Foto ampliada"
                className="w-full h-full object-contain"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
      <WhatsAppButton />
      <BackToTop />
    </div>
  );
}
