"use client";

import { useTranslations } from "next-intl";
import { Alert } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";

export default function DevBanner() {
  const t = useTranslations("devBanner");
  return (
    <Alert
      variant="light"
      color="blue"
      icon={<IconInfoCircle size={20} />}
      title={t("title")}
      mb="md"
      radius="md"
    >
      {t("body")}
    </Alert>
  );
}
