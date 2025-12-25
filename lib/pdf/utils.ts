/**
 * Utilidades para generación de PDFs
 */

/**
 * Sanitiza texto para que sea compatible con PDF (solo caracteres Latin-1)
 */
export function sanitizePdfText(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  let result = '';

  for (const ch of str) {
    const code = ch.codePointAt(0) ?? 32;
    if (
      code === 10 ||
      code === 13 ||
      (code >= 32 && code <= 126) ||
      (code >= 160 && code <= 255)
    ) {
      result += ch;
    } else {
      result += '?';
    }
  }

  return result;
}

/**
 * Formatea un número como moneda
 */
export function formatMoney(value: number): string {
  return `$${value.toFixed(2)}`;
}

/**
 * Trunca texto si excede el ancho máximo
 */
export function truncateText(
  text: string,
  maxWidth: number,
  fontSize: number,
  font: any
): string {
  const safeText = sanitizePdfText(text);
  const textWidth = font.widthOfTextAtSize(safeText, fontSize);
  if (textWidth <= maxWidth) return safeText;

  let truncated = safeText;
  while (
    font.widthOfTextAtSize(truncated + '...', fontSize) > maxWidth &&
    truncated.length > 0
  ) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + '...';
}

/**
 * Formatea una fecha en español
 */
export function formatDateES(date: Date): string {
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Formatea fecha y hora en español
 */
export function formatDateTimeES(date: Date): string {
  return date.toLocaleString('es-ES');
}
