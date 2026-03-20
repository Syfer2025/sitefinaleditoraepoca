import { useState } from "react";
import { BookOpen, Search, Star, Calendar, Tag } from "lucide-react";
import { motion } from "motion/react";
import { allBooks, genres } from "../../data/books";

export function AdminBooks() {
  const [search, setSearch] = useState("");
  const [genreFilter, setGenreFilter] = useState("Todos");

  const filtered = allBooks.filter((b) => {
    if (genreFilter !== "Todos" && b.genre !== genreFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Info banner */}
      <div
        className="rounded-xl p-4 border flex items-start gap-3"
        style={{
          backgroundColor: "rgba(22,91,54,0.04)",
          borderColor: "rgba(22,91,54,0.12)",
        }}
      >
        <BookOpen className="w-5 h-5 text-[#165B36] flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-[#052413] font-medium" style={{ fontFamily: "Inter, sans-serif" }}>
            Catálogo de Livros
          </p>
          <p className="text-xs text-[#856C42] mt-0.5" style={{ fontFamily: "Inter, sans-serif" }}>
            Visualize todos os {allBooks.length} livros cadastrados no catálogo. Os dados dos livros são gerenciados no código-fonte do site.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#856C42]/50" />
          <input
            type="text"
            placeholder="Buscar por título ou autor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm text-[#052413] placeholder:text-[#856C42]/40 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20"
            style={{
              fontFamily: "Inter, sans-serif",
              backgroundColor: "#FFFDF8",
              borderColor: "rgba(133,108,66,0.15)",
            }}
          />
        </div>
        <select
          value={genreFilter}
          onChange={(e) => setGenreFilter(e.target.value)}
          className="px-4 py-2.5 rounded-lg border text-sm text-[#052413] focus:outline-none focus:ring-2 focus:ring-[#165B36]/20"
          style={{
            fontFamily: "Inter, sans-serif",
            backgroundColor: "#FFFDF8",
            borderColor: "rgba(133,108,66,0.15)",
          }}
        >
          {genres.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>

      {/* Books grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((book, i) => (
          <motion.div
            key={book.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.3 }}
            className="rounded-xl border overflow-hidden group hover:shadow-md transition-shadow"
            style={{
              backgroundColor: "#FFFDF8",
              borderColor: "rgba(133,108,66,0.12)",
            }}
          >
            <div className="h-36 overflow-hidden">
              <img
                src={book.image}
                alt={book.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-4">
              <h4
                className="text-sm font-semibold text-[#052413] line-clamp-1"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {book.title}
              </h4>
              <p
                className="text-xs text-[#856C42] mt-0.5"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                {book.author}
              </p>

              <div className="flex items-center gap-3 mt-3">
                <span
                  className="flex items-center gap-1 text-[0.65rem] text-[#165B36] px-2 py-0.5 rounded-full"
                  style={{
                    fontFamily: "Inter, sans-serif",
                    backgroundColor: "rgba(22,91,54,0.08)",
                  }}
                >
                  <Tag className="w-2.5 h-2.5" />
                  {book.genre}
                </span>
                <span
                  className="flex items-center gap-1 text-[0.65rem] text-[#856C42]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  <Star className="w-2.5 h-2.5 fill-[#EBBF74] text-[#EBBF74]" />
                  {book.rating}
                </span>
                <span
                  className="flex items-center gap-1 text-[0.65rem] text-[#856C42]/60 ml-auto"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  <Calendar className="w-2.5 h-2.5" />
                  {book.year}
                </span>
              </div>

              <p
                className="text-[0.7rem] text-[#856C42]/70 mt-2 line-clamp-2 leading-relaxed"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                {book.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <BookOpen className="w-10 h-10 text-[#856C42]/30 mx-auto mb-3" />
          <p className="text-sm text-[#856C42]" style={{ fontFamily: "Inter, sans-serif" }}>
            Nenhum livro encontrado
          </p>
        </div>
      )}
    </div>
  );
}
