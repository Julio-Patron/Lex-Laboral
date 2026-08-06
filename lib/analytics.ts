import { track } from '@vercel/analytics';

/**
 * Eventos personalizados para rastrear el uso de Lex Laboral.
 * 
 * ¿Qué es esto? Cada vez que un usuario hace algo importante en la app
 * (genera un documento, usa la calculadora, etc.), enviamos un "evento"
 * a Vercel Analytics para que tú puedas ver las métricas en tu dashboard.
 * 
 * ¿Dónde se ven? En https://vercel.com → tu proyecto → Analytics → Events
 */

type EventName =
  | 'view_changed'        // Usuario cambió de módulo
  | 'calculator_used'     // Calculadora utilizada
  | 'social_security_used' // Calculadora de IMSS utilizada
  | 'pension_calculator_used' // Calculadora de pensiones utilizada
  | 'consultas_search';   // Búsqueda en consultas jurídicas

/**
 * Envía un evento personalizado a Vercel Analytics.
 * 
 * Ejemplo de uso:
 *   trackEvent('document_generated', { type: 'demanda' });
 *   trackEvent('calculator_used', { dismissal_type: 'injustificado' });
 */
export function trackEvent(name: EventName, properties?: Record<string, string | number | boolean>) {
  try {
    track(name, properties);
  } catch {
    // Silently fail — analytics should never break the app
  }
}
