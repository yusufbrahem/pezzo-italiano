import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import BrandStory from "@/components/BrandStory";
import MenuShowcase from "@/components/MenuShowcase";
import SignatureProducts from "@/components/SignatureProducts";
import Gallery from "@/components/Gallery";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <BrandStory />
      <MenuShowcase />
      <SignatureProducts />
      <Gallery />
      <Contact />
      <Footer />
    </main>
  );
}
