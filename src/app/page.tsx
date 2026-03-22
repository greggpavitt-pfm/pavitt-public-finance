// Main page — assembles all sections in order
import Navbar from "@/components/ui/Navbar"
import Footer from "@/components/ui/Footer"
import HeroSection from "@/components/sections/HeroSection"
import BioSection from "@/components/sections/BioSection"
import ExpertiseSection from "@/components/sections/ExpertiseSection"
import RegionsSection from "@/components/sections/RegionsSection"
import DonorsSection from "@/components/sections/DonorsSection"
import ContactSection from "@/components/sections/ContactSection"

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <BioSection />
        <ExpertiseSection />
        <RegionsSection />
        <DonorsSection />
        <ContactSection />
      </main>
      <Footer />
    </>
  )
}
