import { Link } from "@/i18n/navigation";
import { Stack, Text, Title } from "@mantine/core";

type Translate = (key: string) => string;

/** Общая вёрстка платформенных SEO-лендингов (Windows / macOS / Linux). */
export default function PlatformObd2LandingContent({ t }: { t: Translate }) {
  return (
    <Stack component="article" className="container" gap="lg" py="xl" pb={72} style={{ maxWidth: "42rem" }}>
      <Title order={1}>{t("title")}</Title>
      <Text style={{ lineHeight: 1.7, color: "var(--text-muted)" }}>{t("intro")}</Text>

      <Title order={2} size="h3">
        {t("hAdapters")}
      </Title>
      <Text style={{ lineHeight: 1.7, color: "var(--text-muted)" }}>{t("pAdapters")}</Text>

      <Title order={2} size="h3">
        {t("hFree")}
      </Title>
      <Text style={{ lineHeight: 1.7, color: "var(--text-muted)" }}>{t("pFree")}</Text>

      <Title order={2} size="h3">
        {t("hAi")}
      </Title>
      <Text style={{ lineHeight: 1.7, color: "var(--text-muted)" }}>{t("pAi")}</Text>

      <Title order={2} size="h3">
        {t("hP0420")}
      </Title>
      <Text style={{ lineHeight: 1.7, color: "var(--text-muted)" }}>
        {t("p0420Before")}{" "}
        <Link href="/dtc/P0420" className="landing-learn-more">
          {t("p0420Link")}
        </Link>{" "}
        {t("p0420After")}
      </Text>

      <Title order={2} size="h3">
        {t("hPids")}
      </Title>
      <Text style={{ lineHeight: 1.7, color: "var(--text-muted)" }}>
        {t("pidsBefore")}{" "}
        <Link href="/blog/obd2-live-data-pids-fuel-trim-explained" className="landing-learn-more">
          {t("pidsLink")}
        </Link>{" "}
        {t("pidsAfter")}
      </Text>

      <Stack gap="sm" pt="md">
        <Link href="/download" className="landing-learn-more">
          {t("ctaDownload")}
        </Link>
        <Link href="/pricing" className="landing-learn-more">
          {t("ctaPricing")}
        </Link>
        <Link href="/marketing/compare-obd2-apps" className="landing-learn-more">
          {t("ctaCompare")}
        </Link>
      </Stack>
    </Stack>
  );
}
