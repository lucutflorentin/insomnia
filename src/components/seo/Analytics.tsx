'use client';

import { useState, useEffect } from 'react';
import Script from 'next/script';

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const COOKIE_KEY = 'insomnia_cookie_consent';

export default function Analytics() {
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    setConsent(localStorage.getItem(COOKIE_KEY) === 'accepted');

    // Listen for consent changes (from CookieConsent component)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === COOKIE_KEY) {
        setConsent(e.newValue === 'accepted');
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  if (!consent) return null;

  return (
    <>
      {/* Google Analytics 4 */}
      {GA_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}', {
                page_title: document.title,
                page_location: window.location.href,
              });
            `}
          </Script>
        </>
      )}

      {/* Meta Pixel (Facebook) */}
      {META_PIXEL_ID && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${META_PIXEL_ID}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}
    </>
  );
}

// Helper to track custom events (respects cookie consent)
export function trackEvent(eventName: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(COOKIE_KEY) !== 'accepted') return;

  // GA4
  if ('gtag' in window) {
    (window as unknown as { gtag: (...args: unknown[]) => void }).gtag(
      'event',
      eventName,
      params,
    );
  }

  // Meta Pixel
  if ('fbq' in window) {
    (window as unknown as { fbq: (...args: unknown[]) => void }).fbq(
      'track',
      eventName,
      params,
    );
  }
}
