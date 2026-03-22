import { lazy, Suspense } from "react";
import { Navbar } from "./Navbar";
import { HeroSection } from "./HeroSection";
import { useSEO } from "../hooks/useSEO";

const AboutSection = lazy(() => import("./AboutSection").then(m => ({ default: m.AboutSection })));
const CatalogSection = lazy(() => import("./CatalogSection").then(m => ({ default: m.CatalogSection })));
const TestimonialsSection = lazy(() => import("./TestimonialsSection").then(m => ({ default: m.TestimonialsSection })));
const AuthorsSection = lazy(() => import("./AuthorsSection").then(m => ({ default: m.AuthorsSection })));
const PricingSection = lazy(() => import("./PricingSection").then(m => ({ default: m.PricingSection })));
const ContactSection = lazy(() => import("./ContactSection").then(m => ({ default: m.ContactSection })));
const FaqSection = lazy(() => import("./FaqSection").then(m => ({ default: m.FaqSection })));
const Footer = lazy(() => import("./Footer").then(m => ({ default: m.Footer })));
const BackToTop = lazy(() => import("./BackToTop").then(m => ({ default: m.BackToTop })));
const WhatsAppButton = lazy(() => import("./WhatsAppButton").then(m => ({ default: m.WhatsAppButton })));

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
      <Suspense fallback={null}>
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
      </Suspense>
    </div>
  );
}