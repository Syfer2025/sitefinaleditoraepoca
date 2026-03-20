import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

export function WhatsAppButton() {
  const [visible, setVisible] = useState(false);
  const [pulse, setPulse] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Stop pulse after a few seconds
  useEffect(() => {
    const timer = setTimeout(() => setPulse(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  const whatsappNumber = "5511999999999";
  const message = encodeURIComponent(
    "Olá! Gostaria de saber mais sobre os serviços da Época Editora."
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;

  return (
    <AnimatePresence>
      {visible && (
        <motion.a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, scale: 0, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0, y: 30 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          className="fixed bottom-8 right-8 z-40 group"
          aria-label="Fale conosco pelo WhatsApp"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          {/* Pulse ring */}
          {pulse && (
            <span
              className="absolute inset-0 rounded-full animate-ping"
              style={{
                backgroundColor: "#25D366",
                opacity: 0.3,
                animationDuration: "2s",
              }}
            />
          )}

          {/* Button */}
          <div
            className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-shadow duration-300 group-hover:shadow-xl"
            style={{
              background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
            }}
          >
            {/* WhatsApp Icon */}
            <svg
              viewBox="0 0 24 24"
              className="w-7 h-7 text-white fill-current"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </div>

          {/* Tooltip */}
          <div
            className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none scale-95 group-hover:scale-100"
            style={{
              backgroundColor: "#052413",
              color: "#fff",
              fontFamily: "Inter, sans-serif",
              fontSize: "0.8rem",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            }}
          >
            Fale conosco
            <span
              className="absolute left-full top-1/2 -translate-y-1/2"
              style={{
                borderTop: "5px solid transparent",
                borderBottom: "5px solid transparent",
                borderLeft: "5px solid #052413",
              }}
            />
          </div>
        </motion.a>
      )}
    </AnimatePresence>
  );
}