// src/app/page.tsx  (v2 fintech — drop-in replacement)
// Adds two new sections (Cases, Toolkit) between Regions and Donors.
import Navbar from "@/components/ui/Navbar"
import Footer from "@/components/ui/Footer"
import HeroSection from "@/components/sections/HeroSection"
import BioSection from "@/components/sections/BioSection"
import ExpertiseSection from "@/components/sections/ExpertiseSection"
import RegionsSection from "@/components/sections/RegionsSection"
import CasesSection from "@/components/sections/CasesSection"
import ToolkitSection from "@/components/sections/ToolkitSection"
import DonorsSection from "@/components/sections/DonorsSection"
import ContactSection from "@/components/sections/ContactSection"

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <div className="hidden md:block">
          <BioSection />
          <ExpertiseSection />
          <RegionsSection />
          <CasesSection />
          <ToolkitSection />
          <DonorsSection />
        </div>
        <ContactSection />
      </main>
      <Footer />
    </>
  )
}
