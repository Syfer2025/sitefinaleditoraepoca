import { Navbar } from "./Navbar";
import { HeroSection } from "./HeroSection";
import { AboutSection } from "./AboutSection";
import { CatalogSection } from "./CatalogSection";
import { TestimonialsSection } from "./TestimonialsSection";
import { AuthorsSection } from "./AuthorsSection";

import { PricingSection } from "./PricingSection";
import { ContactSection } from "./ContactSection";
import { FaqSection } from "./FaqSection";
import { Footer } from "./Footer";
import { BackToTop } from "./BackToTop";
import { WhatsAppButton } from "./WhatsAppButton";
import { useSEO } from "../hooks/useSEO";

export function HomePage() {
  useSEO({
    title: "Época Editora de Livros — Histórias que transformam",
    description: "Publicamos histórias que transformam vidas. Serviços editoriais completos: diagramação, revisão, ISBN, criação de capa e distribuição digital. Catálogo com mais de 500 títulos.",
    canonical: "https://editoraepoca.com.br/",
  });
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <AboutSection />
      <CatalogSection />
      <TestimonialsSection />
      <AuthorsSection />
      <PricingSection />
      <FaqSection />
      <ContactSection />
      <Footer />
      <BackToTop />
      <WhatsAppButton />
    </div>
  );
}