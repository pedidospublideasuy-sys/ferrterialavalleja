import HeroBanner from '@/components/home/HeroBanner';
import CategoryGrid from '@/components/home/CategoryGrid';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import BrandsBar from '@/components/home/BrandsBar';
import HomeSections from '@/components/home/HomeSections';

export default function Home() {
  return (
    <div className="store-shell">
      <section className="mx-auto w-full max-w-[1440px]">
        <div className="h-[210px] sm:h-[300px] md:h-[390px] overflow-hidden">
          <HeroBanner />
        </div>
        <CategoryGrid />
      </section>
      <FeaturedProducts />
      <HomeSections />
      <BrandsBar />
    </div>
  );
}
