import { track } from '@vercel/analytics';

/**
 * Eventos personalizados para rastrear el uso de Lex Laboral.
 * Sincronizados simultáneamente con Vercel Analytics y Google Analytics (GA4).
 */
export type EventName =
  | 'view_changed'            // Usuario cambió de módulo
  | 'calculator_used'         // Calculadora de liquidación utilizada
  | 'social_security_used'    // Calculadora de IMSS utilizada
  | 'pension_calculator_used' // Calculadora de pensiones utilizada
  | 'consultas_search'        // Búsqueda en consultas jurídicas
  | 'export_document'         // Exportación de documento Word/PDF
  | 'export_pdf'              // Exportación de cálculo en PDF
  | 'apk_download'            // Descarga del instalador APK
  | 'official_source_click'   // Clic en enlace a fuentes gubernamentales
  | 'open_shared_link'        // Apertura de escenario compartido
  | 'share_whatsapp';         // Compartición de cálculo por WhatsApp

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

/**
 * ID de medición de Google Analytics 4 configurado en variables de entorno.
 * Formato: G-XXXXXXXXXX
 */
const GA_MEASUREMENT_ID = (import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined)?.trim() || '';

/**
 * Inicializa Google Analytics (GA4) inyectando gtag.js dinámicamente.
 * Si no hay measurementId configurado, opera de forma segura sin romper la app.
 */
export function initGoogleAnalytics(measurementId = GA_MEASUREMENT_ID): void {
  if (typeof window === 'undefined' || !measurementId) return;

  // Evitar inyección múltiple
  if (document.getElementById('ga-gtag-script')) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer?.push(arguments);
  };
  window.gtag('js', new Date());

  // En Single Page Applications (SPA), desactivamos el page_view automático
  // para emitirlo manualmente al cambiar de vista y evitar conteos dobles o rutas erróneas.
  window.gtag('config', measurementId, {
    send_page_view: false,
    anonymize_ip: true,
  });

  const script = document.createElement('script');
  script.id = 'ga-gtag-script';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);
}

/**
 * Registra una vista de página en Google Analytics para Single Page Applications (SPA).
 */
export function trackPageView(path: string, title?: string): void {
  try {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', {
        page_path: path,
        page_title: title || document.title,
        page_location: window.location.href,
      });
    }
  } catch {
    // Analytics should never break the app
  }
}

/**
 * Envía un evento personalizado tanto a Vercel Analytics como a Google Analytics (GA4).
 * 
 * Ejemplo de uso:
 *   trackEvent('calculator_used', { dismissal_type: 'injustificado' });
 *   trackEvent('export_document', { format_type: 'pdf' });
 */
export function trackEvent(
  name: EventName | string,
  properties?: Record<string, string | number | boolean>
): void {
  try {
    // Vercel Analytics
    track(name, properties);

    // Google Analytics (GA4)
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', name, properties);
    }
  } catch {
    // Silently fail — analytics should never break the app
  }
}
