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
  // unsafe-eval: requerido por Mapbox GL JS (usa eval para shaders WebGL)
  // unsafe-inline en style-src: requerido por Mapbox GL y Radix UI (inyectan estilos inline)
  "Content-Security-Policy": `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://api.mapbox.com https://vercel.live https://*.mapbox.com;
    script-src-elem 'self' 'unsafe-inline' https://api.mapbox.com https://vercel.live https://*.mapbox.com;
    style-src 'self' 'unsafe-inline' https://api.mapbox.com https://*.mapbox.com https://vercel.live;
    img-src 'self' data: blob: https://res.cloudinary.com https://api.mapbox.com https://*.mapbox.com https://vercel.live https://vercel.com;
    font-src 'self' data: https://api.mapbox.com https://*.mapbox.com https://vercel.live https://assets.vercel.com;
    connect-src 'self' https://api.mapbox.com https://events.mapbox.com https://res.cloudinary.com https://api.cloudinary.com https://*.tiles.mapbox.com https://*.mapbox.com https://vercel.live wss://ws-us3.pusher.com;
    worker-src 'self' blob: data: https://api.mapbox.com https://*.mapbox.com https://vercel.live;
    frame-src 'self' https://vercel.live;
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
