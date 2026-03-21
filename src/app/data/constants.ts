// Centralized constants — update WHATSAPP_NUMBER with the real number before going live
export const WHATSAPP_NUMBER = "5511999999999";

export function buildWhatsAppUrl(text: string, number: string = WHATSAPP_NUMBER): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
