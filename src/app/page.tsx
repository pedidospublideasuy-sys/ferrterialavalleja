import HeroBanner from '@/components/home/HeroBanner';
import CategoryGrid from '@/components/home/CategoryGrid';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import HomeSections from '@/components/home/HomeSections';

export default function Home() {
  return (
    <div className="store-shell">
      <section className="w-full">
        <div className="h-[210px] sm:h-[300px] md:h-[430px] overflow-hidden">
          <HeroBanner />
        </div>
        <CategoryGrid />
      </section>
      <FeaturedProducts />
      <HomeSections />
    </div>
  );
}
