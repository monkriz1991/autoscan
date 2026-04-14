import { Link } from "@/i18n/navigation";
import { List, Stack, Text, Title } from "@mantine/core";

type CompareT = (key: string) => string;

/** Локализованная страница сравнения OBD2-приложений (контент-стратегия SEO). */
export default function CompareObd2AppsContent({ t }: { t: CompareT }) {
  return (
    <Stack component="article" className="container" gap="lg" py="xl" pb={72} style={{ maxWidth: "42rem" }}>
      <Title order={1}>{t("title")}</Title>
      <Text style={{ lineHeight: 1.7, color: "var(--text-muted)" }}>{t("intro")}</Text>

      <Title order={2}>{t("hCriteria")}</Title>
      <List type="ordered" spacing="md" style={{ lineHeight: 1.65, color: "var(--text-muted)" }}>
        <List.Item>
          <Text fw={600} component="span" c="var(--text-color)">
            {t("c1Title")}
          </Text>
          — {t("c1Body")}
        </List.Item>
        <List.Item>
          <Text fw={600} component="span" c="var(--text-color)">
            {t("c2Title")}
          </Text>
          — {t("c2Body")}
        </List.Item>
        <List.Item>
          <Text fw={600} component="span" c="var(--text-color)">
            {t("c3Title")}
          </Text>
          — {t("c3Body")}
        </List.Item>
        <List.Item>
          <Text fw={600} component="span" c="var(--text-color)">
            {t("c4Title")}
          </Text>
          — {t("c4Body")}
        </List.Item>
        <List.Item>
          <Text fw={600} component="span" c="var(--text-color)">
            {t("c5Title")}
          </Text>
          — {t("c5Body")}
        </List.Item>
      </List>

      <Title order={2}>{t("hAIscanAuto")}</Title>
      <Text style={{ lineHeight: 1.7, color: "var(--text-muted)" }}>{t("autoScanBody")}</Text>

      <Title order={2}>{t("hAlternatives")}</Title>
      <Text style={{ lineHeight: 1.7, color: "var(--text-muted)" }}>{t("altBody")}</Text>

      <Stack gap="sm" pt="md">
        <Link href="/marketing/pricing" className="landing-learn-more">
          {t("ctaPricing")}
        </Link>
        <Link href="/blog/obd2-check-engine-light-codes-guide" className="landing-learn-more">
          {t("ctaBlog")}
        </Link>
      </Stack>
    </Stack>
  );
}
