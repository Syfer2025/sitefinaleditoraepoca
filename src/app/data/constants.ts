// ⚠️  IMPORTANTE: Atualize o número real de WhatsApp antes de colocar em produção!
// Formato: código do país + DDD + número (sem espaços ou caracteres especiais)
export const WHATSAPP_NUMBER = "5544999999999";

export function buildWhatsAppUrl(text: string, number: string = WHATSAPP_NUMBER): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

import { useState, useEffect } from "react";
import { getContactInfo } from "./api";

let _cachedWhatsApp: string | null = null;

export function useWhatsAppNumber(): string {
  const [number, setNumber] = useState(_cachedWhatsApp || WHATSAPP_NUMBER);

  useEffect(() => {
    if (_cachedWhatsApp) { setNumber(_cachedWhatsApp); return; }
    getContactInfo()
      .then((info) => {
        if (info.whatsapp) {
          _cachedWhatsApp = info.whatsapp;
          setNumber(info.whatsapp);
        }
      })
      .catch(() => {});
  }, []);

  return number;
}
