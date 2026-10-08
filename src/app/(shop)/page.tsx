import Hero from '@/components/Hero';
import TrustBar from '@/components/TrustBar';
import BrandStrip from '@/components/home/BrandStrip';
import FeaturedBrandSpotlight from '@/components/home/FeaturedBrandSpotlight';
import CategoryTiles from '@/components/home/CategoryTiles';
import FeaturedProducts from '@/components/FeaturedProducts';
import PaymentMethods from '@/components/home/PaymentMethods';
import HowItWorks from '@/components/HowItWorks';
import SizeGuidePromo from '@/components/home/SizeGuidePromo';
import Benefits from '@/components/Benefits';
import Testimonials from '@/components/Testimonials';
import Faq from '@/components/home/Faq';
import HomeCTA from '@/components/HomeCTA';
import RealDeliveries from '@/components/RealDeliveries';
import { getActiveProductsServer } from '@/lib/productsServer';
import { slimProduct } from '@/lib/productMap';
import { featuredTabs } from '@/lib/featuredTabs';
import { getSiteSettingsServer } from '@/lib/settingsServer';
import { isStarBrand } from '@/lib/brand';

export default async function HomePage() {
  const [products, settings] = await Promise.all([getActiveProductsServer(), getSiteSettingsServer()]);
  // Solo viajan en el HTML los zapatos que se muestran (livianos).
  const tabs = featuredTabs(products);
  const featured = Array.from(new Map([...tabs.vendidos, ...tabs.nuevos, ...tabs.ofertas].map((p) => [p.id, slimProduct(p)])).values());
  const starProducts = products.filter((p) => isStarBrand(settings.featuredBrand, p.brand)).map(slimProduct);

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://brooklynstore-six.vercel.app').replace(/\/$/, '');
  const social = [settings.footer.instagram, settings.footer.facebook, settings.footer.tiktok].filter((u) => u?.startsWith('http'));
  // Datos de la tienda para Google: nombre, logo, contacto, redes y buscador.
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'ShoeStore',
      name: settings.storeName,
      url: siteUrl,
      image: `${siteUrl}/og-image.jpg`,
      logo: settings.logoUrl ? (settings.logoUrl.startsWith('http') ? settings.logoUrl : `${siteUrl}${settings.logoUrl}`) : `${siteUrl}/icon-512`,
      description: 'Tienda de zapatos multimarca en Ecuador: On Cloud, Nike, Adidas, Jordan, New Balance, Hoka y más. Envío a todo el país y pago contra entrega.',
      areaServed: { '@type': 'Country', name: 'Ecuador' },
      currenciesAccepted: 'USD',
      paymentAccepted: 'Transferencia bancaria, depósito, pago contra entrega',
      ...(settings.whatsappNumber ? { telephone: `+${settings.whatsappCountryCode}${settings.whatsappNumber.replace(/^0/, '')}` } : {}),
      ...(settings.footer.email ? { email: settings.footer.email } : {}),
      ...(social.length ? { sameAs: social } : {}),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: settings.storeName,
      url: siteUrl,
      potentialAction: { '@type': 'SearchAction', target: `${siteUrl}/catalogo?q={search_term_string}`, 'query-input': 'required name=search_term_string' },
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <Hero />
      <TrustBar />
      {/* Los zapatos primero: quien llega del anuncio ve productos de inmediato. */}
      <FeaturedProducts initialProducts={featured} />
      <RealDeliveries />
      <CategoryTiles />
      <FeaturedBrandSpotlight initialProducts={starProducts} />
      <BrandStrip />
      <PaymentMethods />
      <HowItWorks />
      <SizeGuidePromo />
      <Benefits />
      <Testimonials />
      <Faq />
      <HomeCTA />
    </>
  );
}
