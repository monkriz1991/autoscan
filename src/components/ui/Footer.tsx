"use client";

import { useTranslations } from "next-intl";
import { Container, Text } from "@mantine/core";

export default function Footer() {
  const t = useTranslations("footer");
  return (
    <footer className="footer">
      <Container size="lg">
        <Text size="sm" c="dimmed" ta="center">
          {t("copyright", { year: new Date().getFullYear() })}
        </Text>
      </Container>
    </footer>
  );
}
