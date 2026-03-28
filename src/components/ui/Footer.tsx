"use client";

import { useTranslations } from "next-intl";
import { Container, Text, Group } from "@mantine/core";
import { Link } from "@/i18n/navigation";

export default function Footer() {
  const t = useTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <Container size="lg">
        <Group justify="center" gap="md" wrap="wrap">
          <Text size="sm" c="dimmed" ta="center" component="span">
            {t("copyright", { year })}
          </Text>
          <Text size="sm" c="dimmed" component="span">
            <Link href="/marketing/terms" style={{ color: "inherit" }}>
              {t("terms")}
            </Link>
            {" · "}
            <Link href="/marketing/privacy" style={{ color: "inherit" }}>
              {t("privacy")}
            </Link>
          </Text>
        </Group>
      </Container>
    </footer>
  );
}
