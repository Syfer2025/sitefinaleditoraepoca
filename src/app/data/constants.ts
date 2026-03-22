// ⚠️  IMPORTANTE: Atualize o número real de WhatsApp antes de colocar em produção!
// Formato: código do país + DDD + número (sem espaços ou caracteres especiais)
export const WHATSAPP_NUMBER = "5544999999999";

export function buildWhatsAppUrl(text: string, number: string = WHATSAPP_NUMBER): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
