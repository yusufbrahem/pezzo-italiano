import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import BrandStory from "@/components/BrandStory";
import MenuShowcase from "@/components/MenuShowcase";
import SignatureProducts from "@/components/SignatureProducts";
import Reviews from "@/components/Reviews";
import Gallery from "@/components/Gallery";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import StickyMobileCTA from "@/components/StickyMobileCTA";

export default function Home() {
  return (
    <main className="pb-[72px] lg:pb-0">
      <Navbar />
      <Hero />
      <BrandStory />
      <MenuShowcase />
      <SignatureProducts />
      <Reviews />
      <Gallery />
      <Contact />
      <Footer />
      <StickyMobileCTA />
    </main>
  );
}
