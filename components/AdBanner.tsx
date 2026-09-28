import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

interface AdBannerProps {
  /**
   * ID del bloque de anuncios (ad-slot) configurado en Google AdSense.
   * Ej: "1234567890"
   */
  slot?: string;
  /**
   * Formato de anuncio deseado
   */
  format?: 'auto' | 'horizontal' | 'rectangle';
  /**
   * Clases CSS opcionales para personalizar márgenes o dimensiones
   */
  className?: string;
}

const ADSENSE_CLIENT_ID = (import.meta.env.VITE_ADSENSE_CLIENT_ID as string | undefined)?.trim() || '';

export const AdBanner: React.FC<AdBannerProps> = ({
  slot = '1234567890',
  format = 'auto',
  className = '',
}) => {
  const adRef = useRef<HTMLModElement>(null);
  const isLoadedRef = useRef(false);

  useEffect(() => {
    if (!ADSENSE_CLIENT_ID || typeof window === 'undefined') return;

    // Inyectar el script principal de AdSense una sola vez si no existe
    if (!document.getElementById('adsense-script')) {
      const script = document.createElement('script');
      script.id = 'adsense-script';
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`;
      document.head.appendChild(script);
    }

    // Inicializar el bloque publicitario evitando push duplicados
    if (!isLoadedRef.current && adRef.current) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        isLoadedRef.current = true;
      } catch (err) {
        console.debug('AdSense init notice:', err);
      }
    }
  }, []);

  // Si no está configurado el Client ID de AdSense, no mostramos nada para mantener la interfaz limpia
  if (!ADSENSE_CLIENT_ID) {
    return null;
  }

  return (
    <aside
      aria-label="Publicidad"
      className={`my-8 flex min-h-[100px] w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-white p-2 shadow-xs ${className}`}
    >
      <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
        Publicidad
      </div>
      <ins
        ref={adRef}
        className="adsbygoogle block w-full text-center"
        style={{ display: 'block', minHeight: '90px' }}
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </aside>
  );
};
