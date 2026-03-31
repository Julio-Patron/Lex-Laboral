/**
 * SEO Manager — Dynamic Head Tags for SPA
 * 
 * Actualiza <title>, <meta description>, canonical, y OG tags
 * dinámicamente al navegar entre vistas en la SPA.
 * 
 * Uso: llamar updateSEO(AppView.CALCULATOR) al cambiar de vista.
 */

import { AppView } from '../types';
import { getPathForView } from './routes';

const SITE_NAME = 'Lex Laboral';
const BASE_URL = 'https://lexlaboral.com.mx';
const DEFAULT_OG_IMAGE = `${BASE_URL}/assets/og-image.png`;

interface SEOConfig {
  title: string;
  description: string;
  path: string;
  robots?: string;
  ogTitle?: string;
  ogDescription?: string;
}

/**
 * Mapa de configuración SEO por vista.
 * Cada vista pública tiene su propio título, descripción y canonical.
 */
const SEO_MAP: Record<AppView, SEOConfig> = {
  [AppView.HOME]: {
    title: `Lex Laboral — Herramientas Jurídicas Laborales en México 2026`,
    description: 'Calcula tu liquidación, finiquito, aguinaldo y horas extra en México. Genera documentos legales con IA. Resultados claros y actualizados con UMA 2026.',
    path: getPathForView(AppView.HOME),
  },
  [AppView.CALCULATOR]: {
    title: `Calculadora de Liquidación y Finiquito México 2026 | ${SITE_NAME}`,
    description: 'Calcula tu liquidación, finiquito, aguinaldo, vacaciones, prima de antigüedad e ISR al instante. Actualizado con la UMA y tablas fiscales 2026.',
    path: getPathForView(AppView.CALCULATOR),
    ogTitle: 'Calculadora de Liquidación y Finiquito México 2026',
    ogDescription: 'Herramienta gratuita para calcular tu liquidación laboral en México con desglose paso a paso.',
  },
  [AppView.DRAFTING]: {
    title: `Generador de Documentos Legales con IA | ${SITE_NAME}`,
    description: 'Genera contratos laborales, convenios, cartas de renuncia y escritos legales personalizados con inteligencia artificial. Basado en la Ley Federal del Trabajo.',
    path: getPathForView(AppView.DRAFTING),
    ogTitle: 'Generador de Documentos Legales con IA',
    ogDescription: 'Crea contratos y documentos legales laborales en México al instante con inteligencia artificial.',
  },
  [AppView.SOCIAL_SECURITY]: {
    title: `Calculadora de Cuotas IMSS e INFONAVIT 2026 | ${SITE_NAME}`,
    description: 'Calcula las cuotas obrero-patronales IMSS e INFONAVIT con desglose completo por ramo de seguro. Incluye prima de riesgo de trabajo y cesantía.',
    path: getPathForView(AppView.SOCIAL_SECURITY),
    ogTitle: 'Calculadora de Cuotas IMSS e INFONAVIT 2026',
    ogDescription: 'Desglose completo de cuotas de seguridad social para patrones y trabajadores en México.',
  },
  [AppView.CEO_DASHBOARD]: {
    title: `Panel de Administración | ${SITE_NAME}`,
    description: 'Panel de control y métricas de Lex Laboral.',
    path: getPathForView(AppView.CEO_DASHBOARD),
    robots: 'noindex, nofollow, noarchive',
  },
  [AppView.TERMS]: {
    title: `Términos y Condiciones | ${SITE_NAME}`,
    description: 'Términos y condiciones de uso de la plataforma Lex Laboral. Conoce tus derechos y obligaciones como usuario.',
    path: getPathForView(AppView.TERMS),
  },
  [AppView.PRIVACY]: {
    title: `Aviso de Privacidad | ${SITE_NAME}`,
    description: 'Aviso de privacidad y protección de datos personales de Lex Laboral conforme a la LFPDPPP.',
    path: getPathForView(AppView.PRIVACY),
  },
};

/**
 * Actualiza o crea un <meta> tag en el <head>.
 */
function setMeta(attribute: string, key: string, value: string): void {
  let el = document.querySelector(`meta[${attribute}="${key}"]`) as HTMLMetaElement | null;
  if (el) {
    el.setAttribute('content', value);
  } else {
    el = document.createElement('meta');
    el.setAttribute(attribute, key);
    el.setAttribute('content', value);
    document.head.appendChild(el);
  }
}

/**
 * Actualiza o crea el <link rel="canonical">.
 */
function setCanonical(url: string): void {
  let el = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (el) {
    el.href = url;
  } else {
    el = document.createElement('link');
    el.rel = 'canonical';
    el.href = url;
    document.head.appendChild(el);
  }
}

/**
 * Actualiza todos los tags SEO del <head> para la vista dada.
 * Llamar al cambiar de vista en la aplicación.
 */
export function updateSEO(view: AppView): void {
  const config = SEO_MAP[view];
  if (!config) return;

  const fullUrl = `${BASE_URL}${config.path}`;
  const ogTitle = config.ogTitle || config.title;
  const ogDescription = config.ogDescription || config.description;

  // Title
  document.title = config.title;

  // Standard meta
  setMeta('name', 'description', config.description);
  setMeta('name', 'robots', config.robots || 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');

  // Canonical
  setCanonical(fullUrl);

  // Open Graph
  setMeta('property', 'og:title', ogTitle);
  setMeta('property', 'og:description', ogDescription);
  setMeta('property', 'og:url', fullUrl);
  setMeta('property', 'og:image', DEFAULT_OG_IMAGE);
  setMeta('property', 'og:site_name', SITE_NAME);
  setMeta('property', 'og:type', 'website');
  setMeta('property', 'og:locale', 'es_MX');

  // Twitter
  setMeta('name', 'twitter:card', 'summary_large_image');
  setMeta('name', 'twitter:title', ogTitle);
  setMeta('name', 'twitter:description', ogDescription);
  setMeta('name', 'twitter:url', fullUrl);
  setMeta('name', 'twitter:image', DEFAULT_OG_IMAGE);
}

/**
 * Retorna la configuración SEO para una vista (útil para SSR futuro).
 */
export function getSEOConfig(view: AppView): SEOConfig {
  return SEO_MAP[view] || SEO_MAP[AppView.HOME];
}
