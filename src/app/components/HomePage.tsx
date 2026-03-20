import { Navbar } from "./Navbar";
import { HeroSection } from "./HeroSection";
import { AboutSection } from "./AboutSection";
import { CatalogSection } from "./CatalogSection";
import { TestimonialsSection } from "./TestimonialsSection";
import { AuthorsSection } from "./AuthorsSection";
import { CtaBanner } from "./CtaBanner";
import { PricingSection } from "./PricingSection";
import { ContactSection } from "./ContactSection";
import { FaqSection } from "./FaqSection";
import { Footer } from "./Footer";
import { BackToTop } from "./BackToTop";
import { WhatsAppButton } from "./WhatsAppButton";

export function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <AboutSection />
      <CatalogSection />
      <TestimonialsSection />
      <AuthorsSection />
      <CtaBanner />
      <PricingSection />
      <FaqSection />
      <ContactSection />
      <Footer />
      <BackToTop />
      <WhatsAppButton />
    </div>
  );
}