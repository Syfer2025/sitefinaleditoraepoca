import { useState, useEffect, useMemo } from "react";
import { useSEO } from "../hooks/useSEO";
import { Link } from "react-router";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Star, BookX, Search, ArrowLeft, SlidersHorizontal, X } from "lucide-react";
import { GoldButton } from "./GoldButton";
import { Footer } from "./Footer";
import { BackToTop } from "./BackToTop";
import { WhatsAppButton } from "./WhatsAppButton";
import { motion, AnimatePresence } from "motion/react";
import logoFallback from "/assets/logo.png";
import { allBooks } from "../data/books";
import { getBooks, getLogos } from "../data/api";
import { buildWhatsAppUrl } from "../data/constants";

const sortOptions = [
  { label: "Mais recentes", value: "recent" },
  { label: "Melhor avaliados", value: "rating" },
  { label: "A-Z", value: "az" },
];

export function CatalogPage() {
  const [activeGenre, setActiveGenre] = useState("Todos");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [showFilters, setShowFilters] = useState(false);
  const [books, setBooks] = useState(allBooks);
  const [logoImg, setLogoImg] = useState<string>(logoFallback);

  useSEO({
    title: "Catálogo de Livros",
    description: "Explore o catálogo completo da Época Editora de Livros. Mais de 500 títulos de ficção, poesia, ensaios, literatura infantil e muito mais.",
    canonical: "https://editoraepoca.com.br/catalogo",
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    getBooks()
      .then((data) => { if (Array.isArray(data?.books) && data.books.length > 0) setBooks(data.books); })
      .catch(() => {/* silently use defaults */});
    getLogos()
      .then((l) => { if (l.logo_navbar) setLogoImg(l.logo_navbar); })
      .catch(() => {});
  }, []);

  const genres = useMemo(
    () => ["Todos", ...Array.from(new Set(books.map((b) => b.genre)))],
    [books]
  );

  const filteredBooks = useMemo(
    () =>
      books
        .filter((b) => {
          const matchGenre = activeGenre === "Todos" || b.genre === activeGenre;
          const matchSearch =
            search === "" ||
            b.title.toLowerCase().includes(search.toLowerCase()) ||
            b.author.toLowerCase().includes(search.toLowerCase());
          return matchGenre && matchSearch;
        })
        .sort((a, b) => {
          if (sortBy === "recent") return b.year - a.year;
          if (sortBy === "rating") return b.rating - a.rating;
          return a.title.localeCompare(b.title);
        }),
    [books, activeGenre, search, sortBy]
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Top navbar */}
      <nav
        className="sticky top-0 z-50 transition-all duration-300"
        style={{
          backgroundColor: "rgba(247, 244, 238, 0.95)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(133, 108, 66, 0.15)",
          boxShadow: "0 1px 20px rgba(5, 36, 19, 0.06)",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img src={logoImg} alt="Época Editora" className="h-10" />
          </Link>
          <Link
            to="/"
            className="flex items-center gap-2 transition-colors duration-300"
            style={{
              fontFamily: "Inter, sans-serif",
              color: "#856C42",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#165B36";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#856C42";
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao início
          </Link>
        </div>
      </nav>

      {/* Hero header */}
      <div
        className="py-14 px-6 relative overflow-hidden"
        style={{ backgroundColor: "#052413" }}
      >
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23EBBF74' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-[0.75rem] tracking-[0.3em] uppercase text-[#EBBF74] mb-3"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Catálogo Completo
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-[2.5rem] md:text-[3.5rem] text-white mb-3"
            style={{
              fontFamily: "'Playfair Display', serif",
              lineHeight: 1.15,
            }}
          >
            Nossas <span className="italic text-[#EBBF74]">obras</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-white/65 max-w-xl mx-auto"
            style={{ fontFamily: "Inter, sans-serif", lineHeight: 1.7 }}
          >
            Explore todas as publicações da Época Editora — romances, contos,
            poesia, ensaios e muito mais.
          </motion.p>
        </div>
      </div>

      {/* Filters & Content */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Search + Sort bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por título ou autor..."
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all duration-300"
              style={{ fontFamily: "Inter, sans-serif" }}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 rounded-xl bg-card border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all duration-300 cursor-pointer"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="sm:hidden flex items-center gap-2 px-4 py-3 rounded-xl bg-card border border-border text-foreground transition-all duration-300 cursor-pointer"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filtros
            </button>
          </div>
        </div>

        {/* Genre filters */}
        <div
          className={`flex-wrap gap-2 mb-8 ${showFilters ? "flex" : "hidden sm:flex"}`}
        >
          {genres.map((genre) => (
            <button
              key={genre}
              onClick={() => setActiveGenre(genre)}
              className="px-4 py-2 rounded-full transition-all duration-300 cursor-pointer text-[0.875rem]"
              style={{
                fontFamily: "Inter, sans-serif",
                backgroundColor:
                  activeGenre === genre ? "#165B36" : "var(--card)",
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

        {/* Results count */}
        <p
          className="text-[0.85rem] text-muted-foreground mb-6"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          {filteredBooks.length}{" "}
          {filteredBooks.length === 1 ? "obra encontrada" : "obras encontradas"}
          {activeGenre !== "Todos" && (
            <span>
              {" "}
              em{" "}
              <span style={{ color: "#165B36" }}>{activeGenre}</span>
            </span>
          )}
          {search && (
            <span>
              {" "}
              para &ldquo;<span style={{ color: "#165B36" }}>{search}</span>
              &rdquo;
            </span>
          )}
        </p>

        {/* Books grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredBooks.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
                className="sm:col-span-2 lg:col-span-3 flex flex-col items-center justify-center py-20"
              >
                <BookX className="w-12 h-12 text-muted-foreground/40 mb-4" />
                <p
                  className="text-muted-foreground text-[1.1rem] mb-2"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Nenhum livro encontrado.
                </p>
                <p
                  className="text-[0.875rem] text-muted-foreground/60"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Tente ajustar os filtros ou buscar outro termo.
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
                    duration: 0.4,
                    delay: i * 0.05,
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
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute top-4 left-4 flex gap-2">
                      <span
                        className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-[0.75rem]"
                        style={{ fontFamily: "Inter, sans-serif" }}
                      >
                        {book.genre}
                      </span>
                      <span
                        className="px-3 py-1 rounded-full text-[0.75rem]"
                        style={{
                          fontFamily: "Inter, sans-serif",
                          backgroundColor: "rgba(255,255,255,0.85)",
                          color: "#052413",
                        }}
                      >
                        {book.year}
                      </span>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-1 mb-2">
                      <Star className="w-4 h-4 fill-[#EBBF74] text-[#EBBF74]" />
                      <span
                        className="text-[0.875rem] text-muted-foreground"
                        style={{ fontFamily: "Inter, sans-serif" }}
                      >
                        {book.rating}
                      </span>
                    </div>
                    <h3
                      className="text-[1.375rem] text-foreground mb-1"
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                      {book.title}
                    </h3>
                    <p
                      className="text-[0.875rem] text-muted-foreground mb-3"
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      por {book.author}
                    </p>
                    <p
                      className="text-[0.8rem] text-muted-foreground/80 mb-4"
                      style={{
                        fontFamily: "Inter, sans-serif",
                        lineHeight: 1.6,
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {book.description}
                    </p>
                    <GoldButton
                      className="w-full py-2.5 block"
                      {...(book.slug
                        ? { to: `/livros/${book.slug}` }
                        : { href: buildWhatsAppUrl(`Olá! Gostaria de saber mais sobre o livro "${book.title}".`), target: "_blank" }
                      )}
                    >
                      Ver detalhes
                    </GoldButton>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      <Footer />
      <BackToTop />
      <WhatsAppButton />
    </div>
  );
}