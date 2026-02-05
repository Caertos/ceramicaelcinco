/**
 * useDocumentMeta - Hook personalizado para gestionar meta tags dinámicos por página
 * Mejora el SEO permitiendo que cada ruta tenga sus propias meta tags
 */

import { useEffect } from 'react';

export const useDocumentMeta = ({
  title,
  description,
  keywords,
  ogTitle,
  ogDescription,
  ogImage,
  canonicalUrl,
  structuredData
}) => {
  useEffect(() => {
    // Actualizar título
    if (title) {
      document.title = `${title} | Cerámica El Cinco`;
    }

    // Actualizar meta description
    if (description) {
      updateMetaTag('name', 'description', description);
    }

    // Actualizar keywords
    if (keywords) {
      updateMetaTag('name', 'keywords', keywords);
    }

    // Open Graph
    if (ogTitle) {
      updateMetaTag('property', 'og:title', ogTitle);
    }
    if (ogDescription) {
      updateMetaTag('property', 'og:description', ogDescription);
    }
    if (ogImage) {
      updateMetaTag('property', 'og:image', ogImage);
    }

    // Twitter Card
    if (ogTitle) {
      updateMetaTag('name', 'twitter:title', ogTitle);
    }
    if (ogDescription) {
      updateMetaTag('name', 'twitter:description', ogDescription);
    }
    if (ogImage) {
      updateMetaTag('name', 'twitter:image', ogImage);
    }

    // Canonical URL
    if (canonicalUrl) {
      updateCanonicalLink(canonicalUrl);
    }

    // Structured Data (JSON-LD)
    if (structuredData) {
      updateStructuredData(structuredData);
    }

    // Cleanup function
    return () => {
      // Restaurar valores por defecto si es necesario
    };
  }, [title, description, keywords, ogTitle, ogDescription, ogImage, canonicalUrl, structuredData]);
};

// Función auxiliar para actualizar meta tags
const updateMetaTag = (attribute, key, content) => {
  let element = document.querySelector(`meta[${attribute}="${key}"]`);
  
  if (element) {
    element.setAttribute('content', content);
  } else {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    element.setAttribute('content', content);
    document.head.appendChild(element);
  }
};

// Función auxiliar para actualizar canonical link
const updateCanonicalLink = (url) => {
  let link = document.querySelector('link[rel="canonical"]');
  
  if (link) {
    link.setAttribute('href', url);
  } else {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', url);
    document.head.appendChild(link);
  }
};

// Función auxiliar para actualizar structured data
const updateStructuredData = (data) => {
  const existingScript = document.querySelector('script[data-dynamic-ld]');
  if (existingScript) {
    existingScript.remove();
  }

  const script = document.createElement('script');
  script.setAttribute('type', 'application/ld+json');
  script.setAttribute('data-dynamic-ld', 'true');
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
};

// Configuraciones predefinidas para cada página
export const pageMetaConfig = {
  home: {
    title: 'Inicio - Fabricación de Ladrillos y Bloques Cerámicos',
    description: 'Cerámica El Cinco: Fabricantes líderes de ladrillos, bloques y productos cerámicos de alta calidad. Más de 30 años innovando en la industria cerámica.',
    keywords: 'cerámica el cinco, ladrillos colombia, bloques cerámicos, materiales construcción, fábrica ladrillos, productos cerámicos',
    ogTitle: 'Cerámica El Cinco - Fabricación de Ladrillos y Bloques Cerámicos de Calidad',
    ogDescription: 'Fabricantes de ladrillos, bloques y productos cerámicos de alta calidad. Más de 30 años de experiencia.',
    ogImage: 'https://ceramicaselcinco.com/LogoCEC_2025-2.webp',
    canonicalUrl: 'https://ceramicaselcinco.com/',
  },
  about: {
    title: 'Quiénes Somos - Nuestra Historia y Compromiso',
    description: 'Conoce la historia de Cerámica El Cinco, nuestra misión, visión y valores. Empresa líder en fabricación de productos cerámicos con compromiso ambiental.',
    keywords: 'quiénes somos cerámica el cinco, historia empresa cerámica, misión visión valores, compromiso ambiental',
    ogTitle: 'Quiénes Somos - Cerámica El Cinco',
    ogDescription: 'Conoce nuestra historia, misión, visión y valores. Más de 30 años fabricando productos cerámicos de calidad.',
    ogImage: 'https://ceramicaselcinco.com/QuienesSomosBanner.webp',
    canonicalUrl: 'https://ceramicaselcinco.com/about',
  },
  products: {
    title: 'Productos - Ladrillos y Bloques Cerámicos de Calidad',
    description: 'Catálogo completo de productos cerámicos: ladrillos de fachada, perforación vertical, levante de muros y bloquelones. Calidad certificada.',
    keywords: 'ladrillos, bloques cerámicos, ladrillo fachada, ladrillo perforado, bloquelón, productos cerámicos colombia',
    ogTitle: 'Productos Cerámicos - Cerámica El Cinco',
    ogDescription: 'Descubre nuestro catálogo: ladrillos de fachada, perforación vertical, levante de muros y bloquelones.',
    ogImage: 'https://ceramicaselcinco.com/ProductosBanner.webp',
    canonicalUrl: 'https://ceramicaselcinco.com/products',
  },
  process: {
    title: 'Proceso de Producción - Cómo Fabricamos Nuestros Productos',
    description: 'Conoce nuestro proceso de fabricación de productos cerámicos: desde la extracción de materias primas hasta el producto final. Tecnología y calidad.',
    keywords: 'proceso fabricación cerámica, producción ladrillos, manufactura cerámica, proceso industrial cerámica',
    ogTitle: 'Proceso de Producción - Cerámica El Cinco',
    ogDescription: 'Descubre cómo fabricamos nuestros productos cerámicos con tecnología de punta y control de calidad.',
    ogImage: 'https://ceramicaselcinco.com/HacemosBanner.webp',
    canonicalUrl: 'https://ceramicaselcinco.com/process',
  },
  gallery: {
    title: 'Galería - Proyectos y Obras',
    description: 'Galería de proyectos realizados con nuestros productos cerámicos. Inspírate con obras de construcción y arquitectura.',
    keywords: 'galería cerámica, proyectos construcción, obras ladrillos, arquitectura cerámica',
    ogTitle: 'Galería de Proyectos - Cerámica El Cinco',
    ogDescription: 'Explora nuestra galería de proyectos y obras realizadas con productos Cerámica El Cinco.',
    ogImage: 'https://ceramicaselcinco.com/galleryBanner.webp',
    canonicalUrl: 'https://ceramicaselcinco.com/gallery',
  },
  contact: {
    title: 'Contacto - Comunícate con Nosotros',
    description: 'Contáctanos para más información sobre nuestros productos cerámicos. Atención personalizada y asesoría técnica.',
    keywords: 'contacto cerámica el cinco, cotización ladrillos, asesoría construcción, ventas productos cerámicos',
    ogTitle: 'Contacto - Cerámica El Cinco',
    ogDescription: 'Comunícate con nosotros para cotizaciones, asesoría técnica e información sobre nuestros productos.',
    ogImage: 'https://ceramicaselcinco.com/contactBanner.webp',
    canonicalUrl: 'https://ceramicaselcinco.com/contact',
  },
};
