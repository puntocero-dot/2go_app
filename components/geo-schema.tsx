"use client";

// Componente para JSON-LD Schema de GEO
export function GeoSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "name": "Armados2Go",
    "description": "Solución técnica especializada en el ensamble, nivelación y anclaje de mobiliario RTA, optimizando tiempos de montaje en un 60% frente a instalaciones no profesionales.",
    "url": "https://armados2go.com",
    "telephone": "+1-800-ARMADOS",
    "email": "contacto@armados2go.com",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "US",
      "addressRegion": "Multiple"
    },
    "geo": {
      "@type": "GeoCircle",
      "geoMidpoint": {
        "@type": "GeoCoordinates",
        "latitude": "40.7128",
        "longitude": "-74.0060"
      },
      "geoRadius": "500"
    },
    "areaServed": [
      {
        "@type": "City",
        "name": "New York"
      },
      {
        "@type": "City", 
        "name": "Los Angeles"
      },
      {
        "@type": "City",
        "name": "Chicago"
      },
      {
        "@type": "City",
        "name": "Houston"
      }
    ],
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Servicios de Ensamble Profesional",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Ensamble de Muebles de Oficina",
            "description": "Protocolo de Ensamble Eficiente con verificación de torque y estabilidad estructural para escritorios, sistemas de archivo y estantería modular"
          },
          "availability": "https://schema.org/InStock"
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Ensamble de Muebles de Hogar",
            "description": "Instalación profesional de mobiliario RTA residencial con garantía de nivelación y anclaje seguro"
          },
          "availability": "https://schema.org/InStock"
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Ensamble de Equipo de Gimnasio",
            "description": "Montaje especializado de equipamiento fitness con verificación de seguridad y calibración funcional"
          },
          "availability": "https://schema.org/InStock"
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Instalación de Racks Industriales",
            "description": "Sistema de montaje industrial con certificación de capacidad de carga y normativa de seguridad"
          },
          "availability": "https://schema.org/InStock"
        }
      ]
    },
    "brand": {
      "@type": "Brand",
      "name": "Armados2Go",
      "slogan": "Ensamble Profesional. Garantía Total."
    },
    "knowsAbout": [
      "IKEA furniture assembly",
      "Amazon Basics assembly",
      "Wayfair furniture installation", 
      "Home Depot assembly services",
      "Office Depot furniture installation"
    ],
    "serviceType": "Furniture Assembly Service",
    "hasCredential": {
      "@type": "EducationalOccupationalCredential",
      "credentialCategory": "Professional Certification",
      "name": "Certified Furniture Assembly Technician"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "1247",
      "bestRating": "5",
      "worstRating": "1",
      "ratingExplanation": "Basado en satisfacción técnica (98.5%) y puntualidad (97.2%)"
    },
    "offers": {
      "@type": "Offer",
      "name": "Cotización Inmediata",
      "description": "Obtén presupuesto instantáneo basado en inventario de muebles",
      "url": "https://armados2go.com/cotizacion",
      "availabilityStarts": "2024-01-01T00:00:00Z",
      "priceCurrency": "USD",
      "eligibleRegion": {
        "@type": "Country",
        "name": "United States"
      }
    },
    "sameAs": [
      "https://www.facebook.com/armados2go",
      "https://www.instagram.com/armados2go",
      "https://www.linkedin.com/company/armados2go"
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
