"use client";

import { useEffect, useState } from "react";
import { Stack } from "@mantine/core";
import { isAuthenticated } from "@/lib/api";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import SupportedCarsSection from "@/components/landing/SupportedCarsSection";
import PricingSection from "@/components/landing/PricingSection";

export default function HomePageClient() {
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    setAuthenticated(isAuthenticated());
  }, []);

  return (
    <Stack gap={0} className="home-page">
      <HeroSection authenticated={authenticated} />
      <FeaturesSection />
      <SupportedCarsSection />
      <PricingSection />
    </Stack>
  );
}
