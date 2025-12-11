// Security headers mejorados para toda la aplicación
export const securityHeaders = {
  // HSTS: Force HTTPS por 2 años
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  
  // Prevenir MIME sniffing
  "X-Content-Type-Options": "nosniff",
  
  // Prevenir clickjacking
  "X-Frame-Options": "DENY",
  
  // XSS Protection (legacy pero útil)
  "X-XSS-Protection": "1; mode=block",
  
  // Referrer policy
  "Referrer-Policy": "strict-origin-when-cross-origin",
  
  // Permissions Policy (antes Feature Policy)
  "Permissions-Policy": "geolocation=(self), camera=(), microphone=(), payment=()",
  
  // Content Security Policy
  "Content-Security-Policy": `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://api.mapbox.com https://vercel.live;
    script-src-elem 'self' https://api.mapbox.com https://vercel.live;
    style-src 'self' 'unsafe-inline' https://api.mapbox.com;
    img-src 'self' data: https: blob:;
    font-src 'self' data:;
    connect-src 'self' https://api.mapbox.com https://events.mapbox.com https://res.cloudinary.com https://api.cloudinary.com;
    frame-src 'none';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
  `.replace(/\s+/g, " ").trim(),
};

// Headers específicos para facturación (más restrictivos)
export function getBillingSecurityHeaders(): Record<string, string> {
  return {
    ...securityHeaders,
    "X-Frame-Options": "DENY",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=(), payment=()",
  };
}
