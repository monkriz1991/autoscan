"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Box, Stack, Text, Title } from "@mantine/core";

const BRANDS: { slug: string; labelKey: string }[] = [
  { slug: "toyota", labelKey: "toyota" },
  { slug: "bmw", labelKey: "bmw" },
  { slug: "mercedes", labelKey: "mercedes" },
  { slug: "ford", labelKey: "ford" },
  { slug: "volkswagen", labelKey: "volkswagen" },
  { slug: "honda", labelKey: "honda" },
  { slug: "audi", labelKey: "audi" },
  { slug: "hyundai", labelKey: "hyundai" },
  { slug: "kia", labelKey: "kia" },
  { slug: "nissan", labelKey: "nissan" },
  { slug: "chevrolet", labelKey: "chevrolet" },
  { slug: "subaru", labelKey: "subaru" },
  { slug: "mazda", labelKey: "mazda" },
  { slug: "volvo", labelKey: "volvo" },
  { slug: "peugeot", labelKey: "peugeot" },
  { slug: "renault", labelKey: "renault" },
];

function BrandItem({ slug, label }: { slug: string; label: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return <span className="landing-ticker__pill">{label}</span>;
  }
  return (
    <img
      src={`https://cdn.simpleicons.org/${slug}`}
      width={40}
      height={40}
      alt=""
      loading="lazy"
      className="landing-ticker__logo"
      onError={() => setFailed(true)}
    />
  );
}

export default function SupportedCarsSection() {
  const t = useTranslations("landing.cars");

  return (
    <Stack component="section" gap="lg" py={48} className="landing-cars">
      <Title order={2} className="landing-section-title">
        {t("title")}
      </Title>
      <p className="landing-cars__subtitle">{t("subtitle")}</p>

      <Box className="landing-ticker" role="presentation">
        <Box className="landing-ticker__track">
          {[0, 1].map((dup) =>
            BRANDS.map((b) => <BrandItem key={`${dup}-${b.slug}`} slug={b.slug} label={t(`brands.${b.labelKey}`)} />),
          )}
        </Box>
      </Box>

      <Text size="sm" c="dimmed">
        {t("footnote")}
      </Text>
    </Stack>
  );
}
