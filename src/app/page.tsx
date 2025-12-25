"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { HeroSection } from "@/components/home/hero-section";
import { FeaturesSection } from "@/components/home/features-section";
import { HowItWorksSection } from "@/components/home/how-it-works-section";
import { CTASection } from "@/components/home/cta-section";
import { Footer } from "@/components/home/footer";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <div className="flex min-h-screen selection:bg-emerald-200 selection:text-emerald-900">
      <Sidebar />

      {/* Main Content Area */}
      <main className="mr-[72px] w-[calc(100%-72px)] relative">
        {/* Background Pattern */}
        <div className="fixed top-0 w-full h-full -z-10 bg-geometric opacity-50"></div>

        {/* Hero Section */}
        <HeroSection />

        {/* Features Cards */}
        <FeaturesSection />

        {/* How It Works Section */}
        <HowItWorksSection />

        {/* CTA Section */}
        <CTASection />

        {/* Footer */}
        <Footer />
      </main>
    </div>
  );
}
