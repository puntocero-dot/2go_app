"use client";

import { useMemo, createElement } from "react";
import { sanitizeHTML, sanitizeRichHTML, sanitizeText } from "@/lib/sanitize";

interface SafeHTMLProps {
  html: string;
  mode?: "strict" | "basic" | "rich";
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
}

/**
 * Componente para renderizar HTML sanitizado de forma segura
 * Previene ataques XSS al limpiar el HTML antes de renderizarlo
 */
export function SafeHTML({
  html,
  mode = "basic",
  className = "",
  as: Component = "div",
}: SafeHTMLProps) {
  const sanitized = useMemo(() => {
    switch (mode) {
      case "strict":
        return sanitizeText(html);
      case "rich":
        return sanitizeRichHTML(html);
      default:
        return sanitizeHTML(html);
    }
  }, [html, mode]);

  return createElement(Component, {
    className,
    dangerouslySetInnerHTML: { __html: sanitized },
  });
}

/**
 * Componente para renderizar texto plano sanitizado
 */
export function SafeText({
  text,
  className = "",
  as: Component = "span",
}: {
  text: string;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
}) {
  const sanitized = useMemo(() => sanitizeText(text), [text]);

  return createElement(Component, { className }, sanitized);
}
