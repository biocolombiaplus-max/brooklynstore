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

export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustBar />
      <FeaturedBrandSpotlight />
      <BrandStrip />
      <CategoryTiles />
      <FeaturedProducts />
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
