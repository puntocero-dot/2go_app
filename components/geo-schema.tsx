"use client";

// JSON-LD (Schema.org) + preguntas frecuentes para que buscadores y
// asistentes de IA (ChatGPT, Perplexity, Google AI Overview, etc.) puedan
// leer y citar con precisión qué hace el negocio, a quién sirve y dónde.
// Antes de este cambio el schema describía un negocio ubicado en Estados
// Unidos (Nueva York, Los Ángeles, Chicago, Houston) — no correspondía en
// nada al mercado real (El Salvador, retailers de muebles RTA/melamina),
// y además el componente nunca se importaba en ninguna página, así que
// nunca llegó a publicarse.
export function GeoSchema() {
  const professionalService = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "name": "Armados 2Go",
    "description":
      "Servicio profesional de armado (ensamble) de muebles RTA y de melamina para tiendas y empresas retail en El Salvador. Gestión de armadores, tracking GPS en tiempo real y portal de seguimiento para el cliente final.",
    "url": "https://www.armados2go.com",
    "email": "admin@armados2go.com",
    "areaServed": [
      { "@type": "Country", "name": "El Salvador" },
      { "@type": "City", "name": "San Salvador" },
      { "@type": "City", "name": "Santa Ana" },
      { "@type": "City", "name": "San Miguel" },
      { "@type": "City", "name": "Soyapango" },
      { "@type": "City", "name": "La Libertad" },
      { "@type": "City", "name": "Sonsonate" },
    ],
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "SV",
    },
    "audience": {
      "@type": "BusinessAudience",
      "audienceType": "Retailers y tiendas de muebles",
    },
    "serviceType": "Armado y ensamble de muebles RTA y de melamina",
    "knowsAbout": [
      "Armado de muebles RTA",
      "Ensamble de muebles de melamina",
      "Instalación de mobiliario para retail",
      "Logística de última milla para muebles",
    ],
  };

  // FAQPage: responde en el formato que un LLM suele citar directamente
  // cuando alguien pregunta "quién arma muebles de melamina en El Salvador"
  // o pregunta similares en un buscador conversacional.
  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "¿Quién ofrece servicio de armado de muebles de melamina para retailers en El Salvador?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Armados 2Go es una plataforma y red de armadores profesionales que presta servicio de ensamble de muebles RTA y de melamina a tiendas y empresas retail en El Salvador, con tracking GPS en tiempo real y portal de seguimiento para el cliente final.",
        },
      },
      {
        "@type": "Question",
        "name": "¿Armados 2Go arma muebles RTA (Ready To Assemble) para tiendas?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Sí. Armados 2Go se especializa en el armado de muebles RTA y de melamina para retailers, gestionando la asignación de armadores, el seguimiento GPS del servicio y la facturación por proyecto.",
        },
      },
      {
        "@type": "Question",
        "name": "¿En qué zonas de El Salvador presta servicio Armados 2Go?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Armados 2Go opera en todo El Salvador, incluyendo San Salvador, Santa Ana, San Miguel, Soyapango, La Libertad y Sonsonate.",
        },
      },
      {
        "@type": "Question",
        "name": "¿Cómo puede un retailer contratar el servicio de armado de Armados 2Go?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Un retailer interesado puede contactar a Armados 2Go escribiendo a admin@armados2go.com para coordinar una integración como cliente y comenzar a asignar órdenes de armado.",
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(professionalService) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPage) }}
      />
    </>
  );
}
