"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { Box, Button, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { isAuthenticated } from "@/lib/api";

function CarHero() {
  const t = useTranslations("home");
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    setAuthenticated(isAuthenticated());
  }, []);
  return (
    <Box
      className="car-hero"
      style={{
        width: "100vw",
        position: "relative",
        left: "50%",
        right: "50%",
        marginLeft: "-50vw",
        marginRight: "-50vw",
        marginTop: "-40px",
        padding: "72px 24px 64px",
        background: "#f9f9fa",
        overflow: "hidden",
      }}
    >
      <Box
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 28,
          textAlign: "center",
        }}
      >
        <Text
          size="xs"
          tt="uppercase"
          fw={600}
          c="dimmed"
          style={{ letterSpacing: "0.18em" }}
        >
          {t("brand")}
        </Text>

        <Box
          style={{
            width: "min(920px, 100%)",
            position: "relative",
            aspectRatio: "16 / 6",
            maxHeight: 320,
          }}
        >
          <Image
            src="/car-hero.png"
            alt=""
            fill
            sizes="(max-width: 960px) 100vw, 920px"
            style={{ objectFit: "contain" }}
            priority
          />
          <Box
            aria-hidden
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: "55%",
              background:
                "linear-gradient(to bottom, transparent 0%, #f8f9fa 85%, #f8f9fa 100%)",
              pointerEvents: "none",
            }}
          />
        </Box>

        <Stack gap={10} align="center">
          <Title
            order={1}
            style={{
              fontSize: "clamp(2rem, 4vw, 3.6rem)",
              fontWeight: 300,
              letterSpacing: "-0.04em",
              lineHeight: 1.05,
            }}
          >
            {t("title")}
          </Title>
          <Text
            maw={760}
            c="dimmed"
            style={{
              fontSize: "clamp(1rem, 1.5vw, 1.125rem)",
              lineHeight: 1.7,
            }}
          >
            {t("subtitle")}
          </Text>
        </Stack>

        <Box style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          {authenticated ? (
            <Link href="/superadmin/dashboard" style={{ textDecoration: "none" }}>
              <Button className="btn-metallic" color="silver" radius="xl" size="md" px="xl">
                {t("dashboard")}
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login" style={{ textDecoration: "none" }}>
                <Button className="btn-metallic" color="silver" radius="xl" size="md" px="xl">
                  {t("login")}
                </Button>
              </Link>
              <Link href="/pricing" style={{ textDecoration: "none" }}>
                <Button
                  className="btn-metallic btn-metallic-outline"
                  color="silver"
                  variant="default"
                  radius="xl"
                  size="md"
                  px="xl"
                >
                  {t("pricing")}
                </Button>
              </Link>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}

function SpecCard({ text }: { text: string }) {
  return (
    <Box
      style={{
        padding: "18px 18px",
        background: "#ffffff",
        border: "1px solid #eceef1",
        borderRadius: 18,
        boxShadow: "0 10px 30px rgba(17, 24, 39, 0.04)",
        minHeight: 86,
      }}
    >
      <Box style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <Box
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            marginTop: 7,
            flexShrink: 0,
            background:
              "linear-gradient(135deg, #c7ccd3 0%, #8f96a0 45%, #eef1f5 100%)",
          }}
        />
        <Text c="dimmed" style={{ lineHeight: 1.65 }}>
          {text}
        </Text>
      </Box>
    </Box>
  );
}

export default function HomePage() {
  const t = useTranslations("home");
  const specs = [t("spec0"), t("spec1"), t("spec2"), t("spec3"), t("spec4"), t("spec5")];

  return (
    <Stack gap={44}>
      <CarHero />

      <Stack gap={18}>
        <Box>
          <Title order={2} style={{ fontWeight: 400, letterSpacing: "-0.03em" }}>
            {t("specsTitle")}
          </Title>
        </Box>

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          {specs.map((item) => (
            <SpecCard key={item} text={item} />
          ))}
        </SimpleGrid>
      </Stack>
    </Stack>
  );
}
