'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useSiteSettings } from '@/lib/settings-context';
import { trackPixel } from '@/lib/pixel';
import { isStaffDevice } from '@/lib/visitor';

// Píxel de Meta: se activa solo cuando hay un ID guardado en el panel
// (Configuración → Píxel de Meta). Registra cada página vista, también al
// navegar dentro de la tienda sin recargar.
export default function MetaPixel() {
  const { metaPixelId } = useSiteSettings();
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    if (!metaPixelId) return;
    if (first.current) {
      first.current = false;
      return; // La primera vista ya la registra el código base.
    }
    trackPixel('PageView');
  }, [pathname, metaPixelId]);

  // El equipo (celulares que entran al panel) no cuenta para Meta.
  if (!metaPixelId || (typeof window !== 'undefined' && isStaffDevice())) return null;

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${metaPixelId}');fbq('track','PageView');(window.__bsPixelQueue||[]).forEach(function(a){fbq.apply(null,a.filter(function(x){return x!==undefined}))});window.__bsPixelQueue=[];`}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img height="1" width="1" style={{ display: 'none' }} alt="" src={`https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1`} />
      </noscript>
    </>
  );
}
