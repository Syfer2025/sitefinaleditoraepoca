import { useState, useEffect } from "react";
import { Mail, MapPin, Phone, Send, CheckCircle } from "lucide-react";
import { GoldButton } from "./GoldButton";
import { RevealOnScroll } from "./RevealOnScroll";
import { motion, AnimatePresence } from "motion/react";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { toast } from "sonner";
import { getContactInfo, type ContactInfo } from "../data/api";

const DEFAULT_CONTACT: ContactInfo = {
  phone: "(44) 3456-7890",
  address: "Maringa, PR - Brasil",
  city: "",
  email: "contato@epocaeditora.com.br",
  whatsapp: "",
  mapUrl: "",
};

export function ContactSection() {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [contactInfo, setContactInfo] = useState<ContactInfo>(DEFAULT_CONTACT);

  useEffect(() => {
    getContactInfo().then((info) => {
      if (info.phone || info.address || info.email) setContactInfo({ ...DEFAULT_CONTACT, ...info });
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const body = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      subject: formData.get("subject") as string,
      message: formData.get("message") as string,
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e413165d/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        }
      );
      if (!res.ok) {
        const err = await res.json();
        console.error("Contact form error:", err);
        toast.error("Erro ao enviar mensagem. Tente novamente.");
      } else {
        toast.success("Mensagem enviada com sucesso!");
        setSubmitted(true);
        form.reset();
        setTimeout(() => setSubmitted(false), 5000);
      }
    } catch (err: any) {
      if (err?.name === "AbortError") {
        toast.error("Tempo esgotado. Verifique sua conexão e tente novamente.");
      } else {
        console.error("Contact form submit error:", err);
        toast.error("Erro de conexão. Verifique sua internet e tente novamente.");
      }
    } finally {
      clearTimeout(timeout);
      setSending(false);
    }
  };

  return (
    <section id="contato" className="py-16 px-6 bg-secondary/30">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left side */}
          <RevealOnScroll direction="left" duration={0.8}>
            <div>
              <p
                className="text-[0.75rem] tracking-[0.3em] uppercase text-primary mb-3"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Contato
              </p>
              <h2
                className="text-[2.5rem] md:text-[3rem] text-foreground mb-4"
                style={{
                  fontFamily: "'Playfair Display', serif",
                  lineHeight: 1.15,
                }}
              >
                Fale <span className="italic">conosco</span>
              </h2>
              <p
                className="text-muted-foreground mb-8"
                style={{ fontFamily: "Inter, sans-serif", lineHeight: 1.8 }}
              >
                Quer submeter um manuscrito, agendar um evento ou simplesmente
                conversar sobre livros? Estamos aqui para você.
              </p>

              <div className="space-y-6">
                {[
                  {
                    icon: MapPin,
                    title: contactInfo.address,
                    sub: contactInfo.city || "Brasil",
                  },
                  {
                    icon: Phone,
                    title: contactInfo.phone,
                    sub: "Seg - Sex, 9h - 18h",
                  },
                  {
                    icon: Mail,
                    title: contactInfo.email,
                    sub: "Resposta em até 24h",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 group cursor-default"
                  >
                    <div className="bg-primary/10 p-3 rounded-xl group-hover:bg-primary/20 transition-colors duration-300">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p
                        className="text-foreground group-hover:text-primary transition-colors duration-300"
                        style={{ fontFamily: "Inter, sans-serif" }}
                      >
                        {item.title}
                      </p>
                      <p
                        className="text-[0.875rem] text-muted-foreground"
                        style={{ fontFamily: "Inter, sans-serif" }}
                      >
                        {item.sub}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </RevealOnScroll>

          {/* Form */}
          <RevealOnScroll direction="right" duration={0.8} delay={0.15}>
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border hover:shadow-lg transition-shadow duration-500 relative overflow-hidden">
              <AnimatePresence mode="wait">
                {submitted ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                    className="flex flex-col items-center justify-center py-12 text-center"
                  >
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-5">
                      <CheckCircle className="w-8 h-8 text-primary" />
                    </div>
                    <h3
                      className="text-[1.5rem] text-foreground mb-2"
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                      Mensagem enviada!
                    </h3>
                    <p
                      className="text-muted-foreground max-w-xs"
                      style={{
                        fontFamily: "Inter, sans-serif",
                        lineHeight: 1.7,
                      }}
                    >
                      Recebemos sua mensagem e responderemos em até 24 horas.
                      Obrigado pelo contato!
                    </p>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-5"
                    onSubmit={handleSubmit}
                  >
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="contact-name"
                          className="block text-[0.875rem] text-foreground mb-1.5"
                          style={{ fontFamily: "Inter, sans-serif" }}
                        >
                          Nome <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="contact-name"
                          type="text"
                          name="name"
                          placeholder="Seu nome"
                          required
                          className="w-full px-4 py-3 rounded-lg bg-input-background border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all duration-300"
                          style={{ fontFamily: "Inter, sans-serif" }}
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="contact-email"
                          className="block text-[0.875rem] text-foreground mb-1.5"
                          style={{ fontFamily: "Inter, sans-serif" }}
                        >
                          Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="contact-email"
                          type="email"
                          name="email"
                          placeholder="seu@email.com"
                          required
                          className="w-full px-4 py-3 rounded-lg bg-input-background border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all duration-300"
                          style={{ fontFamily: "Inter, sans-serif" }}
                        />
                      </div>
                    </div>
                    <div>
                      <label
                        className="block text-[0.875rem] text-foreground mb-1.5"
                        style={{ fontFamily: "Inter, sans-serif" }}
                      >
                        Assunto
                      </label>
                      <select
                        name="subject"
                        className="w-full px-4 py-3 rounded-lg bg-input-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all duration-300"
                        style={{ fontFamily: "Inter, sans-serif" }}
                      >
                        <option>Submissão de manuscrito</option>
                        <option>Parcerias</option>
                        <option>Eventos</option>
                        <option>Imprensa</option>
                        <option>Outro</option>
                      </select>
                    </div>
                    <div>
                      <label
                        htmlFor="contact-message"
                        className="block text-[0.875rem] text-foreground mb-1.5"
                        style={{ fontFamily: "Inter, sans-serif" }}
                      >
                        Mensagem <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="contact-message"
                        name="message"
                        rows={4}
                        placeholder="Sua mensagem..."
                        required
                        className="w-full px-4 py-3 rounded-lg bg-input-background border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all duration-300 resize-none"
                        style={{ fontFamily: "Inter, sans-serif" }}
                      />
                    </div>
                    <GoldButton type="submit" className="w-full py-3.5">
                      <Send className="w-4 h-4" />
                      {sending ? "Enviando..." : "Enviar mensagem"}
                    </GoldButton>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </RevealOnScroll>
        </div>
      </div>
    </section>
  );
}